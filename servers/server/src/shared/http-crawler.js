const { response } = require('express');
const http = require('http');
const https = require('https');
const {
  findExistingContent,
} = require('../queries/content-tagging/content.queries');
const { getSiteForUrl } = require('../queries/content-tagging/site.queries');

const getOrCreateSite = async (tx, url) => {
  const existingSites = await getSiteForUrl(url);
  if (existingSites.length > 0) {
    return existingSites[0].siteId;
  } else {
    console.log('Site not found!!!');
  }
};

const getExistingSite = async (tx, url) => {
  const existingSites = await getSiteForUrl(url);
  if (existingSites.length > 0) {
    return existingSites[0].siteId;
  } else {
    return undefined;
  }
};

const getOrCreateContent = async (tx, contentType, url) => {
  const existingContent = await findExistingContent(url);
  if (existingContent && existingContent.length > 0) {
    return existingContent[0].contentId;
  } else {
    const site = await getExistingSite(tx, url);
    if (site != undefined) {
      // found site
      console.log('Site', site);
      //retreive for existing site
      const retrieved = retrieve(m.link);
      //check if redirect
      //check if content extists
      //TODO: create site and new content
      return retrieved;
    } else {
      const retrieved = retrieve(m.link);
      //check if redirect
      //check if content extists
      //TODO: create site and new content
      return retrieved;
    }
  }
};

const retrieve = async (url) => {
  const client = url.startsWith('https') ? https : http;
  client.get(url, (res) => {
    if (response.status == 302) {
      console.log(res.headers);
      console.log('This is a redirect!', res.headers.location);
      res.end();
      return { redirectLocation: res.headers.location };
    } else {
      // TODO: figure out how to return data.
    }
  });
};

module.exports = {
  retrieve,
  getOrCreateContent,
  getOrCreateSite,
};
