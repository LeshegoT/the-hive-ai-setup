const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { insert_profile_ranking } = require('../queries/profile-rankings.queries');
const { toRank } = require('../queries/leaderboard.queries');
const queue = require('../shared/queue');

router.post(
  '/schedule-rank-recordings',
  handle_errors(async (req, res) => {
    const heroes = await toRank();

    for (const hero of heroes) {
      queue.enqueue('profile-rankings', {
        userPrincipleName: hero.userPrincipleName,
        position: hero.position,
        pointsTotal: hero.pointsTotal,
      });
    }

    res.send('Successful');
  })
);

router.post(
  '/record-profile-ranking',
  handle_errors(async (req, res) => {
    await insert_profile_ranking(
      req.body.userPrincipleName,
      req.body.position,
      req.body.pointsTotal
    );

    res.send('Successful');
  })
);

module.exports = router;
