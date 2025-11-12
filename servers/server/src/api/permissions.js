const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { getAppPermissions } = require('../queries/permissions.queries');

router.get(
  '/app/permissions',
  handle_errors(async (req, res) => {
    const permissions = await getAppPermissions(res.locals.upn);
    res.json(permissions);
  })
);

module.exports = router;
