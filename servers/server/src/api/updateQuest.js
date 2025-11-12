const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { update_quest, single_quest } = require('../queries/quest.queries');
const { quest_missions } = require('../queries/mission.queries');

const { withTransaction } = require('../shared/db');

module.exports = router.post(
  '/updateQuest',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;

    const newMissions = req.body.missions.filter(
      (m) => m.missionId < 0 && !m.deleted
    );
    const existingMissions = req.body.missions.filter((m) => m.missionId > 0);

    await withTransaction((tx) =>
      update_quest(
        tx,
        req.body.quest.questId,
        req.body.quest.goal,
        req.body.quest.endDate,
        newMissions,
        existingMissions
      )
    );

    const quest = await single_quest(req.body.quest.questId, upn);
    const missions = await quest_missions(req.body.quest.questId);

    res.json({ quest, missions });
  })
);
