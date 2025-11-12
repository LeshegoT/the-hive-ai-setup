import {
  NOTIFICATIONS_RECEIVED,
  notificationsReceived
} from '../../../src/actions/notifications-received.action';

import { expect } from '@open-wc/testing';

describe('Action - NOTIFICATIONS_RECEIVED', () => {
  it('returns an new action', async () => {
    let notifications = [
      { questId: 100, createdDate: '2019-01-01', notificationTypeId: 1, resolved: 1 },
      { questId: 101, createdDate: '2019-02-02', notificationTypeId: 1, resolved: 1 },
      { questId: 102, createdDate: '2019-03-03', notificationTypeId: 1, resolved: 0 }
    ];

    const action = notificationsReceived(notifications);

    expect(action.type).to.equal(NOTIFICATIONS_RECEIVED);
    expect(action).to.deep.equal({
      type: NOTIFICATIONS_RECEIVED,
      notifications
    });
  });
});
