import { expect } from '@open-wc/testing';
import { ratings } from '../../../src/reducers/ratings.reducer';
import { initialise_reducer_test } from '../shared/reducer';
import { RATINGS_RECEIVED } from '../../../src/actions/ratings-received.action';


describe('Reducer - Ratings', () => {
  let initial_state = {
    values: []
  };

  let test_reducer_state = initialise_reducer_test(ratings, initial_state);

  it('should initialise correctly.', () => {
    let state = ratings(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a RATINGS_RECEIVED action.`, () => {
    let action = {
      type: RATINGS_RECEIVED,
      ratings: [{value: 1}]
    };

    let delta = {
      values: action.ratings
    };

    test_reducer_state(action, delta);
  });
});
