const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  addEmployeeFeedback,
  allTags,
  addFeedbackTags,
  allRevieweePublishedFeedbackMessages,
  allPrincipleFeedbackMessages,
  get_feedbacks_assigned_to_user,
  assignFeedbackMessageId,
  get_user_display_name,
  get_users_with_same_manager,
  addAssignedFeedbackAnswers,
  assignedFeedbackSelfIndication,
  allFeedbackTemplates,
  getSelfReviewQuestions,
  getFeedbackAssignment,
  findReviewerInStaff,
  getTemplateVariables,
  getDefaultTemplateVariables,
  allUPNFeedbackMessagesSince,
  removeFeedbackMessage,
  resetFeedbackMessageAssigned,
  assignFeedbackConstructiveMessageId,
  findConstructiveMessageRelatedToPositiveMessage,
  checkAndMarkFeedbackAssignment,
  updateStatusOfReviewBasedOnFeedbackAssignments
} = require('../queries/peer-feedback.queries');

const { latestLogin } = require('../queries/login.queries');

const { withTransaction, db } = require('../shared/db');

const {
  validateDate,
  ValidationError,
  validateIdExists,
  validateLoggedInUser,
} = require('../shared/validations');
const {
  StandardRestErrorResponse,
} = require('../shared/standard-rest-response');
const { ReviewsLogic } = require('@the-hive/lib-reviews-logic');
const { feedbackAssignmentStatuses } = require('@the-hive/lib-reviews-shared');

const reviewsLogic = new ReviewsLogic(db);

router.get(
  '/all-tags',
  handle_errors(async (req, res) => {
    const results = await allTags();
    res.json(results);
  })
);

router.get(
  '/assignment/:id',
  handle_errors(async (req, res) => {
    const results = await getFeedbackAssignment(req.params.id);
    if (results === undefined || results.reviewer !== res.locals.upn) {
      res.json({});
    } else {
      res.json(results);
    }
  })
);

