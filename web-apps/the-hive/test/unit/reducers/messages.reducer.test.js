import { expect } from '@open-wc/testing';
import { messages } from '../../../src/reducers/messages.reducer';
import { initialise_reducer_test } from '../shared/reducer';
import { MESSAGES_RECEIVED } from '../../../src/actions/messages-received.action';
import { USER_DATA_RECEIVED } from '../../../src/actions/user-data-received.action';

describe('Reducer - Messages', () => {
  let initial_state = {
    all: [],
    feedback: []
  };
  let test_reducer_state = initialise_reducer_test(messages, initial_state);

  it('should initialise correctly.', () => {
    let state = messages(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it('should update the state on a USER_DATA_RECEIVED action .', () => {
    let action = { type: USER_DATA_RECEIVED, messages: [1] };

    let delta = {
      all: [1]
    };

    test_reducer_state(action, delta);
  });

  it('should not update the state on a USER_DATA_RECEIVED action if there are not messages.', () => {
    let action = { type: USER_DATA_RECEIVED };

    let delta = {
      all: []
    };

    test_reducer_state(action, delta);
  });

  it('should update the state on a MESSAGES_RECEIVED action.', () => {
    let action = {
      type: MESSAGES_RECEIVED,
      messages: [1]
    };

    let delta = {
      all: [1]
    };

    test_reducer_state(action, delta);
  });

  it('should update the state on a MESSAGES_RECEIVED action, but dedupe messages.', () => {
    let action = {
      type: MESSAGES_RECEIVED,
      messages: [1]
    };

    let delta = {
      all: [1]
    };

    let state = messages(initial_state, action);
    state = messages(state, action);

    expect(state).to.deep.equal({
      ...initial_state,
      ...delta
    });
  });
});
