const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { guide_hero_quests } = require('../../queries/quest.queries');

module.exports = router.get(
  '/guidesHeroes',
  handle_errors(async (req, res) => {
    const heroQuests = await guide_hero_quests(req.query.guide, 'in-progress');

    res.json(heroQuests);
  })
);
