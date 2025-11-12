const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  guide_details,
  confirm_delete_guide,
} = require('../../queries/guide.queries');
const { withTransaction } = require('../../shared/db');

module.exports = router.get(
  '/guideDetails',
  handle_errors(async (req, res) => {
    const details = await guide_details(req.query.guide);

    res.json(details);
  })
);

module.exports = router.post(
  '/confirmGuideDelete',
  handle_errors(async (req, res) => {
    const guide = req.body.upn;
    await withTransaction(async (tx) => await confirm_delete_guide(tx, guide));
    res.status(204).send();
  })
);
