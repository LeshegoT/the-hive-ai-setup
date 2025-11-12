import { expect } from '@open-wc/testing';
import { levelUpActivities } from '../../../src/reducers/level-up-activities.reducer';
import { LEVEL_UP_ACTIVITIES_RECEIVED } from '../../../src/actions/level-up-activities-received.action';
import { USER_LEVEL_UP_ACTIVITIES_RECEIVED } from '../../../src/actions/user-level-up-activities-received.action';
import { initialise_reducer_test } from '../shared/reducer';

describe('Reducer - Level Up Activities', () => {
  let initial_state = {
    all: [],
    user: []
  };

  let test_reducer_state = initialise_reducer_test(levelUpActivities, initial_state);

  it('should initialise correctly.', () => {
    let state = levelUpActivities(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a LEVEL_UP_ACTIVITIES_RECEIVED action.`, () => {
    let action = {
      type: LEVEL_UP_ACTIVITIES_RECEIVED,
      levelUpActivities: [{ levelUpActivityId: 1 }]
    };

    let delta = {
      all: action.levelUpActivities
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a USER_LEVEL_UP_ACTIVITIES_RECEIVED action.`, () => {
    let action = {
      type: USER_LEVEL_UP_ACTIVITIES_RECEIVED,
      userLevelUpActivities: [{ levelUpActivityId: 1 }]
    };

    let delta = {
      user: action.userLevelUpActivities
    };

    test_reducer_state(action, delta);
  });
});
