import { createSelector } from 'reselect';
import auth_service from '../services/auth.service';
import { selectHeroUserPrincipleName, selectQuestId } from './route-data.selectors';
import { selectSpecialisations, selectQuestTypes } from './reference-data.selectors';
import { selectAllNotifications } from './notifications.selectors';

export const selectHero = createSelector(
  selectHeroUserPrincipleName,
  (heroUserPrincipleName) => heroUserPrincipleName || auth_service.getUserPrincipleName()
);

export const selectAllHeroQuests = (state) => state.heroes.all;

export const selectHeroQuests = createSelector(
  selectAllHeroQuests,
  selectSpecialisations,
  selectQuestTypes,
  selectAllNotifications,
  (heroQuests, specialisations, questTypes, notifications) => {
    heroQuests = heroQuests.filter((quest) => quest.status == 'in-progress' || notifications.find((note) => note.questId == quest.questId && !note.resolved));

    return heroQuests.map((quest) => {
      const questType = questTypes.find((q) => q.questTypeId === quest.questTypeId);
      const specialisation = specialisations.find(
        (s) => s.specialisationId === quest.specialisationId
      );

      return {
        ...quest,
        questType,
        specialisation,
        startDate: quest.startDate,
        endDate: quest.endDate,
        lastActive: quest.lastActive
      };
    });
  }
);

export const selectIsGuide = (state) => state.heroes.isGuide;

export const selectHeroQuest = createSelector(
  selectHeroQuests,
  selectHero,
  (quests, hero) => quests.find((q) => q.heroUserPrincipleName === hero)
);

export const selectExistingQuest = (state) => state.heroes.existingQuest;

export const selectHeroQuestForFeedback = createSelector(
  selectHeroQuests,
  selectQuestId,
  (allQuests, questId) => allQuests.find((quest) => quest.questId == questId)
);

export const selectGuideRequests = (state) => state.heroes.guideRequests;