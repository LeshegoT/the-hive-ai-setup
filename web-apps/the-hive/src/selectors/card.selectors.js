import { createSelector } from 'reselect';

import { selectUpcomingLevelUps } from './level-up.selectors';
import { selectUpcomingLevelUpActivities } from './level-up-activity.selectors';
import { selectActiveSideQuests } from './side-quests.selectors';
import { selectActivePrescribedCourses } from './course.selectors';
import { selectStock } from './store.selectors';

const COMPULSORY_TRAINING_PRIORITY = 0;
const LEVEL_UP_PRIORITY = 1;
const SIDE_QUEST_PRIORITY = 1;
const POINTS_PRIORITY = Number.MAX_SAFE_INTEGER;

const COMPULSORY_TRAINING = {
  typeCode: 'compulsoryTraining',
  typeName: 'Assigned Training'
};
const LEVEL_UP = {
  typeCode: 'levelUp',
  typeName: 'Level Up'
};
const POINTS = {
  typeCode: 'pointsSummary',
  typeName: 'Points Summary'
};
const SIDE_QUEST = {
  typeCode: 'sideQuest',
  typeName: 'Side Quest'
};
const STOCK = {
  typeCode: 'stock',
  typeName: 'Store Stock'
};

export const selectLevelUpCards = createSelector(
  selectUpcomingLevelUps,
  selectUpcomingLevelUpActivities,
  (levelUps, activities) => {
    return activities.map((activity) => {
      let levelUp = levelUps.find((l) => l.levelUpId === activity.levelUpId);

      if (levelUp) {
        const priority = LEVEL_UP_PRIORITY;
        const type = LEVEL_UP;
        const title = levelUp.name;
        const subtitle = activity.levelUpActivityType
          ? activity.levelUpActivityType.name
          : '';
        const date = activity.activityDate;
        const icon = levelUp.icon;
        const link = `/level-up/${activity.levelUpId}`;
        const label = levelUp.registered ? 'Registered' : '';
        const actionName = 'Register';

        return {
          levelUp,
          priority,
          type,
          title,
          subtitle,
          date,
          icon,
          link,
          label,
          actionName
        };
      }
    });
  }
);

export const selectSideQuestCards = createSelector(
  selectActiveSideQuests,
  (sideQuests) => {
    if (!sideQuests) return;
    return sideQuests.map((sideQuest) => {
      const priority = SIDE_QUEST_PRIORITY;
      const type = SIDE_QUEST;
      const title = sideQuest.name;
      const date = sideQuest.startDate;
      const icon = sideQuest.icon;
      const link = `/side-quest/${sideQuest.id}`;
      const sideQuestId = sideQuest.id;

      return {
        priority,
        type,
        title,
        date,
        icon,
        link,
        sideQuestId
      };
    });
  }
);

export const selectPrescribedCoursesCards = createSelector(
  selectActivePrescribedCourses,
  (prescribedCourses) => {
    let res = prescribedCourses.reduce((acc, course) => {
      if (course && course.progress < 100) {
        const priority = COMPULSORY_TRAINING_PRIORITY;
        const type = COMPULSORY_TRAINING;
        const title = course.name;
        const subtitle = ``;
        const date = `Progress: ${course.progress}%`;
        const icon = course.icon;
        const link = `/course/${course.code}`;
        const actionName = 'Continue';

        let newCourse = {
          course,
          priority,
          type,
          title,
          subtitle,
          date,
          icon,
          link
        };

        if (course.progress > 0 && course.progress < 100) {
          newCourse.actionName = actionName;
        }

        acc.push(newCourse);
      }

      return acc;
    }, []);

    return res;
  }
);

export const selectLastMonthPointsCard = createSelector(
  (state) => state.leaderboard.lastMonthPoints,
  (points) => {
    if (points <= 0 || points == undefined) return null;

    const priority = POINTS_PRIORITY;
    const type = POINTS;
    const title = points + ' Points';
    const subtitle = 'Scored during the last month.';
    const icon = 'images/logos/podium.svg';
    const link = `/leaderboard`;

    return {
      priority,
      type,
      title,
      subtitle,
      icon,
      link
    };
  }
);

export const selectCards = createSelector(
  selectLevelUpCards,
  selectSideQuestCards,
  selectLastMonthPointsCard,
  selectPrescribedCoursesCards,
  (levelUps, sideQuests, lastMonthPoints, prescribedCourses) => {
    if (!sideQuests) return;
    let sliceFrom =
      prescribedCourses && prescribedCourses.length > 0
        ? prescribedCourses.length - 1
        : 0;
    let sliceTo = lastMonthPoints ? 8 : 9;

    let cards = [...levelUps, ...sideQuests, ...prescribedCourses];
    if (lastMonthPoints) cards.push(lastMonthPoints);

    cards = cards.sort((a, b) => {
      if (a.priority < b.priority) return -1;

      if (a.priority > b.priority) return 1;

      return new Date(a.date) - new Date(b.date);
    });

    let normalCards = cards.length <= sliceTo ? cards : cards.slice(sliceFrom, sliceTo);
    return lastMonthPoints ? [...normalCards, lastMonthPoints] : normalCards;
  }
);
