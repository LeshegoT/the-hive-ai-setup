const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { complete_mission } = require('../queries/mission.queries');
const { quest_missions } = require('../queries/mission.queries');
const { withTransaction } = require('../shared/db');
const {
  get_interaction_type,
  insert_user_interaction,
} = require('../queries/user-interactions.queries');
const {
  get_mission_type,
  insert_self_directed_mission,
  get_mission_code,
} = require('../queries/self-directed.queries');
const { scorePoints } = require('../shared/scorePoints');

router.post(
  '/completeMission',
  handle_errors(async (req, res) => {
    const { upn, missionTypeId, missionId } = req.body;
    const updatedMission = await complete_mission(missionId);
    const missions = await quest_missions(updatedMission.questId);
    withTransaction((tx) => missionInteraction(tx, upn, missionTypeId));
    res.json(missions);
  })
);

router.post(
  '/selfDirectedMissionInteraction',
  handle_errors(async (req, res) => {
    const { upn, messageTypeId } = req.body;
    await withTransaction(async (tx) => await selfDirectedInteraction(tx, upn, messageTypeId));
    res.status(201).send();
  })
);

const selfDirectedInteraction = async (tx, upn, messageTypeId) => {
  const type = await get_mission_type(tx, messageTypeId);

  const typeID = await get_interaction_type(tx, type);

  const userInteractionID = await insert_user_interaction(tx, upn, typeID);

  await insert_self_directed_mission(tx, typeID, userInteractionID);

  await scorePoints(tx, upn, type, userInteractionID);
};

const missionInteraction = async (tx, upn, missionTypeId) => {
  const type = await get_mission_code(tx, missionTypeId);

  const typeID = await get_interaction_type(tx, type);

  const userInteractionID = await insert_user_interaction(tx, upn, typeID);

  await insert_self_directed_mission(tx, typeID, userInteractionID);

  await scorePoints(tx, upn, type, userInteractionID);
};

module.exports = router;
