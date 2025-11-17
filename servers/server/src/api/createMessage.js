const router = require('express').Router();
const { handle_errors, logger } = require('@the-hive/lib-core');
const queue = require('../shared/queue');
const { create_message } = require('../queries/message.queries');
const { update_last_guide_activity } = require('../queries/hero.queries');
const { shouldAIRespond, createAIReply } = require('../shared/ai-guide');

module.exports = router.post(
  '/createMessage',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;

    const {
      questId,
      missionId,
      sideQuestId,
      courseId,
      messageTypeId,
      heroUpn,
      text,
      dateCompleted,
      title,
      link,
      timeSpent,
      content,
    } = req.body;
    const createdByUpn = upn;

    // Create the user's message
    const message = await create_message(
      messageTypeId,
      heroUpn,
      createdByUpn,
      text,
      questId,
      missionId,
      sideQuestId,
      courseId,
      dateCompleted,
      link,
      timeSpent,
      title,
      content
    );

    const newMessage = { ...message, questId, missionId, courseId, sideQuestId };

    queue.enqueue('notifications', newMessage);

    res.json(newMessage);

    if (createdByUpn != heroUpn) {
      await update_last_guide_activity(createdByUpn);
    } else {
      // createdByUpn equals heroUpn, no guide activity update needed
    }

    if (shouldAIRespond(text, messageTypeId, createdByUpn, heroUpn)) {
      logger.info('AI mention detected, triggering AI response', {
        heroUpn: createdByUpn,
        messageTypeId: messageTypeId,
        textPreview: text.substring(0, 50) + '...'
      });

      createAIReply(
        {
          messageTypeId,
          createdByUpn,
          questId,
          missionId,
          sideQuestId,
          courseId,
        },
        text
      ).catch(error => {
      res.status(500).send({ message: 'Background AI reply failed:', error });
      });
    } else {
      // AI response conditions not met, no action needed
    }
  })
);
 