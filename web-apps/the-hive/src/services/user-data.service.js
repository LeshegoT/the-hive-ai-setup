import { store } from '../store.js';
import { get, post } from './shared.js';
import authService from './auth.service';
import { userDataReceived } from '../actions/user-data-received.action.js';
import notificationService from './notification.service';
import configService from './config.service';


export const getUserData = () => {
  try {
    const upn = authService.getUserPrincipleName();
    if (upn) {
      get(`${configService.hiveApiUrl}userData?upn=${upn}`)
        .then((response) => response.json())
        .then((userData) => store.dispatch(userDataReceived(userData)));

      notificationService.checkForNotifications(upn);

      post(`${configService.hiveApiUrl}lastHeroActiveDate?upn=${upn}`);
    }
  } catch (err) {
    console.error(err);
  }
};
