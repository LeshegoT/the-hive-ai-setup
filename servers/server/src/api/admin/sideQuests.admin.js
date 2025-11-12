const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  create_side_quest,
  update_side_quest,
  delete_side_quest,
  create_side_quest_type,
  update_side_quest_type,
  delete_side_quest_type,
  count_sidequest_mission,
  all_side_quests,
  getSideQuestUsers,
} = require('../../queries/side-quests.queries');

router.delete(
  '/deleteSideQuestType/:id',
  handle_errors(async (req, res) => {
    const id = parseInt(req.params.id);
    await delete_side_quest_type(id);
    res.status(201).send();
  })
);
router.get(
  '/sidequest/:id/mission/count',
  handle_errors(async (req, res) => {
    const sideQuestId = req.params.id;
    countSideQuestMission = await count_sidequest_mission(sideQuestId);
    res.json(countSideQuestMission);
  })
);
router.post(
  '/createSideQuest',
  handle_errors(async (req, res) => {
    const sideQuest = req.body;
    sideQuest.startDate = new Date(sideQuest.startDate);
    await create_side_quest(sideQuest);
    res.status(204).send();
  })
);

router.post(
  '/updateSideQuest',
  handle_errors(async (req, res) => {
    const sideQuest = req.body.sideQuest;
    sideQuest.startDate = new Date(sideQuest.startDate);
    await update_side_quest(sideQuest);
    res.status(201).send();
  })
);

router.delete(
  '/deleteSideQuest/:id',
  handle_errors(async (req, res) => {
    const id = parseInt(req.params.id);

    await delete_side_quest(id);
    res.status(201).send();
  })
);

router.post(
  '/createSideQuestType',
  handle_errors(async (req, res) => {
    await create_side_quest_type(req.body);
    res.status(204).send();
  })
);

router.post(
  '/updateSideQuestType',
  handle_errors(async (req, res) => {
    const updated_type = req.body.sideQuestType;
    await update_side_quest_type(updated_type);
    res.status(201).send();
  })
);

router.get(
  '/unfilteredSideQuests',
  handle_errors(async (req, res) => {
    const filtered = false;
    res.json(await all_side_quests(filtered));
  })
);

router.get(
  '/side-quest-users/:id',
  handle_errors(async (req, res) => {
    const { id } = req.params;
    res.json(await getSideQuestUsers(id));
  })
);

module.exports = router;
