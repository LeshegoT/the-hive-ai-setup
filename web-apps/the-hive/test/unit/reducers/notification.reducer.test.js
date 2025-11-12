import { expect } from '@open-wc/testing';
import { notifications } from '../../../src/reducers/notifications.reducer';
import { initialise_reducer_test } from '../shared/reducer';
import { NOTIFICATIONS_RECEIVED } from '../../../src/actions/notifications-received.action';

describe('Reducer - Notifications', () => {
  let initial_state = {
    all: []
  };

  let test_reducer_state = initialise_reducer_test(notifications, initial_state);

  it('should initialise correctly.', () => {
    let state = notifications(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should return the state on a empty NOTIFICATIONS_RECEIVED action .`, () => {
    let action = {
      type: NOTIFICATIONS_RECEIVED,
      notifications: null
    };

    let delta = {
      all: []
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a NOTIFICATIONS_RECEIVED action .`, () => {
    let action = {
      type: NOTIFICATIONS_RECEIVED,
      notifications: [1]
    };

    let delta = {
      all: [1]
    };

    test_reducer_state(action, delta);
  });
});