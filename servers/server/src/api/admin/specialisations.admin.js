const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { all_specialisations } = require('../../queries/reference-data.queries');

module.exports = router.get(
  '/specialisations',
  handle_errors(async (req, res) => {
    const specialisations = await all_specialisations();

    res.json(specialisations);
  })
);
