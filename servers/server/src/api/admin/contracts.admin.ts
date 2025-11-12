import { AuthenticatedLocals, handle_errors, handleErrors } from '@the-hive/lib-core';
import { ContractsLogic, ReviewsLogic } from '@the-hive/lib-reviews-logic';
import { ContractRecommendationUpdate, NewContractRequest } from '@the-hive/lib-reviews-shared';
import { BadRequestDetail, findOverlappingDateRanges, includeInObjectWhenSet, isError, parseAndValidate } from '@the-hive/lib-shared';
import { StaffLogic, validateAndParseDate, validateAndParsePositiveInteger } from '@the-hive/lib-staff-logic';
import { Request, Response, Router } from 'express';
import moment from 'moment';
import { getPaginatedContractStaff } from '../../queries/contracts-overview.queries';
import {
  addContractRecommendationComment,
  addContractRecommendationStaffReviewLink,
  addTemporaryContractRecommendationHrRep,
  createContractRecommendation,
  getAllContractRecommendations,
  getContractById,
  getContractRecommendationCancellationReasons,
  getContractRecommendationComments,
  getContractRecommendationCommentsForStaff,
  getContractRecommendationNumbers,
  getHrRepsWithRecommendations,
  markContractAsScheduled,
  markContractAsUnscheduled,
  putContractOnHold,
  removeContractHold,
  retrieveContracts,
  updateContractDates,
  updateContractDatesTx,
  updateContractRecommendationHrRep,
} from '../../queries/contracts.queries';
import { insertStaffReviewLinking, retrieveActiveReviewsByRevieweeStaffId } from '../../queries/review.queries';
import { db, withTransaction } from '../../shared/db';
const router = Router();
const {
  retrieveFeedbackTemplate,
  createReview,
  retrieveStartingReviewStatus,
} = require('../../queries/peer-feedback.queries');
const queue = require('../../shared/queue');
const { ValidationError } = require('../../shared/validations');
const { generateInternalServerMessage } = require('@the-hive/lib-core');

// TODO: RE - remove this named alias of the JSON.parse function to avoid type-checking (the correct type of value is string not any)
const parseJSON = (value) => JSON.parse(value);
const reviewsLogic = new ReviewsLogic(db);
const contractsLogic = new ContractsLogic(db);
const staffLogic = new StaffLogic(db);

const creatResultWithPaginationInfo = (data, pageNumber, pageSize) => {
  const [firstItem] = data;
  const resultSetSize = firstItem ? firstItem.resultSetSize : 0;
  return {
    pageInfo: {
      pageNumber,
      pageSize,
      resultSetSize,
      totalPages: Math.ceil(resultSetSize / pageSize),
    },
    data,
  };
};

router.get(
  '/contracts',
  handle_errors(async (req, res) => {
    const { page, pageSize, searchText, endDate, jobTitlesText, companyEntitiesFilter } = req.query;
    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);
    const endDateValue = endDate ? parseJSON(endDate) : endDate;

    if (
      Number.isNaN(pageNum) ||
      Number.isNaN(pageSizeNum) ||
      pageNum < 0 ||
      pageSizeNum <= 0
    ) {
      res
        .status(400)
        .json({ errorMessage: 'Invalid parameters for page and size' });
    } else {
      const allContracts = await retrieveContracts(
        pageNum,
        pageSizeNum,
        searchText,
        endDateValue,
        jobTitlesText,
        companyEntitiesFilter
      );

      const result = creatResultWithPaginationInfo(allContracts, page, pageSize);
      res.json(result);
    }
  })
);

router.get(
  '/contracts/staff/:staffUserPrincipleName',
  handle_errors(async (req, res) => {
    const staffUserPrincipleName = req.params.staffUserPrincipleName;

    const staffContracts = await contractsLogic.retrieveStaffContracts(staffUserPrincipleName);

    res.json(staffContracts);
  })
);

