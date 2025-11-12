const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  incomplete_course_missions,
  complete_mission,
} = require('../queries/mission.queries');
const {
  find_system_message,
  insert_mission_message_no_tx,
} = require('../queries/message.queries');

module.exports = router.post(
  '/complete-course-mission',
  handle_errors(async (req, res) => {
    while (true) {
      const incompleteMission = await incomplete_course_missions();

      if (!incompleteMission) break;

      await complete_mission(incompleteMission.missionId);

      const message = await find_system_message(
        incompleteMission.heroUserPrincipleName,
        incompleteMission.courseId
      );
      if (message) {
        await insert_mission_message_no_tx(
          message.messageId,
          incompleteMission.missionId
        );
      }
    }

    res.send('Successful');
  })
);
