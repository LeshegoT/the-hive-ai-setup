const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { single_mission, user_missions } = require('../queries/mission.queries');

router.get(
  '/missions',
  handle_errors(async (req, res) => {
    const missions = await user_missions(req.query.hero);

    res.json(missions);
  })
);

router.get(
  '/mission',
  handle_errors(async (req, res) => {
    const mission = await single_mission(req.query.missionId);

    res.json(mission);
  })
);

module.exports = router;
