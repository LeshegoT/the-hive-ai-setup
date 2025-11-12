const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { user_avatar, user_avatar_parts } = require('../queries/avatar.queries');
const { choose_parts } = require('../queries/part.queries');

module.exports = router.post(
  '/chooseParts',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const { avatarId } = await user_avatar(upn);

    const claim_parts = req.body.parts;
    await choose_parts(avatarId, claim_parts);

    const parts = await user_avatar_parts(upn);

    res.json({ parts });
  })
);
