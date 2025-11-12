import { expect } from '@open-wc/testing';
import {
  selectAllNotifications,
  selectNotificationActiveCount
} from '../../../src/selectors/notifications.selectors';

describe('Selector - Notification', () => {
  it('should return all notifications from state', () => {
    let state = {
      notifications: {
        all: [{ notificationId: 1 }, { notificationId: 2 }, { notificationId: 3 }]
      }
    };

    let notifications = selectAllNotifications(state);

    expect(notifications).to.equal(state.notifications.all);
  });

  it('should return notification count', () => {
    let state = {
      notifications: {
        all: [{ notificationId: 1 }, { notificationId: 2 }, { notificationId: 3 }]
      }
    };

    let notificationCount = selectNotificationActiveCount.resultFunc(state.notifications.all);

    expect(notificationCount).to.equal(3);
  });
});