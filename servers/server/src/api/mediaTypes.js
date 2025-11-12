const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  getMediaTypes,
} = require('../queries/content-tagging/content-media-type.queries');

router.get(
  '/content-media-type',
  handle_errors(async (req, res) => {
    res.json(await getMediaTypes());
  })
);

module.exports = router;
