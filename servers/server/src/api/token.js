const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  get_user_token,
  insert_user_token,
  insert_profile_record_with_token,
} = require('../queries/token.queries');
const { withTransaction } = require('../shared/db');

router.get(
  '/token',
  handle_errors(async (req, res) => {
    const userToken = await withTransaction((tx) => token(tx, res.locals.upn));
    res.json({ token: userToken });
  })
);

const token = async (tx, upn) => {
  let token = await get_user_token(tx, upn);

  if (token === 'No record found') {
    token = await insert_profile_record_with_token(tx, upn);
    return token;
  }

  if (!token) token = await insert_user_token(tx, upn);
  return token;
};

module.exports = router;
