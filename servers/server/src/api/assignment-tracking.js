const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../shared/db');
const { send } = require('../shared/email');
const {
  bulkNudgeInsertReviewCommunication,
  REVIEW_COMMUNICATION_TYPE_REVIEWER_EMAIL,
} = require('../shared/review');

const {
  getAllAssignmentTracking,
  getAllFeedbackAssignments,
  getOverdueFeedbackAssignments,
} = require('../queries/assignment-tracking.queries');

const { prepareBulkNudgeEmailContent } = require('../shared/peer-feedback');
const { getUserBulkNudgeReviewCommunicationsForToday } = require('../queries/peer-feedback.queries');

const REVIEW_COMMUNICATION_REASON_MANUAL_BULK_NUDGE = 'HR manual bulk nudge';

router.get(
  '/assignment-tracking/',
  handle_errors(async (req, res) => {
    try {
      const { searchText, manager } = req.query;
      const allAssignmentTracking = await getAllAssignmentTracking(
        searchText,
        manager
      );
      res.json(allAssignmentTracking);
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
  '/assignment-tracking/feedback-assignments/:upn',
  handle_errors(async (req, res) => {
    const allReviews = await getAllFeedbackAssignments(req.params.upn);
    res.json(allReviews);
  })
);

router.post(
  '/assignment-tracking/bulknudge/',
  handle_errors(async (req, res) => {
    const staffUPN = req.body.upn;
    const nudgedBy = res.locals.upn;
    try {
      await withTransaction(async (tx)=> {
        if (staffUPN) {
          const bulkNudgeCommmunications = await getUserBulkNudgeReviewCommunicationsForToday(staffUPN);

          if (bulkNudgeCommmunications.length === 0) {
            const outstandingAssignments = await getOverdueFeedbackAssignments(staffUPN);
            const emailData = await prepareBulkNudgeEmailContent(tx, staffUPN, outstandingAssignments, nudgedBy);
            const { from, to, subject, context, message, url, callToAction, image, templateFile, clientEmail} = emailData;
            await send(from, to, subject, context, message, url, { callToAction, image, templateFile, clientEmail, bulkNudgeCC:true });
            await bulkNudgeInsertReviewCommunication(tx, outstandingAssignments, res.locals.upn, staffUPN, new Date(), REVIEW_COMMUNICATION_TYPE_REVIEWER_EMAIL, REVIEW_COMMUNICATION_REASON_MANUAL_BULK_NUDGE);
            res.status(201).send();
          } else {
            throw new Error('The staff member has already been bulk nudged today.')
          }
        } else {
          throw new Error('UPN must be supplied');
        }
      })
    } catch (error) {
      res.status(400).json({ message:  error.message});
    }
  })
);

module.exports = router;
