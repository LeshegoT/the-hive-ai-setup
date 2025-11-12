const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { all_quests } = require('../../queries/quest.queries');

module.exports = router.get(
  '/allQuests',
  handle_errors(async (req, res) => {
    const quests = await all_quests();

    res.json(quests);
  })
);
