const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { register_for_side_quest } = require('../queries/side-quests.queries');

module.exports = router.post(
  '/registerForSideQuest',
  handle_errors(async (req, res) => {
    const sideQuests = await register_for_side_quest(
      req.body.sideQuestId,
      req.body.upn
    );
    res.json(sideQuests);
  })
);
