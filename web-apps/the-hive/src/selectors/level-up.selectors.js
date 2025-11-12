import { createSelector } from 'reselect';
import { selectCourses, selectAllCourses } from './course.selectors';
import { selectLevelUpActivities } from './level-up-activity.selectors';
import { selectLevelUpId } from './route-data.selectors';
import { selectMapMission } from './map.selectors';

export const selectAllLevelUps = (state) => state.levelUps.all;

export const selectUserLevelUps = (state) => state.levelUps.user;

export const selectLevelUpUsers = (state) => state.levelUpUsers.all;

const mapCourses = (levelUp, courses) => {
  if (!courses || !courses.length) return [];

  return levelUp.courseIds.map((id) => courses.find((course) => course.courseId === id));
};

const mapLevelUpActivities = (levelUp, activities) => {
  if (!activities || !activities.length) return [];

  return activities.filter((item) => item.levelUpId === levelUp.levelUpId).sort((a, b) => a.activityDate - b.activityDate);
};

export const selectLevelUps = createSelector(
  selectAllLevelUps,
  selectCourses,
  selectLevelUpActivities,
  selectUserLevelUps,
  (levelUps, allCourses, activities, user) =>
    levelUps.map((levelUp) => {
      let courses = mapCourses(levelUp, allCourses);
      let levelUpActivities = mapLevelUpActivities(levelUp, activities);
      let startDate = new Date(levelUp.startDate);
      let endDate = new Date(levelUp.endDate);

      let userLevelUp = user.find((l) => l.levelUpId === levelUp.levelUpId);
      let registered = !!userLevelUp;

      return {
        ...levelUp,
        courses,
        levelUpActivities,
        startDate,
        endDate,
        registered
      };
    })
);

export const selectUpcomingLevelUps = createSelector(
  selectLevelUps,
  (levelUps) => levelUps.filter((l) => l.endDate >= new Date())
);

export const selectPastLevelUps = createSelector(
  selectLevelUps,
  (levelUps) => levelUps.filter((l) => l.endDate < new Date()).sort((a, b) => b.endDate - a.endDate)
);

export const selectLevelUp = createSelector(
  selectLevelUps,
  selectLevelUpId,
  (levelUps, levelUpId) => levelUps.find((l) => l.levelUpId == levelUpId)
);

export const selectMapMissionLevelUp = createSelector(
  selectMapMission,
  selectAllLevelUps,
  (mission, levelUps) => levelUps.find((levelUp) => mission.levelUpId === levelUp.levelUpId)
);

export const selectMapMissionLevelUpCourses = createSelector(
  selectMapMission,
  selectAllLevelUps,
  selectAllCourses,
  (mission, levelUps, courses) => {
    const mapLevelUp = levelUps && levelUps.find((levelUp) => mission.levelUpId === levelUp.levelUpId);
    return mapCourses(mapLevelUp, courses);
  }
);
