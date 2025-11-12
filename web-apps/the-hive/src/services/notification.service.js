import { get, post } from './shared';
import { navigateComponent } from '../actions/app.action.js';
import { notificationsReceived } from '../actions/notifications-received.action';
import authService from './auth.service';
import configService from './config.service';
import { BaseService } from './base.service';

export class NotificationService extends BaseService{
  constructor() {
    super();
  }

  async checkForNotifications(userPrincipleName) {
    let response = await get(this.buildApiUrl(`getGuideNotifications?upn=${userPrincipleName}`));
    let notifications = await response.json();
    this.store.dispatch(notificationsReceived(notifications));
  }

  async resolveQuestNotifications(questId) {
    let body = {
      questId: questId
    }
    let response = await post(this.buildApiUrl('resolveQuestNotifications'), body);
    if (response) {
      this.checkForNotifications(authService.getUserPrincipleName());
      this.store.dispatch(navigateComponent('/heroes'));
    }
  }
}

export default new NotificationService();