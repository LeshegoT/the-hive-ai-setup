const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { admin_set_quest_specialisation } = require('../../queries/quest.queries');

module.exports = router.post(
  '/setQuestSpecialisation',
  handle_errors(async (req, res) => {
    await admin_set_quest_specialisation(
      req.body.questId,
      req.body.specialisationId
    );
    res.status(204).send();
  })
);
