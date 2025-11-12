const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { transaction } = require('../shared/db');

const {
  insertGuideNotification,
  getGuideNotifications,
  resolveGuideNotification,
} = require('../queries/notification.queries');

router.get(
  '/getGuideNotifications',
  handle_errors(async (req, res) => {
    const notifications = await getGuideNotifications(req.query.upn);
    res.json(notifications);
  })
);

router.post(
  '/notifyGuideQuestStatusChange',
  handle_errors(async (req, res) => {
    const tx = await transaction();

    try {
      await tx.begin();

      quest = await set_quest_status(tx, req.body.questId, 'abandoned');

      await insertGuideNotification(tx, req.body.questId, req.body.type);

      await tx.commit();
    } catch (error) {
      console.error(error);
      await tx.rollback();
    }

    res.status(201).send();
  })
);

router.post(
  '/resolveQuestNotifications',
  handle_errors(async (req, res) => {
    await resolveGuideNotification(req.body.questId);

    res.status(201).send();
  })
);

module.exports = router;
