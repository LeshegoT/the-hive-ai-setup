import { post, get } from './shared.js';
import { resetEditingQuest } from '../actions/reset-editing-quest.action.js';
import { navigateComponent } from '../actions/app.action.js';
import { questCreated } from '../actions/quest-created.action';
import { questUpdated } from '../actions/quest-updated.action.js';
import { heroMissionsReceived } from '../actions/hero-missions-received.action.js';
import { heroQuestReceived } from '../actions/hero-quest-received.action.js';
import { heroQuestsReceived } from '../actions/hero-quests-received.action.js';
import { questExistsErrorReceived } from '../actions/quest-exists-error-received.action.js';
import { userHasOldQuests } from '../actions/user-has-old-quests.action.js';
import auth_service from './auth.service.js';
import { BaseService } from './base.service.js';

export class QuestService extends BaseService{
  constructor() {
    super();
  }

  async getQuest(hero) {
    let upn = auth_service.getUserPrincipleName();

    //this check is here so that we don not get the data twice
    //if the user we are trying to get data for is the logged in user, then user-data would have already made this call
    //Gery, 2019-09-11
    if (hero === upn) return;

    let response = await get(this.buildApiUrl(`heroQuest/${hero}`));
    let data = await response.json();
    let { quest, missions } = data;

    if (quest) {
      
      quest.startDate = new Date(quest.startDate);
      quest.endDate = new Date(quest.endDate);
      missions = missions.map(mission => {
        let dateCompleted = mission.dateCompleted ? new Date(mission.dateCompleted) : mission.dateCompleted;
        return {
          ...mission,
          dateCompleted
        };
      });

      this.store.dispatch(heroQuestReceived(quest));
      this.store.dispatch(heroMissionsReceived(missions));
    } else {
      this.store.dispatch(navigateComponent('/permission'));
    }
  }

  async getHeroQuests(upn) {
    if (!upn) upn = auth_service.getUserPrincipleName();

    let response = await get(this.buildApiUrl(`allHeroQuestsWithMissions?upn=${upn}`));
    let quests = await response.json();

    quests = quests.map(quest => {
      let startDate = new Date(quest.startDate);
      let endDate = new Date(quest.endDate);
      return {
        ...quest,
        startDate,
        endDate
      };
    });

    this.store.dispatch(heroQuestsReceived(quests));
  }

  async updateQuest(quest, missions) {
    let request = {
      quest,
      missions
    };

    let response = await post(this.buildApiUrl('updateQuest'), request);
    let data = await response.json();
    let upn = auth_service.getUserPrincipleName();
    let updatedQuest = data.quest;
    let updatedMissions = data.missions;

    updatedQuest.startDate = new Date(updatedQuest.startDate);
    updatedQuest.endDate = new Date(updatedQuest.endDate);
    updatedMissions = updatedMissions.map(mission => {
      let dateCompleted = mission.dateCompleted ? new Date(mission.dateCompleted) : mission.dateCompleted;
      return {
        ...mission,
        dateCompleted
      };
    });

    if (updatedQuest && updatedQuest.heroUserPrincipleName == upn) {
      this.store.dispatch(questUpdated({ quest: updatedQuest, missions: updatedMissions }));
    }

    if (updatedQuest && updatedQuest.heroUserPrincipleName != upn) {
      post(this.buildApiUrl(`lastGuideActiveDate?upn=${upn}`));
    }

    this.store.dispatch(resetEditingQuest());

    return data;
  }

