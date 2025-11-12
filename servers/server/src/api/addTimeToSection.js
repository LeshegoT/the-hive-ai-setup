const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { add_time_to_section } = require('../queries/complete-section.queries');

module.exports = router.post(
  '/addTimeToSection',
  handle_errors(async (req, res) => {
    await add_time_to_section(req.body.sectionId, req.body.upn, req.body.time);
    res.status(204).send();
  })
);
