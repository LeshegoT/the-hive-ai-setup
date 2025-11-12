const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../../shared/db');
const {
  createTag,
  findExistingSynonym,
  findExistingTag,
  getTag,
  updateTag,
  removeTag,
  getTagsAndSynonyms,
} = require('../../queries/content-tagging/tag.queries');

async function isTagValid(tag) {
  const foundTag = await findExistingTag(tag.name);
  const foundSynonym = await findExistingSynonym(tag.name);
  if (foundTag || foundSynonym) {
    return false;
  }
  if (tag.synonyms) {
    const tagsAndSynonyms = await getTagsAndSynonyms();
    const existingSynonyms = tagsAndSynonyms.filter((tag) =>
      tag.synonyms.includes(tag.tagName)
    );
    return !existingSynonyms.length;
  }
  return true;
}

router.post(
  '/tag',
  handle_errors(async (req, res) => {
    const tag = req.body;
    if (await isTagValid(tag)) {
      res.json(await withTransaction((tx) => createTag(tx, tag)));
    } else {
      res.status(400).json({ msg: 'Tag or synonyms already exist', tag });
    }
  })
);

router.put(
  '/tag/:tagId',
  handle_errors(async (req, res) => {
    const tag = req.body;
    if (tag.tagId && tag.tagId != req.params.tagId) {
      res.status(400).json({
        msg: `Tag ID in body (${tag.tagId}) and request URL (${req.params.tagId}) do not match`,
        suggestedFix:
          'Do not include tagId in body, or ensure the values match',
      });
    } else {
      if (!tag.tagId) {
        tag.tagId = req.params.tagId;
      }
      if (!(await getTag(req.params.tagId))) {
        res.status(404).json({ msg: `Tag ID (${tag.tagId}) not found!` });
      } else {
        res.json(await withTransaction((tx) => updateTag(tx, tag)));
      }
    }
  })
);

router.delete(
  '/tag/:tagId',
  handle_errors(async (req, res) => {
    res.json({
      tagId: await withTransaction((tx) => removeTag(tx, req.params.tagId)),
    });
  })
);

module.exports = router;
