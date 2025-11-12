const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { leaderboard } = require('../queries/leaderboard.queries');

module.exports = router.get(
  '/leaderboard',
  handle_errors(async (req, res) => {
    const response = await leaderboard(req.headers.upn);
    res.json(response);
  })
);
