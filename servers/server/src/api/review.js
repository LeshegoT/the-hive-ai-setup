const router = require('express').Router();
const { handle_errors, logger } = require('@the-hive/lib-core');
const { withTransaction } = require('../shared/db');

const QUESTION_TYPE_RATING_ONLY = 'rating-only';
const QUESTION_TYPE_EXTENDED_RATING = 'extended-rating';
const QUESTION_TYPE_STANDARD_ANSWER = 'standard-answer';
const SECTION_TYPE_COMBINED_DISCUSSION = 'discussion';

const {
  structuredOutstandingReviewFeedbackAssignments,
  structuredOutstandingReviewFeedbackAssignment,
  structuredReviewSurvey,
  addDoubleCommentAnswer,
  addRatingAnswer,
  addSingleCommentAnswer,
  insertFeedbackResponse,
  updateFeedbackAssignmentAnonymousIndication,
  retrieveAssignmentStatus,
  findReviewByAssignment,
  updateReviewStatus,
  retrieveFeedbackAssignment,
  countFeedbackAssignmentsForReview,
  findCreatedBy,
  getDeletedFeedbackAssignments,
  assignmentQuestionIds,
  retrieveFeedbackAssignmentAssignedToUpn,
  retrieveOutstandingFeedbackAssignment,
} = require('../queries/review.queries');

const {
  checkAndMarkFeedbackAssignment,
  updateStatusOfReviewBasedOnFeedbackAssignments,
  getStatusIdByDescription,
  isAssignmentProgressionAllowed,
  insertStatusHistory,
} = require('../queries/peer-feedback.queries');

const { fetchBlobData } = require('@the-hive/lib-core');
const { BlobServiceClient } = require('@azure/storage-blob');
const { getEnvironmentName } = require('@the-hive/lib-core');
const CONTAINER_NAME = 'peer-feedback-saved';
const { uploadFile } = require('../shared/upload-file');
const { db } = require('../shared/db');
const { ReviewsLogic } = require('@the-hive/lib-reviews-logic');
const { feedbackAssignmentStatuses } = require('@the-hive/lib-reviews-shared');

const reviewsLogic = new ReviewsLogic(db);

router.get(
  '/reviews/v2/outstanding/',
  handle_errors(async (req, res) => {
    let activeUPN = res.locals.upn;

    if (activeUPN.endsWith('@bbdsoftware.com')) {
      activeUPN = activeUPN.replace('@bbdsoftware.com', '@bbd.co.za');
    }else {
        // Continue with the original UPN since it already uses @bbd.co.za
    }
    const results = await structuredOutstandingReviewFeedbackAssignments(
      activeUPN
    );

    res.json(results);
  })
);

router.get(
  '/reviews/v2/outstanding/next/',
  handle_errors(async (req, res) => {
    const activeUPN = res.locals.upn;

    try {
      const result = await structuredOutstandingReviewFeedbackAssignment(
        activeUPN
      );

      if (result) {
        res.json(result);
      } else {
        res.status(404).send();
      }
    } catch (error) {
      logger.error({message:`Error getting oustanding reviews for '${activeUPN}'`,error});
      res.status(400).send();
    }
  })
);

router.get(
  '/assignment/v2/:id/status',
  handle_errors(async (req, res) => {
    try {
      const assignmentStatus = await retrieveAssignmentStatus(req.params.id);
      if (assignmentStatus) {
        res.json(assignmentStatus);
        res.status(201).send();
      } else {
        res.status(404).send();
      }
    } catch (error) {
      logger.error({message:`Error getting assignment status for assignment '${req.params.id}'`,error});
      res.status(400).send();
    }
  })
);

router.get(
  '/assignment/v2/valid/:id',
  handle_errors(async (req, res) => {
    try {
      const assignmentId = Number.parseInt(req.params.id);
      const activeUPN = res.locals.upn;

      if (Number.isInteger(assignmentId) && assignmentId > 0) {
        const assignment = await retrieveFeedbackAssignmentAssignedToUpn(
          assignmentId,
          activeUPN
        );

        res.json({ assignment: assignment?.at(0) });
      } else {
        res.status(400).json({ error: 'Invalid Assignment ID' })
      }
    } catch (error) {
      res.status(500).send({ message: 'Something went wrong. Please try again later.', error });
    }
  })
);

