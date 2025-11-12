const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  user_interactions,
  interaction_types,
} = require('../queries/user-interactions.queries');

router.get(
  '/userInteractions',
  handle_errors(async (req, res) => {
    const interactions = await user_interactions(req.query.upn);
    res.json(interactions);
  })
);

router.get(
  '/interactionTypes',
  handle_errors(async (req, res) => {
    const types = await interaction_types();
    res.json(types);
  })
);

module.exports = router;