router.get(
  '/contracts/recommendations',
  handle_errors(async (req, res) => {
    try {
      const {
        page,
        pageSize,
        searchText,
        hrRep,
        status,
        endDate,
        jobTitlesText,
        companyEntitiesFilter
      } = req.query;
      const pageNum = Number(page);
      const pageSizeNum = Number(pageSize);
      const endDateValue = endDate ? parseJSON(endDate) : endDate;

      if (
        isNaN(pageNum) ||
        isNaN(pageSizeNum) ||
        pageNum < 0 ||
        pageSizeNum <= 0
      ) {
        res
          .status(400)
          .json({ errorMessage: 'Invalid parameters for page and size' });
      } else {
        const contractRecommendations = await getAllContractRecommendations(
          pageNum,
          pageSizeNum,
          searchText,
          hrRep,
          status,
          endDateValue,
          jobTitlesText,
          companyEntitiesFilter
        );

        const result = creatResultWithPaginationInfo(
          contractRecommendations,
          page,
          pageSize
        );
        res.json(result);
      }
    } catch (error) {
      res.status(500).json(generateInternalServerMessage("retrieving the contract recommendations",error));
    }
  })
);

router.get(
  '/contracts/recommendations/status-progressions',
  handle_errors(async (_req, res) => {
    try {
      const allStatusProgressions = await contractsLogic.getAllowedContractRecommendationStatusProgressions();
      res.json(allStatusProgressions);
    } catch (error) {
      res.status(500).json(generateInternalServerMessage('retrieving the status progressions',error));
    }
  })
);

router.get(
  '/contracts/recommendations/hr-reps',
  handle_errors(async (_req, res) => {
    const hrReps = await getHrRepsWithRecommendations();
    res.status(200).json(hrReps.map((hrRep) => hrRep.upn));
  })
);

router.get(
  '/contract-staff',
  handle_errors(async (req, res) => {
    try {
      const { page, pageSize, searchText, selectedUnits, selectedEntities, onlyContractorsWithNoContracts } = req.query;
      const pageNum = Number(page);
      const pageSizeNum = Number(pageSize);

      if (
        isNaN(pageNum) ||
        isNaN(pageSizeNum) ||
        pageNum < 0 ||
        pageSizeNum <= 0
      ) {
        res
          .status(400)
          .json({ errorMessage: 'Invalid parameters for page and pageSize' });
      } else {
        const parsedOnlyContractorsWithNoContracts = onlyContractorsWithNoContracts && typeof onlyContractorsWithNoContracts==='string'?JSON.parse(onlyContractorsWithNoContracts):false;
        const result = await getPaginatedContractStaff(
          page,
          pageSizeNum,
          selectedUnits,
          selectedEntities,
          searchText,
          parsedOnlyContractorsWithNoContracts
        );
        res.status(200).json(result);
      }
    } catch (error) {
      res.status(500).json(generateInternalServerMessage('retrieving the contract for the staff',error));
    }
  })
);

router.post(
  '/contracts',
  handle_errors(async (req, res) => {
    const updatedBy = res.locals.upn;

    const validatedStaffReviewId = req.body.staffReviewId ? validateAndParsePositiveInteger('staffReviewId', req.body.staffReviewId) : undefined; 
    const validatedNewContract = parseAndValidate<NewContractRequest>({
      startDate: validateAndParseDate('startsAt', req.body.startsAt),
      endDate: validateAndParseDate('endsAt', req.body.endsAt),
      reviewDate: validateAndParseDate('nextReviewDate', req.body.nextReviewDate),
      staffId: validateAndParsePositiveInteger('staffId', req.body.staffId),
      ...includeInObjectWhenSet('staffReviewId', validatedStaffReviewId),
    });

    if (isError(validatedNewContract)) {
      res.status(400).json(validatedNewContract);
    } else if (validatedNewContract.reviewDate.getTime() < validatedNewContract.startDate.getTime() || validatedNewContract.reviewDate.getTime() > validatedNewContract.endDate.getTime()) {
      res
        .status(400)
        .json({ message: 'The next review date must be between the start and end date of the contract.' });
    } else if (validatedNewContract.endDate.getTime() <= validatedNewContract.startDate.getTime()) {
      res
        .status(400)
        .json({ message: 'Contract end date should be after the start date' });
    } else {
      const { staffId, startDate, endDate, reviewDate, staffReviewId } = validatedNewContract;
      const reviews = await retrieveActiveReviewsByRevieweeStaffId(staffId);

      if (reviews.length > 0) {
        res
          .status(400)
          .json({
            message: `Cannot create a contract for the staff member because they have an active review.`,
          });
      } else {
        const staffMember = (await staffLogic.getStaffByFilter({ staffIds: [staffId] }))[0];
        if (!staffMember) {
          res.status(400).json({ message: `Failed to retrieve staff member with staffId=${staffId} when trying to create the staff member's contract.` })
        } else {
          const existingContracts = await contractsLogic.retrieveStaffContracts(staffMember.upn);
          const overlappingContracts = findOverlappingDateRanges(
            moment(startDate),
            moment(endDate),
            existingContracts.map((contract) => ({ ...contract, startDate: moment(contract.startsAt), endDate: moment(contract.endsAt) }))
          );

          if (overlappingContracts.length > 0) {
            const overlappingContractDateRangesString = overlappingContracts.map(contract => `${contract.startsAt.toDateString()} to ${contract.endsAt.toDateString()}`).join('; ')
            res.status(409).json({ message: `Failed to create a new contract as the new contract dates (${startDate.toDateString()} to ${endDate.toDateString()}) overlap with the following existing contract dates: ${overlappingContractDateRangesString}` });
          } else {
            await withTransaction(async (tx) => {
              await contractsLogic.createContract(tx, staffId, updatedBy, startDate, endDate, reviewDate);
              await reviewsLogic.removeStaffReview(tx, staffReviewId, updatedBy);
            });
            res.status(201).send();
          }
        }
      }
    }
  })
);

