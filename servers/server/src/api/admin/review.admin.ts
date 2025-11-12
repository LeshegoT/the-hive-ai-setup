const router = require('express').Router();
const { handle_errors, handleErrors, validateAndParsePagination } = require('@the-hive/lib-core');
import { AuthenticatedLocals } from '@the-hive/lib-core';
import { ContractsLogic, FeedbackLogic, ReviewsLogic } from '@the-hive/lib-reviews-logic';
import { ReviewAudit, UNIT_MOVE_REVIEW_TEMPLATE_NAME } from '@the-hive/lib-reviews-shared';
import { BadRequestDetail, isBBDEmail, isError, PagedResponse } from '@the-hive/lib-shared';
import { NextFunction, Request, Response } from 'express';
import { GetAccessibleRoutes } from '../../queries/security.queries';
import { REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE, REVIEW_COMMUNICATION_REASON_SYSTEM_NUDGE } from '../../shared/review';
import { getUserGroups } from '../security';

const {
  retrieveFilteredReviews,
  allReviewAssignments,
  retrieveReview,
  structuredReviewReport,
  structuredUserFeedback,
  getLatestReviewId,
  updateClientEmail,
  insertReportDownload,
  retrieveStaffReviewsToBeCreatedAt,
  markUpcomingReviewAsScheduled,
  getReviewsByStatus,
  updateReviewStatus,
  changeReviewHoldStatus,
  getStatusDescriptionById,
  getNumberOfReviewsBasedOnFilter,
} = require('../../queries/review.queries');
const {
  archiveReview,
  deleteActiveFeedbackAssignments,
  getReviewMeetingMinutes,
  getReview,
  getDetailsForFeedbackProvidersRequestEmail,
} = require('../../queries/peer-feedback.queries');
const {
  getReviewReasons,
  addHRReviewReason,
} = require('../../queries/review-reasons.queries');
const {
  groupMembers,
  peopleOwningReviews,
} = require('../../queries/user.queries');
const {
  retrieveWeeklyReviewDashboard,
  retrieveWeeklyReviewAgeing,
  retrieveStatusSummaryForPeriod,
  retrieveReviewDurations,
  retrieveHrReviewCountSummaryByPeriod,
  retrieveReviewsForLatenessAndStatus,
  retrieveReviewsWithUnchangedLatenessAndStatus,
} = require('../../queries/review-dashboard.queries');
const { withTransaction } = require('../../shared/db');
const {
  createReviewWithAssignments,
  getReviewStatuses,
} = require('../../shared/review');
const {
  parseIfSetElseDefault,
  bbdDomains,
} = require('@the-hive/lib-core');
const queue = require('../../shared/queue');
const {
  hasContractRecommendations,
  retrieveContractRecommendationId,
} = require('../../queries/contracts.queries');
const { ValidationError } = require('../../shared/validations');
const { generateInternalServerMessage} = require('@the-hive/lib-core');
const { db } = require('../../shared/db');
const { StaffLogic } = require('@the-hive/lib-staff-logic');
const { getBBDUserStaffPersonalDetails } = require('../../queries/reporting.queries');
const reviewsLogic = new ReviewsLogic(db);
const contractsLogic = new ContractsLogic(db);
const staffLogic = new StaffLogic(db);
const feedbackLogic = new FeedbackLogic(db);

const REVIEW_HR_REPRESENTATIVE_GROUP_NAME = 'Review HR Rep';
const INDIA_REVIEW_HR_REPRESENTATIVE_GROUP_NAME = 'India Review HR Rep';
const CAN_VIEW_OWN_REVIEW = parseIfSetElseDefault('ALLOW_HR_OWN_REVIEW', false);
const FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED = parseIfSetElseDefault('FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED', false);
const INDIA_ENTITY_ABBREVIATION = parseIfSetElseDefault('INDIA_ENTITY_ABBREVIATION', 'IND');

const protectReviewsRoute = async (req: Request, res: Response<BadRequestDetail | undefined, AuthenticatedLocals>, next: NextFunction) => {
  const userGroups = await getUserGroups(res.locals.upn);
  const userAccessibleRoutes = await GetAccessibleRoutes(userGroups, res.locals.upn);
  const urlWithoutQuery = req.originalUrl.split('?')[0];
  const isAllowedToAccessRoute = userAccessibleRoutes.some(route => new RegExp(route.routePattern).test(urlWithoutQuery));
  if (!isAllowedToAccessRoute) {
    res.status(403).json({ message: "You are not allowed to perform this action or access this resource." });
  } else {
    next();
  }
}

router.get(
  '/hr-review-dashboard/',
  handle_errors(async (req, res) => {
    const dashboardData = await retrieveWeeklyReviewDashboard();
    res.status(200).json(dashboardData);
  })
);

router.get(
  '/hr-review-ageing/',
  handle_errors(async (req, res) => {
    const ageingData = await retrieveWeeklyReviewAgeing();
    res.status(200).json(ageingData);
  })
);

