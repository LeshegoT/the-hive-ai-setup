const { randomUUID } = require('crypto');

const {
  addOrUpdateFeedbackAssignments,
  addGuestReviewer,
  findReviewerInStaff,
  createReview,
  getFeedbackAssignmentTemplate,
  retrieveAllReviewStatusAndAllowedProgressions,
  retrieveStartingReviewStatus,
  retrieveCancelReviewStatus,
  getNewStatusId,
} = require('../queries/peer-feedback.queries');
const {
  insertScheduledReviewLinking,
  scheduledReviewEntry,
  checkIfReviewExistsAlready,
  insertStaffReviewLinking,
} = require('../queries/review.queries');
const { db } = require('./db');
const queue = require('./queue');
const {
  select,
  describeTable,
  insert,
} = require('../queries/generate.queries');
const { ReviewsLogic } = require('@the-hive/lib-reviews-logic');
const REVIEWERS_ASSIGNED_STATUS_ACTION_NAME = 'ProvidersAssigned';

const REVIEW_COMMUNICATION_TYPE_FEEDBACK_PROVIDERS_REQUEST = 'Feedback Providers Request e-mail'
const REVIEW_COMMUNICATION_TYPE_REVIEWER_EMAIL = 'Reviewer e-mail';
const REVIEW_COMMUNICATION_TYPE_CALENDAR_EVENT = 'Reviewer Calendar Event';
const REVIEW_COMMUNICATION_REASON_SYSTEM_NUDGE = 'System nudge';
const REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE = 'HR manual nudge';

const reviewStatuses = new Map();
const reviewCommunicationReasons = new Map();
const reviewCommunicationTypes = new Map();

const reviewsLogic = new ReviewsLogic(db);

const createReviewWithAssignments = async (
  tx,
  about,
  reviewers,
  createdBy,
  upn,
  reviewDeadline,
  templateId,
  scheduleId = undefined,
  staffReviewId = undefined
) => {
  let validReviewCreation = true;
  if (scheduleId) {
    const exisitingScheduledReview = await scheduledReviewEntry(
      scheduleId,
      about
    );
    if (
      exisitingScheduledReview != undefined &&
      exisitingScheduledReview.length > 0
    ) {
      validReviewCreation = false;
    }
  }

  if (staffReviewId) {
    const exisitingReview = await checkIfReviewExistsAlready(staffReviewId);
    if (exisitingReview) {
      validReviewCreation = false;
    }
  }

  if (validReviewCreation) {
    const template = await getFeedbackAssignmentTemplate(templateId);

    if(!template.requiresFeedback && reviewers?.length > 0) {
      throw new Error('This type of review does not allow for feedback assignments.');
    } else {
        let reviewStatusId;
        if (reviewers.length >= process.env.REVIEWER_ASSIGNED_THRESHOLD) {
          reviewStatusId = (
            await reviewsLogic.getStatusIdByActionName(REVIEWERS_ASSIGNED_STATUS_ACTION_NAME)
          ).reviewStatusId;
        } else {
          reviewStatusId = (await retrieveStartingReviewStatus()).reviewStatusId;
        }

        const reviewId = await createReview(
          tx,
          createdBy,
          upn,
          reviewDeadline,
          about,
          template.id,
          reviewStatusId
        );

        if (scheduleId) {
          await insertScheduledReviewLinking(tx, scheduleId, reviewId);
        }

        if (staffReviewId) {
          await insertStaffReviewLinking(tx, staffReviewId, reviewId);
        }

        for (const reviewer of reviewers) {
          const feedbackDeadline = new Date(reviewer.dueBy);
          const data = {
            reviewee: about,
            reviewer: reviewer.reviewer,
            clientEmail: reviewer.clientEmail,
            assignedBy: createdBy,
            feedbackAssignmentTemplate: template,
          };

          const newStatusId = (await getNewStatusId())?.feedbackAssignmentStatusId;

          if (newStatusId) {
            const feedbackAssignmentId = await addOrUpdateFeedbackAssignments(
              tx,
              data.reviewer.toLowerCase(),
              data.assignedBy.toLowerCase(),
              feedbackDeadline,
              reviewId,
              newStatusId,
              data.clientEmail
            );
            data.feedbackAssignmentId = feedbackAssignmentId;

            const findReviewer = await findReviewerInStaff(data.reviewer);
            if (!findReviewer) {
              const uuid = randomUUID();
              await addGuestReviewer(tx, feedbackAssignmentId, uuid);
            } else {
              // Reviewer is staff do not add as guest
            }
          } else {
            throw new Error(
              `Failed to retrieve the feedbackAssignmentStatusId, to save the feedback assignment of review ${reviewId}`
            );
          }

          await queue.enqueue('assignment-queue', data);
        }
    }
  }
};

const getReviewStatuses = async (filter) => {
  if (reviewStatuses.size === 0) {
    const allReviewStatus = await retrieveAllReviewStatusAndAllowedProgressions();

    for (const reviewStatus of allReviewStatus) {
      const { description, currentStatusId, nextStatusId, actionName } =
        reviewStatus;
      let allowedToProgressTo;

      if (reviewStatuses.has(description)) {
        allowedToProgressTo =
          reviewStatuses.get(description).allowedToProgressTo;
        allowedToProgressTo.push(nextStatusId);
      } else {
        allowedToProgressTo = [nextStatusId];
        reviewStatuses.set(description, {
          statusId: currentStatusId,
          description,
          allowedToProgressTo,
          startingStatus: false,
          cancellationStatus: false,
          actionName,
        });
      }
    }

    const startingStatus = await retrieveStartingReviewStatus();
    const newReviewStatus = reviewStatuses.get(startingStatus.description);
    newReviewStatus.startingStatus = true;

    const cancellationStatus = await retrieveCancelReviewStatus();
    const cancelReviewStatus = reviewStatuses.get(cancellationStatus.description);
    cancelReviewStatus.cancellationStatus = true;
  }

  if (filter) {
    const { status, startingStatus = false, cancellationStatus = false } = filter;
    if (status) {
      return reviewStatuses.get(status);
    } else if (startingStatus) {
      for (const [, value] of reviewStatuses) {
        if (value.startingStatus === true) {
          return value;
        }
      }
    } else if (cancellationStatus) {
      for (const [, value] of reviewStatuses) {
        if (value.cancellationStatus === true) {
          return value;
        }
      }
    }
  } else {
    return reviewStatuses;
  }
};