router.post(
  '/contracts/recommendations',
  handle_errors(async (req, res) => {
    const {contractId, hrRep} = req.body;
    const updatedBy = res.locals.upn;

    const contract = await getContractById(contractId);

    if (!contract) {
      res.status(400).json({ message: `A recommendation cannot be created for a contract that doesn't exist.` });
    } else if (contract.holdReason) {
      res.status(400).json({ message:  `A recommendation cannot be created for a contract that is currently on hold.` });
    } else {
      await withTransaction(async (tx) => {
        await markContractAsScheduled(tx, contractId, updatedBy);
        await createContractRecommendation(tx, contractId, hrRep, updatedBy);
      });
      res.status(201).send();
    }
  })
);

const addRecommendationStatusOrReturnErrorMessage = async (
  tx,
  contractRecommendation,
  status,
  updatedBy
) => {
  const contractRecommendationId =
    contractRecommendation.contractRecommendationId;
  if (contractRecommendation === undefined) {
    return 'Cannot add status for a contract recommendation that does not exist.';
  } else {
    const allowedProgressions =
      await contractsLogic.allowedContractRecommendationStatusProgressions(
        contractRecommendation.status
      );
    const canProgressStatus = allowedProgressions.some(
      (statusProgression) => statusProgression.toStatus == status
    );

    if (canProgressStatus === undefined) {
      return `The contract recommendation status cannot be changed from '${contractRecommendation.status}' to '${status}'.`;
    } else {
      await contractsLogic.addContractRecommendationStatus(
        tx,
        contractRecommendationId,
        status,
        updatedBy
      );
      return undefined;
    }
  }
};

const createStaffReviewOrReturnErrorMessage = async (
  tx,
  updatedBy,
  nextReviewType,
  nextReviewDate,
  contractRecommendation
) => {
  const reviewType = await retrieveFeedbackTemplate(nextReviewType);

  if (reviewType !== undefined) {
    const staffReviewId = await reviewsLogic.createStaffReview(
      tx,
      updatedBy,
      contractRecommendation.staffId,
      nextReviewDate,
      undefined,
      reviewType.feedbackAssignmentTemplateId
    );
    await addContractRecommendationStaffReviewLink(
      tx,
      contractRecommendation.contractRecommendationId,
      staffReviewId
    );
    const reviewStatusId = (await retrieveStartingReviewStatus())
      .reviewStatusId;
    const reviewId = await createReview(
      tx,
      updatedBy,
      updatedBy,
      nextReviewDate,
      contractRecommendation.userPrincipleName,
      reviewType.feedbackAssignmentTemplateId,
      reviewStatusId
    );
    await insertStaffReviewLinking(tx, staffReviewId, reviewId);
    return undefined;
  } else {
    return 'The next review type is invalid.';
  }
};