  async createQuest(quest, missions) {
    let request = {
      quest,
      missions
    };

    // TODO: This is clearing the editing quest when there's an error. We should handle
    // the error situation a bit more explicitly. - Mike, 2019-07-04
    let response = await post(this.buildApiUrl('createQuest'), request);
    let data = await response.json();

    let updatedQuest = data.quest;
    let updatedMissions = data.missions;
    let avatar = data.avatar;
    let numberOfPartsAvailable = data.numberOfPartsAvailable;
  
    if (data.error) {
      this.store.dispatch(questExistsErrorReceived(updatedQuest));
      return;
    }

    if (updatedQuest) {

      updatedQuest.startDate = new Date(updatedQuest.startDate);
      updatedQuest.endDate = new Date(updatedQuest.endDate);
      updatedMissions = updatedMissions.map(mission => {
        let dateCompleted = mission.dateCompleted ? new Date(mission.dateCompleted) : mission.dateCompleted;
        return {
          ...mission,
          dateCompleted
        };
      });

      if (quest.heroUpn == auth_service.getUserPrincipleName()) {
        this.store.dispatch(questCreated({ quest: updatedQuest, missions: updatedMissions, avatar, numberOfPartsAvailable }));
      } else {
        this.store.dispatch(heroQuestReceived(updatedQuest));
      }
    }

    this.store.dispatch(resetEditingQuest());
  }

  async resumeQuest (questId) {
    let request = {
      questId
    };
    let response = await post(this.buildApiUrl('resumeQuest'), request);
    let quest = await response.json();
    quest.startDate = new Date(quest.startDate);
    quest.endDate = new Date(quest.endDate);
    this.store.dispatch(questUpdated(quest));
  }

  async getGuidesBySpecialisation(specialisationId) {
    let response = await get(this.buildApiUrl(`guides?specialisationId=${specialisationId}`));
    let guides = await response.json();
    return guides;
  }

  async getOldQuests() {
    let response = await get(this.buildApiUrl('oldQuests'));
    let oldQuests = await response.json();
    oldQuests = oldQuests.map(quest => {
      let startDate = new Date(quest.startDate);
      let endDate = new Date(quest.endDate);
      return {
        ...quest,
        startDate,
        endDate
      };
    });
    this.store.dispatch(userHasOldQuests(oldQuests));
  }

  questOptimisticUpdate(quest, missions) {
    // Optimistically update the Quest, while we wait for the response to return. - Mike, 2019-07-08
    this.store.dispatch(questUpdated({ quest, missions }));
  }

  async retractHeroQuestCompletion(quest){
    let response = await post(this.buildApiUrl('retractQuestCompletion'), {questId: quest.questId, upn: quest.heroUserPrincipleName});
    if (response) this.store.dispatch(navigateComponent('/heroes'));
  }

  async markQuestComplete (quest) {
    let response = await post(this.buildApiUrl('markQuestComplete'), {questId: quest.questId, upn: quest.heroUserPrincipleName});
    let updatedQuest = await response.json();
    updatedQuest.startDate = new Date(updatedQuest.startDate);
    updatedQuest.endDate = new Date(updatedQuest.endDate);
    this.store.dispatch(questUpdated({...updatedQuest, missions: []}));
    if (updatedQuest) this.store.dispatch(navigateComponent('/home'));
    //TODO: handle error case
  }

  async markQuestAbandoned (quest) {
    let response = await post(this.buildApiUrl('markQuestAbandoned'), {questId: quest.questId, upn: quest.heroUserPrincipleName});
    let updatedQuest = await response.json();
    updatedQuest.startDate = new Date(updatedQuest.startDate);
    updatedQuest.endDate = new Date(updatedQuest.endDate);
    this.store.dispatch(questUpdated({...updatedQuest, missions: []}));
    if (updatedQuest) this.store.dispatch(navigateComponent('/home'));
    //TODO: handle error case
  }

  async markQuestPaused (quest) {
    let response = await post(this.buildApiUrl('markQuestPaused'), {questId: quest.questId, upn: quest.heroUserPrincipleName});
    let updatedQuest = await response.json();
    updatedQuest.startDate = new Date(updatedQuest.startDate);
    updatedQuest.endDate = new Date(updatedQuest.endDate);
    this.store.dispatch(questUpdated({...updatedQuest, missions: []}));
    if (updatedQuest) this.store.dispatch(navigateComponent('/home'));
    //TODO: handle error case
  }
}

export default new QuestService();