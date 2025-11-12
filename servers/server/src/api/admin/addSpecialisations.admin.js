const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { add_specialisations } = require('../../queries/guide.queries');

module.exports = router.post(
  '/addSpecialisations',
  handle_errors(async (req, res) => {
    await add_specialisations(req.body.guide, req.body.specialisations);
    res.status(204).send();
  })
);