const renewContractOrReturnErrorMessage = async (
  tx,
  updatedBy,
  startDate,
  endDate,
  contractRecommendation,
  nextReviewDate
) => {
  const startsAt = new Date(startDate);
  const endsAt = new Date(endDate);
  const reviewDate = new Date(nextReviewDate);
  const previousContractEndDate = new Date(contractRecommendation.endsAt);

  if (!startDate || !endDate) {
    return 'Contract start or end date are not provided';
  } else if (endsAt <= startsAt) {
    return 'Contract end date should be after the start date';
  } else if (previousContractEndDate >= startsAt) {
    return 'New contract start date should be after the previous contract end date';
  } else {
    await contractsLogic.createContract(
      tx,
      contractRecommendation.staffId,
      updatedBy,
      startsAt,
      endsAt,
      reviewDate
    );
    return undefined;
  }
};

const updateContractReviewDateOrReturnErrorMessage = async (tx, updatedBy, nextReviewDate, contractRecommendation) => {
  const reviewDate = new Date(nextReviewDate);

  if(nextReviewDate && !isNaN(reviewDate.getTime())) {
    await updateContractDatesTx(
      tx,
      contractRecommendation.contractId,
      contractRecommendation.startsAt,
      contractRecommendation.endsAt,
      reviewDate,
      updatedBy
    );
  } else {
    return "The nextReviewDate is required and must be a valid date string."
  }
};

const addContractRecommendationCancellationReason  = async (tx, contractRecommendationId, reason, createdBy) => {
  if (!reason) {
    throw new ValidationError('Please provide a reason for canceling the contract recommendation.');
  } else {
    await addContractRecommendationComment(tx, contractRecommendationId, createdBy, reason);
  }
}

