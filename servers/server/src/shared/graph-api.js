/**
 *
 * Module containing graph-api related functions
 *
 * All interactions with the MS graph-api should be via this module
 *
 * Please do not use deprecated functions from this module, but create or re-use
 * individual function that clearly define what they do like.
 *
 * @link getUser and @link postMail
 *
 * @module shared/graph-api
 *
 */

const fetch = require('node-fetch');
const graphApiClient = require('@microsoft/microsoft-graph-client');
const { rateLimit, getMsalAccessToken } = require('@the-hive/lib-core');

/**
 * Utility function to ensure api requests do not happen any more
 * often than once every 200 milliseconds.
 *
 * This tries to avoid the case where we reach the rate limit set up on
 * the microsoft graph-api services.
 */
const limitToOnceEvery200ms = rateLimit(200);

/**
 * Authentication provider class for use when authenticating the GraphAPI client
 * This authentication provider is not build into the graph api library as yet.
 *
 * The `getAccessToken` on instances of this class is used to retrieve an access
 * token for the graph-api client to use whenever requests are to be made.
 *
 * Note: RE - I am using a class instead of just creating an object to make it
 * easier to understand why a custom provider was necessary in the first place.
 *
 * @extends {graphApiClient.AuthProvider}
 */
class HiveOnBehalfOfAuthenticationProvider {
  constructor() {
    this.getAccessToken = getMsalAccessToken;
  }
}

/**
 * Function to initialize the graph-api client
 *
 * This function should not be exported, since it should only be called internally
 * to this module.
 * @returns {graphApiClient.Client} the initialized graph-api client
 */
function initGraphAPIClient() {
  const authProvider = new HiveOnBehalfOfAuthenticationProvider();
  const client = graphApiClient.Client.initWithMiddleware({
    debugLogging: true,
    authProvider,
  });

  return client;
}

/**
 * A module local instance of the graph-api client to be used to generate and
 * execute graph-api requests
 * @type {graphApiClient.Client}
 */
const client = initGraphAPIClient();

/**
 * Wrapper function for graph-api get request creation and execution
 *
 * This function should not be exported (is internal to this module). It is  a utility
 * to allow individual request functions like `getUser` to be created.
 *
 * @param {*} path
 * @param {*} filter
 * @param {*} select
 * @param {number} top
 * @param {*} raw TODO: RE: Figure out what this RAW variable was for
 * @param {boolean} beta
 * @param {*} expand
 * @returns {*} the result of the get request
 */
const apiGet = async (
  path,
  filter,
  select,
  top = 10,
  raw = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  beta = true,
  expand = []
) => {
  await limitToOnceEvery200ms();
  path = path.includes('#') ? path.replace(/#/g, encodeURIComponent('#')) : path;
  let request = client
    .api(path)
    .version(beta?'beta':'v1.0')
    .header('content-type', 'application/json')
    //.header('Prefer', 'IdType = "ImmutableId"')
    .top(top)
    .count(true);
  if (filter) {
    request = request.filter(filter);
  }

  if (select) {
    request = request.select(select);
  }

  if (expand && Array.isArray(expand) && expand.length > 0) {
    request = request.expand(expand);
  }

  return await request.get();
};

/**
 * Wrapper function for graph-api post request creation and execution
 *
 * This function should not be exported (is internal to this module). It is  a utility
 * to allow individual request functions like `getUser` to be created.
 */
const apiPost = async (path, body) => {
  path = path.includes('#') ? path.replace(/#/g, encodeURIComponent('#')) : path;
  await limitToOnceEvery200ms();
  return client
    .api(path)
    .version('beta')
    .header('Prefer', 'IdType = "ImmutableId"')
    .post(body);
};

/**
 * Wrapper function for graph-api patch request creation and execution
 *
 * This function should not be exported (is internal to this module). It is  a utility
 * to allow individual request functions like `getUser` to be created.
 *
 */
const apiPatch = async (path, body) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  await limitToOnceEvery200ms();
  return client
    .api(path)
    .version('beta')
    .header('Prefer', 'IdType = "ImmutableId"')
    .patch(body);
};

/**
 * Wrapper function for graph-api delete request creation and execution
 *
 * This function should not be exported (is internal to this module). It is  a utility
 * to allow individual request functions like `getUser` to be created.
 */
const apiDelete = async (path) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  await limitToOnceEvery200ms();
  return client.api(path).version('beta').delete();
};

const getUsers = (filter, select, top = 10, raw = false, beta = true) =>
  apiGet('/users', filter, select, top, raw, beta);
const getUser = (upn, filter, select, top = 10, raw = false, beta = true) =>
  apiGet(`/users/${upn}`, filter, select, top, raw, beta);
const getUserCalendars = (
  upn,
  filter,
  select,
  top = 10,
  raw = false,
  beta = true,
  expand = []
) => apiGet(`/users/${upn}/calendars`, filter, select, top, raw, beta, expand);
const getUserMailboxSettingsSettings = (
  upn,
  filter,
  select,
  top = 10,
  raw = false,
  beta = true,
  expand = []
) =>
  apiGet(
    `/users/${upn}/mailboxSettings`,
    filter,
    select,
    top,
    raw,
    beta,
    expand
  );
