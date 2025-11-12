const { db } = require('../../shared/db');
const fixCase = require('../../shared/fix-case');
const { removeContentTags, getContentTags } = require('./tag.queries');
const { removeContentRatings } = require('./rating.queries');
const { getMediaType } = require('./content-media-type.queries');
const { findSiteId, getSite } = require('./site.queries');

const searchContentUrl = async (filter) => {
  if (!filter) {
    return getAllContent();
  } else {
    const query = `SELECT ContentId, URL, ContentMediaTypeId, SiteId
      FROM Content C
      where C.URL like @FILTER
    `;
    const connection = await db();
    const result = await connection
      .input('FILTER', `%${filter}%`)
      .timed_query(query, 'content-by-filter');

    return fixCase(result.recordset);
  }
};

const getContent = async (contentId) => {
  if (!contentId) {
    return getAllContent();
  } else {
    const query = `SELECT ContentId, URL, ContentMediaTypeId, SiteId
      FROM Content C
      where C.ContentID like @CONTENT_ID
    `;
    const connection = await db();
    const result = await connection
      .input('CONTENT_ID', contentId)
      .timed_query(query, 'content-by-id');

    let content = fixCase(result.recordset);

    if (content.length) {
      content = content[0];
      content.tags = await getContentTags(content.contentId);
      content.mediaType = await getMediaType(content.contentMediaTypeId);
      content.site = await getSite(content.siteId);

      return content;
    }

    return undefined;
  }
};

const getContentForSite = async (siteId) => {
  if (!siteId) {
    return getAllContent();
  } else {
    const query = `SELECT ContentId, URL, ContentMediaTypeId, SiteId
      FROM Content C
      where C.SiteID like @SITE_ID
    `;
    const connection = await db();
    const result = await connection
      .input('SITE_ID', siteId)
      .timed_query(query, 'content-by-site');

    return fixCase(result.recordset);
  }
};

const getAllContent = async () => {
  const connection = await db();
  const query =
    'SELECT ContentId, URL, ContentMediaTypeId, SiteId FROM Content C';
  const result = await connection.timed_query(query, 'all-content');
  let allContent = fixCase(result.recordset);
  allContent = await Promise.all(
    allContent.map(async (element) => {
      const content = {
        contentId: element.contentId,
        url: element.url,
      };
      content.site = await getSite(element.siteId);
      content.mediaType = await getMediaType(element.contentMediaTypeId);
      content.tags = await getContentTags(element.contentId);
      return content;
    })
  );
  return allContent;
};

const findExistingContent = async (contentUrl) => {
  const query = `SELECT ContentId, URL
      FROM Content C
      where C.URL = @URL
    `;
  const connection = await db();
  const result = await connection
    .input('URL', contentUrl)
    .timed_query(query, 'content-by-url');

  return result.recordset.length ? fixCase(result.recordset)[0] : undefined;
};

const addContent = async (tx, content) => {
  let siteId = content.siteId;
  if (!siteId) {
    siteId = await findSiteId(tx, content.url);
  }

  const insertContent = `INSERT INTO Content(URL, SiteId, ContentMediaTypeId) OUTPUT INSERTED.ContentId
      values (@URL, @SITE, @MEDIA_TYPE)`;
  const request = await tx.request();

  const result = await request
    .input('URL', content.url)
    .input('SITE', siteId)
    .input('MEDIA_TYPE', content.mediaTypeId)
    .query(insertContent, 'insert-content');
  const inserted = fixCase(result.recordset)[0];
  inserted.url = content.url;
  return inserted;
};

const updateContent = async (tx, content) => {
  const query = `UPDATE Content
    SET URL = @URL,
    ContentMediaType = @MEDIA_TYPE,
    SiteId = @SITE
    WHERE ContentId = @CONTENT_ID
    `;
  const request = await tx.request();

  await request
    .input('URL', content.url)
    .input('MEDIA_TYPE', content.mediaType)
    .input('SITE', content.siteId)
    .input('CONTENT_ID', content.contentId)
    .query(query, 'update-content');
  return content.contentId;
};

const removeContent = async (tx, contentId) => {
  await removeContentTags(tx, contentId);
  await removeContentRatings(tx, contentId);

  const query = `DELETE
    FROM Content
    WHERE ContentId = @CONTENT_ID
  `;
  const request = await tx.request();

  await request.input('CONTENT_ID', contentId).query(query, 'remove-content');
  return contentId;
};

module.exports = {
  addContent,
  findExistingContent,
  getAllContent,
  searchContentUrl,
  getContent,
  getContentForSite,
  updateContent,
  removeContent,
};
