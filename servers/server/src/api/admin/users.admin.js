const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { userExists } = require('../../shared/active-directory-profile');
const { getUserDetails } = require('../../shared/user-details');
const { getUPNDepartmentHistory } = require('../../queries/reporting.queries');

router.get(
  '/user/:upn/details',
  handle_errors(async (req, res) => {
    const { upn } = req.params;

    const person = { userPrincipleName: upn };
    const details = await getUserDetails([person]);

    res.json(details[0]);
  })
);

router.get(
  '/user/:upn/history',
  handle_errors(async (req, res) => {
    const { upn } = req.params;
    const result = await getUPNDepartmentHistory(upn);

    res.json(result);
  })
);

router.get(
  '/user/:upn/exists-in-ad',
  handle_errors(async (req, res) => {
    const { upn } = req.params;
    const existsInAd = await userExists(upn);

    res.json({ upn, existsInAd });
  })
);

module.exports = router;
