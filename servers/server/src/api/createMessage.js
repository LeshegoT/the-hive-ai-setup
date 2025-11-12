const router = require('express').Router();

const { create_message } = require('../queries/message.queries');

const queue = require('../shared/queue');

const { handle_errors } = require('@the-hive/lib-core');
const { update_last_guide_activity } = require('../queries/hero.queries');

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
    }
  })
);
