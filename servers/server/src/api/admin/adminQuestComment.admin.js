const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { update_Admin_Quest_Comment } = require('../../queries/quest.queries');

module.exports = router.post(
  '/adminQuestComment',
  handle_errors(async (req, res) => {
    await update_Admin_Quest_Comment(req.body.questId, req.body.comment);
    res.json({});
  })
);
