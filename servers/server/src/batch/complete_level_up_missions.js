const router = require('express').Router();

const { handle_errors } = require('@the-hive/lib-core');

const { complete_level_up_missions } = require('../queries/mission.queries');

module.exports = router.post(
  '/complete-level-up-missions',
  handle_errors(async (req, res) => {
    await complete_level_up_missions();

    res.send('Successful');
  })
);
