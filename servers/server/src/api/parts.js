const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { all_parts } = require('../queries/part.queries');

module.exports = router.get(
  '/parts',
  handle_errors(async (req, res) => {
    const parts = await all_parts();

    res.json(parts);
  })
);
