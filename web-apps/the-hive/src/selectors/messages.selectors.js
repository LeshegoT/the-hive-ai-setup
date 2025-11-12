import { createSelector } from 'reselect';
import {
  selectMission,
  selectMissions,
  selectMissionsIncludeDeleted
} from './quest.selectors';
import { selectCourse, selectCourses } from './course.selectors';
import { selectHero } from './hero.selectors';
import { selectMessageTypes } from './reference-data.selectors';
import { selectAllLearningTasks } from './learning-tasks.selectors';
import { selectSideQuest, selectSideQuests } from './side-quests.selectors';
import { selectMapMission } from './map.selectors';
import { selectMapMissionLevelUpCourses } from './level-up.selectors';

export const selectAllMessages = (state) =>
  state.messages.all
    .map((m) => ({ ...m, creationDate: new Date(m.creationDate) }))
    .sort((a, b) => b.creationDate - a.creationDate);
    
export const selectHeroMessages = createSelector(
  selectHero,
  selectAllMessages,
  (hero, allMessages) => allMessages.filter(message => message.createdByUserPrincipleName === hero || message.heroUserPrincipleName === hero)
  )

const selectQuestLogInternal = (allMessages = [], allMissions = [], allCourses = [], allMessageTypes = [], allLearningTasks = [], allSideQuests = []) =>
  allMessages.map((message) => {
    let mission = allMissions.find((mission) => mission.missionId === message.missionId);
    let course = allCourses.find((course) => course.courseId == message.courseId);
    let sideQuest = allSideQuests.find((sideQuest) => sideQuest.id == message.sideQuestId);
    let messageType = allMessageTypes.find(
      (t) => t.messageTypeId == message.messageTypeId
    );
    let learningTask = allLearningTasks.find((t) => t.messageId === message.messageId);

    return {
      ...message,
      mission,
      course,
      messageType,
      learningTask,
      sideQuest
    };
  });

export const selectMyMessages = createSelector(
  selectAllMessages,
  selectMissions,
  selectCourses,
  selectMessageTypes,
  selectAllLearningTasks,
  selectSideQuests,
  (allMessages, allMissions, allCourses, allMessageTypes, allLearningTasks, allSideQuests) =>
    selectQuestLogInternal(allMessages, allMissions, allCourses, allMessageTypes, allLearningTasks, allSideQuests)
);

let mapMessagesForMission = (mission, messages) =>
  mission && messages.filter((m) => m.missionId == mission.missionId);

export const selectMessagesForMission = createSelector(
  selectMission,
  selectMyMessages,
  (mission, messages) => mapMessagesForMission(mission, messages)
);

export const selectMessagesForCourse = createSelector(
  selectCourse,
  selectMyMessages,
  (course, messages) => course && messages.filter((m) => m.courseId == course.courseId)
);
export const selectMessagesForSideQuest = createSelector(
  selectSideQuest,
  selectMyMessages,
  (sideQuest, messages) => sideQuest && messages.filter((m) => m.sideQuestId == sideQuest.id)
);

export const selectMapMessagesForMission = createSelector(
  selectMapMission,
  selectMyMessages,
  (mission, messages) => mapMessagesForMission(mission, messages)
);

export const selectMapMessagesForCourse = createSelector(
  selectMapMission,
  selectAllMessages,
  (mission, messages) => messages.filter((message) => mission.courseId === message.courseId)
);

export const selectMapMessagesForSideQuest = createSelector(
  selectMapMission,
  selectAllMessages,
  (mission, messages) => messages.filter((message) => mission.sideQuestId === message.sideQuestId)
);

export const selectMapMessagesForLevelUp = createSelector(
  selectMapMissionLevelUpCourses,
  selectAllMessages,
  (courses, messages) => messages.filter((message) => courses.find((course) => course.courseId === message.courseId))
);

export const selectMapMessagesForConversation = createSelector(
  selectMessageTypes,
  selectAllMessages,
  selectHero,
  (types, messages, hero) => messages.filter((message) => 
    message.messageTypeId === types.find((type) => type.code === 'conversation').messageTypeId && message.heroUserPrincipleName.toLowerCase() === hero.toLowerCase())
);

export const selectMapMessagesForSelfDirected = createSelector(
  selectAllMessages,
  (messages) => messages.filter((message) => message.selfDirected)
);

export const selectFeedbackMessages = (state) => state.messages.feedback; 
