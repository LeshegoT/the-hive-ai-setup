const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  all_mission_types,
  all_quest_types,
  all_specialisations,
  all_levels,
  all_message_types,
  all_side_quest_types,
  all_level_up_activity_types,
  all_guide_details,
} = require('../queries/reference-data.queries');

module.exports = router.get(
  '/referenceData',
  handle_errors(async (req, res) => {
    const missionTypes = await all_mission_types();
    const questTypes = await all_quest_types();
    const specialisations = await all_specialisations();
    const levels = await all_levels();
    const messageTypes = await all_message_types();
    const sideQuestTypes = await all_side_quest_types();
    const levelUpActivityTypes = await all_level_up_activity_types();
    const guideDetails = await all_guide_details('active');

    res.json({
      missionTypes,
      questTypes,
      specialisations,
      levels,
      messageTypes,
      sideQuestTypes,
      levelUpActivityTypes,
      guideDetails,
    });
  })
);
