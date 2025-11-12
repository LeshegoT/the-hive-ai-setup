const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  searchTags,
  getTag,
  getTagsAndSynonyms,
} = require('../queries/content-tagging/tag.queries');

router.options(
  '/tags',
  handle_errors(async (req, res) => {
    console.log('Options request');
    res.json(await searchTags(req.query.search));
  })
);

router.get(
  '/tags',
  handle_errors(async (req, res) => {
    res.json(await searchTags(req.query.search));
  })
);

router.get(
  '/tag/:tagId',
  handle_errors(async (req, res) => {
    res.json(await getTag(req.params.tagId));
  })
);

router.get(
  '/tags-and-synonyms',
  handle_errors(async (req, res) => {
    res.json(await getTagsAndSynonyms(req.query.search));
  })
);

module.exports = router;
