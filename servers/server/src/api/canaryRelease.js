const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { check_canary_release_group } = require('../queries/groups.queries');

router.get(
  '/canaryRelease/:userPrincipleName',
  handle_errors(async (req, res) => {
    const { userPrincipleName } = req.params;
    const validCanaryReleaseUser = await check_canary_release_group(
      userPrincipleName
    );

    res.json({ validCanaryReleaseUser });
  })
);

module.exports = router;
