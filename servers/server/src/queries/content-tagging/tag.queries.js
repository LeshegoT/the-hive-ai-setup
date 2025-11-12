const { db } = require('../../shared/db');
const fixCase = require('../../shared/fix-case');

const findTag = async (tx, tagName) => {
  const tag = await findExistingTag(tagName);
  if (tag) {
    return tag;
  }
  const synonym = await findExistingSynonym(tagName);
  if (synonym) {
    return synonym;
  }
  return await createTag(tx, { name: tagName });
};

const searchTags = async (filter) => {
  if (!filter) {
    return getTags();
  } else {
    const query = `SELECT TagId, TagName
      FROM ContentTags T
      where T.TagName like @FILTER
    `;
    const connection = await db();
    const result = await connection
      .input('FILTER', `%${filter}%`)
      .timed_query(query, 'tags-by-filter');

    return fixCase(result.recordset);
  }
};

const getTag = async (tagId) => {
  if (!tagId) {
    return getTags();
  } else {
    const query = `SELECT TagId, TagName
      FROM ContentTags T
      where T.TagId like @TAG_ID
    `;
    const connection = await db();
    const result = await connection
      .input('TAG_ID', tagId)
      .timed_query(query, 'tags-by-id');

    return result.recordset ? fixCase(result.recordset)[0] : undefined;
  }
};

const getContentTags = async (contentId) => {
  const query = `SELECT T.TagId, T.TagName
    FROM ContentTags T
    JOIN ContentAssignedTags CT
    ON T.TagID = CT.TagId
    WHERE CT.ContentId = @CONTENT_ID
    `;
  const connection = await db();
  const result = await connection
    .input('CONTENT_ID', contentId)
    .timed_query(query, 'tags-by-content');
  return fixCase(result.recordset);
};

const getTags = async () => {
  const connection = await db();
  const query = 'SELECT TagId, TagName FROM ContentTags T';
  const result = await connection.timed_query(query, 'all-tags');
  return fixCase(result.recordset);
};

const getTagsAndSynonyms = async (filter) => {
  const connection = await db();
  if (filter) {
    const query = `
  SELECT TagId, TagName, TagSynonymId from
  (SELECT TagId, TagName, NULL as TagSynonymId from ContentTags T
  UNION
  SELECT T.TagId, S.Synonym, S.TagSynonymId from ContentTagSynonyms S inner join ContentTags T on T.TagId = S.TagId) u
  where u.TagName like @FILTER`;
    const result = await connection
      .input('FILTER', `%${filter}%`)
      .timed_query(query, 'all-tags-with-synonyms');

    return fixCase(result.recordset);
  } else {
    const query = `
      select TagId, TagName, NULL as TagSynonymId from ContentTags T
      UNION
      select T.TagId, S.Synonym, S.TagSynonymId from ContentTagSynonyms S inner join ContentTags T on T.TagId = S.TagId`;
    const result = await connection.timed_query(query, 'all-tags-with-synonyms');

    return fixCase(result.recordset);
  }
};

const findExistingTag = async (tagName) => {
  const query = `SELECT TagId, TagName
      FROM ContentTags T
      where T.TagName = @TAG_NAME
    `;
  const connection = await db();
  const result = await connection
    .input('TAG_NAME', tagName)
    .timed_query(query, 'tags-by-name');

  return result.recordset.length ? fixCase(result.recordset)[0] : undefined;
};

const findExistingSynonym = async (synonym) => {
  const query = `SELECT TagSynonymId, TagId, Synonym AS TagName
      FROM ContentTagSynonyms T
      where T.Synonym = @SYNONYM`;
  const connection = await db();
  const result = await connection
    .input('SYNONYM', synonym)
    .timed_query(query, 'synonyms-by-name');

  return result.recordset.length ? fixCase(result.recordset)[0] : undefined;
};

const createSynonymForTag = async (tx, tagId, synonym) => {
  const exists = await findExistingSynonym(synonym);
  if (exists) {
    return exists.tagSynonymId;
  }

  const query = `INSERT INTO ContentTagSynonyms(TagId, Synonym) OUTPUT INSERTED.TagSynonymId
      values (@TAG_ID, @SYN)`;
  const request = await tx.request();
  const result = await request
    .input('TAG_ID', tagId)
    .input('SYN', synonym)
    .query(query, 'insert-synonym');
  return fixCase(result.recordset)[0].tagSynonymId;
};

const removeSynonymsForTag = async (tx, tagId) => {
  const query = `DELETE
    FROM ContentTagSynonyms
    WHERE TagId = @TAG_ID
  `;
  const request = await tx.request();
  await request.input('TAG_ID', tagId).query(query, 'remove-synonyms');
};

const removeContentTaggingForTag = async (tx, tagId) => {
  const query = `DELETE
    FROM ContentAssignedTags
    WHERE TagId = @TAG_ID
  `;
  const request = await tx.request();
  await request.input('TAG_ID', tagId).query(query, 'remove-content');
};

const tagContent = async (tx, contentId, tagIds) => {
  const insertedTags = [];
  for (const tagId of tagIds) {
    const request = await tx.request();
    const query = `INSERT INTO ContentAssignedTags(ContentId, TagId)
      values (@CONTENT_ID, @TAG_ID)`;
    await request
      .input('TAG_ID', tagId)
      .input('CONTENT_ID', contentId)
      .query(query, 'insert-tag');
    insertedTags.push(tagId);
  }
  return insertedTags;
};

const createTag = async (tx, tag) => {
  const request = await tx.request();
  const insertTag = `INSERT INTO ContentTags(TagName) OUTPUT INSERTED.TagId
      values (@TAG_NAME)`;
  const result = await request
    .input('TAG_NAME', tag.name)
    .query(insertTag, 'insert-tag');
  const insertedId = result.recordset[0].TagId;
  if (!tag.synonyms) {
    tag.synonyms = [];
  }
  await Promise.all(
    tag.synonyms.map((synonym) => createSynonymForTag(tx, insertedId, synonym))
  );
  return { tagId: insertedId, tagName: tag.name };
};

const updateTag = async (tx, tag) => {
  const query = `UPDATE ContentTags
    SET TagName = @NAME
    WHERE TagId = @TAG_ID
    `;
  const request = await tx.request();
  if (tag.name) {
    await request
      .input('NAME', tag.name)
      .input('TAG_ID', tag.tagId)
      .query(query, 'update-tag');
  }

  if (!tag.synonyms) {
    tag.synonyms = [];
  }
  const synonyms = [];
  for (const synonym of tag.synonyms) {
    synonyms.push(await createSynonymForTag(tx, tag.tagId, synonym));
  }

  return { tagId: tag.tagId, synonymIds: synonyms };
};

const removeTag = async (tx, tagId) => {
  await removeSynonymsForTag(tx, tagId);
  await removeContentTaggingForTag(tx, tagId);

  const query = `DELETE
    FROM ContentTags
    WHERE TagId = @TAG_ID
  `;
  const request = await tx.request();
  await request.input('TAG_ID', tagId).query(query, 'remove-tag');
  return tagId;
};

const removeContentTags = async (tx, contentId) => {
  const request = await tx.request();
  const query = `DELETE
    FROM ContentAssignedTags
    WHERE ContentId = @CONTENT_ID
  `;
  await request.input('CONTENT_ID', contentId).query(query, 'remove-tag');
};

module.exports = {
  getTag,
  searchTags,
  getTags,
  getContentTags,
  getTagsAndSynonyms,
  createTag,
  tagContent,
  findExistingTag,
  findExistingSynonym,
  removeTag,
  removeContentTags,
  updateTag,
  findTag,
};
