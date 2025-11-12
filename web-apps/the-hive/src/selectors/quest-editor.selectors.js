import { createSelector } from 'reselect';
import { selectQuestTypes, selectSpecialisations, selectMissionTypes } from './reference-data.selectors';
import { getQuestInformation, getMissionInformation } from './quest.selectors';
import { selectCourseProgress } from './course.selectors';

const selectQuest = (state) => state.questEditor.quest; 

export const selectEditingQuest = createSelector(
  selectQuest,
  selectQuestTypes,
  selectSpecialisations,
  (quest, questTypes, specialisations) => getQuestInformation(quest, questTypes, specialisations)
);

export const selectQuestMissions = (state) => state.questEditor.missions;

export const selectEditingQuestMissions = createSelector(
  selectQuestMissions,
  selectCourseProgress,
  selectMissionTypes,
  (missions, courses, missionTypes) => getMissionInformation(missions, courses, missionTypes)
);

export const selectQuestEditorErrors = (state) => state.questEditor.errors;

export const selectMissionToUpdate = (state) => state.questEditor.missionToUpdate;