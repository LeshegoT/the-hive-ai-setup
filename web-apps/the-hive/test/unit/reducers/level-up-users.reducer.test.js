import { expect } from '@open-wc/testing';
import { levelUpUsers } from '../../../src/reducers/level-up-users.reducer';
import { initialise_reducer_test } from '../shared/reducer';
import { LEVEL_UP_USERS_RECEIVED } from '../../../src/actions/level-up-users-received.action';

describe('Reducer - Level up users', () => {
  let initial_state = {
    all: []
  };

  let test_reducer_state = initialise_reducer_test(levelUpUsers, initial_state);

  it('should initialise correctly.', () => {
    let state = levelUpUsers(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a LEVEL_UP_USERS_RECEIVED action .`, () => {
    let action = {
      type: LEVEL_UP_USERS_RECEIVED,
      levelUpUsers: [{userId: 1}]
    };

    let delta = {
      all: [{userId: 1}]
    };

    test_reducer_state(action, delta);
  });
});