/**
 * Returns middleware that handles summary requests.
 *
 * A summary request has an asAt date, the period length as well as the number of periods.
 *
 * @param {Function} retriever - The function to call to fetch the the summary.
 * @returns {Function}
 */
const handleWithSummaryRetriever = (retriever) => {
  return async (req, res) => {
    try {
      const periodLength = req.query.periodLength;
      const numberOfPeriods = Number.parseInt(req.query.numberOfPeriods);
      const asAtEndOf = new Date(req.query.asAtEndOf);
      const companyEntityIds = req.query.companyEntityIds;

      const invalidFields = [
        {
          field: "asAtEndOf",
          valid: !!req.query.asAtEndOf,
          error: "asAtEndOf is required."
        },
        {
          field: "asAtEndOf",
          valid: !isNaN(asAtEndOf.getTime()),
          error: "asAtEndOf should be a valid date string."
        },

        {
          field: "numberOfPeriods",
          valid: !!req.query.numberOfPeriods,
          error: "numberOfPeriods is required."
        },
        {
          field: "numberOfPeriods",
          valid: !isNaN(numberOfPeriods),
          error: "numberOfPeriods should be a number."
        },
      ].filter(field => !field.valid);

      if(invalidFields.length === 0) {
        const statusSummaries = await retriever(asAtEndOf, periodLength, numberOfPeriods, companyEntityIds);
        res.status(200).json(statusSummaries);
      } else {
        res.status(400).json(invalidFields)
      }
    } catch (error) {
      if (error.causedBy?.code === "ETIMEOUT") {
        res.status(504).json({
          message: "The request took too long to complete. Please try again or contact support if the problem persists.",
          code: error.causedBy.code,
          details: error.message,
        })
      } else {
        res.status(500).json({
          message: error.message,
          code: error.code ?? error.name,
          details: "Internal Server Error"
        })
      }
    }
  }
}

async function handleFeedbackProvidersRequest(reviewId: number, communicationReason: typeof REVIEW_COMMUNICATION_REASON_SYSTEM_NUDGE | typeof REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE): Promise<void | BadRequestDetail> {
  const hasEmailAlreadyBeenSentToday = await feedbackLogic.hasFeedbackProvidersRequestEmailBeenSentForReviewToday(reviewId);
  if (hasEmailAlreadyBeenSentToday) {
    return { message: "A feedback providers request email has already been sent for this review today."}
  } else {
    const details = await getDetailsForFeedbackProvidersRequestEmail(reviewId);
    await queue.enqueue('feedback-providers-request', {
      details,
      typeOfCommunication: communicationReason
    });
  }
}

router.post('/reviews/:reviewId/nudge-manager',
  handle_errors(async (req, res) => {
    const reviewId = req.params.reviewId;
      try {
        const sendEmailResponse = await handleFeedbackProvidersRequest(reviewId, REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE);
        if (sendEmailResponse && isError(sendEmailResponse)) {
          res.status(400).json(sendEmailResponse);
        } else {
          res.status(202).json();
        }
      } catch (error) {
        res.status(500).json(generateInternalServerMessage('sending feedback providers request email', error));
      }
  })
)


router.get('/hr-review-dashboard/status-summaries', handle_errors(
  async (req, res) => {
    try {
      const periodLength = req.query.periodLength;
      const numberOfPeriods = Number.parseInt(req.query.numberOfPeriods);
      const asAtEndOf = new Date(req.query.asAtEndOf);
      const companyEntityIds = req.query.companyEntityIds;
      const templateName = req.query.templateName;
      const excludedHrReps = req.query.excludedHrReps;
      const excludedLatenesses = req.query.excludedLatenesses;
      const excludedStatuses = req.query.excludedStatuses;
      const excludedTemplateNames = req.query.excludedTemplateNames;

      const invalidFields = [
        {
          field: "asAtEndOf",
          valid: !!req.query.asAtEndOf,
          error: "asAtEndOf is required."
        },
        {
          field: "asAtEndOf",
          valid: !isNaN(asAtEndOf.getTime()),
          error: "asAtEndOf should be a valid date string."
        },

        {
          field: "numberOfPeriods",
          valid: !!req.query.numberOfPeriods,
          error: "numberOfPeriods is required."
        },
        {
          field: "numberOfPeriods",
          valid: !isNaN(numberOfPeriods),
          error: "numberOfPeriods should be a number."
        },
      ].filter(field => !field.valid);

      if(invalidFields.length === 0) {
        const statusSummaries = await retrieveStatusSummaryForPeriod(asAtEndOf, periodLength, numberOfPeriods, companyEntityIds, templateName, excludedHrReps, excludedLatenesses, excludedStatuses, excludedTemplateNames);
        res.status(200).json(statusSummaries);
      } else {
        res.status(400).json(invalidFields)
      }
    } catch(error) {
      res.status(500).json({ message: error.message });
    }
  }
));

router.get('/hr-review-dashboard/review-durations', handle_errors(handleWithSummaryRetriever(retrieveReviewDurations)));

