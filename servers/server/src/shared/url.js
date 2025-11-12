/**
 *
 * Module containing functions related to URL construction
 * @module shared/url
 */

const { getBaseURL } = require('@the-hive/lib-core');

/**
 * Build a relative URL for the specific application and currently running environment.
 *
 * This function uses the `URL` class to ensure that the base/path combination
 * does not have duplicate '//' between the base URL and the path.
 *
 * @param {"hive"|"admin"|"guest"} app the application we need the base the URL on, options are "hive", "admin" and "guest" *
 */
function buildRelativeURL(app, path) {
  const baseURL = getBaseURL(app);
  return new URL(path, baseURL).toString();
}

module.exports = {
  buildRelativeURL,
};