router.patch(
  '/contracts/recommendations/:contractRecommendationId',
  handleErrors(async (req: Request<{ contractRecommendationId: number }, BadRequestDetail | undefined, ContractRecommendationUpdate>, res: Response<BadRequestDetail | undefined, AuthenticatedLocals>) => {
    const updatedBy = res.locals.upn;
    const contractRecommendationId = Number(req.params.contractRecommendationId);
    const contractRecommendationUpdate = req.body;

    const contractRecommendation = await contractsLogic.getContractRecommendationById(
      contractRecommendationId
    );
    const currentStatus = contractRecommendation.status;
    const nextStatus = contractRecommendationUpdate.status;
    try {
      await withTransaction(async (tx) => {
        const statusProgressionErrorMessage =
          await addRecommendationStatusOrReturnErrorMessage(
            tx,
            contractRecommendation,
            contractRecommendationUpdate.status,
            updatedBy
          );

        if (statusProgressionErrorMessage) {
          res.status(400).json({ message: statusProgressionErrorMessage });
        } else {
          let errorMessage = undefined;

          if (
            currentStatus === 'New' &&
            nextStatus === 'In Review'
          ) {
            const { nextReviewType, nextReviewDate } = contractRecommendationUpdate;
            errorMessage = await createStaffReviewOrReturnErrorMessage(
              tx,
              updatedBy,
              nextReviewType,
              nextReviewDate,
              contractRecommendation
            );
          } else if (
            currentStatus === 'To Renew' &&
            nextStatus === 'Archived'
          ) {
            const { startDate, endDate, nextReviewDate } = contractRecommendationUpdate;
            errorMessage = await renewContractOrReturnErrorMessage(
              tx,
              updatedBy,
              startDate,
              endDate,
              contractRecommendation,
              nextReviewDate
            );
          } else if (currentStatus === 'New' && nextStatus === 'Cancelled') {
            const { recommendationCancelReason } = contractRecommendationUpdate;
            await addContractRecommendationCancellationReason(tx, contractRecommendationId, recommendationCancelReason, updatedBy);
            await markContractAsUnscheduled(tx, contractRecommendation.contractId);
          } else if (nextStatus === 'Archived' && currentStatus == 'Continue As Is') {
            const { nextReviewDate } = contractRecommendationUpdate;
            errorMessage = await updateContractReviewDateOrReturnErrorMessage(tx, updatedBy, nextReviewDate, contractRecommendation);
            await markContractAsUnscheduled(tx, contractRecommendation.contractId);
          } else if (nextStatus === 'Archived' && currentStatus === 'To Terminate') {
            const isAllowedToBeMarkedAsPendingDelete = await staffLogic.checkIfStaffIsAllowedToTransitionToStaffStatus(contractRecommendation.staffId, 'pending-delete');
            if (isAllowedToBeMarkedAsPendingDelete) {
              await staffLogic.updateStaffStatus(tx, contractRecommendation.staffId, 'pending-delete', updatedBy, contractRecommendation.endsAt);
            } else {
              res.status(400).json({ message: "Failed to terminate this staff member's contract recommendation. They are not allowed to be marked as pending delete." });
            }
          }

          if (errorMessage) {
            throw new Error(errorMessage);
          } else {
            res.status(204).json();
          }
        }
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  })
);

const validateContractRecommendationHrRepUpdateInput = (contractRecommendationId, hrRep, comment) => {
  if (isNaN(contractRecommendationId)) {
    throw new ValidationError('Contract recommendation id must be a number');
  } else {
    // Contract recommendation id is valid input
  }

  if (hrRep === undefined) {
    throw new ValidationError('You need to provide a new hr representative');
  } else {
    // hrRep is valid input
  }

  if (comment === undefined) {
    throw new ValidationError('You need to provide a reason for changing the hr representative');
  } else {
    // comment is valid input
  }
}

router.patch(
  '/contracts/recommendations/:contractRecommendationId/hrRep',
  handle_errors(async (req, res) => {
    const updatedBy = res.locals.upn;
    const contractRecommendationId = Number(req.params.contractRecommendationId);
    const { hrRep, comment, temporaryHrRepEndDate } = req.body;

    try {
      await withTransaction(async (tx) => {
        validateContractRecommendationHrRepUpdateInput(contractRecommendationId, hrRep, comment);

        const contractRecommendation = await contractsLogic.getContractRecommendationById(contractRecommendationId);
        if (contractRecommendation.hrRep === hrRep) {
          throw new ValidationError('You cannot take your own contract recommendation');
        } else {
          // HrRep cannot take their own contract recommendation
        }

        if (temporaryHrRepEndDate) {
          const tempHrRepEndDate = new Date(temporaryHrRepEndDate);
          const currentDate = new Date();

          if (tempHrRepEndDate < currentDate) {
            throw new ValidationError(`The temporary HR representative's end date must be set for a future date.`);
          } else {
            await addTemporaryContractRecommendationHrRep(tx, contractRecommendationId, hrRep, temporaryHrRepEndDate, updatedBy);
          }
        } else {
          await updateContractRecommendationHrRep(tx, contractRecommendation.contractRecommendationId, hrRep, updatedBy);
        }
        await addContractRecommendationComment(tx, contractRecommendation.contractRecommendationId, updatedBy, comment);
      });
      res.status(204).send();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json(generateInternalServerMessage('updating the contract recommendations',error));
      }
    }
  })
);

const assignHRRepToContractRecommendation = async (tx, contractIds, hrReps, createdBy) => {
  let hrRepNumber = 0;
  for (const contractId of contractIds) {
    if (hrRepNumber === hrReps.length) hrRepNumber = 0;
    const hrRep = hrReps[hrRepNumber];
    const data = { contractId, hrRep };
    await markContractAsScheduled(tx, contractId, createdBy);
    await queue.enqueue('create-recommendation-queue', data);
    hrRepNumber++;
  }
};

router.post(
  '/contracts/recommendations/bulk',
  handle_errors(async (req, res) => {
    const createdBy = res.locals.upn;
    try {
      await withTransaction(async (tx) => {
        const { contractIds, indiaContractIds, hrReps, indiaHrReps } = req.body;

        await assignHRRepToContractRecommendation(tx, contractIds, hrReps, createdBy);
        await assignHRRepToContractRecommendation(tx, indiaContractIds, indiaHrReps, createdBy);

        res.status(201).send();
      })
    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }

      res.status(500).json(generateInternalServerMessage(`adding the contract recommendations (${errorMessage})`,error));
    }
  })
);

router.patch(
  '/contracts/:contractId',
  handle_errors(async (req, res) => {
    const contractId = req.params.contractId;
    const { startsAt, endsAt, nextReviewDate } = req.body;
    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    const reviewDueDate = new Date(nextReviewDate);

    try {
      if (!startsAt || !endsAt || !nextReviewDate) {
        res
          .status(400)
          .json({ error: 'Contract start, review, and end dates must be provided' });
      } else if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(reviewDueDate.getTime())) {
        res.status(400).json({ error: 'Invalid date format provided' });
      } else if (endDate.getTime() <= startDate.getTime()) {
        res
          .status(400)
          .json({ message: 'Contract end date must be after the start date' });
      } else {
        await updateContractDates(contractId, startsAt, endsAt, reviewDueDate, res.locals.upn);
        res.status(200).send();
      }
    } catch (error) {
      res.status(500).json(generateInternalServerMessage('setting the next review date for the contract',error));
    }
  })
);