router.get(
  '/review/v2/',
  handle_errors(async (req, res) => {
    const {
      page,
      size,
      statusId,
      createdBy,
      selectedReviewTypeIds,
      searchText,
      selectedStatusIds,
    } = req.query;

    let {
      from,
      to,
      archived,
    } = req.query;

    if (page && size) {
      if (from) {
        from = new Date(from).toISOString();
      }
      if (to) {
        to = new Date(to).toISOString();
      }
      archived = archived === 'true' ? 'true' : 'false';
      const allFilteredReviews = await retrieveFilteredReviews(
        page,
        size,
        statusId,
        createdBy,
        from,
        to,
        selectedReviewTypeIds,
        searchText,
        archived,
        selectedStatusIds
      );
      let reviews = allFilteredReviews;
      if (!CAN_VIEW_OWN_REVIEW) {
        reviews = allFilteredReviews.filter(
          (review) =>
            review.reviewee.toLowerCase() !== res.locals.upn.toLowerCase()
        );
      } else {
        //do nothing
      }

      const overallAssignmentCount = reviews[0] ? reviews[0].overallCount : 0;

      reviews = await structuredReviews(reviews);

      const result = {
        pageInfo: {
          pageNumber: page,
          pageSize: size,
          resultSetSize: overallAssignmentCount,
          totalPages: Math.ceil(overallAssignmentCount / size),
        },
        data: reviews,
      };

      res.json(result);
    } else {
      res
        .status(400)
        .send(
          'Failed to retrieve reviews: Missing parameters for page and size '
        );
    }
  })
);

const structuredReviews = async (reviews) => {
  return reviews.map((review) => {
    return {
      reviewID: review.reviewId,
      reviewee: review.reviewee,
      template: {
        id: review.feedbackAssignmentTemplateId,
        name: review.templateName,
        isManualFeedback: review.manualFeedbackAssignment,
      },
      dateCreated: review.dateCreated,
      hrRep: review.hrRep,
      dueDate: review.dueDate,
      status: review.status,
      archived: review.archived,
      staffId: review.staffId,
      displayName: review.displayName
    };
  });
};

router.get(
  '/review/v2/:id/assignments/',
  handle_errors(async (req, res) => {
    const id = req.params.id;
    const assignments = await allReviewAssignments(id);
    res.json(assignments);
  })
);

router.get(
  '/review/v2/:id/report/',
  handle_errors(async (req, res) => {
    const { anonymous, levelupFrom, levelupTo, voluntaryFrom, voluntaryTo } =
      req.query;
    const id = req.params.id;

    const islevelupIncluded =
      levelupFrom !== undefined && levelupTo !== undefined;
    const isVoluntaryIncluded =
      voluntaryFrom !== undefined && voluntaryTo !== undefined;

    const review = await retrieveReview(id);

    if(review.reviewee.toLowerCase() !== res.locals.upn.toLowerCase()) {
      await withTransaction(async (tx) => {
        await insertReportDownload(
          tx,
          res.locals.upn,
          id,
          islevelupIncluded ? 1 : 0,
          isVoluntaryIncluded ? 1 : 0
        );
      });

      const reviewResponse = await structuredReviewReport(
        review,
        anonymous,
        levelupFrom,
        levelupTo,
        voluntaryFrom,
        voluntaryTo
      );

      res.json(reviewResponse);
    } else {
      res.status(403).json({message: 'Report cannot be downloaded for own review'});
    }
  })
);

router.get(
  '/review/feedback/:upn',
  handle_errors(async (req, res) => {
    const upn = req.params.upn;

    if (upn) {
      if(upn.toLowerCase() !== res.locals.upn.toLowerCase()) {
        const result = await structuredUserFeedback(upn);
        res.json(result);
      } else {
        res.status(403).json({message: 'Not allowed to retrieve self feedback'});
      }
    } else {
      res
        .status(400)
        .send('Failed to retrieve feedback: Missing parameters for user ');
    }
  })
);

router.patch(
  '/review/v2/:id/clientEmail',
  handle_errors(async (req, res) => {
    try {
      const assignmentId =parseInt(req.params.id);
      if (Number.isNaN(assignmentId) || assignmentId <= 0) {
        res.status(400).json({ message: 'Invalid assignment ID' });
      } else {
        const clientEmail = req.body.email;
        if (!clientEmail) {
          res.status(400).json({ message: 'Client email is required' });
        } else if (isBBDEmail(clientEmail, bbdDomains)) {
          res.status(400).json({ message: 'BBD email addresses are not allowed for client emails. Please use an external email address.'});
        } else {
          await updateClientEmail(assignmentId, clientEmail);
          res.status(200).send();
        }
      }
    } catch (error) {
      res.status(500).json({ message: 'An unexpected error occurred while updating the email. Please try again',error:error});
    }
  })
);

