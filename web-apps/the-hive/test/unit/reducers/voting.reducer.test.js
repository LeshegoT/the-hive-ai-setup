import { expect } from '@open-wc/testing';
import { votingOptions, userVotes, votingEvent } from '../../../src/reducers/voting.reducer';
import { VOTING_OPTIONS_RECEIVED } from '../../../src/actions/voting-options-received.action';
import { VOTING_EVENT_RECEIVED } from '../../../src/actions/voting-event-received.action';
import { USER_VOTES_RECEIVED } from '../../../src/actions/user-votes-received.action';
import { initialise_reducer_test } from '../shared/reducer';


describe('Reducer - Voting', () => {
  let initial_state = {
    all: [],
    user: []
  };

  let test_voting_options_reducer_state = initialise_reducer_test(votingOptions, initial_state);
  let test_voting_event_reducer_state = initialise_reducer_test(votingEvent, initial_state);
  let test_user_votes_reducer_state = initialise_reducer_test(userVotes, initial_state);

  it('voting options should initialise correctly.', () => {
    let state = votingOptions(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it('userVotes should initialise correctly.', () => {
    let state = userVotes(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it('votingEvent should initialise correctly.', () => {
    let state = votingEvent(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a VOTING_OPTIONS_RECEIVED action.`, () => {
    let action = {
      type: VOTING_OPTIONS_RECEIVED,
      votingOptions: [{ votingOptionId: 1 }]
    };

    let delta = {
        all: action.votingOptions
    };

    test_voting_options_reducer_state(action, delta);
  });
});
