const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  set_quest_status,
  single_quest,
  user_quest,
} = require('../queries/quest.queries');
const {
  insert_part,
  remove_part,
  link_part_to_quest,
} = require('../queries/part.queries');
const { insertGuideNotification } = require('../queries/notification.queries');
const { transaction } = require('../shared/db');

router.post(
  '/markQuestComplete',
  handle_errors(async (req, res) => {
    let quest = await single_quest(req.body.questId, req.body.upn);

    //technically this should not happen, unless the hero tries to get around the frontend validation
    //Gery, 2019/12/11
    if (quest.guideUserPrincipleName) {
      const tx = await transaction();

      try {
        await tx.begin();
        quest = await set_quest_status(tx, req.body.questId, 'completed');
        await insertGuideNotification(tx, req.body.questId, 'quest');

        const request = await tx.timed_request();
        const reason = `Completed your quest`;
        const insertedId = await insert_part(
          request,
          req.body.upn,
          null,
          'accessory',
          reason
        );
        await link_part_to_quest(tx, insertedId, req.body.questId);

        await tx.commit();
      } catch (error) {
        console.error(error);
        await tx.rollback();
      }
    }

    res.json(quest);
  })
);

router.post(
  '/markQuestPaused',
  handle_errors(async (req, res) => {
    let quest = null;
    const tx = await transaction();

    try {
      await tx.begin();

      quest = await set_quest_status(tx, req.body.questId, 'paused');

      await insertGuideNotification(tx, req.body.questId, 'quest');

      await tx.commit();
    } catch (error) {
      console.error(error);
      await tx.rollback();
    }

    res.json(quest);
  })
);

router.post(
  '/markQuestAbandoned',
  handle_errors(async (req, res) => {
    let quest = null;
    const tx = await transaction();

    try {
      await tx.begin();

      quest = await set_quest_status(tx, req.body.questId, 'abandoned');

      await insertGuideNotification(tx, req.body.questId, 'quest');

      await tx.commit();
    } catch (error) {
      console.error(error);
      await tx.rollback();
    }

    res.json(quest);
  })
);

router.post(
  '/retractQuestCompletion',
  handle_errors(async (req, res) => {
    let quest = null;
    const tx = await transaction();

    try {
      await tx.begin();

      let activeQuest = await user_quest(req.body.upn);
      if (activeQuest) {
        activeQuest = await set_quest_status(tx, activeQuest.questId, 'paused');
      }

      quest = await set_quest_status(tx, req.body.questId, 'in-progress');

      await remove_part(tx, req.body.upn, 'accessory', req.body.questId);

      await tx.commit();
    } catch (error) {
      console.error(error);
      await tx.rollback();
    }

    res.json(quest);
  })
);

module.exports = router;
