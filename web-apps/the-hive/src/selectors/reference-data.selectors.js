import { createSelector } from 'reselect';
import { selectLevelUpActivityTypeCode } from './route-data.selectors';

export const selectMissionTypes = (state) => state.referenceData.missionTypes;

export const selectQuestTypes = (state) => state.referenceData.questTypes;

export const selectSpecialisations = (state) => state.referenceData.specialisations;

export const selectLevels = (state) => state.referenceData.levels;

export const selectMessageTypes = (state) => state.referenceData.messageTypes;

export const selectSideQuestTypes = (state) => state.referenceData.sideQuestTypes;

export const selectLevelUpActivityTypes = (state) =>
  state.referenceData.levelUpActivityTypes;

export const selectLevelUpActivityType = createSelector(
  selectLevelUpActivityTypes,
  selectLevelUpActivityTypeCode,
  (activityTypes, activityTypeCode) =>
    activityTypes.find((t) => t.code === activityTypeCode)
);

export const selectGuideDetails = (state) => state.referenceData.guideDetails;
