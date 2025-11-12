const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { logger } = require('@the-hive/lib-core');
const {
  getScheduledReviewsForToday,
  getProgrammeUsersRequiringScheduledReview,
} = require('../queries/review.queries');

const { createReviewWithAssignments } = require('../shared/review');
const { withTransaction } = require('../shared/db');

router.post(
  '/review/scheduled',
  handle_errors(async (req, res) => {
    const reviewScheduledForToday = await getScheduledReviewsForToday();

    for (const scheduledReview of reviewScheduledForToday) {
      await createReviews(scheduledReview);
    }

    res.status(204).send();
  })
);

const createReviews = async (scheduledReview) => {
  const members = await getProgrammeUsersRequiringScheduledReview(
    scheduledReview.programmeName,
    scheduledReview.reviewScheduleId
  );

  const failures = [];

  for (const member of members) {
    try {
      const request = {
        about: member.upn,
        reviewers: [{ reviewer: member.upn, dueBy: scheduledReview.dueDate }],
        createdBy: 'the-hive@bbd.co.za',
        reviewDeadline: scheduledReview.dueDate,
        templateId: scheduledReview.templateId,
        scheduleId: scheduledReview.reviewScheduleId,
      };
      await withTransaction(async (tx) => {        
        await createReviewWithAssignments(
          tx,
          request.about,
          request.reviewers,
          request.createdBy,
          request.createdBy,
          request.reviewDeadline,
          request.templateId,
          request.scheduleId
        );
      })
    } catch (error) {
      failures.push({ member, scheduledReview, error });
    }
  }

  const failureCount = failures.length;
  logger.info(`Scheduled Reviews: ${failureCount} failures`);

  if (failureCount) {
    const errors = failures
      .map(
        (failure) =>
          `Error when scheduling review:  '${failure.member.upn} - TemplateID(${failure.scheduledReview.templateId})': ${failure.error}`
      )
      .join('\n');

    const body = {
      message: {
        subject: `Review Schedule Error [${getEnvironmentName(true)}]`,
        toRecipients: [
          {
            emailAddress: {
              address: 'atcteam@bbd.co.za',
            },
          },
        ],
        ccRecipients: [],
        body: {
          content: errors,
          contentType: 'text',
        },
      },
    };

    await post('/users/the-hive@bbd.co.za/sendMail', body);
  }
};

module.exports = router;