const getReviewCommunicationReasonId = async (communicationReason) => {
  if (reviewCommunicationReasons.size === 0) {
    const reviewCommunicationReasonDescription = await describeTable(
      'ReviewCommunicationReason'
    );
    const communicationReasons = await select(
      'ReviewCommunicationReason',
      reviewCommunicationReasonDescription
    );

    for (const communicationReason of communicationReasons) {
      const { reason, reviewCommunicationReasonId } = communicationReason;
      reviewCommunicationReasons.set(reason, reviewCommunicationReasonId);
    }
  }
  return reviewCommunicationReasons.get(communicationReason);
};

const getReviewCommunicationTypeId = async (communicationType) => {
  if (reviewCommunicationTypes.size === 0) {
    const reviewCommunicationTypeDescription = await describeTable(
      'ReviewCommunicationType'
    );
    const communicationTypes = await select(
      'ReviewCommunicationType',
      reviewCommunicationTypeDescription
    );

    for (const communicationType of communicationTypes) {
      const { type, reviewCommunicationTypeId } = communicationType;
      reviewCommunicationTypes.set(type, reviewCommunicationTypeId);
    }
  }
  return reviewCommunicationTypes.get(communicationType);
};

const insertIntoReviewCommunication = async (
  tx,
  feedbackAssignmentId,
  nudgedBy,
  nudgedTo,
  nudgedDate,
  communicationType,
  communicationReason
) => {

  const reviewCommunicationId = await persistReviewCommunication(tx, nudgedBy, nudgedTo, nudgedDate, communicationType, communicationReason);

  const reviewCommunicationFeedbackAssignmentDescription = await describeTable(
    'ReviewCommunicationFeedbackAssignments'
  );

  const reviewCommunicationFeedbackAssignment = {
    feedbackAssignmentId,
    reviewCommunicationId,
  };

  await insert(
    tx,
    'ReviewCommunicationFeedbackAssignments',
    reviewCommunicationFeedbackAssignmentDescription,
    reviewCommunicationFeedbackAssignment
  );
};

const persistReviewCommunication = async (
  tx, nudgedBy, nudgedTo, nudgedDate, communicationType, communicationReason
) => {
  const reviewCommunicationDescription = await describeTable(
    'ReviewCommunication'
  );
  const reviewCommunicationTypeId = await getReviewCommunicationTypeId(
    communicationType
  );
  const reviewCommunicationReasonId = await getReviewCommunicationReasonId(
    communicationReason
  );

  const reviewCommunication = {
    reviewCommunicationTypeId,
    nudgedBy,
    nudgedTo,
    nudgedDate,
    reviewCommunicationReasonId,
  };

  const reviewCommunicationId = await insert(
    tx,
    'ReviewCommunication',
    reviewCommunicationDescription,
    reviewCommunication
  );

  return reviewCommunicationId;
}

const bulkNudgeInsertReviewCommunication = async (
  tx,
  outstandingAssignments,
  nudgedBy,
  nudgedTo,
  nudgedDate,
  communicationType,
  communicationReason
) => {
  const reviewCommunicationDescription = await describeTable(
    'ReviewCommunication'
  );
  const reviewCommunicationTypeId = await getReviewCommunicationTypeId(
    communicationType
  );
  const reviewCommunicationReasonId = await getReviewCommunicationReasonId(
    communicationReason
  );

  const reviewCommunication = {
    reviewCommunicationTypeId,
    nudgedBy,
    nudgedTo,
    nudgedDate,
    reviewCommunicationReasonId,
  };

  const reviewCommunicationId = await insert(
    tx,
    'ReviewCommunication',
    reviewCommunicationDescription,
    reviewCommunication
  );
  const reviewCommunicationFeedbackAssignmentDescription = await describeTable(
    'ReviewCommunicationFeedbackAssignments'
  );

  for (const assignment of outstandingAssignments) {
    const feedbackAssignmentId = assignment.feedbackAssignmentID;
    const reviewCommunicationFeedbackAssignment = {
      feedbackAssignmentId,
      reviewCommunicationId,
    };
    await insert(
      tx,
      'ReviewCommunicationFeedbackAssignments',
      reviewCommunicationFeedbackAssignmentDescription,
      reviewCommunicationFeedbackAssignment
    );
  }
};

module.exports = {
  createReviewWithAssignments,
  getReviewStatuses,
  getReviewCommunicationReasonId,
  getReviewCommunicationTypeId,
  insertIntoReviewCommunication,
  bulkNudgeInsertReviewCommunication,
  persistReviewCommunication,
  REVIEW_COMMUNICATION_TYPE_REVIEWER_EMAIL,
  REVIEW_COMMUNICATION_TYPE_CALENDAR_EVENT,
  REVIEW_COMMUNICATION_REASON_SYSTEM_NUDGE,
  REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE,
  REVIEW_COMMUNICATION_TYPE_FEEDBACK_PROVIDERS_REQUEST,
};