router.patch(
  '/assignment/:id/status',
  handle_errors(async (req, res) => {
    try {
      await withTransaction(async (tx) => {
        await checkAndMarkFeedbackAssignment(
          tx,
          req.params.id,
          feedbackAssignmentStatuses.viewed,
          res.locals.upn
        );
      });

      await withTransaction(async (tx) => {
        const { reviewId } = await reviewsLogic.getReviewIdBasedOnFeedbackAssignmentId(
          tx,
          req.params.id,
        );

        await updateStatusOfReviewBasedOnFeedbackAssignments(
          tx,
          reviewId,
          res.locals.upn
        );
      });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  })
);

router.get(
  '/feedbackAssignmentTemplate',
  handle_errors(async (req, res) => {
    const results = await allFeedbackTemplates();
    const templates = [];
    for (const template of results) {
      templates.push(await setTemplateCustomProperties(template));
    }

    res.json(templates);
  })
);

const setTemplateCustomProperties = async (template) => {
  const templateQuestions = await getSelfReviewQuestions(
    template.feedbackAssignmentTemplateId
  );
  const templateVariables = await getTemplateVariables(
    template.feedbackAssignmentTemplateId
  );

  const templateResult = {
    feedbackAssignmentTemplateId: template.feedbackAssignmentTemplateId,
    templateName: template.templateName,
    subjectLineTemplate: template.subjectLineTemplate,
    textContentTemplate: template.textContentTemplate,
    urlTemplate: template.urlTemplate,
    titleTemplate: template.titleTemplate,
    manualFeedbackAssignment: template.manualFeedbackAssignment,
    questions: templateQuestions,
    variables: templateVariables,
    requiresSelfReview: template.requiresSelfReview,
    includeStaffReport: template.includeStaffReport,
    includeExecReport: template.includeExecReport,
  };

  return templateResult;
};

router.get(
  '/feedback/latest',
  handle_errors(async (req, res) => {
    const activeUPN = res.locals.upn;
    const lastUPNLogin = await latestLogin(activeUPN);
    const latestFeedback = await allUPNFeedbackMessagesSince(
      activeUPN,
      lastUPNLogin
    );
    const pendingRequests = await get_feedbacks_assigned_to_user(activeUPN);

    const result = {
      feedback: latestFeedback,
      assignments: pendingRequests,
    };

    res.json(result);
  })
);

router.get(
  '/feedbackAssignmentTemplateVariables',
  handle_errors(async (req, res) => {
    const results = await getDefaultTemplateVariables();
    res.json(results);
  })
);

router.get(
  '/user-assigned-feedbacks/:upn',
  handle_errors(async (req, res) => {
    const assignedFeedbacks = await get_feedbacks_assigned_to_user(
      res.locals.upn
    );

    res.json(assignedFeedbacks);
  })
);

router.get(
  '/display-name/:upn',
  handle_errors(async (req, res) => {
    const displayName = await get_user_display_name(req.params.upn);

    res.json(displayName);
  })
);

router.get(
  '/feedback/team-members',
  handle_errors(async (req, res) => {
    const teamMembers = await get_users_with_same_manager(res.locals.upn);

    res.json(teamMembers);
  })
);

router.post(
  '/feedback',
  handle_errors(async (req, res) => {
    try {
      const {
        about,
        by,
        createdAt: createdAtString,
        comment,
        positiveComment,
        constructiveComment,
        tags,
        answers,
        assignmentId,
      } = req.body;
      validateLoggedInUser(res.locals.upn, by, 'by');
      const positive = positiveComment ?? comment;
      const createdAt = validateDate(createdAtString, 'createdAt');
      const assignment = await validateIdExists(
        assignmentId,
        'FeedbackAssignments',
        'assignmentId'
      );
      const review = await validateIdExists(
        assignment.reviewId,
        'Review',
        'assignmentId->reviewId'
      );

      if (!positive) {
        throw new ValidationError(
          'No comment provided (either "comment" or "positiveComment" expected)'
        );
      }

      if (assignment.reviewer.toLowerCase() !== res.locals.upn.toLowerCase()) {
        throw new ValidationError(
          `Current logged in user was not assigned feedback for '${about}' as assignment ID '${assignmentId}'`
        );
      }

      if (review.reviewee.toLowerCase() !== about.toLowerCase()) {
        throw new ValidationError(
          `Feedback was not requested about '${about}' as part of assignment ID '${assignmentId}'`
        );
      }

      if (answers) {
        await withTransaction(
          async (tx) =>
            await addAssignedFeedback(
              tx,
              about,
              by,
              createdAt,
              positive,
              constructiveComment,
              tags,
              answers,
              assignmentId
            )
        );
      } else {
        await withTransaction((tx) =>
          addFeedback(tx, about, by, createdAt, comment, tags)
        );
      }
      res.status(201).send({ success: true });
    } catch (error) {
      if (error instanceof ValidationError) {
        const response = new StandardRestErrorResponse(error.message);
        res.status(400).send(JSON.stringify(response));
      } else {
        let errorMessage = error.message;
        if (error.causedBy) {
          errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
        }
        console.error(error);
        const response = new StandardRestErrorResponse(errorMessage);
        res.status(500).send(JSON.stringify(response));
      }
    }
  })
);

const addFeedback = async (tx, about, by, createdAt, comment, tags) => {
  const messageId = await addEmployeeFeedback(tx, about, by, createdAt, comment);

  for (const tag of tags) {
    await addFeedbackTags(tx, messageId, tag.id, tag.rating);
  }
};

const addAssignedFeedback = async (
  tx,
  about,
  by,
  createdAt,
  positiveComment,
  constructiveComment,
  tags,
  answers,
  assignmentId
) => {
  const positiveMessageId = await addEmployeeFeedback(
    tx,
    about,
    by,
    createdAt,
    positiveComment
  );
  const constructiveMessageId = constructiveComment
    ? await addEmployeeFeedback(tx, about, by, createdAt, constructiveComment)
    : null;

  for (const tag of tags) {
    await addFeedbackTags(tx, positiveMessageId, tag.id, tag.rating);
  }

  if (answers.length != 0) {
    for (const answer of answers) {
      await addAssignedFeedbackAnswers(
        tx,
        positiveMessageId,
        answer.questionId,
        answer.answer
      );
    }
  }

  if (by == about) {
    await assignedFeedbackSelfIndication(tx, positiveMessageId);
    if (constructiveComment) {
      await assignedFeedbackSelfIndication(tx, constructiveMessageId);
    }
  }

  await assignFeedbackMessageId(tx, assignmentId, positiveMessageId);

  if (constructiveComment) {
    await assignFeedbackConstructiveMessageId(
      tx,
      assignmentId,
      constructiveMessageId
    );
  }
};

router.get(
  '/feedback/:upn',
  handle_errors(async (req, res) => {
    let messages;
    const activeUPN = res.locals.upn;
    const reviewee = req.params.upn;

    if (activeUPN == reviewee) {
      messages = await allPrincipleFeedbackMessages(reviewee, activeUPN);
    } else {
      messages = await allRevieweePublishedFeedbackMessages(
        reviewee,
        activeUPN
      );
    }

    for (let i = 0; i < messages.length; i++) {
      const isExternal = await findReviewerInStaff(messages[i].by);
      if (isExternal === undefined) {
        messages[i].by = undefined;
      }
    }

    res.json(messages);
  })
);

router.get(
  '/feedback/questions/:id',
  handle_errors(async (req, res) => {
    const template = req.params.id;
    const selfReviewQuestions = await getSelfReviewQuestions(template);
    const data = selfReviewQuestions.map((question, index) => {
      return {
        questionId: question.questionId,
        question: question.question,
        position: index + 1,
      };
    });
    res.json(data);
  })
);

router.delete(
  '/feedback/:id',
  handle_errors(async (req, res) => {
    try {
      const positiveMessageId = req.params.id;
      const relatedConstructiveMessage =
        await findConstructiveMessageRelatedToPositiveMessage(
          positiveMessageId
        );

      await withTransaction(async (tx) => {
        if (relatedConstructiveMessage?.id) {
          await removeFeedbackMessage(
            tx,
            relatedConstructiveMessage.id,
            req.body.reason,
            res.locals.upn
          );
        }

        await removeFeedbackMessage(
          tx,
          positiveMessageId,
          req.body.reason,
          res.locals.upn
        );
        await resetFeedbackMessageAssigned(tx, req.params.id);
      });

      res.status(200).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

module.exports = router;