router.get(
  '/reviews/toBeCreated/',
  handle_errors(async (req, res) => {
    try {
      const {
        date,
        searchText,
        selectedReviewTypeIds,
        selectedCompanyFilter,
      } = req.query;
      const result =
        await retrieveStaffReviewsToBeCreatedAt(
          date,
          searchText,
          selectedReviewTypeIds,
          selectedCompanyFilter
        )
      res.json(result);
    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }
      res.status(500).send(errorMessage);
    }
  })
);

const assignToHrRepresentative = async (
  assignments,
  hrRepresentatives,
  reviewee
) => {
  if (hrRepresentatives.length === 0) {
    throw new Error(
      `Cannot assign HR Representative for ${reviewee} because the list of HR Representatives does not exist.`
    );
  }
  const hrRepresentativesSortedByCurrentAssignmentCount = hrRepresentatives
    .filter((representative) => representative !== reviewee)
    .map((representative) => ({
      hrRepresentative: representative,
      currentAssignmentCount: assignments[representative]?.length ?? 0,
    }))
    .sort((a, b) => a.currentAssignmentCount - b.currentAssignmentCount);

  return hrRepresentativesSortedByCurrentAssignmentCount[0].hrRepresentative;
};

router.post(
  '/reviews/bulk',
  handle_errors(async (req, res) => {
    try {
      const { reviews, hrOther, hrIndia } = req.body;
      const upn = res.locals.upn;

      const indiaAssignments = Object.fromEntries(
        hrIndia.map((key) => [key, []])
      );
      const otherAssignments = Object.fromEntries(
        hrOther.map((key) => [key, []])
      );
      for (const review of reviews) {
        const {
          userPrincipleName: reviewee,
          dueDate: reviewDate,
          nextFeedbackTypeId: assignmentTemplateId,
          staffReviewId,
          holdReason,
        } = review;
        if (!holdReason) {
          const reviewers = [];
          let hrRep;
          if (review.entityAbbreviation === INDIA_ENTITY_ABBREVIATION) {
            hrRep = await assignToHrRepresentative(
              indiaAssignments,
              hrIndia,
              reviewee
            );
            indiaAssignments[hrRep].push(reviewee);
          } else {
            hrRep = await assignToHrRepresentative(
              otherAssignments,
              hrOther,
              reviewee
            );
            otherAssignments[hrRep].push(reviewee);
          }
          const data = {
            reviewee,
            reviewers,
            hrRep,
            upn,
            reviewDate,
            assignmentTemplateId,
            staffReviewId,
          };
          await markUpcomingReviewAsScheduled(staffReviewId, hrRep);
          await queue.enqueue('create-review-queue', data);
        }
      }
      res.status(201).send();
    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }
      res.status(500).send(errorMessage);
    }
  })
);

