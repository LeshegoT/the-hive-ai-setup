const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { transaction } = require('../shared/db');

const { set_quest_status, single_quest } = require('../queries/quest.queries');
const { quest_missions } = require('../queries/mission.queries');

module.exports = router.post(
  '/resumeQuest',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const questId = req.body.questId;

    const tx = await transaction();

    try {
      await tx.begin();
      await set_quest_status(tx, questId, 'in-progress');
      await tx.commit();
    } catch (error) {
      console.error(error);
      await tx.rollback();
    }

    const quest = await single_quest(questId, upn);
    const missions = await quest_missions(questId);

    res.json({ quest, missions });
  })
);
