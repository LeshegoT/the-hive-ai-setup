import { expect } from '@open-wc/testing';

export const initialise_reducer_test = (reducer, initial_state) => (action, delta) => {
  let state = reducer(initial_state, action);
  expect(state).to.deep.equal({
    ...initial_state,
    ...delta
  });
};

export const test_reducer_action = (reducer, initial_state, action_name, delta) => {
  let test_reducer_state = initialise_reducer_test(reducer, initial_state);

  it(`should update the state on a ${action_name} action.`, () => {
    let action = {
      type: action_name,
      ...delta
    };

    test_reducer_state(action, delta);
  });
};