router.post('/reviews/unit-change', handle_errors(async (req, res) => {
  try {

    const { revieweeUpn, reviewDeadline } = req.body;
    const createdByUpn = res.locals.upn;
    const staffRecord = await getBBDUserStaffPersonalDetails(revieweeUpn);

    const validationResults = validateCreateUnitChangeReviewInput(staffRecord, revieweeUpn, reviewDeadline);

    if (validationResults?.length > 0) {
      res.status(400).json({ message: `Failed to create unit move review: ${validationResults.map(error => error.message).join(', ')}` });
    } else {
      const hrRepOrError = reviewsLogic.getHrRepForRevieweeGivenAssignmentSplit(parseIfSetElseDefault('UNIT_CHANGE_REVIEW_ASSIGNMENT_SPLIT', []), staffRecord.displayName, staffRecord.entityAbbreviation);
      const revieweeStaffId = staffRecord.staffId;
      const activeUnitChangeReview = await reviewsLogic.getActiveReviewIdByTemplateNameForStaffMember(revieweeUpn, UNIT_MOVE_REVIEW_TEMPLATE_NAME);

      if (isError(hrRepOrError)) {
        res.status(400).json(hrRepOrError);
      } else if (activeUnitChangeReview && !isError(activeUnitChangeReview)) {
        res.status(409).json({ message: `A unit move review already exists for this staff member (${revieweeUpn}).` });
      } else {
        let createUnitChangeReviewResult;
        await withTransaction(async (tx) => {
          createUnitChangeReviewResult = await createUnitChangeReview(tx, createdByUpn, revieweeStaffId, reviewDeadline, revieweeUpn, hrRepOrError);
        });

        if (createUnitChangeReviewResult && isError(createUnitChangeReviewResult)) {
          res.status(400).json(createUnitChangeReviewResult);
        } else if (createUnitChangeReviewResult) {
          res.status(201).send();
        } else {
          res.status(500).json({ message: 'Could not create unit move review' });
        }
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not create unit move review', detail: error.message });
  }
}));


async function createUnitChangeReview(tx, createdByUpn, revieweeStaffId, reviewDeadline, revieweeUpn, hrRepOrError) {
  const unitChangeFeedbackAssignmentTemplate = await reviewsLogic.getFeedbackAssignmentTemplateByName(UNIT_MOVE_REVIEW_TEMPLATE_NAME);

  const staffReviewId = await reviewsLogic.createStaffReview(
    tx,
    createdByUpn,
    revieweeStaffId,
    reviewDeadline,
    undefined,
    unitChangeFeedbackAssignmentTemplate.feedbackAssignmentTemplateId
  );

  if (staffReviewId) {
    const activeStaffDepartment = await staffLogic.getActiveStaffDepartment(revieweeStaffId);
    if (activeStaffDepartment) {
      await createReviewAndLinkStaffDepartment(tx, staffReviewId, activeStaffDepartment.staffDepartmentId, revieweeUpn, hrRepOrError, createdByUpn, reviewDeadline, unitChangeFeedbackAssignmentTemplate.feedbackAssignmentTemplateId);
      return { staffReviewId };
    } else {
      return { message: 'Failed to create unit change review: Could not retrieve active staff department' };
    }
  } else {
    return { message: 'Failed to create unit change review: Could not create a staff review' };
  }
}

async function createReviewAndLinkStaffDepartment(tx, staffReviewId, staffDepartmentId, revieweeUpn, hrRep, createdByUpn, reviewDeadline, feedbackAssignmentTemplateId) {
  await reviewsLogic.addStaffDepartmentStaffReview(
    tx,
    staffReviewId,
    staffDepartmentId
  );

  await createReviewWithAssignments(
    tx,
    revieweeUpn,
    [],
    hrRep,
    createdByUpn,
    reviewDeadline,
    feedbackAssignmentTemplateId,
    undefined,
    staffReviewId,
  );
}

function validateCreateUnitChangeReviewInput(staffRecord, revieweeUpn, reviewDeadline) {
  if (!staffRecord) {
    return [{
      message: `Could not find staff member with email: ${revieweeUpn}.`,
      error: true
    }];
  } else {
    const inputValidationErrors = [
      {
        message: 'revieweeUpn is required.',
        error: !revieweeUpn
      },
      {
        message: 'reviewDeadline is required.',
        error: !reviewDeadline
      },
      {
        message: 'reviewDeadline must be a valid ISO date string.',
        error: isNaN(Date.parse(reviewDeadline))
      },
      {
        message: `Could not find staff member with email: ${revieweeUpn}.`,
        error: revieweeUpn && !staffRecord
      },
    ].filter(validation => validation.error);

    return inputValidationErrors
  }

}

router.post(
  '/reviews/:staffReviewId',
  handle_errors(async (req, res) => {
    try {
      const {
        about: reviewee,
        assignedTo: reviewers,
        dueBy: reviewDate,
        feedbackAssignmentTemplateId: assignmentTemplateId,
      } = req.body;
      const hrRep = res.locals.upn;
      if (hrRep.toLowerCase() != reviewee.toLowerCase()) {
        await withTransaction(async (tx) => {
          await createReviewWithAssignments(
            tx,
            reviewee,
            reviewers,
            hrRep,
            hrRep,
            reviewDate,
            assignmentTemplateId,
            undefined,
            req.params.staffReviewId
          );
        })
        res.json(hrRep);
      } else {
        throw new Error('HR rep is the same as the reviewee');
      }
    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }
      res.status(400).json({ message: errorMessage });
    }
  })
);

router.patch(
  '/reviews/:staffReviewId/hold',
  handle_errors(async (req, res) => {
    try {
      const holdReason = req.body.holdReason;
      const staffReviewId = req.params.staffReviewId;
      const activeUPN = holdReason == null ? null : res.locals.upn;
      await changeReviewHoldStatus(holdReason, staffReviewId, activeUPN);
      res.status(201).send();
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
  '/hrRepresentatives',
  handle_errors(async (_req, res) => {
    try {
      const hrIndia = (
        await groupMembers(INDIA_REVIEW_HR_REPRESENTATIVE_GROUP_NAME)
      ).map((rep) => rep.memberUserPrincipleName);
      const hrOther = (
        await groupMembers(REVIEW_HR_REPRESENTATIVE_GROUP_NAME)
      ).map((rep) => rep.memberUserPrincipleName);
      const result = { hrOther: hrOther, hrIndia: hrIndia };
      res.json(result);
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
  '/people-owning-reviews',
  handle_errors(async (_req, res) => {
    try {
      let result = await peopleOwningReviews();
      result = result.map((review) => review.userPrincipleName);
      res.json(result);
    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }
      res.status(500).json(errorMessage);
    }
  })
);

router.get(
  '/reviews',
  handle_errors(async (req, res) => {
    try {
      const {
        statusId,
        date = new Date().toISOString(),
        searchText,
        selectedReviewTypeIds,
        hrRep = res.locals.upn,
      } = req.query;
      const result = await getReviewsByStatus(
        statusId,
        date,
        searchText,
        selectedReviewTypeIds,
        hrRep
      );
      res.json(result);
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
  '/review-statuses',
  handle_errors(async (req, res) => {
    try {
      const statuses = await getReviewStatuses();
      const result = Array.from(statuses);
      res.json(result);
    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }
      res.status(500).send(errorMessage);
    }
  })
);

router.patch(
  '/reviews/:reviewId/status',
  handle_errors(async (req, res) => {
    try {
      const createdBy = res.locals.upn;
      const reviewId = req.params.reviewId;
      const contractRecommendationId = (
        await contractsLogic.getContractRecommendationIdsByReviewId(reviewId)
      )[0]?.contractRecommendationId;
      const { newStatusId } = req.body;
      const currentStatusId = (await reviewsLogic.getReviewStatusId(reviewId)).reviewStatusId;
      const allowedToProgress = await reviewsLogic.checkProgression(
        currentStatusId,
        newStatusId
      );
      if (allowedToProgress) {
        const contractRecommendation = await contractsLogic.getContractRecommendationById(
          contractRecommendationId
        );
        const allowedProgressions =
          await contractsLogic.allowedContractRecommendationStatusProgressions(
            contractRecommendation?.status
          );
        const canContractRecommendationProgressStatus =
          allowedProgressions.some(
            (statusProgression) =>
              statusProgression.toStatus === 'Review Completed'
          );
        await withTransaction(async (tx) => {
          const finaliseSalaryReviewStatus = await reviewsLogic.getStatusIdByActionName(
            'SalaryFinalised'
          );

          const providersRequestedStatus = await reviewsLogic.getStatusIdByActionName('ProvidersRequested');

          const review = await getReview(reviewId);

          if (finaliseSalaryReviewStatus?.reviewStatusId === newStatusId && review.requiresFeedback) {
            const reviewMeetingMinutes = await getReviewMeetingMinutes(reviewId);
            if (!reviewMeetingMinutes) {
              throw new ValidationError(`Meeting minutes are required to update the review status to 'Finalise Salary'.`);
            } else {
              // Meeting minutes exist and can update review status to 'Finalise Salary'
            }
          } else {
            // Meeting minutes are not needed for this status progression because no meeting has happened.
          }

          await updateReviewStatus(tx, reviewId, newStatusId, createdBy);

          if (
            currentStatusId === finaliseSalaryReviewStatus.reviewStatusId &&
            canContractRecommendationProgressStatus
          ) {
            // Archive review after status has changed to Archived
            await archiveReview(tx, reviewId, true, createdBy);
            await contractsLogic.addContractRecommendationStatus(
              tx,
              contractRecommendationId,
              'Review Completed',
              createdBy
            );
            res.status(200).send();
          }  else if(providersRequestedStatus && newStatusId === providersRequestedStatus.reviewStatusId) {
            // Send email after review status has changed to feedback requested
            if (FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED) {
              const sendEmailResponse = await handleFeedbackProvidersRequest(reviewId, REVIEW_COMMUNICATION_REASON_SYSTEM_NUDGE);
              if (sendEmailResponse && isError(sendEmailResponse)) {
                res.status(200).json({
                  message: `Successfully moved to feedback providers requests but failed to schedule a feedback providers request email: ${sendEmailResponse.message}`
                })
              } else {
                res.status(200).json({
                  message: 'Successfully moved to feedback providers requested and scheduled a feedback providers request email.'
                });
              }
            } else {
              res.status(200).send();
            }
          } else {
            // Send the response only, if the review status changed to any other status other than feedback requested or Archived
            res.status(200).send();
          }
        });
      } else {
        const currentStatusDescription = (
          await getStatusDescriptionById(currentStatusId)
        ).description;
        const newStatus = await getStatusDescriptionById(newStatusId);
        if (newStatus) {
          res
            .status(400)
            .json({
              message: `Not allowed to progress from ${currentStatusDescription} status to ${newStatus.description} status.`,
            });
        } else {
          res
            .status(400)
            .json({
              message: `Unknown status, ${newStatusId}, to move review to.`,
            });
        }
      }
    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({ message: errorMessage });
      } else {
        res.status(500).send(errorMessage);
      }
    }
  })
);

router.post(
  '/staff-reviews/:reviewId',
  handle_errors(async (req, res) => {
    const reviewId = Number(req.params.reviewId);
    if (isNaN(reviewId)) {
      res.status(400).send({ message: 'Id must be a number.' });
    } else {
      try {
        await withTransaction(async (tx) => {
          const { nextReviewDate, nextFeedbackTypeId, reviewId, staffId } =
            req.body;
          const createdBy = res.locals.upn;
          await archiveReview(tx, reviewId, true, createdBy);
          await deleteActiveFeedbackAssignments(tx, reviewId, createdBy);
          const previousStaffReviewId = await reviewsLogic.getStaffReviewId(reviewId);
          await reviewsLogic.createStaffReview(
            tx,
            createdBy,
            staffId,
            nextReviewDate,
            previousStaffReviewId,
            nextFeedbackTypeId
          );
          const contractRecommendationExists = await hasContractRecommendations(
            reviewId
          );

          if (contractRecommendationExists) {
            const contractRecommendationProgressionAllowed =
              await contractsLogic.canContractRecommendationProgress(reviewId, 'New');

            if (!contractRecommendationProgressionAllowed) {
              throw new Error(
                "The contract recommendation status cannot be change to 'New'."
              );
            } else {
              const contractRecommendationId =
                await retrieveContractRecommendationId(reviewId);
              await contractsLogic.addContractRecommendationStatus(
                tx,
                contractRecommendationId,
                'New',
                createdBy
              );
              res
                .status(201)
                .send({
                  message:
                    'Review and contract recommendation status updated successfully.',
                });
            }
          } else {
            res
              .status(201)
              .send({
                message:
                  'Review updated successfully, no contract recommendation found.',
              });
          }
        });
      } catch (error) {
        let errorMessage = error.message;
        if (error.causedBy) {
          errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
        }
        res.status(500).send(errorMessage);
      }
    }
  })
);

router.post(
  '/staff-reviews/:staffId/no-upcoming-reviews',
  handle_errors(async (req, res) => {
    try {
      const { nextReviewDate, nextFeedbackTemplateId } = req.body;
      const staffId = req.params.staffId;
      const createdBy = res.locals.upn;
      const reviewId = await getLatestReviewId(staffId);
      const previousStaffReviewId = await reviewsLogic.getStaffReviewId(reviewId);
      await withTransaction(async (tx) => {
        await reviewsLogic.createStaffReview(
          tx,
          createdBy,
          staffId,
          nextReviewDate,
          previousStaffReviewId,
          nextFeedbackTemplateId
        );
      });
      res.status(201).send();
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
  '/review-reasons',
  handle_errors(async (_req, res) => {
    const reviewReasons = await getReviewReasons();
    res.json(reviewReasons);
  })
);

router.post(
  '/reviews/:reviewId/hr-review-reasons/',
  handle_errors(async (req, res) => {
    try {
      const reviewId = req.params.reviewId;
      const { reason, specialCaseReason } = req.body;
      const createdBy = res.locals.upn;
      await withTransaction(async (tx) => {
        await addHRReviewReason(
          tx,
          reason,
          createdBy,
          reviewId,
          specialCaseReason
        );
      });
      res.status(201).send();
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
  '/reviews/count-reviews-by-status',
  handle_errors(async (req, res) => {
    const { hrRep, date, selectedReviewTypeIds, searchText } = req.query;
    const result = await getNumberOfReviewsBasedOnFilter(
      hrRep,
      date,
      selectedReviewTypeIds,
      searchText
    );
    res.json(result);
  })
);

function unchangedReviewsQueryParamsValidator(asAt, lateness, hrRep, reviewStatus){
  const asAtEndOf = asAt? new Date(asAt) : new Date();
  return [
    {
      field: "asAtEndOf",
      valid: !!asAtEndOf,
      error: "'As At End Of' is required."
    },
    {
      field: "asAtEndOf",
      valid: !isNaN(asAtEndOf.getTime()),
      error: "'As At End Of' should be a valid date string."
    },
    {
      field: "[all]",
      valid: [reviewStatus, lateness, hrRep].filter(groupingType => !!groupingType).length > 0,
      error: "You must group by at least one of 'reviewStatus', 'lateness', or 'hrRep'"
    }
  ].filter(field => !field.valid);

}


router.get(
  '/reviews/dashboard/status-summary',
  handle_errors(async (req, res) => {
    const { groupBy } = req.query;
    const hrRep = 'hrRep', ageing = 'ageing';
    try{
      if (groupBy === hrRep){
        return handleWithSummaryRetriever(retrieveHrReviewCountSummaryByPeriod)(req, res);
      } else if (groupBy === ageing) {
        return handleWithSummaryRetriever(retrieveStatusSummaryForPeriod)(req, res);
      } else {
        res.status(400).send(
          {
            field: "groupBy",
            error: `Incorrect group by field! groupBy field should be ${hrRep} or ${ageing}`
          }
        )
      }
    } catch(error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }
      res.status(500).send(errorMessage);
    }

  })
);

router.get('/reviews/with-unchanged-status', handle_errors(async (req, res) => {
  try{
    const {asAtEndOf, periodLength, status, lateness, hrRep, companyEntityIds, excludedLatenesses, excludedStatuses, excludedHrReps, templateName, excludedTemplateNames} = req.query;
    const invalidFields = unchangedReviewsQueryParamsValidator(asAtEndOf, lateness, hrRep, status);
    if (invalidFields.length > 0) {
      return res.status(400).json(invalidFields);
    } else {
      const reviews = await retrieveReviewsWithUnchangedLatenessAndStatus(asAtEndOf, periodLength, status, lateness, hrRep, companyEntityIds, excludedLatenesses, excludedStatuses, excludedHrReps, templateName, excludedTemplateNames);
      res.status(200).json(reviews);
    }
  } catch (error) {
    if (error.causedBy?.code === "ETIMEOUT") {
      res.status(504).json({
        message: "The request took too long to complete. Please try again or contact support if the problem persists.",
        code: error.causedBy.code,
        details: error.message,
      })
    } else {
      res.status(500).json({
        message: error.message,
        code: error.code ?? error.name,
        details: "Internal Server Error"
      })
    }
  }

}))

router.get('/reviews/with-unchanged-status-count', handle_errors(async (req, res) => {
  try{
    const {asAtEndOf, periodLength, status, lateness, hrRep, companyEntityIds, excludedLatenesses, excludedStatuses, excludedHrReps, templateName, excludedTemplateNames} = req.query;
    const invalidFields = unchangedReviewsQueryParamsValidator(asAtEndOf, lateness, hrRep, status);
    if (invalidFields.length > 0) {
      return res.status(400).json(invalidFields);
    } else {
      const reviews = await retrieveReviewsWithUnchangedLatenessAndStatus(asAtEndOf, periodLength, status, lateness, hrRep, companyEntityIds, excludedLatenesses, excludedStatuses, excludedHrReps, templateName, excludedTemplateNames);
      res.status(200).json(reviews.length);
    }
  } catch (error) {
    if (error.causedBy?.code === "ETIMEOUT") {
      res.status(504).json({
        message: "The request took too long to complete. Please try again or contact support if the problem persists.",
        code: error.causedBy.code,
        details: error.message,
      })
    } else {
      res.status(500).json({
        message: error.message,
        code: error.code ?? error.name,
        details: "Internal Server Error"
      })
    }
  }
}))

router.get(
  '/reviews/dashboard/staff-reviews',
  handle_errors(async (req, res) => {
    try {
      const asAtEndOf = req.query.asAtEndOf ? new Date(req.query.asAtEndOf) : new Date();
      const {
        status,
        lateness,
        hrRep,
        excludedLatenesses,
        excludedStatuses,
        excludedHrReps,
        companyEntityIds,
        templateName,
        excludedTemplateNames
      } = req.query;

      const invalidFields = [
        {
          field: "asAtEndOf",
          valid: !!asAtEndOf,
          error: "'As At End Of' is required."
        },
        {
          field: "asAtEndOf",
          valid: !isNaN(asAtEndOf.getTime()),
          error: "'As At End Of' should be a valid date string."
        },
        {
          field: "[all]",
          valid: [status, lateness, hrRep].filter(groupingType => !!groupingType).length > 0,
          error: "You must group by at least one of 'status', 'lateness', or 'hrRep'"
        }
      ].filter(field => !field.valid);


      if(invalidFields.length === 0) {
        const staffReviews = await retrieveReviewsForLatenessAndStatus(asAtEndOf, lateness, status, hrRep, companyEntityIds, excludedLatenesses, excludedStatuses, excludedHrReps, templateName, excludedTemplateNames);
        res.status(200).json(staffReviews);
      } else {
        res.status(400).json(invalidFields)
      }

    } catch (error) {
      if (error.causedBy?.code === "ETIMEOUT") {
        res.status(504).json({
          message: "The request took too long to complete. Please try again or contact support if the problem persists.",
          code: error.causedBy.code,
          details: error.message,
        })
      } else {
        res.status(500).json({
          message: error.message,
          code: error.code ?? error.name,
          details: "Internal Server Error"
        })
      }
    }
  })
);

router.get(
  '/reviews/:reviewId/audit',
  protectReviewsRoute,
  handleErrors(async (
    req: Request<{reviewId: string}, PagedResponse<ReviewAudit> | BadRequestDetail, undefined, {auditTypes?: string; startIndex?: string; pageLength?: string, users?: string}, AuthenticatedLocals>,
    res: Response<PagedResponse<ReviewAudit> | BadRequestDetail, AuthenticatedLocals>
  ) => {
    try {
      const reviewId = Number(req.params.reviewId);
      const auditTypes = req.query.auditTypes?.split(',').map(type => type.trim());
      const users = req.query.users?.split(',').map(user => user.trim());
      const pagination = validateAndParsePagination(req.query.startIndex, req.query.pageLength);

      if (!Number.isInteger(reviewId) || reviewId <= 0) {
        res.status(400).json({ message: "ReviewId must be a positive integer." });
      } else if (isError(pagination)) {
        res.status(400).json(pagination);
      } else {
        const { reviewAuditRecords, auditRecordsTotalCount } = await reviewsLogic.getReviewAuditWithCount(reviewId, auditTypes, users, pagination);

        const result = {
          pageInfo: {
            pageNumber: Math.floor(pagination.startIndex / pagination.pageLength),
            pageSize: pagination.pageLength,
            resultSetSize: auditRecordsTotalCount,
            totalPages: Math.ceil(auditRecordsTotalCount / pagination.pageLength)
          },
          data: reviewAuditRecords
        };
        res.status(200).json(result);
      }
    } catch (error) {
      const message = "A technical issue was encountered while retrieving the review audit.";
      const detail = error.causedBy ? error.causedBy.message : error.message;
      res.status(500).json({ message, detail });
    }
  })
);

module.exports = router;
