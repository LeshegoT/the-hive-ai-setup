const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { all_restrictions } = require('../../queries/restrictions.queries');

module.exports = router.get(
  '/restrictions',
  handle_errors(async (req, res) => {
    const restrictions = await all_restrictions();

    res.json(restrictions);
  })
);
