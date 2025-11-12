const router = require('express').Router();

const { handle_errors } = require('@the-hive/lib-core');
const { logger } = require('@the-hive/lib-core');
const email = require('../shared/email');
const { user_quest } = require('../queries/quest.queries');
const { getEnvironmentName } = require('@the-hive/lib-core');
const { buildRelativeURL } = require('../shared/url');

module.exports = router.post(
  '/sendNotification',
  handle_errors(async (req, res) => {
    const message = req.body;

    logger.info(`Sending notification for message: ${message.messageId}.`);

    // Send the message to the hero. This could either be the guide or the hero.
    let to = message.heroUserPrincipleName;
    const from = message.createdByUserPrincipleName;

    if (from === to) {
      // Send the message to the guide (if there is a guide).

      const quest = await user_quest(message.heroUserPrincipleName);
      if (quest.guideUserPrincipleName) to = quest.guideUserPrincipleName;
    }

    let path = `log/${Buffer.from(message.heroUserPrincipleName).toString(
      'base64'
    )}`;

    if (/^quest/i.test(message.context)) {
      path = `guide-feedback/${message.questId}`;
    }

    const url = buildRelativeURL('hive', path);

    const sent = await email.send(from, to, message.context, message.text, url);

    if (sent) {
      logger.info('Message sending complete');
      res.status(202).json({ sent });
    } else {
      res
        .status(202)
        .json({
          sent,
          reason: `Not sending email from '${getEnvironmentName(true)}'`,
        });
    }
  })
);
