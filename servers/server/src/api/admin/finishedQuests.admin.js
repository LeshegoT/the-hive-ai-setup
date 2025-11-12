const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { finished_quests } = require('../../queries/quest.queries');

module.exports = router.get(
  '/finishedQuests',
  handle_errors(async (req, res) => {
    const quests = await finished_quests();

    res.json(quests);
  })
);
