const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { hero_quests, all_quests_for_hero } = require('../queries/quest.queries');
const { quest_missions } = require('../queries/mission.queries');

router.get(
  '/heroes',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const heroes = await hero_quests(upn);

    res.json(heroes);
  })
);

router.get(
  '/allHeroQuests',
  handle_errors(async (req, res) => {
    const quests = await all_quests_for_hero(req.query.upn);

    res.json(quests);
  })
);

router.get(
  '/allHeroQuestsWithMissions',
  handle_errors(async (req, res) => {
    const quests = await all_quests_for_hero(req.query.upn);
    const questsWithMissions = await Promise.all(
      quests.map(async (quest) => {
        const questMissions = await quest_missions(quest.questId);
        return { ...quest, missions: questMissions };
      })
    );

    res.json(questsWithMissions);
  })
);

module.exports = router;
