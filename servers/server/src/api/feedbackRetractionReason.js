const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { getAllRetractReason } = require('../queries/retraction-reason.queries');

module.exports = router.get(
  '/retraction',
  handle_errors(async (req, res) => {
    try {
      const reasons = await getAllRetractReason();
      res.status(200).json(reasons);
    } catch (error) {
      res
        .status(400)
        .json({
          message: 'Failed to retrieve feedback retraction reason',
          error,
        });
    }
  })
);
