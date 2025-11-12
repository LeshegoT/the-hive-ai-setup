/**
 * Module containing main entrypoint for the server
 * @module main/index
 *
 * @requires express
 */

// Initialise dotenv
require('@the-hive/lib-core');
import { unsecureRouter } from'./src/api/unsecure';

// Initialise app insights.
const {configureAppInsights} = require('@the-hive/lib-core');
configureAppInsights();

/**
 * Express module
 * @const
 */
const express = require('express');
const app = express();
const { logger, logging_middleware } = require('@the-hive/lib-core');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const proxy = require('express-http-proxy');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { isLocal, parseIfSetElseDefault } = require('@the-hive/lib-core');

const port = process.env.PORT || 3001;
const FILE_SIZE_LIMIT = '50mb';

// Configure middleware
app.use(logging_middleware);
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'connect-src': [
          "'self'",
          'https://login.microsoftonline.com/',
          'https://graph.microsoft.com/',
          'https://www.google-analytics.com/',
          'https://dc.services.visualstudio.com/',
          'https://fonts.googleapis.com/',
          'https://fonts.gstatic.com/',
          process.env.EVENT_SERVER_URL,
        ],
        'frame-src': [
          "'self'",
          'https://login.microsoftonline.com/',
          'https://www.youtube.com/',
          'https://bbdza-onmicrosoft-com.access.mcas.ms/',
          'https://expressjs.com',
          'https://flaviocopes.com',
          'https://javascript.info',
          'https://kapeli.com',
          'https://styled-components.com',
          'https://www.loggly.com',
          'https://www.restapitutorial.com',
        ],
        'script-src': [
          "'self'",
          "'sha256-iXpU8/gyaSHWkh2ObTo1KZ2nWpKVNb2iGvhejYf2xOk='", // hive svg loader animation script
          "'sha256-Z99+mZm8cprTmFJbSHCu6U1mMfKB6NNXrkJBmer2aSA='", // hive svg loader animation script
          "'sha256-qK1CiheEfwQ3cdsSQe8oY/LNYeiP8Og5qsLi81GYehw='", // the google analytics inline script in index.html
          "'sha256-tWmukSht4jCUuu+ClBqzdq0TygELWE7sncYp/EEDllw='", // the google analytics inline script in index.html (another)
          'https://www.googletagmanager.com/',
          'https://www.google-analytics.com/',
          'https://storage.googleapis.com/',
        ],
        'script-src-attr': [
          "'unsafe-hashes'",
          "'sha256-MhtPZXr7+LpJUY5qtMutB+qWfQtMaPccfe7QXtCcEYc='",
          "'self'",
        ],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          'https://www.google-analytics.com/', // this is a wierd one, but google analytics actually loads a 1x1 hidden image from their script
          process.env.STORAGE_ACCOUNT_PROXY_URL,
        ],
        'object-src': ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(bodyParser.json({ limit: FILE_SIZE_LIMIT }));
app.use(cookieParser());


const coursesStorage = parseIfSetElseDefault('COURSES_STORAGE', 'submodules');
if (isLocal() && coursesStorage==='submodules') {
  app.use(
    '/courses',
    express.static(path.join(__dirname, '/../../../../submodules/courses'))
  );
} else {
  app.use(
    '/courses',
    proxy(process.env.STORAGE_ACCOUNT_PROXY_URL, {
      proxyReqPathResolver: (req) => `/courses${req.url}`,
    })
  );
}

app.use(
  '/static-content',
  proxy(process.env.STORAGE_ACCOUNT_PROXY_URL, {
    proxyReqPathResolver: (req) => {
      return `/static-content${req.url}`;
    },
  })
);

/**
 * Check whether we need to force a refresh based on the lastRefreshed cookie value
 *
 * @param {express.Request} request
 * @returns true if reload is required.
 */
function checkRefreshCookie(request) {
  const lastRefreshedCookie = request.cookies.lastRefreshed;
  return needsReload(lastRefreshedCookie);
}

