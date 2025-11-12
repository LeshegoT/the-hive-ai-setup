const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { calculateMultiplier } = require('../shared/calculate-multiplier');

router.get(
  '/multiplier',
  handle_errors(async (req, res) => {
    const multiplier = await calculateMultiplier(res.locals.upn);

    res.json(multiplier);
  })
);

module.exports = router;