const getUserTimeZone = (
  upn,
  filter,
  select,
  top = 10,
  raw = false,
  beta = true,
  expand = []
) =>
  apiGet(
    `/users/${upn}/mailboxSettings/timeZone`,
    filter,
    select,
    top,
    raw,
    beta,
    expand
  );

/**
 * Send an e-mail
 *
 * @param {string} fromUpn the UPN for the user from whose mailbox the email is being sent
 *
 * @param {*} body the body of the e-mail request.
 * TODO: RE - declare the type of the body properly
 *
 * @returns {Promise<*>} the result of the API post call
 *
 * TODO: RE - list of valid from email addresses should be checked here and denied.
 */
const postEmail = (fromUpn, body) =>
  apiPost(`/users/${fromUpn}/sendMail`, body);

/** @deprecated only used by deprecated functions */
const base_url_beta = 'https://graph.microsoft.com/beta';
/** @deprecated only used by deprecated functions */
const base_url_v1 = 'https://graph.microsoft.com/v1.0';

const error = async (url, response, body) => {
  throw new Error(
    `Something went wrong communicating with the graph api. (status: ${
      response.status
    }, url: ${url}, message: ${await response.text()}, ${JSON.stringify(
      body
    )} )`
  );
};

/**
 * Perform a graph-api post request and return the response interpreted as JSON
 * @deprecated this general function should not be used and individual getters used
 * instead. For example `postUser` should be used instead of sending the '/users/{upn}'
 * URL to the `post` function
 * @param {string} url the graph-api URL to preform the get request at.
 * @param {*} body the body of the path request
 * @param {boolean} [beta = true] beta whether to use the beta URLs for graph-api
 * @returns {object|buffer} the result of the graph-api patch
 */
const post = async (url, body, beta = true) => {
  await limitToOnceEvery200ms();
  const accessToken = await getMsalAccessToken();
  const base_url = beta ? base_url_beta : base_url_v1;
  const response = await fetch(`${base_url}${url}`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  // see https://docs.microsoft.com/en-us/graph/throttling
  if (response.status === 429 /* Hit concurrency limit */) {
    await error(url, response, body);
  } else if (!response.ok) await error(url, response, body);

  if (response.status === 202 /* Accepted, no response */) return;

  return await response.json();
};

/**
 * Perform a graph-api patch request and return the response  interpreted as JSON
 * @deprecated this general function should not be used and individual getters used
 * instead. For example `patchUser` should be used instead of sending the '/users/{upn}'
 * URL to the `patch` function
 * @param {string} url the graph-api URL to preform the get request at.
 * @param {*} body the body of the path request
 * @param {boolean} [beta = true] beta whether to use the beta URLs for graph-api
 * @returns {object|buffer} the result of the graph-api patch
 */
const patch = async (url, body, beta = true) => {
  await limitToOnceEvery200ms();
  const accessToken = await getMsalAccessToken();
  const base_url = beta ? base_url_beta : base_url_v1;
  const response = await fetch(`${base_url}${url}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  // see https://docs.microsoft.com/en-us/graph/throttling
  if (response.status === 429 /* Hit concurrency limit */) {
    await error(url, response, body);
  } else if (!response.ok) await error(url, response, body);

  if (response.status === 202 /* Accepted, no response */) {
    return;
  }

  const newResponse = await response.json();
  return newResponse;
};

/**
 * Perform a graph-api get request and return the response (either interpreted as JSON)
 * or raw (as a JS buffer)
 * @deprecated this general function should not be used and individual getters used
 * instead. For example `getUser` should be used instead of sending the '/users/{upn}'
 * URL to the `get` function
 * @param {string} url the graph-api URL to preform the get request at.
 * @param {boolean} [raw = false] whether the response should be raw (true) or interpreted (false)
 * @param {boolean} [beta = true] beta whether to use the beta URLs for graph-api
 * @returns {object|buffer}the result of the graph-api get
 */
const get = async (url, raw = false, beta = true) => {
  url = url.includes('#') ? url.replace(/#/g, encodeURIComponent('#')) : url;
  const accessToken = await getMsalAccessToken();
  const base_url = beta ? base_url_beta : base_url_v1;
  await limitToOnceEvery200ms();
  const response = await fetch(`${base_url}${url}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // see https://docs.microsoft.com/en-us/graph/throttling
  if (response.status === 429 /* Hit concurrency limit */) {
    await error(url, response, body);
  }

  if (raw) return await response.buffer();

  return await response.json();
};

module.exports = {
  /*deprecated exports*/
  get,
  post,
  patch,
  /*new preferred exports*/

  /*user related functions */
  getUsers,
  getUser,

  /**Email related functions */
  postEmail,

  /*calendar related functions*/
  getUserCalendars,

  /*General / other functions */
  getUserMailboxSettingsSettings,
  getUserTimeZone,
};
