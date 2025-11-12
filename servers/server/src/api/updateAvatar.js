const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  update_avatar,
  user_avatar,
  user_avatar_parts,
} = require('../queries/avatar.queries');

module.exports = router.post(
  '/updateAvatar',
  handle_errors(async (req, res) => {
    await update_avatar(
      req.body.upn,
      req.body.red,
      req.body.green,
      req.body.blue,
      req.body.parts
    );

    const avatar = await user_avatar(req.body.upn);
    const parts = await user_avatar_parts(req.body.upn);

    res.json({ avatar: avatar[0], parts });
  })
);
