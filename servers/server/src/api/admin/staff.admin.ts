import { SqlTransaction } from "@the-hive/lib-db";
import { ContractsLogic, ReviewsLogic } from "@the-hive/lib-reviews-logic";
import { BadRequestDetail, isError } from "@the-hive/lib-shared";
import { parseAndValidateCompanyEntityUpdate, parseAndValidateNewStaffMemberRequest, parseAndValidateStaffFilter, StaffCompanyEntityUpdate, StaffLogic, validateNonEmptyString, validatePositiveIntegerArray } from "@the-hive/lib-staff-logic";
import { activeStaffTypes, BulkStaffReviewerReassignmentRequest, NewStaffMemberRequest, Staff, StaffFilter, StaffSpokenLanguage, StaffStatusChangeReason, StaffUpdateFields, StaffWithDirectReportsCount } from "@the-hive/lib-staff-shared";
import { getStaffId } from "../../queries/staff-overview.queries";

import { AuthenticatedLocals, handleErrors } from "@the-hive/lib-core";
import { validateAndParseDate, validateStaffStatus } from "@the-hive/lib-staff-logic";
import { NextFunction, Request, Response, Router } from "express";
import { getLatestReviewId } from '../../queries/review.queries';
import { GetAccessibleRoutes } from "../../queries/security.queries";
import { withTransaction } from '../../shared/db';
import { getUserGroups } from "../security";
const router = Router();
const { handle_errors, parseIfSetElseDefault } = require('@the-hive/lib-core');
const { retrieveStaffHistory } = require('../../queries/peer-feedback.queries');
const {
  makeContractorPermanent,
  retrieveFinalContractRecommendationStatus,
} = require('../../queries/contracts.queries');
const {
  getAllStaffJobTitles,
} = require('../../queries/staff-overview.queries');
const { db } = require("../../shared/db");

const additionalInfoUsers = parseIfSetElseDefault("ADDITIONAL_INFO_USERS", '[]');
const modifyBioInformationUsers = parseIfSetElseDefault("MODIFY_BIO_INFORMATION_USERS", '[]');
const azureMapsApiKey = parseIfSetElseDefault("AZURE_MAP_API_KEY", "")

const staffLogic = new StaffLogic(db);
const reviewsLogic = new ReviewsLogic(db);
const contractsLogic = new ContractsLogic(db);

const protectStaffRoute = async (req: Request, res: Response<BadRequestDetail | undefined, AuthenticatedLocals>, next: NextFunction) => {
  const userGroups = await getUserGroups(res.locals.upn);
  const userAccessibleRoutes = await GetAccessibleRoutes(userGroups, res.locals.upn);
  const isAllowedToAccessRoute = userAccessibleRoutes.some(route => new RegExp(route.routePattern).test(req.originalUrl));
  if (!isAllowedToAccessRoute) {
    res.status(403).json({ message: "You are not allowed to perform this action or access this resource." });
  } else {
    next();
  }
}

router.get(
  '/staff/:upn/review-history',
  handle_errors(async (req, res) => {
    const upn = req.params.upn;
    const response = await retrieveStaffHistory(upn);
    res.json(response);
  })
);

