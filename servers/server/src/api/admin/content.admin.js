const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  updateContent,
  removeContent,
} = require('../../queries/content-tagging/content.queries');
const {
  getContentRatings,
} = require('../../queries/content-tagging/rating.queries');
const { getContentTags } = require('../../queries/content-tagging/tag.queries');
const { withTransaction } = require('../../shared/db');

router.put(
  '/content/:contentId',
  handle_errors(async (req, res) => {
    const content = req.body;
    content.contentId = req.params.contentId;
    res.json({
      contentId: await withTransaction((tx) => updateContent(tx, content)),
    });
  })
);

router.delete(
  '/content/:contentId',
  handle_errors(async (req, res) => {
    const tags = await getContentTags(req.params.contentId);
    const ratings = await getContentRatings(req.params.contentId);
    if (tags.length) {
      res.status(400).json({
        msg: `Cannot delete content that has been tagged.`,
      });
    } else if (ratings.length) {
      res.status(400).json({
        msg: `Cannot delete content that has been rated.`,
      });
    } else {
      res.json({
        contentId: await withTransaction((tx) =>
          removeContent(tx, req.params.contentId)
        ),
      });
    }
  })
);

module.exports = router;