router.get(
  '/assignment/v2/survey/:id',
  handle_errors(async (req, res) => {
    const activeUPN = res.locals.upn;

    try {
      const assignmentId = Number(req.params.id);

      if (Number.isInteger(assignmentId) && assignmentId > 0) {
        const survey = await structuredReviewSurvey(assignmentId, activeUPN);
        const totalQuestions = survey.questions.length;
        let sectionQuestions = survey.questions;

        const discussionQuestions = {
          name: 'Discussion Points',
          type: SECTION_TYPE_COMBINED_DISCUSSION,
          questions: sectionQuestions.filter(
            (question) => question.type == QUESTION_TYPE_STANDARD_ANSWER
          ),
          displayOrder: 0,
        };

        if (discussionQuestions.questions?.length > 0) {
          sectionQuestions = survey.questions.filter(
            (question) => question.type != QUESTION_TYPE_STANDARD_ANSWER
          );
          discussionQuestions.displayOrder =
            sectionQuestions.slice(-1)[0].displayOrder + 1;
          sectionQuestions.push(discussionQuestions);
          survey.questions = sectionQuestions;
        }

        const result = {
          survey: survey,
          totalQuestions: totalQuestions,
        };

        res.json(result);
      } else {
        throw new Error('Invalid Assignment ID');
      }
    } catch (error) {
      res.status(404).send({ error: error.message });
    }
  })
);

router.post(
  '/review/v2',
  handle_errors(async (req, res) => {
    try {
      const { assignmentId, answers, anonymous = false } = req.body;
      const upn = res.locals.upn;

      const questionIds = (
        await assignmentQuestionIds(assignmentId, upn)
      ).sort();
      const answerIds = answers?.map((answer) => answer.id)?.sort() ?? [];
      const allQuestionsAnswered =
        questionIds.length === answerIds.length &&
        questionIds.every((id, index) => answerIds[index] === id);

      if (assignmentId && allQuestionsAnswered) {
        await withTransaction(async (tx) => {
          await insertReviewAnswers(tx, assignmentId, answers, upn);
          await updateFeedbackAssignmentAnonymousIndication(
            tx,
            assignmentId,
            anonymous
          );
        });
      } else {
        throw new Error('Invalid request body received');
      }

      res.status(201).send();
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  })
);

const insertReviewAnswers = async (tx, assignmentId, answers, upn) => {
  const reviewFeedbackAssignment = await retrieveFeedbackAssignment(
    assignmentId
  );
  const completedAssignmentStatusId = (
    await getStatusIdByDescription('Completed')
  )[0].feedbackAssignmentStatusId;
  const isAllowedToComplete = await isAssignmentProgressionAllowed(
    tx,
    assignmentId,
    completedAssignmentStatusId
  );

  if (!isAllowedToComplete) {
    throw new Error('The assignment has already been submitted.');
  } else if (upn.toLowerCase() !== reviewFeedbackAssignment.reviewer) {
    throw new Error('You are not the assigned reviewer for this review.');
  } else {
    for (const answer of answers) {
      const feedbackResponseId = await insertFeedbackResponse(
        tx,
        assignmentId,
        answer.id,
        upn
      );

      switch (answer.type) {
        case QUESTION_TYPE_EXTENDED_RATING:
          await addDoubleCommentAnswer(tx, feedbackResponseId, answer);
          await addRatingAnswer(tx, feedbackResponseId, answer);
          break;
        case QUESTION_TYPE_RATING_ONLY:
          await addRatingAnswer(tx, feedbackResponseId, answer);
          break;
        case QUESTION_TYPE_STANDARD_ANSWER:
          await addSingleCommentAnswer(tx, feedbackResponseId, answer);
          break;
        case SECTION_TYPE_COMBINED_DISCUSSION:
          await addSingleCommentAnswer(tx, feedbackResponseId, answer);
          break;
        default:
          throw new Error('Invalid answer type');
      }
    }

    await insertStatusHistory(
      tx,
      assignmentId,
      completedAssignmentStatusId,
      upn
    );

    const reviewId = (await findReviewByAssignment(assignmentId)).reviewId;
    const allFeedbackSubmitted = await isAllReviewFeedbackSubmitted(
      tx,
      reviewId
    );

    if (allFeedbackSubmitted) {
      await progressReviewStatus(tx, assignmentId, 'FeedbackCompleted', upn);
    } else {
      // Do nothing as there is still outstanding feedback before we progress this review status.
    }
  }
};

const isAllReviewFeedbackSubmitted = async (tx, reviewId) => {
  const assignmentCount = await countFeedbackAssignmentsForReview(tx, reviewId);
  return (
    assignmentCount.completedAssignmentCount ===
    assignmentCount.reviewAssignmentCount
  );
};

router.post(
  '/review/progress/:id',
  handle_errors(async (req, res) => {
    try {
      const { assignmentId, surveyId, answers, questionTotal } = req.body;
      const activeUPN = res.locals.upn;
      
      if (answers && assignmentId && surveyId && questionTotal) {
        const assignment = await retrieveOutstandingFeedbackAssignment(
          assignmentId,
          activeUPN
        );

        if (assignment === undefined || !assignment[0]) {
          throw new Error(
            'User does not have access to this feedback assignment.'
          );
        } else {
          await storeReviewFeedbackProgress(req.body, assignmentId, activeUPN);

          await withTransaction(async (tx) => {
            await checkAndMarkFeedbackAssignment(
              tx,
              assignmentId,
              answers.length === 0 ? feedbackAssignmentStatuses.started : feedbackAssignmentStatuses.savedForLater,
              activeUPN
            );
            const { reviewId } = await reviewsLogic.getReviewIdBasedOnFeedbackAssignmentId(
              tx,
              assignmentId
            );
            await updateStatusOfReviewBasedOnFeedbackAssignments(
              tx,
              reviewId,
              activeUPN
            );
          });        
          res.status(201).send();
        }
      } else {
        throw new Error('Invalid request body received');
      }
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  })
);

const progressReviewStatus = async (tx, assignmentId, nextStatusActionName) => {
  let allowedToProgress = true;
  const reviewId = (await findReviewByAssignment(assignmentId)).reviewId;
  const nextStatusId = (await reviewsLogic.getStatusIdByActionName(nextStatusActionName))
    .reviewStatusId;
  const currentStatusId = (await reviewsLogic.getReviewStatusId(reviewId)).reviewStatusId;

  if (currentStatusId != nextStatusId) {
    allowedToProgress = await reviewsLogic.checkProgression(currentStatusId, nextStatusId);
    if (allowedToProgress) {
      await updateReviewStatus(
        tx,
        reviewId,
        nextStatusId,
        'the-hive@bbd.co.za'
      );
    }
  }

  return allowedToProgress;
};

router.get(
  '/review/progress/:id',
  handle_errors(async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const activeUPN = res.locals.upn;
      const reviewProgress = await retrieveReviewFeedbackProcess(
        assignmentId,
        activeUPN
      );
      res.json(reviewProgress);
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  })
);

router.delete(
  '/review/progress/:id',
  handle_errors(async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const activeUPN = res.locals.upn;
      await removeReviewFeedbackProcess(assignmentId, activeUPN);
      const { reviewId } = await reviewsLogic.getReviewIdBasedOnFeedbackAssignmentId(
        db,
        assignmentId
      );
      await withTransaction(
        async (tx) =>
          await updateStatusOfReviewBasedOnFeedbackAssignments(
            tx,
            reviewId,
            activeUPN
          )
      );
      res.status(201).send();
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  })
);

