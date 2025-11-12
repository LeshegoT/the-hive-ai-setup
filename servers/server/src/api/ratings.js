const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  averageContentRating,
  getRatingValues,
} = require('../queries/content-tagging/rating.queries');

router.get(
  '/ratings/:contentId/average',
  handle_errors(async (req, res) => {
    res.json(await averageContentRating(req.params.contentId));
  })
);

router.get(
  '/ratingValues',
  handle_errors(async (req, res) => {
    res.json(await getRatingValues());
  })
);

module.exports = router;
