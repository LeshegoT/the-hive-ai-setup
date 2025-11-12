const { db } = require('../../shared/db');
const fixCase = require('../../shared/fix-case');

const getSites = async () => {
  const connection = await db();
  const query = 'SELECT SiteId, Name, URLBase FROM Site T';
  const result = await connection.timed_query(query, 'all-sites');
  return fixCase(result.recordset);
};

const getSite = async (siteId) => {
  const connection = await db();
  const query =
    'SELECT SiteId, Name, URLBase FROM Site T WHERE SiteId = @SITE_ID';
  const result = await connection
    .input('SITE_ID', siteId)
    .timed_query(query, 'all-sites');
  return result.recordset ? fixCase(result.recordset)[0] : undefined;
};

const getSiteForUrl = async (url) => {
  const connection = await db();
  const query = `SELECT SiteId, Name, URLBase FROM Site T
    WHERE @URL like T.URLBase+'%'`;
  const result = await connection
    .input('URL', url)
    .timed_query(query, 'site-by-url');
  return result.recordset ? fixCase(result.recordset)[0] : undefined;
};

const getSiteFromName = async (siteName) => {
  const connection = await db();
  const query = `SELECT SiteId, Name, URLBase FROM Site T
    WHERE T.Name = @NAME`;
  const result = await connection
    .input('NAME', siteName)
    .timed_query(query, 'site-by-name');
  return result.recordset ? fixCase(result.recordset)[0] : undefined;
};

const findSiteId = async (tx, url) => {
  const site = await getSiteForUrl(url);
  if (site) {
    return site.siteId;
  }
  let siteName = url.replace(/https?:\/\/|www\.|\..+/g, '');
  const baseUrl = url.replace(/(?<!:|\/)\/.+/, '');
  const nameExists = await getSiteFromName(siteName);
  if (nameExists) {
    siteName = baseUrl;
  }
  return addSite(tx, siteName, baseUrl);
};

const addSite = async (tx, name, baseUrl) => {
  const request = await tx.timed_request();
  const query = `INSERT INTO Site(Name, URLBase) OUTPUT INSERTED.SiteId
    VALUES (@NAME, @URL)`;
  const result = await request
    .input('NAME', name)
    .input('URL', baseUrl)
    .timed_query(query, 'insert-site');
  return fixCase(result.recordset)[0].siteId;
};

const updateSite = async (tx, site) => {
  const query = `UPDATE Site
    SET Name = @NAME,
    URLBase = @URL
    WHERE SiteId = @SITE_ID
    `;
  const request = await tx.request();
  await request
    .input('NAME', site.name)
    .input('URL', site.baseUrl)
    .input('SITE_ID', site.siteId)
    .query(query, 'update-tag');
  return site.siteId;
};

const removeSite = async (tx, siteId) => {
  const request = await tx.request();
  const query = `DELETE
    FROM Site
    WHERE SiteId = @SITE_ID
  `;
  await request.input('SITE_ID', siteId).query(query, 'remove-site');
  return siteId;
};

module.exports = {
  getSites,
  getSite,
  addSite,
  updateSite,
  removeSite,
  getSiteForUrl,
  findSiteId,
};
