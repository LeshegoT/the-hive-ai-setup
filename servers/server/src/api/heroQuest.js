const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { hero_quest } = require('../queries/quest.queries');
const { quest_missions } = require('../queries/mission.queries');

module.exports = router.get(
  '/heroQuest/:hero',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const { hero } = req.params;

    const quest = await hero_quest(hero, upn);

    let missions = [];
    if (quest) {
      missions = await quest_missions(quest.questId);
    }

    res.json({ quest, missions });
  })
);
