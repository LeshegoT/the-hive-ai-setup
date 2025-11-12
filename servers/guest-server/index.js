// Initialise dotenv
require('@the-hive/lib-core');

const express = require('express');
const fs = require('fs');
let { logger } = require('./core/logger');
const app = express();
const cors = require('cors');
let bodyParser = require('body-parser');
let path = require('path');
let helmet = require('helmet');
let { getGuestAssignment } = require('./src/queries/guestFeedback.queries');
let port = process.env.PORT || 3002;

async function readHTMLAndReplaceSiteKey(siteKey) {
  let htmlFile = fs.readFileSync(__dirname + '/public/feedback.html', 'utf8');
  return htmlFile.replace("RECAPTCHA_SITE_KEY", siteKey);
}

app.use(cors());
app.use(bodyParser.json());

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'connect-src': [
          "'self'",
          'https://fonts.gstatic.com/',
          'https://fonts.googleapis.com',
        ],
        'frame-src': [
          "'self'",
          'https://www.google.com/recaptcha/',
          'https://www.gstatic.com/recaptcha/',
        ],
        'script-src': [
          "'self'",
          'https://www.google.com/recaptcha/',
          'https://www.gstatic.com/recaptcha/',
        ],
        'img-src': [
          "'self'",
         ' data: *',
         'blob: *'
        ],
      },
    },
  })
);

// Routing
let api = require('./src/api/guestFeedback');
app.use('/api/', api);


app.use('/', express.static(path.join(__dirname, '/public')));
app.use('/vac', express.static(path.join(__dirname, '/public/vac')));
app.use('/game', express.static(path.join(__dirname, '/public/game/source')));

app.get('/', async (req, res) => {
  if (req.query.id) {
    let access = await externalAccess(req.query.id);
    const fixedHTML = await readHTMLAndReplaceSiteKey(process.env.RECAPTCHA_SITE_KEY);
    access.valid ? res.send(fixedHTML):  res.sendFile(__dirname + '/public/html/denied.html') ;
  } else {
    res.sendFile(__dirname + '/public/html/denied.html');
  }
});

app.get('/saveForLater', async (req, res) => {
  if (req.query.id) {
    let access = await externalAccess(req.query.id);
    access.valid ? res.sendFile(__dirname + '/public/html/saveForLater.html') : res.sendFile(__dirname + '/public/html/denied.html');
  } else {
    res.sendFile(__dirname + '/public/html/denied.html');
  }
});

app.get('/success', async (req, res) => {
    res.sendFile(__dirname + '/public/html/reviewSuccess.html') ;
});

const externalAccess =  async(id) => {
  let externalId = id;
  let result =  await getGuestAssignment(externalId);
  const today = new Date();
  if (result == undefined ) {
    logger.warn(`Invalid Access ID: ${externalId}`);
    return { valid: false };
  } else {
    logger.warn(`Valid Access ID: ${externalId}`);
    return { valid: true };
  }
};

app.use('/api/*', (req, res, next) => {
  res.status(404).send(`${req.originalUrl} not found`);
});

app.listen(port, () => {
  logger.warn('Punch it, Chewie! 💫');
  logger.info(`http://localhost:${port}`);
});