router.post(
  '/contracts/:contractId/hold',
  handle_errors(async (req, res) => {
    const contractId = Number.parseInt(req.params.contractId);
    const updatedBy = res.locals.upn;
    const { holdReason  } = req.body;

    if (Number.isNaN(contractId)) {
      res.status(400).json({ message: `The contract ID '${contractId}' is invalid.` });
    } else {
      await withTransaction((tx) => putContractOnHold(tx, contractId, holdReason, updatedBy));
      res.status(204).send();
    }
  })
)

router.delete(
  '/contracts/:contractId/hold',
  handle_errors(async (req, res) => {
    const contractId = Number.parseInt(req.params.contractId);

    if (Number.isNaN(contractId)) {
      res.status(400).json({ message: `The contract ID '${contractId}' is invalid.` });
    } else {
      await withTransaction((tx) => removeContractHold(tx, contractId));
      res.status(204).send();
    }
  })
)

router.get(
  '/contracts-recommendations-numbers',
  handle_errors(async (req, res) => {
    const { searchText, endDate, hrRep, jobTitlesText, companyEntitiesFilter } =
    req.query;
    const endDateValue = endDate ? parseJSON(endDate) : endDate;
    const result = await getContractRecommendationNumbers(searchText, hrRep, endDateValue, jobTitlesText, companyEntitiesFilter);
    res.status(200).send(result);
  })
)

router.get(
  '/staff/:userPrincipleName/contracts/recommendations/comments',
  handle_errors(async (req, res) => {
    const userPrincipleName = req.params.userPrincipleName;
    const staffContractRecommendationComments = await getContractRecommendationCommentsForStaff(userPrincipleName);
    res.status(200).json(staffContractRecommendationComments);
  })
)

router.get(
  '/contracts/recommendations/:contractRecommendationId/comments',
  handle_errors(async (req, res) => {
    const contractRecommendationId = Number.parseInt(req.params.contractRecommendationId);

    if (Number.isNaN(contractRecommendationId)) {
      res.status(400).json({ message: `The contract recommendation ID '${contractRecommendationId}' is invalid.` });
    } else {
      const contractRecommendationComments = await getContractRecommendationComments(contractRecommendationId);
      res.status(200).json(contractRecommendationComments)
    }
  })
)

router.post(
  '/contracts/recommendations/:contractRecommendationId/comments',
  handle_errors(async (req, res) => {
    const contractRecommendationId = Number.parseInt(req.params.contractRecommendationId);
    const createdBy = res.locals.upn;
    const { comment } = req.body;

    if (Number.isNaN(contractRecommendationId)){
      res.status(400).json({ message: `The contract recommendation ID '${contractRecommendationId}' is invalid.` });
    } else if (!comment) {
      res.status(400).json({ message: `Please provide a comment that will be saved.` });
    } else {
      await withTransaction((tx) => addContractRecommendationComment(tx, contractRecommendationId, createdBy, comment));
      res.status(201).send();
    }
  })
)

router.get(
  '/contracts/recommendations/cancellation-reasons',
  handle_errors(async (_req, res) => {
    try {
      const recommendationCancelReasons = await getContractRecommendationCancellationReasons();
      res.status(200).json(recommendationCancelReasons);
    } catch(error) {
      res.status(500).json(generateInternalServerMessage('getting the recommendation cancellation reasons',error));
    }
  })
);

module.exports = router;
