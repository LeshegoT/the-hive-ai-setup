const {
  levelUpFacilitators,
} = require('../queries/level-up-facilitator.queries');
const { level_up_activity_attendance } = require('../queries/level-up.queries');
const { getUserDetails } = require('../shared/user-details');

const getFacilitatorDetails = async (levelUpId) => {
  const facilitators = await levelUpFacilitators(levelUpId);
  return await getUserDetails(facilitators);
};

const getAttendeeDetails = async (activityId) => {
  const levelUpAttendees = await level_up_activity_attendance(activityId);
  return await getUserDetails(levelUpAttendees);
};

module.exports = {
  getFacilitatorDetails,
  getAttendeeDetails,
};
