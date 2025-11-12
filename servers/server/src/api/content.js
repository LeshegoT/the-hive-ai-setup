const router = require('express').Router();
const { withTransaction } = require('../shared/db');
const { createStandardApiRoutes } = require('../shared/standard-api');
const { handle_errors } = require('@the-hive/lib-core');
const {
  getAllContent,
  findExistingContent,
  getContent,
  searchContentUrl,
} = require('../queries/content-tagging/content.queries');
const {
  tagContent,
  findTag,
} = require('../queries/content-tagging/tag.queries');
const { rateContent } = require('../queries/content-tagging/rating.queries');
const { createContent } = require('../shared/create-content');
const { parseIfSetElseDefault } = require('@the-hive/lib-core');

createStandardApiRoutes(router, '/content', 'Content');

router.get(
  '/content',
  handle_errors(async (req, res) => {
    if (req.query.url) {
      res.json(await findExistingContent(req.query.url));
    } else {
      res.json(await getAllContent());
    }
  })
);

router.get(
  '/content/search',
  handle_errors(async (req, res) => {
    if (!parseIfSetElseDefault('COURSE_SEARCH_ENABLED', true)) {
      res.status(404).json({ msg: 'Course search feature is disabled.' });
    } else if (req.query.url) {
      res.json(await searchContentUrl(req.query.url));
    } else {
      res.json(await getAllContent());
    }
  })
);

router.get(
  '/content/:contentId',
  handle_errors(async (req, res) => {
    res.json(await getContent(req.params.contentId));
  })
);

router.post(
  '/content',
  handle_errors(async (req, res) => {
    const ratingEnabled = parseIfSetElseDefault('RATING_CONTENT_ENABLED', true);
    const tagEnabled = parseIfSetElseDefault('TAG_CONTENT_ENABLED', true);

    if (!ratingEnabled && !tagEnabled) {
      res.status(404).json({ msg: 'Rating and Tagging content features are disabled.' });
    } else if (!(req.body.ratingId && req.body.userPrincipalName)) {
      res.status(400).json({
        msg: `Content requires a rating, tags and poster UPN!`,
      });
    } else {
      res.json(await withTransaction(async (tx) => createContent(tx, content)));
    }
  })
);

router.post(
  '/content/:contentId/tag',
  handle_errors(async (req, res) => {
    const tags = req.body.tags;
    const contentId = req.params.contentId;
    let tagIds = [];
    await withTransaction(async (tx) => {
      for (const tag of tags) {
        const foundTag = await findTag(tx, tag.tagName);
        tagIds.push(foundTag.tagId);
      }
      tagIds = await tagContent(tx, contentId, tagIds);
    });
    res.json({ tagIds });
  })
);

router.post(
  '/content/:contentId/rate',
  handle_errors(async (req, res) => {
    if (!parseIfSetElseDefault('RATING_CONTENT_ENABLED', true)) {
      res.status(404).json({ msg: 'Rating content feature is disabled.' });
    } else {
      const contentId = req.params.contentId;
      const upn = req.body.userPrincipalName;
      const ratingId = req.body.ratingId;
      res.json({
        ratingId: await withTransaction((tx) =>
          rateContent(tx, contentId, upn, ratingId)
        ),
      });
    }
  })
);

module.exports = router;
