import { get, post } from './shared.js';
import { levelUpsReceived } from '../actions/level-ups-received.action.js';
import { levelUpActivitiesReceived } from '../actions/level-up-activities-received.action.js';
import { userLevelUpsReceived } from '../actions/user-level-ups-received.action.js';
import { levelUpUsersReceived } from '../actions/level-up-users-received.action.js';
import { userLevelUpActivitiesReceived } from '../actions/user-level-up-activities-received.action.js';
import { BaseService } from './base.service.js';

export class LevelUpService extends BaseService {
  constructor() {
    super();
  }

  async getLevelUps() {
    let response = await get(this.buildApiUrl('levelUps'));
    let {
      levelUps,
      levelUpActivities,
      userLevelUps,
      userLevelUpActivities
    } = await response.json();
    this.store.dispatch(levelUpsReceived(levelUps));
    this.store.dispatch(userLevelUpsReceived(userLevelUps));
    this.store.dispatch(levelUpActivitiesReceived(levelUpActivities));
    this.store.dispatch(userLevelUpActivitiesReceived(userLevelUpActivities));
  }

  async getLevelUpUsers(levelUpId) {
    let response = await get(this.buildApiUrl(`levelUpUsers/${levelUpId}`));
    let levelUpUsers = await response.json();
    this.store.dispatch(levelUpUsersReceived(levelUpUsers));
  }

  async registerForLevelUp(levelUpId) {
    let response = await post(this.buildApiUrl(`levelUpRegister/${levelUpId}`));
    let data = await response.json();
    this.store.dispatch(userLevelUpsReceived(data));
  }

  async markActivityAsAttended(levelUpActivityId) {
    let response = await post(this.buildApiUrl(`levelUpActivityAttend/${levelUpActivityId}`));
    let data = await response.json();

    if (data.length) {
      this.store.dispatch(userLevelUpActivitiesReceived(data));
    }
  }
}

export default new LevelUpService();
