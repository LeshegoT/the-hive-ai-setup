const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  insert_peer_feedback_reply,
  update_peer_feedback_publish,
  isUsersMessage,
} = require('../queries/message.queries');

module.exports = router.post(
  '/addPeerFeedbackReply',
  handle_errors(async (req, res) => {
    const message = await insert_peer_feedback_reply(
      req.body.reply,
      req.body.messageId
    );

    res.json(message);
  })
);

module.exports = router.post(
  '/feedback-publish',
  handle_errors(async (req, res) => {
    const { messageId } = req.body;
    const canChangePublishState = await isUsersMessage(messageId, res.locals.upn);

    if (canChangePublishState) {
      const result = await update_peer_feedback_publish(messageId);
      res.json(result);
    } else {
      res.status(403).json({
        message:
          'Request denied because user is not permitted to change privacy of this message',
      });
    }
  })
);

module.exports = router;
