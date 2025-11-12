const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { admin_quest } = require('../../queries/quest.queries');

module.exports = router.get(
  '/adminQuest',
  handle_errors(async (req, res) => {
    const quest = await admin_quest(req.query.questId);

    res.json(quest);
  })
);