router.get(
  "/staff/:upn/additional-info",
  handle_errors(async (req, res) => {
    try {
      if(additionalInfoUsers.includes(res.locals.upn)){
        const staffLogic = new StaffLogic(db);
        res.status(200).json(await staffLogic.getAdditionalInfo(req.params.upn));
      } else {
        res.status(403).json({ message: 'Not allowed to retrieve additional info' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.patch(
  "/staff/:upn/additional-info",
  handle_errors(async (req, res) => {
    try {
      if(additionalInfoUsers.includes(res.locals.upn)){
        const staffLogic = new StaffLogic(db);
        const info = req.body;
        res.status(200).json(await staffLogic.persistAdditionalInfo(req.params.upn, info));
      } else {
        res.status(403).json({ message: 'Not allowed to modify additional info' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.patch(
  '/staff/:staffId',
  handle_errors(async (req, res) => {
    try {
      await withTransaction(async (tx) => {
        const staffId = req.params.staffId;
        const upn = res.locals.upn;
        const { nextReviewDate, nextFeedbackTypeId, contractRecommendationId } =
          req.body;
        const reviewId = await getLatestReviewId(staffId);
        const previousStaffReviewId = await reviewsLogic.getStaffReviewId(reviewId);

        if (contractRecommendationId) {
          const finalRecommendationStatus =
            await retrieveFinalContractRecommendationStatus();
          await contractsLogic.addContractRecommendationStatus(
            tx,
            contractRecommendationId,
            finalRecommendationStatus.status,
            upn
          );
        } else {
          //Do nothing, no recommendation to be archived.
        }

        await makeContractorPermanent(
          tx,
          staffId,
          upn,
          nextReviewDate,
          previousStaffReviewId,
          nextFeedbackTypeId
        );
        res.status(201).send();
      });
    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }
      res.status(500).send(errorMessage);
    }
  })
);

router.get(
  '/job-titles',
  handle_errors(async (_req, res) => {
    const response = await getAllStaffJobTitles();
    res.status(200).json(response);
  })
);

router.get(
  '/staff/onboarding-status',
  handle_errors(async (req, res) => {
    try{
      const staffMembers = await staffLogic.getStaffWithOnboardingStatus();
      res.status(200).json(staffMembers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", detail: error.message });
    }
  })
);

router.get(
  '/staff',
  handleErrors(async (
    req: Request<never, BadRequestDetail | StaffWithDirectReportsCount[], never, unknown>,
    res: Response<BadRequestDetail | StaffWithDirectReportsCount[], AuthenticatedLocals>
  ) => {
    try {
      const staffFilterOrValidationError = await parseAndValidateStaffFilter(req.query, staffLogic);
      if (isError(staffFilterOrValidationError)) {
        res.status(400).json(staffFilterOrValidationError);
      } else {
        const staffMembers = await staffLogic.getStaffByFilter(staffFilterOrValidationError);
        res.status(200).json(staffMembers);
      }
    } catch (error) {
      res.status(500).json({ message: "Error retrieving staff", detail: error.message });
    }
  })
);

router.get(
  '/staff/missing-information',
  handle_errors(async (req, res) => {
    try{
      const staffMembers = await staffLogic.getStaffWithMissingInformation();
      res.status(200).json(staffMembers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", detail: error.message });
    }
  })
);

const validateStaffUpdate = (staffDetails: StaffUpdateFields) => {
  const validationErrors = [
    {
      message: "'jobTitle' may not be empty if provided",
      error: staffDetails.jobTitle !== undefined && staffDetails.jobTitle.trim().length === 0
    },
    {
      message: `'staffType' should be one of: ${activeStaffTypes.join(', ')}`,
      error: staffDetails.staffType !== undefined && !activeStaffTypes.includes(staffDetails.staffType)
    },
    {
      message: "'department' may not be empty if provided",
      error: staffDetails.department !== undefined && staffDetails.department.trim().length === 0
    },
    {
      message: "'manager' may not be empty if provided",
      error: staffDetails.manager !== undefined && staffDetails.manager.trim().length === 0
    },
    {
      message: "'officeId' must be a positive integer if provided",
      error: staffDetails.officeId !== undefined && (!Number.isInteger(staffDetails.officeId) || (Number.isInteger(staffDetails.officeId) && staffDetails.officeId <= 0))
    },
    {
      message: "'companyEntityId' must be a positive integer if provided",
      error: staffDetails.companyEntityId !== undefined && (!Number.isInteger(staffDetails.companyEntityId) || (Number.isInteger(staffDetails.companyEntityId) && staffDetails.companyEntityId <= 0))
    },
    {
      message: "'employmentDate' must be a valid ISO date string",
      error: staffDetails.employmentDate !== undefined && Number.isNaN(new Date(staffDetails.employmentDate).getTime())
    },
    {
      message: "'probationaryReviewDate' is required for permanent staff type and must be a valid ISO date string",
      error: staffDetails.staffType !== undefined && staffDetails.staffType === 'Permanent' && Number.isNaN(new Date(staffDetails.probationaryReviewDate).getTime())
    },
    {
      message: "'contractStartDate' is required for contract staff type and must be a valid ISO date string",
      error: staffDetails.staffType !== undefined && staffDetails.staffType === 'Contract' && Number.isNaN(new Date(staffDetails.contractStartDate).getTime())
    },
    {
      message: "'contractEndDate' is required for contract staff type and must be a valid ISO date string",
      error: staffDetails.staffType !== undefined && staffDetails.staffType === 'Contract' && Number.isNaN(new Date(staffDetails.contractEndDate).getTime())
    },
    {
      message: "'contractStartDate' must be before 'contractEndDate'",
      error: staffDetails.staffType !== undefined && staffDetails.staffType === 'Contract' && staffDetails.contractStartDate !== undefined && staffDetails.contractEndDate !== undefined && new Date(staffDetails.contractStartDate).getTime() > new Date(staffDetails.contractEndDate).getTime()
    },
    {
      message: "'contractReviewDate' is required for contract staff type and must be a valid ISO date string",
      error: staffDetails.staffType !== undefined && staffDetails.staffType === 'Contract' && Number.isNaN(new Date(staffDetails.contractReviewDate).getTime())
    }
  ];

  return validationErrors.filter(error => error.error)
}

router.post(
  '/staff/onboarding',
  protectStaffRoute,
  handleErrors(async (
    req: Request<never, BadRequestDetail | undefined, Record<keyof NewStaffMemberRequest, string>>,
    res: Response<BadRequestDetail | undefined, AuthenticatedLocals>
  ) => {
    try {
      const validatedCreateOnboardingStaffMemberOrError = parseAndValidateNewStaffMemberRequest(req.body);

      if (isError(validatedCreateOnboardingStaffMemberOrError)) {
        res.status(400).json(validatedCreateOnboardingStaffMemberOrError);
      } else {
        const updatedByUpn = res.locals.upn;

        await withTransaction(async (tx) => staffLogic.createOnboardingStaffMember(
          tx,
          validatedCreateOnboardingStaffMemberOrError,
          updatedByUpn
        ));

        res.status(201).json();
      }
    } catch (error) {
      const message = "A technical issue was encountered while onboarding staff member.";
      const detail = error.causedBy ? error.causedBy.message : error.message;
      res.status(500).json({ message, detail });
    }
  })
);

router.patch(
  '/staff/:upn/onboarding',
  protectStaffRoute,
  handleErrors(async (
    req: Request<{ upn: string }, BadRequestDetail | undefined, StaffUpdateFields>,
    res: Response<BadRequestDetail | undefined, AuthenticatedLocals>
  ) => {
    try {
      const staffDetails: StaffUpdateFields = req.body;
      const upn = req.params.upn;
      const updatedBy = res.locals.upn;

      const staffUpdateValidationErrors = validateStaffUpdate(staffDetails);

      if (staffUpdateValidationErrors.length > 0) {
        res.status(400).json({
          message: `There were some validation errors: ${staffUpdateValidationErrors.map(error => error.message).join(', ')}.`
        });
      } else {
        const staffUpdateResult = await withTransaction(async (tx) => {

          const staffFilter: StaffFilter = { upn: upn };
          const foundStaffRecords = await staffLogic.getStaffByFilter(staffFilter);
          const staffMember = foundStaffRecords[0];

          if (!staffMember) {
            return { message: `Staff ID not found for the provided UPN '${upn}'.` };
          } else {
            const staffUpdateResult = await staffLogic.updateOnboardingStaffMember(tx, staffMember, updatedBy, staffDetails)

            if (staffDetails.staffType === 'Permanent') {
              const probationaryReviewDate = new Date(staffDetails.probationaryReviewDate);
              const probationaryReviewTemplate = await reviewsLogic.getFeedbackAssignmentTemplateByName('Probationary');
              const staffReviewId = await reviewsLogic.createStaffReview(tx, updatedBy, staffMember.staffId, probationaryReviewDate, undefined, probationaryReviewTemplate.feedbackAssignmentTemplateId);

              if (!staffReviewId) {
                return { message: "Failed to create probationary review. This could be due to missing probationary review template, database constraint violations, an invalid staff ID, or database transaction issues." };
              } else {
                return staffUpdateResult;
              }

            } else if (staffDetails.staffType === 'Contract') {
              const contractStartDate = new Date(staffDetails.contractStartDate);
              const contractEndDate = new Date(staffDetails.contractEndDate);
              const contractReviewDate = new Date(staffDetails.contractReviewDate);
              const contractOrError = await contractsLogic.createContract(tx, staffMember.staffId, updatedBy, contractStartDate, contractEndDate, contractReviewDate);

              if (!contractOrError) {
                return { message: "Failed to create contract. This could be due to missing 'Contract' staff type in database, invalid staff ID, database constraint violations, or database transaction issues." };
              } else if (isError(contractOrError)) {
                return contractOrError;
              } else {
                return staffUpdateResult;
              }

            } else {
              return staffUpdateResult;
            }
          }
        });

        if (isError(staffUpdateResult)) {
          res.status(400).json(staffUpdateResult);
        } else {
          res.status(204).json();
        }
      }
    } catch (error) {
      res.status(500).json({ message: "A technical issue was encountered while updating staff details.", detail: error.message });
    }
  })
);

const validateUpdateDepartment = (upn: string, department: string, manager: string, startDate) => {
  const validationErrors = [
    {
      message: "upn is required",
      error: !upn
    },
    {
      message: "department is required",
      error: !department
    },
    {
      message: "manager is required",
      error: !manager
    },
    {
      message: "startDate is required",
      error: !startDate
    },
    {
      message: "startDate must be a valid ISO date string",
      error: isNaN(Date.parse(startDate))
    }
  ].filter(validation => validation.error);
  return validationErrors;
}

router.post('/staff/:upn/department', handle_errors(async (req, res) => {
  try {
    const { upn } = req.params;
    const { department, manager, startDate } = req.body;
    const updatedByUpn = res.locals.upn;

    const staffId = (await getStaffId(upn))?.staffId;
    const managerStaffId = (await getStaffId(manager))?.staffId;

    const validationErrors = validateUpdateDepartment(upn, department, manager, startDate);
    if (validationErrors.length > 0) {
      res.status(400).json({ message: validationErrors.map(validation => validation.message).join(", ") });
    } else if (!staffId || !managerStaffId) {
      res.status(400).json({ message: `No staff member found with upn ${upn}.` });
    } else {
      await withTransaction(async (tx) => {
        const parsedStartDate = new Date(startDate);
        const staffDepartmentCreated = await staffLogic.createNewStaffDepartmentEntry(tx, staffId, department, manager, parsedStartDate, updatedByUpn);
        if (staffDepartmentCreated) {
          res.status(200).send();
        } else {
          res.status(400).json({ message: "Failed to create new staff department entry." });
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: "A technical issue was encountered while updating staff details.", detail: error.message });
  }
}));

router.put(
  '/staff/:upn/job-title',
  handle_errors(async (req, res) => {
    try {
      const { upn } = req.params;
      const jobTitle = req.body.jobTitle?.trim();

      if (!jobTitle) {
        res.status(400).json({ message: "'jobTitle' is required and cannot be empty." });
      } else {
        await withTransaction(async (tx) => {
          const staffId = (await getStaffId(upn))?.staffId;
          if (!staffId) {
            res.status(400).json({ message: "Staff ID not found for the provided UPN." });
          } else {
            const staffJobTitleUpdated = await staffLogic.updateStaffJobTitle(tx, staffId, jobTitle);
            if (staffJobTitleUpdated) {
              res.status(200).send();
            } else {
              res.status(500).json({ message: "Failed to update staff job title." });
            }
          }
        });
      }
    } catch (error) {
      res.status(500).json({ message: "A technical issue was encountered while updating staff job title.", detail: error.message });
    }
  })
)

router.post(
  '/staff/:upn/company-entity',
  protectStaffRoute,
  handleErrors(async (
    req: Request<{ upn: string }, BadRequestDetail | void, StaffCompanyEntityUpdate>,
    res: Response<BadRequestDetail | undefined, AuthenticatedLocals>
  ) => {
    try {
      const validatedStaffCompanyEntityUpdateOrError = parseAndValidateCompanyEntityUpdate(req.body);

      if (isError(validatedStaffCompanyEntityUpdateOrError)) {
        res.status(400).json(validatedStaffCompanyEntityUpdateOrError);
      } else {
        const wasStaffCompanyEntityUpdatedOrError = await withTransaction(async (tx) => {
          const updatedByUpn = res.locals.upn;
          const staffMemberUpn = req.params.upn;
          const companyEntityId = validatedStaffCompanyEntityUpdateOrError.companyEntityId;
          const effectiveFrom = validatedStaffCompanyEntityUpdateOrError.effectiveFrom;
          return staffLogic.updateStaffCompanyEntity(tx, staffMemberUpn, companyEntityId, updatedByUpn, effectiveFrom);
        });

        if (isError(wasStaffCompanyEntityUpdatedOrError)) {
          res.status(400).json(wasStaffCompanyEntityUpdatedOrError);
        } else {
          res.status(201).send();
        }
      }
    } catch (error) {
      res.status(500).json({ message: "A technical issue was encountered while updating the staff member's company entity.", detail: error.message });
    }
  })
);

router.put(
  "/staff/:upn/office",
  handle_errors(async (req, res) => {
    try {
      const { upn } = req.params;
      const officeId = Number(req.body.officeId);

      if (Number.isNaN(officeId) || officeId <= 0) {
        res.status(400).json({ message: "Invalid officeId provided. Must be a positive integer." });
      } else {
        await withTransaction(async (tx) => {
          const staffId = (await getStaffId(upn))?.staffId;
          if (!staffId) {
            res.status(400).json({ message: "Staff ID not found for the provided UPN." });
          } else {
            const staffOfficeUpdated = await staffLogic.updateStaffOffice(tx, staffId, officeId, res.locals.upn);
            if (staffOfficeUpdated) {
              res.status(200).send();
            } else {
              res.status(500).json({ message: "Failed to update staff office." });
            }
          }
        });
      }
    } catch (error) {
      res.status(500).json({ message: "A technical issue was encountered while updating the staff member's office.", detail: error.message });
    }
  })
)

router.patch(
  '/staff/:upn/status',
  protectStaffRoute,
  handleErrors(async (
    req: Request<{ upn: string }, BadRequestDetail | undefined, { status: string, effectiveFrom: string }>,
    res: Response<BadRequestDetail | undefined, AuthenticatedLocals>
  ) => {
    try{
      await withTransaction(async (tx) => {
        const upn = req.params.upn;
        const updatedBy = res.locals.upn;
        const validStaffStatuses = (await staffLogic.getStaffStatuses()).map(statusDetail => statusDetail.staffStatus);

        const validatedStatus = validateStaffStatus('status', req.body.status, validStaffStatuses);
        const validatedEffectiveFrom = validateAndParseDate('effectiveFrom', req.body.effectiveFrom);

        const staffIdRecord = await getStaffId(upn);
        if (!staffIdRecord){
          res.status(400).json({ message: "Staff ID not found for the provided UPN." });
        } else {
          const staffId = staffIdRecord.staffId;
          if (isError(validatedStatus)){
            res.status(400).json({message: `Invalid status: '${req.body.status}'. Valid statuses are: ${validStaffStatuses.join(", ")}.`})
          } else if (isError(validatedEffectiveFrom)) {
            res.status(400).json({message: `Invalid effectiveFrom: '${req.body.effectiveFrom}'. Valid format is YYYY-MM-DD.`})
          } else if (!(await staffLogic.checkIfStaffIsAllowedToTransitionToStaffStatus(staffId, validatedStatus))) {
            res.status(400).json({message: `Cannot transition staffStatus to '${validatedStatus}' status from current state.`})
          } else {
            if (validatedStatus === 'terminated') {
              const isAllowedToBeTerminated = await staffLogic.validateStaffStatusChange(upn, validatedStatus);
              if (isError(isAllowedToBeTerminated)) {
                res.status(400).json(isAllowedToBeTerminated);
              } else {
                const terminateStaffMemberResult = await terminateStaffMember(tx, staffId, updatedBy, validatedEffectiveFrom);
                if (isError(terminateStaffMemberResult)) {
                  res.status(400).json(terminateStaffMemberResult);
                } else {
                  res.status(200).send();
                }
              }
            } else if (validatedStatus === 'pending-delete') {
              const isAllowedToBeMarkedAsPendingDelete = await staffLogic.validateStaffStatusChange(upn, validatedStatus);
              if (isError(isAllowedToBeMarkedAsPendingDelete)) {
                res.status(400).json(isAllowedToBeMarkedAsPendingDelete);
              } else {
                const staffStatusUpdateResult = await staffLogic.updateStaffStatus(tx, staffId, "pending-delete", updatedBy);
                if (isError(staffStatusUpdateResult)) {
                  res.status(400).json(staffStatusUpdateResult);
                } else {
                  res.status(200).send();
                }
              }
            } else if (validatedStatus === 'active') {
              const updatedStaffMember = (await staffLogic.getStaffByFilter({ upn: upn }, tx))[0];

              const canTransitionToActiveStatus =
                (await staffLogic.checkIfStaffIsAllowedToTransitionToStaffStatus(updatedStaffMember.staffId, "active"))
                && staffLogic.hasRequiredFieldsForActiveStatus(updatedStaffMember);

              if (canTransitionToActiveStatus) {
                const staffStatusUpdateResult = await staffLogic.updateStaffStatus(tx, updatedStaffMember.staffId, "active", updatedBy);
                if (isError(staffStatusUpdateResult)) {
                  res.status(400).json(staffStatusUpdateResult);
                } else {
                  res.status(200).send();
                }
              } else {
                res.status(400).json({ message: "Staff member cannot yet transition to active status as they are missing required information." });
              }
            } else {
              const staffStatusUpdated = await staffLogic.updateStaffStatus(tx, staffId, validatedStatus, updatedBy, validatedEffectiveFrom);
              if (!staffStatusUpdated) {
                res.status(500).json({ message: `An unexpected error occurred while updating staff status to ${validatedStatus} for staff member with upn ${upn}. Contact support if this issue persists.` });
              } else {
                res.status(200).send();
              }
            }
          }
        }
      });
    } catch (error) {
      res.status(500).json({ message: "A technical issue was encountered while updating staff status.", detail: error.message });
    }
  })
);

router.get(
  '/staff/:upn/direct-reports',
  handleErrors(async (
    req: Request<{ upn: string }, BadRequestDetail | Staff[]>,
    res: Response<BadRequestDetail | Staff[], AuthenticatedLocals>
  ) => {
    try {
      const directReports = await staffLogic.getActiveDirectReportsForUpn(req.params.upn);
      res.status(200).json(directReports);
    } catch (error) {
      res.status(500).json({ message: "A technical issue was encountered while retrieving direct reports.", detail: error.message });
    }
  })
);

router.post(
  '/staff/bulk-reviewer-reassignments',
  protectStaffRoute,
  handleErrors(async (
    req: Request<never, BadRequestDetail | undefined, unknown>,
    res: Response<BadRequestDetail | undefined, AuthenticatedLocals>
  ) => {
    try {
      const bulkReassignmentRequestOrError = parseAndValidateBulkReassignmentRequest(req.body);
      const updatedByUpn = res.locals.upn;

      if (isError(bulkReassignmentRequestOrError)) {
        res.status(400).json(bulkReassignmentRequestOrError);
      } else {
        const bulkReassignmentResult = await withTransaction(async (tx) =>
          staffLogic.bulkReassignStaffToNewReviewer(tx, bulkReassignmentRequestOrError, updatedByUpn)
        );

        if (isError(bulkReassignmentResult)) {
          res.status(400).json(bulkReassignmentResult);
        } else {
          res.status(201).json();
        }
      }

    } catch (error) {
      let detail;
      if (error.causedBy) {
        detail = `${error.message}: caused by (${error.causedBy})`;
      } else {
        detail = error.message;
      }
      res.status(500).json({ message: "A technical issue was encountered while bulk reassigning staff to new reviewer.", detail });
    }
  })
);

const parseAndValidateBulkReassignmentRequest = (body: unknown): BulkStaffReviewerReassignmentRequest | BadRequestDetail => {
  const staffIds = validatePositiveIntegerArray('staffIds', body['staffIds']);
  const effectiveDate = validateAndParseDate('effectiveDate', body['effectiveDate']);
  const newManagerUpn = validateNonEmptyString('newManagerUpn', body['newManagerUpn']);

  if (isError(staffIds) || isError(effectiveDate) || isError(newManagerUpn)) {
    return { message: Object.values({ staffIds, effectiveDate, newManagerUpn }).filter(isError).map(error => error.message).join(", ") };
  } else {
    return { staffIds, effectiveDate, newManagerUpn };
  }
}

const terminateStaffMember = async (tx: SqlTransaction, staffId: number, updatedByUpn: string, effectiveFrom: Date): Promise<true | BadRequestDetail> => {
  if (!staffId || isNaN(staffId)) {
    return { message: "The provided staffId is invalid" };
  } else {
    const resultsOrErrors = {
      deletedStaffId: undefined as number | BadRequestDetail,
      deletedReviewId: undefined as number | BadRequestDetail,
      staffReviewDeletedError: undefined as BadRequestDetail,
    }

    resultsOrErrors.deletedStaffId = await staffLogic.markStaffMemberAsTerminated(tx, staffId, updatedByUpn, effectiveFrom);
    const staffMemberActiveReviewId = await reviewsLogic.getActiveReviewForStaff(staffId);

    if (staffMemberActiveReviewId) {
      resultsOrErrors.deletedReviewId = await reviewsLogic.cancelReviewAndCascadeUpdates(
        tx,
        staffMemberActiveReviewId,
        "Staff member terminated",
        updatedByUpn
      );
    } else {
      // Staff member had no active review
      // Nothing has to be done related to active reviews
    }

    const currentStaffReviewId = await reviewsLogic.getCurrentStaffReviewId(staffId);
    if ((!resultsOrErrors.deletedReviewId || !isError(resultsOrErrors.deletedReviewId)) && currentStaffReviewId) {
      const staffReviewIsDeleted = await reviewsLogic.removeStaffReview(tx, currentStaffReviewId, updatedByUpn);
      resultsOrErrors.staffReviewDeletedError = staffReviewIsDeleted ? undefined : { message: "Failed to delete staff review" };
    } else {
      // Staff member had no active or pending review
      // Nothing has to be done related to staffReviews (pending reviews)
    }

    const errors = Object.values(resultsOrErrors).filter(value => !!value).filter(isError);
    if (errors.length > 0) {
      const errorMessages = errors.map(error => error.message).join(", ");
      return { message: `Failed to delete staff member: ${errorMessages}` };
    } else {
      return true;
    }
  }
}

router.get('/staff/:upn/spoken-languages', handleErrors(async (
  req: Request<{ upn: string }>,
  res: Response<StaffSpokenLanguage[] | BadRequestDetail>
) => {
  try {
    const staffMember = await getStaffId(req.params.upn);
    if (!staffMember) {
      res.status(400).json({ message: "Staff member not found for the provided UPN." });
    } else {
      const languages = await staffLogic.retrieveStaffSpokenLanguages(staffMember.staffId);
      res.status(200).json(languages);
    }
  } catch (error) {
    res.status(500).json({ message: "A technical issue was encountered while retrieving staff spoken languages.", detail: error.message });
  }
}));

router.get('/staff/spoken-language-proficiencies', handleErrors(async (
  req: Request,
  res: Response<string[] | BadRequestDetail>
) => {
  try {
    const proficiencies = await staffLogic.retrieveLanguageProficiencies();
    res.status(200).json(proficiencies);
  } catch (error) {
    res.status(500).json({ message: "A technical issue was encountered while retrieving staff spoken language proficiencies.", detail: error.message });
  }
}));

router.patch('/staff/:upn/spoken-languages', handleErrors(async (
  req: Request<{ upn: string }, undefined, { languages: StaffSpokenLanguage[] }>,
  res: Response<void | BadRequestDetail>
) => {
  try {
    const { upn } = req.params;
    const { languages } = req.body;
    const staffMember = await getStaffId(upn);
    if (!staffMember) {
      res.status(400).json({ message: "Staff member not found for the provided UPN." });
    } else {
      let result: void | BadRequestDetail;
      await withTransaction(async (tx: SqlTransaction) => {
        result = await staffLogic.updateStaffSpokenLanguages(tx, staffMember.staffId, languages);
      });
      if (result && isError(result)) {
        res.status(400).json(result);
      } else {
        res.status(200).send();
      }
    }
  } catch (error) {
    res.status(500).json({ message: "A technical issue was encountered while updating staff spoken languages.", detail: error.message });
  }
}));


router.get('/staff/spoken-languages', handleErrors(async (
  req: Request,
  res: Response<string[] | BadRequestDetail>
) => {
  try {
    const languages = await staffLogic.retrieveSpokenLanguages();
    res.status(200).json(languages);
  } catch (error) {
    res.status(500).json({ message: "A technical issue was encountered while retrieving staff spoken languages.", detail: error.message });
  }
}));

router.get(
  '/staff/status-change-reasons',
  async (
    req: Request<never, StaffStatusChangeReason[] | BadRequestDetail, never, unknown>,
    res: Response<StaffStatusChangeReason[] | BadRequestDetail>
  ) => {
    try {
      const staffStatusChangeReasons = await staffLogic.retrieveStaffStatusChangeReasons();
      res.status(200).json(staffStatusChangeReasons);
    } catch (error) {
      const detail = error.causedBy ? `${error.message}: Caused by ${error.causedBy}` : error.message
      res.status(500).json({
        message: "A technical issue was encountered while retrieving staff status change reasons",
        detail
      })
    }
  }
)

router.patch(
  '/staff/:upn/date-of-birth',
  handleErrors(async (
    req: Request<{ upn: string }, undefined, { dateOfBirth: string }>,
    res: Response<void | BadRequestDetail>
  ) => {
    try {
      const { upn } = req.params;
      const { dateOfBirth } = req.body;
      const staffMember = await getStaffId(upn);
      if (!staffMember) {
        res.status(400).json({ message: "Staff member not found for the provided UPN." });
      } else {
        const validatedDateOfBirth = validateAndParseDate('dateOfBirth', dateOfBirth);
        const isLoggedInUserMemberOfModifyBioInformationUsers = modifyBioInformationUsers.includes(res.locals.upn);
        if (!isLoggedInUserMemberOfModifyBioInformationUsers) {
          res.status(403).json({ message: "You are not allowed to modify the date of birth of this staff member." });
        } else if (isError(validatedDateOfBirth)) {
          res.status(400).json(validatedDateOfBirth);
        } else {
          await withTransaction(async (tx: SqlTransaction) => {
            const result = await staffLogic.updateStaffDateOfBirth(tx, staffMember.staffId, validatedDateOfBirth);
            if (!result) {
              throw new Error("Failed to update staff date of birth.");
            } else {
              // Staff date of birth updated successfully
            }
          });
        }
        res.status(200).send();
      }
    } catch (error) {
      res.status(500).json({ message: "A technical issue was encountered while updating staff date of birth.", detail: error.message });
    }
  })
);

router.patch(
  '/staff/:upn/residence',
  handleErrors(async (
    req: Request<{ upn: string }, undefined, { residence: string }>,
    res: Response<void | BadRequestDetail>
  ) => {
    try {
      const { upn } = req.params;
      const { residence } = req.body;
      const staffMember = await getStaffId(upn);
      if (!staffMember) {
        res.status(400).json({ message: "Staff member not found for the provided UPN." });
      } else {
        const isLoggedInUserMemberOfModifyBioInformationUsers = modifyBioInformationUsers.includes(res.locals.upn);
        if (!isLoggedInUserMemberOfModifyBioInformationUsers) {
          res.status(403).json({ message: "You are not allowed to modify a staff members residence." });
        } else if (isError(residence)) {
          res.status(400).json(residence);
        } else {
          await withTransaction(async (tx: SqlTransaction) => {
            const result = await staffLogic.updateStaffResidence(tx, staffMember.staffId, residence);
            if (!result) {
              throw new Error("Failed to update staff residence.");
            } else {
              // Update successful
            }
          });
        }
        res.status(200).send();
      }
    } catch (error) {
      res.status(500).json({ message: "A technical issue was encountered while updating staff residence.", detail: error.message });
    }
  })
);

router.get('/staff/nationalities', handleErrors(async (
  req: Request,
  res: Response<string[] | BadRequestDetail>
) => {
  try {
    const nationalities = await staffLogic.retrieveStaffNationalities();
    res.status(200).json(nationalities);
  } catch (error) {
    res.status(500).json({ message: "A technical issue was encountered while retrieving staff nationalities.", detail: error.message });
  }
}));

router.patch('/staff/:upn/nationality', handleErrors(async (
  req: Request<{ upn: string }, undefined, { nationality: string }>,
  res: Response<void | BadRequestDetail>
) => {
  try {
    const { upn } = req.params;
    const { nationality } = req.body;
    const staffMember = await getStaffId(upn);
    if (!staffMember) {
      res.status(400).json({ message: "Staff member not found for the provided UPN." });
    } else {
      const validatedNationality = validateNonEmptyString('nationality', nationality);
      const isLoggedInUserMemberOfModifyBioInformationUsers = modifyBioInformationUsers.includes(res.locals.upn);
      if (!isLoggedInUserMemberOfModifyBioInformationUsers) {
        res.status(403).json({ message: "You are not allowed to modify the nationality of this staff member." });
      } else if (isError(validatedNationality)) {
        res.status(400).json(validatedNationality);
      } else {
        const transactionOutcome = await withTransaction<boolean>(async (tx: SqlTransaction) => {
          const wasNationalityUpdated = await staffLogic.updateStaffNationality(tx, staffMember.staffId, validatedNationality);
          if (!wasNationalityUpdated) {
            throw new Error("Failed to update staff nationality.");
          } else {
            return true;
          }
        });
        if (isError(transactionOutcome)) {
          res.status(500).json(transactionOutcome);
        } else {
          res.status(200).send();
        }
      }
    }
  } catch (error) {
    res.status(500).json({ message: "A technical issue was encountered while updating staff nationality.", detail: error.message });
  }
}));

router.get(
  "/azuremaps/suggest",
  async (req: Request, res: Response) => {
    try {
      const query = req.query.q.toString();

      const url = `https://atlas.microsoft.com/search/fuzzy/json?api-version=1.0&typeahead=true&entityType=Municipality,CountrySubdivision,Country&subscription-key=${azureMapsApiKey}&query=${encodeURIComponent(query)}`;

      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Azure Maps API returned ${response.status}: ${text}`);
      }else {
        const data = await response.json();
        res.json(data.results || []);
      }
    } catch (error) {
      res.status(500).json({ message: `Error fetching suggestions: ${error.message}` });
    }
  }
);


module.exports = router;
