const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../shared/db');
const {
  user_level_up_activities,
  get_activity,
  get_activity_attendee,
  insert_activity_attendee,
  is_now,
} = require('../queries/level-up.queries');

module.exports = router.post(
  '/levelUpActivityAttend/:levelUpActivityId',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const { levelUpActivityId } = req.params;

    const userMarkedAsAttended = await withTransaction((tx) =>
      attendLevelUpActivity(tx, upn, levelUpActivityId)
    );

    let userLevelUpActivities = [];

    if (userMarkedAsAttended) {
      userLevelUpActivities = await user_level_up_activities(upn);
    }

    res.json(userLevelUpActivities);
  })
);

const attendLevelUpActivity = async (tx, upn, levelUpActivityId) => {
  const activity = await get_activity(tx, levelUpActivityId);
  if (!activity || !is_now(activity.activityDate, activity.durationInMinutes)) {
    return false;
  }

  const attendee = await get_activity_attendee(tx, upn, levelUpActivityId);
  if (attendee.length) {
    return false;
  }

  await insert_activity_attendee(tx, upn, levelUpActivityId);
  return true;
};
