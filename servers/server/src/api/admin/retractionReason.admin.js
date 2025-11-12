const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  insertRetractReason,
  updateRetractReason,
  deleteRetractReason,
  getRetractionReason,
} = require('../../queries/retraction-reason.queries');

module.exports = router.post(
  '/retraction',
  handle_errors(async (req, res) => {
    const reasons = req.body;
    try {
      const addReason = await insertRetractReason(reasons.retractReason);
      res.status(201).json(addReason);
    } catch (error) {
      res
        .status(400)
        .json({
          message: 'Failed to create feedback retraction reason',
          error,
        });
    }
  })
);

module.exports = router.delete(
  '/retraction/:id',
  handle_errors(async (req, res) => {
    try {
      await deleteRetractReason(req.params.id, res.locals.upn);
      res.status(200).send();
    } catch (error) {
      res
        .status(400)
        .json({
          message: 'Failed to delete feedback retraction reason',
          error,
        });
    }
  })
);

module.exports = router.patch(
  '/retraction/:id',
  handle_errors(async (req, res) => {
    const retractReason = req.body.retractReason;
    const retractFeedbackReasonID = parseInt(req.params.id);
    const checkIfExist = await getRetractionReason(retractFeedbackReasonID);
    if (checkIfExist.length > 0) {
      await updateRetractReason(retractFeedbackReasonID, retractReason);
      res.status(200).send();
    } else {
      res
        .status(400)
        .json({ message: 'feedback fetraction Reason does not exist' });
    }
  })
);
