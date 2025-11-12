const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  level_up_register,
  user_level_ups,
} = require('../queries/level-up.queries');

module.exports = router.post(
  '/levelUpRegister/:levelUpId',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const { levelUpId } = req.params;

    await level_up_register(upn, levelUpId);

    const userLevelUps = await user_level_ups(upn);

    res.json(userLevelUps);
  })
);
