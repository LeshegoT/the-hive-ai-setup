const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  user_messages,
  all_messages_during_quest,
} = require('../queries/message.queries');

router.get(
  '/messages',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;

    const { hero, offset, questId, missionId, courseId, sideQuestId } = req.query;

    if (hero !== upn) {
      // TODO: Validate that the user is allowed to see this information,
      // they need to be a quest guide.
    }

    const messages = await user_messages(
      hero,
      offset,
      questId,
      missionId,
      courseId,
      sideQuestId
    );

    res.json(messages);
  })
);

router.get(
  '/allMessagesDuringQuest',
  handle_errors(async (req, res) => {
    const { hero, questId } = req.query;
    const messages = await all_messages_during_quest(hero, questId);
    res.json(messages);
  })
);

module.exports = router;
