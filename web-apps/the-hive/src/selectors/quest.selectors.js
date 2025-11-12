import { createSelector } from 'reselect';
import {
  selectMissionTypes,
  selectQuestTypes,
  selectSpecialisations
} from './reference-data.selectors';
import { selectCourseProgress } from './course.selectors';
import { selectMissionId } from './route-data.selectors';
import { selectHero } from './hero.selectors';

export const selectCurrentQuest = (state) => state.quests.current;

export const getQuestInformation = (quest, questTypes, specialisations) => {
  if (!quest) return {};

  const questType = questTypes.find((q) => q.questTypeId === quest.questTypeId);
  const specialisation = specialisations.find(
    (s) => s.specialisationId === quest.specialisationId
  );

  let months = quest.months;
  if (!months) {
    const startDate = new Date(quest.startDate);
    const endDate = new Date(quest.endDate);
    months = endDate.getMonth() - startDate.getMonth();

    let years = endDate.getFullYear() - startDate.getFullYear();
    if (years > 0) {
      months = months + 12 * years;
    }
  }

  return {
    ...quest,
    months,
    questType,
    specialisation
  };
};

export const selectQuest = createSelector(
  selectCurrentQuest,
  selectQuestTypes,
  selectSpecialisations,
  (quest, questTypes, specialisations) =>
    getQuestInformation(quest, questTypes, specialisations)
);

export const selectHeroAllQuests = (state) => state.quests.all;

export const selectQuestDaysRemaining = createSelector(
  selectCurrentQuest,
  (quest) => {
    if (!quest || !quest.endDate) return 0;

    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    const questEndDate = new Date(quest.endDate);
    const daysRemaining = (
      (questEndDate.getTime() - today.getTime()) /
      oneDay
    ).toFixed(0);

    if (daysRemaining < 0) return 0;

    return daysRemaining;
  }
);

export const selectAllMissions = (state) => state.quests.missions;

export const selectHeroMissions = createSelector(
  selectAllMissions,
  selectHero,
  (missions, hero) => missions.filter((m) => m.heroUserPrincipleName === hero)
);

export const getMissionInformation = (missions, courses, missionTypes) => {
    if (!courses.length || !missionTypes.length) {
      return [];
    }

    return missions.map((m) => {
      const type = missionTypes.find((t) => t.missionTypeId === m.missionTypeId);
      const course = courses.find((c) => c.courseId === m.courseId);

      return {
        ...m,
        type,
        course
      };
    });
  }

export const selectMissions = createSelector(
  selectHeroMissions,
  selectCourseProgress,
  selectMissionTypes,
  (missions, courses, missionTypes) =>
    getMissionInformation(missions, courses, missionTypes).filter((m) => !m.deleted)
);

export const selectQuestMissions = createSelector(
  selectHeroMissions,
  selectCourseProgress,
  selectMissionTypes,
  selectQuest,
  (missions, courses, missionTypes, quest) => {
    let missionsInfo = getMissionInformation(missions, courses, missionTypes).filter(
      (m) => !m.deleted && m.questId === quest.questId
    );

    if (allMissionsDone(missionsInfo))
      missionsInfo.push({
        icon: 'images/logos/podium.svg',
        name: 'Complete Quest!',
        index: missionsInfo.length,
        type: 'completeQuest',
        missionId: '-1'
      });
    return missionsInfo;
  }
);

const allMissionsDone = (missions) => {
  return missions.length && !missions.find(m => !m.dateCompleted);
};

export const selectMissionsIncludeDeleted = createSelector(
  selectHeroMissions,
  selectCourseProgress,
  selectMissionTypes,
  (missions, courses, missionTypes) =>
    getMissionInformation(missions, courses, missionTypes)
);

export const selectMissionProgress = createSelector(
  selectMissions,
  (missions) => {
    const missionWorth = 100 / missions.length;
    const progress = missions
      .reduce((previousTotal, currentMission) => {
        let total = previousTotal;
        if (currentMission.course && currentMission.course.totalSections > 0) {
          const amountComplete =
            (currentMission.course.completedSections /
              currentMission.course.totalSections) *
            missionWorth;
          total += amountComplete;
        } else if (currentMission.dateCompleted) {
          total += missionWorth;
        }
        return total;
      }, 0)
      .toFixed(0);

    return progress;
  }
);

export const selectMission = createSelector(
  selectMissionId,
  selectMissions,
  (missionId, missions) => missions.find((m) => m.missionId == missionId)
);

export const selectCurrentMission = createSelector(
  selectQuestMissions,
  (missions) => {
    missions = missions.sort((a, b) => (a.sortOrder > b.sortOrder) ? 1 : ((b.sortOrder > a.sortOrder) ? -1 : 0));
    return missions.find((m) => !m.dateCompleted);
  }
)

export const selectQuestsWithMissions = createSelector(
  selectHeroAllQuests,
  selectCourseProgress,
  selectMissionTypes,
  (quests, courses, missionTypes) => quests.map(quest => {
    let missionsWithInfo = getMissionInformation(quest.missions, courses, missionTypes).filter((m) => !m.deleted)
    return { ...quest, missions: missionsWithInfo };
  }).sort((a, b) => {
    if (a.status == 'in-progress') return -1;
    return a.endDate > b.endDate;
  })
);

export const selectHasOldQuests = (state) => state.quests.oldQuests;

export const selectPausedQuests = (state) => state.quests.pausedQuests;