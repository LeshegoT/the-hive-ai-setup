const {
  tagContent,
  findTag,
} = require('../queries/content-tagging/tag.queries');
const { rateContent } = require('../queries/content-tagging/rating.queries');
const {
  findExistingContent,
  addContent,
} = require('../queries/content-tagging/content.queries');
const { parseIfSetElseDefault } = require('@the-hive/lib-core');

const createContent = async (tx, content) => {
  let newContent = await findExistingContent(content.url);
  if (!newContent) {
    newContent = await addContent(tx, content);
  } else {
    // If content already exists, we do not need to add it again. No further action is required here.
  }
  if (content.tags && parseIfSetElseDefault('TAG_CONTENT_ENABLED', true)) {
  const tags = content.tags.filter((tag) => tag.tagId);
  for (const tag of content.tags.filter((tag) => !tag.tagId)) {
    tags.push(await findTag(tx, tag.tagName));
  }
  newContent.tags = tags;
    await tagContent(
      tx,
      newContent.contentId,
      tags.map((tag) => tag.tagId)
    );
  } else {
    //If tagging is disabled, we simply skip tagging. No further action is required here.
  }

  if (parseIfSetElseDefault('RATING_CONTENT_ENABLED', true)) {
    await rateContent(
      tx,
      newContent.contentId,
      content.userPrincipalName,
      content.ratingId
    );
  } else {
    //If rating is disabled, we simply skip rating. No further action is required here.
  }
  return newContent;
};

module.exports = {
  createContent,
};
