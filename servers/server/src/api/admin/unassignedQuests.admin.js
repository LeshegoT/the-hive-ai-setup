const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { unassigned_quests } = require('../../queries/quest.queries');

module.exports = router.get(
  '/unassignedQuests',
  handle_errors(async (req, res) => {
    const quests = await unassigned_quests();

    res.json(quests);
  })
);
