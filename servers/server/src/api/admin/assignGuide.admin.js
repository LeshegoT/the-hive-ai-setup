const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { assign_guide } = require('../../queries/quest.queries');

module.exports = router.post(
  '/assignGuide',
  handle_errors(async (req, res) => {
    await assign_guide(req.body.questId, req.body.guide);
    res.json({}); //do we need to return somethimg here?
  })
);
