/**
 *
 * Module containing email related functions
 *
 * All emails should be sent using the send function in this module.
 *
 * All other email sending functions have been unified in this module
 *
 * @module shared/email
 *
 */

const { logger, parseIfSetElseDefault } = require('@the-hive/lib-core');
const { postEmail } = require('./graph-api');
const { userGroups } = require('../queries/user.queries');
const MarkdownConverter = new (require('showdown').Converter)({ tables: true });
const {
  isProduction,
  prependEnvironment,
  allowedExternalEmails,
} = require('@the-hive/lib-core');
const HTMLEngine = require('./html-template');
const { fetchBinaryBlobData } = require('@the-hive/lib-core');
const { readFile } = require('node:fs/promises');

/**
 * Definition for font style for use in HTML templates.
 */
const DEFAULT_FONT = `font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:12pt; color:#000000; height: 56px;`;
const FEEDBACK_FONT = `font-family:'Montserrat', Montserrat, Arial, sans-serif; font-size:16pt; color:#000000;`;

// TODO: RE - this image data has to be made more stand-alone (and more dynamic)
// Currently just references public images, but should probably embed the images
// as base64 encoded in the e-mail instead.
// Link to trello ticket: https://trello.com/c/PxWx2Obg
const imageData = {
  hive: {
    name: 'hive.png',
    type: 'image/png',
    altText: 'The Hive',
  },
  bbd: {
    name: 'bbd-software-logo.webp',
    type: 'image/webp',
    altText: 'BBD Software Development',
  },
  client: {
    name: 'review-image-2024.jpg',
    type: 'image/jpeg',
    altText: 'BBD Software Development - Code is our Art',
  },
  self: {
    name: 'review-image-2024.jpg',
    type: 'image/jpeg',
    altText: 'BBD Software Development - Code is our Art',
  },
  peer: {
    name: 'review-image-2024.jpg',
    type: 'image/jpeg',
    altText: 'BBD Software Development - Code is our Art',
  },
};

/**
 * Check whether a user is in the *ATC team*
 *
 * @param {string} email the user to check
 * @returns {Promise<boolean>} true if the user is in the admin group ATC, otherwise false
 */
const userInATCTeam = async (email) =>
  (await userGroups(email)).map((group) => group.groupName).includes('ATC');
const userInTestingGroup = async (email) =>
  (await userGroups(email))
    .map((group) => group.groupName)
    .includes('The HIVE Review System Testing');

/**
 * Check whether sending an email to this address is allowed in the current
 * environment.
 *
 * Currently, for production, all emails are allowed and only ATC team members
 * are allowed to receive e-mail on non-production environments.
 *
 * @param {string} email the email address we will be sending to
 * @returns {Promise<boolean>} indicating whether an email to the address is allowed.
 */
const isEmailAllowed = async (email) => {
  if (isProduction()) {
    return true;
  } else {
    //only send to atc team (and specifically allowed e-mails)
    return (
      (await userInATCTeam(email)) ||
      (await userInTestingGroup(email)) ||
      allowedExternalEmails().includes(email.toLocaleLowerCase())
    );
  }
};

/**
 * Build the call-to-action 'button' for the email
 *
 * If the callToAction parameter is set, that will be used as the call to action
 *
 * If it is not set, we're building other options.
 *
 * This is to allow feature parity with the old email implementation.
 *
 * TODO: We should remove this 'optional' configuration and insist that users
 * of the email function send in their preferred call to action.
 *
 */
const buildCallToAction = (context, url, callToAction) => {
  if (callToAction) {
    return callToAction;
  } else {
    const urlCallToAction = url ? 'Reply' : 'Go to The Hive';
    return /^quest/i.test(context) ? 'Give feedback' : urlCallToAction;
  }
};

/**
 * Create the object for recipients as expected by the GraphAPI email
 * @param {string} email
 * @returns {GraphAPIEmailAddress} object in the correct format for the GraphAPI.
 */
const makeEmailAddress = (email) => ({
  emailAddress: {
    address: email,
  },
});

const readImageFromBlobStorage = async (imageData) => {
  return fetchBinaryBlobData(
    'static-content',
    `images/review/${imageData.name}`
  );
};

const readImageFromDisk = async (imageData) => {
  return readFile(`${__dirname}/email-template-images/${imageData.name}`);
};

const readImage = async (imageData) => {
  try {
    return await readImageFromDisk(imageData);
  } catch (error) {
    logger.error({message:"Image not found on disk", error, imageData})
    return readImageFromBlobStorage(imageData);
  }
};

/**
 * @typedef {Object} GraphAPIEmailAddress
 * @property {Object} emailAddress object containing the email address
 * @property {string} emailAddress.address the email address
 */

/**
 * @typedef {Object} EmailOptions
 * @property {string} [callToAction] the call to action text
 * @property {string} [image='hive'] the image to include, valid values are "bbd" and "hive", defaults to "hive"
 * @property {boolean} [includeATCTeam=false] whether to CC the ATCTeam email address, default is false
 * @property {string} [templateFile='general-email.html.hbs'] the template file to use for the email, defaults to "general-email.html.hbs"
 * @property {GraphAPIEmailAddress[]} [ccRecipients=[]] the email addresses to CC
 */

