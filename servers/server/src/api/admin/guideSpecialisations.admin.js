const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { guide_specialisations } = require('../../queries/guide.queries');

module.exports = router.get(
  '/guideSpecialisations/:guide',
  handle_errors(async (req, res) => {
    const { guide } = req.params;

    const specialisations = await guide_specialisations(guide, 'active');

    res.json(specialisations);
  })
);
