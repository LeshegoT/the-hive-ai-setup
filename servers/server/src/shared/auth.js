const {
  get_interaction_type,
  insert_user_interaction,
} = require('../queries/user-interactions.queries');
const { insert_user_login } = require('../queries/login.queries');
const { withTransaction } = require('../shared/db');
const { check_login } = require('../queries/reference-data.queries');
const { auth } = require('@the-hive/lib-core');
const registerLogin = async (_req, res, next) => {
  const login = await check_login(res.locals.upn);
  if (!login) {
    await withTransaction((tx) => userLogin(tx, res.locals.upn, 'login'));
  }

  next();
};

const userLogin = async (tx, upn, typeCode) => {
  const typeID = await get_interaction_type(tx, typeCode);

  const uiid = await insert_user_interaction(tx, upn, typeID);

  await insert_user_login(tx, uiid);
};

module.exports = {
  auth,
  registerLogin,
};