const LOG_EMAIL_REQUESTS = parseIfSetElseDefault("LOG_EMAIL_REQUESTS",false);

/**
 * Attempt to send an email
 *
 * @param {string} from the email address of the sender
 * @param {string} to the email address for the recipient
 * @param {string} subject the subject line for the email
 * @param {string} context the context of the message to send
 * @param {string} message the message to send
 * @param {string} url the URL link for the call to action text
 * @param {EmailOptions} [options={}] the URL link for the call to action text
 * @returns {Promise<boolean>} true if the email was sent successfully, false if
 * there are invalid parameters sent to the function
 * @throws when something goes wrong during sending of the email
 */
const send = async (from, to, subject, context, message, url, options = {}) => {
  if(LOG_EMAIL_REQUESTS){
    logger.info(`Email request was '${JSON.stringify({requestObject:{from, to, subject, context, message, url, options }})}'`);
  } else {
    // logging is disabled, let's not spam the void
  }

  let font = DEFAULT_FONT;
  const {
    callToAction,
    image = 'hive',
    includeATCTeam = false,
    templateFile = 'general-email.html.hbs',
    showCallToAction = true,
    clientEmail,
    bulkNudgeCC = false,
    ccRecipients = [],
  } = options;
  if (!to.length) {
    logger.warn('No valid recipient to send the email to.');
    return false;
  }

  if (!(await isEmailAllowed(to))) {
    logger.warn(
      `Not allowed to send to '${to}' in environment '${process.env.NODE_ENV}'`
    );
    return false;
  }

  let selectedImageData = imageData[image];
  if (!selectedImageData) {
    selectedImageData = imageData['hive'];
  }

  const imageBuffer = await readImage(selectedImageData);
  const imageBytes = imageBuffer.toString('base64');
  const imageAttachment = {
    '@odata.type': '#microsoft.graph.fileAttachment',
    contentType: selectedImageData.type,
    name: selectedImageData.name,
    contentId: selectedImageData.name,
    contentBytes: imageBytes,
  };

  if (
    ['feedback-email.html.hbs', 'overdue-feedback-email.html.hbs'].includes(
      templateFile
    )
  ) {
    font = FEEDBACK_FONT;
  }

  const messageFromMarkdown = MarkdownConverter.makeHtml(message);
  const callToActionHtml = showCallToAction
    ? buildCallToAction(context, url, callToAction)
    : '';

  const emailData = buildEmailData(
    context,
    messageFromMarkdown,
    url,
    callToActionHtml,
    font,
    selectedImageData
  );
  const htmlTemplate = HTMLEngine.prepareTemplateFromFile(
    'email-templates',
    templateFile
  );
  const html = htmlTemplate(emailData);

  const fromEmail = makeEmailAddress('the-hive@bbd.co.za');
  fromEmail.emailAddress.name = `The Hive (on behalf of ${from})`;
  const toRecipients = [makeEmailAddress(to)];

  if (clientEmail) {
    toRecipients.push(makeEmailAddress(clientEmail));
  }

  if (includeATCTeam) {
    ccRecipients.push(makeEmailAddress('atcteam@bbd.co.za'));
  }

  if (bulkNudgeCC && isProduction()) {
    ccRecipients.push(makeEmailAddress('gus@bbd.co.za'));
  } else {
    // Don't CC Gus Pringle
  }

  try {
    const body = {
      message: {
        from: fromEmail,
        subject: prependEnvironment(subject),
        toRecipients,
        ccRecipients,
        body: {
          content: html,
          contentType: 'html',
        },
        attachments: [imageAttachment],
      },
    };

    if(LOG_EMAIL_REQUESTS){
      logger.info(`Sending email: '${JSON.stringify(body)}'`);
    } else {
      logger.info('Sending email.');
    }

    await postEmail('the-hive@bbd.co.za', body);

    logger.info(`Email successfully sent.`);
    return true;
  } catch (error) {
    logger.error('Something went wrong sending the mail.');
    logger.error(error);

    throw error;
  }
};

/**
 * @typedef EmailHandlebarsData
 * @type {object}
 * @property {string} subject the subject of the message
 * @property {string} context the context of the message
 * @property {string} message the message text itself
 * @property {string} url the URL to include in the message
 * @property {string} callToAction the call-to-action text for the message
 */

/**
 * Build an object from individual fields that is of the correct structure to
 * send to a Handlebars template for rendering.
 * @param {string} context the context of the message
 * @param {string} message the message text itself
 * @param {string} url the URL to include in the message
 * @param {string} callToAction the call-to-action text for the message
 * @param {string} fontStyle the font-style for the message
 * @param {Object} image the image to use for the message
 * @param {string} image.url the URL to use for the image source
 * @param {string} image.altText the alternative text to use for the image
 * @returns {EmailHandlebarsData} an object containing email related data for use as context object in
 * Handlebars template application
 */
const buildEmailData = (
  context,
  message,
  url,
  callToAction,
  fontStyle,
  image
) => ({ context, message, url, callToAction, font: fontStyle, image });

module.exports = {
  send,
  makeEmailAddress,
  isEmailAllowed,
  buildEmailData,
  readImage,
};
