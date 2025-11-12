import { expect } from '@open-wc/testing';
import { learningTasks } from '../../../src/reducers/learning-tasks.reducer';
import { initialise_reducer_test } from '../shared/reducer';
import { LEARNING_TASKS_RECEIVED } from '../../../src/actions/learning-tasks-received.action';

describe('Reducer - Learning Tasks', () => {
  let initial_state = {
    user: []
  };
  let test_reducer_state = initialise_reducer_test(learningTasks, initial_state);

  it('should initialise correctly.', () => {
    let state = learningTasks(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a LEARNING_TASKS_RECEIVED action .`, () => {
    let action = {
      type: LEARNING_TASKS_RECEIVED,
      learningTasks: [{ id: 1 }, { id: 2 }]
    };

    let delta = {
      user: [{ id: 1 }, { id: 2 }]
    };

    test_reducer_state(action, delta);
  });
});