async function storeReviewFeedbackProgress(progress, assignmentId, upn) {
  const newFile = getFileName(assignmentId, upn);
  const fileContent = JSON.stringify(progress);

  await uploadFile(fileContent, newFile, CONTAINER_NAME);
}

async function retrieveReviewFeedbackProcess(assignmentId, upn) {
  const file = getFileName(assignmentId, upn);
  const content = await fetchBlobData(CONTAINER_NAME, file);
  if (content) {
    return JSON.parse(content);
  } else {
    return {};
  }
}

async function removeReviewFeedbackProcess(assignmentId, upn) {
  const file = getFileName(assignmentId, upn);

  // include: Delete the base blob and all of its snapshots.
  // only: Delete only the blob's snapshots and not the blob itself.
  const options = {
    deleteSnapshots: 'include',
  };

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(file);

  await blockBlobClient.deleteIfExists(options);
}

function getFileName(assignmentId, upn) {
  const env = getEnvironmentName(true);
  return `${env}/${upn.toLowerCase()}/feedback-${assignmentId}.json`;
}

router.get(
  '/review/v2/:id/createdBy/',
  handle_errors(async (req, res) => {
    const id = req.params.id;
    const createdBy = await findCreatedBy(id);
    res.json(createdBy);
  })
);

router.get(
  '/review/v2/:reviewId',
  handle_errors(async (req, res) => {
    const reviewId = req.params.reviewId;
    const deletedAssignments = await getDeletedFeedbackAssignments(reviewId);
    res.json(deletedAssignments);
  })
);

module.exports = router;
