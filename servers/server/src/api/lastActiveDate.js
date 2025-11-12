const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  update_last_hero_activity,
  update_last_guide_activity,
} = require('../queries/hero.queries');

router.post(
  '/lastHeroActiveDate',
  handle_errors(async (req, res) => {
    await update_last_hero_activity(req.query.upn);
    res.status(204).send();
  })
);

router.post(
  '/lastGuideActiveDate',
  handle_errors(async (req, res) => {
    await update_last_guide_activity(req.query.upn);
    res.status(204).send();
  })
);

module.exports = router;
