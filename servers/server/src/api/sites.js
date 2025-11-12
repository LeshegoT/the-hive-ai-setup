const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { getSites } = require('../queries/content-tagging/site.queries');

router.get(
  '/site',
  handle_errors(async (req, res) => {
    res.json(await getSites());
  })
);

module.exports = router;
