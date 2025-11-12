const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { single_quest, old_user_quests } = require('../queries/quest.queries');
const { quest_missions } = require('../queries/mission.queries');

router.get(
  '/quest',
  handle_errors(async (req, res) => {
    const quest = await single_quest(req.query.questId, req.query.upn);

    let missions = [];
    if (quest) {
      missions = await quest_missions(req.query.questId);
    }

    res.json({ quest, missions });
  })
);

router.get(
  '/questMissions',
  handle_errors(async (req, res) => {
    const missions = await quest_missions(req.query.questId);

    res.json(missions);
  })
);

router.get(
  '/oldQuests',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;

    const oldQuests = await old_user_quests(upn);

    res.json(oldQuests);
  })
);

module.exports = router;