/**
 * Check whether we need to reload/refresh based on the value of the last refresh
 * cookie
 *
 * @param {String} lastReload representing the date containted in the refresh cookie
 * @returns true when we need to reload/refresh the hive app.
 */
function needsReload(lastReload) {
  if (lastReload) {
    const now = new Date();
    const lastReloadDate = new Date(Date.parse(lastReload));
    const oneDayInMillis = 24 * 60 * 60 * 1000;
    return oneDayInMillis < now - lastReloadDate;
  } else {
    return true;
  }
}

/**
 * Set a lastRefreshed cookie on the response. This will only be sent when a user is actually redirected to the
 * refresh page and never in any other circuimstance.
 *
 * @param {express.Responce} response
 */
function setRefreshCookie(response) {
  const now = new Date().toISOString();
  const oneDayInMillis = 24 * 60 * 60 * 1000;
  response.cookie('lastRefreshed', now, {
    maxAge: oneDayInMillis,
    httpOnly: true,
    sameSite: 'strict',
  });
}

/**
 * Check whether we can safely redirect the browser request to the force refresh page.
 *
 * Rules are:
 *
 * Never redirect if the request is already for the refresh page
 * Only redirect HTML files (since an HTML redirect for a requested .js file will surely break)
 * When the client is requesting index.html directly (because the service worker is trying to pre-cache it)
 * When the refresh cookie has never been set or is older than a day.
 *
 *
 * @param {express.Request} request
 * @returns true when a redirect to the refresh page is allowed.
 */
function checPathsAndCookie(request) {
  return (
    !request.path.startsWith('/refresh.html') &&
    request.path.includes('.html') &&
    !(
      (request.path == '/' || request.path.startsWith('/index.html')) &&
      request.query['__WB_REVISION__']
    ) &&
    checkRefreshCookie(request)
  );
}

/**
 * Express handler that should be used to intercept all requests to the 'app'.
 *
 * This is used to determine the date of last reload and will redirect to the
 * refesh page if it makes sense and is necessary to do so.
 *
 * The refresh page is temprorarily served from '/refresh.html
 *
 * @param {express.Request} request
 * @param {express.Response} response
 * @param {express.RequestHandler} next
 */
function interceptAppRequests(request, response, next) {
  if (checPathsAndCookie(request)) {
    console.log('Need to force refresh for ', {
      path: request.path,
      query: request.query,
    });
    //response.redirect(307, '/refresh.html');
  } else if (request.path == '/refresh.html') {
    setRefreshCookie(response);
  } else if (request.path == '/index.html' || request.path == '/') {
    response.set('Cache-Control', 'no-store');
  }
  next();
}
// Add routing
const api = require('./src/api/index');

app.use('/api/', api);
app.use('/public/', unsecureRouter);

app.use('/batch/', require('./src/batch'));

app.use(
  '/',
  interceptAppRequests,
  express.static(path.join(__dirname, 'public'))
);
app.use(
  '/error',
  interceptAppRequests,
  express.static(path.join(__dirname, 'public'))
);
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.get('/admin/*', (req, res) =>
  res.sendfile(path.join(__dirname, 'admin/index.html'))
);

app.use('/api/*', (req, res) => {
  res.status(404).send(`${req.originalUrl} not found`);
});

app.use('/batch/*', (req, res) => {
  res.status(404).send(`${req.originalUrl} not found`);
});

app.use(
  '/*',
  interceptAppRequests,
  express.static(path.join(__dirname, 'public'))
);

// 404
app.use((req, res, next) => {
  if (req.path.match(/\.(png|jpe?g)/i)) {
    // Skip 404 handling for image requests
    return next();
  } else if (req.accepts('html')) {
    // Handle HTML requests with a custom 404 page
    return res.status(404).redirect('/error/404.html');
  } else {
    // For all other cases, let Express handle it
    return next();
  }
});

app.listen(port, () => {
  logger.warn('Punch it, Chewie! 💫');
  logger.info(`http://localhost:${port}`);
});
