import { expect } from '@open-wc/testing';
import { leaderboard } from '../../../src/reducers/leaderboard.reducer';
import { initialise_reducer_test, test_reducer_action } from '../shared/reducer';
import { LEADERBOARD_RECEIVED } from '../../../src/actions/leaderboard-received.action';
import { LAST_MONTH_POINTS_RECEIVED } from '../../../src/actions/last-month-points-received.action';

describe('Reducer - Sections', () => {
  let initial_state = {
    heroes: []
  };

  let test_reducer_state = initialise_reducer_test(leaderboard, initial_state);

  it('should initialise correctly.', () => {
    let state = leaderboard(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a LAST_MONTH_POINTS_RECEIVED action.`, () => {
    let action = {
      type: LAST_MONTH_POINTS_RECEIVED,
      points: { total: 100 }
    };

    let delta = {
        lastMonthPoints: 100
    };

    test_reducer_state(action, delta);
  });

  test_reducer_action(leaderboard, initial_state, LEADERBOARD_RECEIVED, { heroes: [{upn: 'test@bbd.co.za'}] });
});
