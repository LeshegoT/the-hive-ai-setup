import { get, post } from './shared.js';
import { sideQuestsReceived } from '../actions/side-quests-received.action';
import { sideQuestRegistered } from '../actions/side-quest-registered.action';
import authService from './auth.service.js';
import { BaseService } from './base.service.js';

export class SideQuestService extends BaseService{
  constructor() {
    super();
  }

  async getSideQuests() {
    let response = await get(this.buildApiUrl('sideQuests'));
    let sideQuests = await response.json();
    this.store.dispatch(sideQuestsReceived(sideQuests));
  }

  async registerForSideQuest(sideQuestId) {
    let request = {
      sideQuestId,
      upn: authService.getUserPrincipleName()
    };

    let response = await post(this.buildApiUrl('registerForSideQuest'), request);
    let sideQuest = await response.json();
    this.store.dispatch(sideQuestRegistered(sideQuest));
  }
}

export default new SideQuestService();
