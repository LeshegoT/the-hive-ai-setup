import { createSelector } from 'reselect';
import { selectLevelUpActivityTypes } from './reference-data.selectors';
import { selectLevelUpActivityId } from './route-data.selectors';

export const selectAllLevelUpActivities = (state) => state.levelUpActivities.all;
export const selectUserLevelUpActivities = (state) => state.levelUpActivities.user;

export const selectLevelUpActivities = createSelector(
  selectAllLevelUpActivities,
  selectLevelUpActivityTypes,
  selectUserLevelUpActivities,
  (activities, activityTypes, user) =>
    activities.map((activity) => {
      let levelUpActivityType = activityTypes.find(
        (t) => t.levelUpActivityTypeId === activity.levelUpActivityTypeId
      );
      let activityDate = new Date(activity.activityDate);
      let userLevelUpActivity = user.find(
        (l) => l.levelUpActivityId === activity.levelUpActivityId
      );
      let attended = !!userLevelUpActivity;

      return {
        ...activity,
        activityDate,
        levelUpActivityType,
        attended
      };
    })
);

export const selectLevelUpActivity = createSelector(
  selectLevelUpActivities,
  selectLevelUpActivityId,
  (activities, activityId) => activities.find((a) => a.levelUpActivityId == activityId)
);

export const selectUpcomingLevelUpActivities = createSelector(
  selectLevelUpActivities,
  (activities) =>
    activities.filter((activity) => {
      return activity.activityDate >= new Date();
    })
);
