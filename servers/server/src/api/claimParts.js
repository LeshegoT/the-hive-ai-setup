const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { all_claim_parts } = require('../queries/part.queries');

module.exports = router.get(
  '/claimParts',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const parts = await all_claim_parts(upn);

    res.json(parts);
  })
);
