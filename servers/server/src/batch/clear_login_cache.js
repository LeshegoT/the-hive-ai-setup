const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { clearLoginCache } = require('../queries/reference-data.queries');

router.post(
  '/clearLogins',
  handle_errors(async (req, res) => {
    await clearLoginCache();
    res.status(202).send();
  })
);

module.exports = router;
