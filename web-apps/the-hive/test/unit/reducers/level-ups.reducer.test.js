import { expect } from '@open-wc/testing';
import { levelUps } from '../../../src/reducers/level-ups.reducer';
import { LEVEL_UPS_RECEIVED } from '../../../src/actions/level-ups-received.action';
import { USER_LEVEL_UPS_RECEIVED } from '../../../src/actions/user-level-ups-received.action';
import { initialise_reducer_test } from '../shared/reducer';

describe('Reducer - LevelUps', () => {
  let initial_state = {
    all: [],
    user: []
  };

  let test_reducer_state = initialise_reducer_test(levelUps, initial_state);

  it('should initialise correctly.', () => {
    let state = levelUps(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a LEVEL_UPS_RECEIVED action.`, () => {
    let action = {
      type: LEVEL_UPS_RECEIVED,
      levelUps: [{ levelUpId: 1 }]
    };

    let delta = {
      all: action.levelUps
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a USER_LEVEL_UPS_RECEIVED action.`, () => {
    let action = {
      type: USER_LEVEL_UPS_RECEIVED,
      userLevelUps: [{ levelUpId: 1 }]
    };

    let delta = {
      user: action.userLevelUps
    };

    test_reducer_state(action, delta);
  });
});
