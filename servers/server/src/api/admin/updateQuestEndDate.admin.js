const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { admin_edit_quest_end_date } = require('../../queries/quest.queries');

module.exports = router.post(
  '/updateQuestEndDate',
  handle_errors(async (req, res) => {
    await admin_edit_quest_end_date(req.body.questId, req.body.endDate);
    res.status(204).send();
  })
);
