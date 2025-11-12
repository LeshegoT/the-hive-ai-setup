const {
  score_points,
  update_profile_for_user,
} = require('../queries/point.queries');
const { calculateMultiplier } = require('../shared/calculate-multiplier');

const scorePoints = async (tx, upn, pointType, interactionID) => {
  const multiplier = (await calculateMultiplier(upn)).value;

  await score_points(tx, upn, pointType, multiplier, interactionID);
  await update_profile_for_user(tx, upn);
};

module.exports = {
  scorePoints,
};
