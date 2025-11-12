import { expect } from '@open-wc/testing';
import { raffle } from '../../../src/reducers/raffle.reducer';
import { initialise_reducer_test, test_reducer_action } from '../shared/reducer';
import {
  RAFFLE_STATE_UPDATED,
  RAFFLE_PARTICIPANTS_RECEIVED,
  RAFFLE_PARTICIPANT_RECEIVED,
  RAFFLE_WINNER_RECEIVED,
} from '../../../src/actions/raffle.action';

describe('Reducer - Raffle', () => {
  let initial_state = {
    allRaffles: [],
    raffleState: undefined,
    raffle: undefined,
    participants: [],
    winner: undefined,
    price: undefined,
  };

  let test_reducer_state = initialise_reducer_test(raffle, initial_state);

  it('should initialise correctly.', () => {
    let state = raffle(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a RAFFLE_STATE_UPDATED action.`, () => {
    let action = {
      type: RAFFLE_STATE_UPDATED,
      raffleState: 'home',
    };

    let delta = {
      raffleState: action.raffleState,
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a RAFFLE_PARTICIPANTS_RECEIVED action.`, () => {
    let action = {
      type: RAFFLE_PARTICIPANTS_RECEIVED,
      participants: ['testing'],
    };

    let delta = {
      participants: action.participants,
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a RAFFLE_PARTICIPANT_RECEIVED action.`, () => {
    let action = {
      type: RAFFLE_PARTICIPANT_RECEIVED,
      allRaffles: ['testing'],
    };

    let delta = {
      allRaffles: action.allRaffles,
    };

    test_reducer_state(action, delta);
  });

    it(`should update the state on a RAFFLE_WINNER_RECEIVED action.`, () => {
      let action = {
        type: RAFFLE_WINNER_RECEIVED,
        winner: {
          winner: 1,
          participants: ['testingUser1', 'testingUser2'],
          total: 100,
        },
      };

      let delta = {
        winner: action.winner,
      };

      test_reducer_state(action, delta);
    });

});
