const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  course_mission_needing_award,
  course_mission_awarded,
} = require('../queries/mission.queries');
const { award_part, save_mission_claim } = require('../queries/part.queries');

module.exports = router.post(
  '/award-course-missions-part',
  handle_errors(async (req, res) => {
    while (true) {
      const missionAward = await course_mission_needing_award();

      if (!missionAward) break;

      const awarded = await course_mission_awarded(
        missionAward.heroUserPrincipleName,
        missionAward.courseId
      );

      if (awarded) {
        await save_mission_claim(awarded.claimPartId, missionAward.missionId);
        continue;
      }

      const reason = `Completed the ${missionAward.name} level up`;
      const claimPartId = await award_part(
        missionAward.heroUserPrincipleName,
        null,
        'right',
        reason
      );

      await save_mission_claim(claimPartId, missionAward.missionId);
    }

    res.send('Successful');
  })
);
