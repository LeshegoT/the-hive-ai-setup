import {
  selectAllLearningTasks
} from '../../../src/selectors/learning-tasks.selectors';

import { expect } from '@open-wc/testing';

let create_state = (learning_tasks) => ({
  learningTasks: {
    ...learning_tasks
  }
});

describe('Selector - Learning Tasks', () => {
  it('should return current learning task', () => {
    let state = create_state({
      user: [{ learningTaskId: 1 }, { learningTaskId: 2 }, { learningTaskId: 3 }]
    });

    let learningTasks = selectAllLearningTasks(state);

    expect(learningTasks).to.be.ok;
    expect(learningTasks).to.deep.equal([...state.learningTasks.user]);
  });
});
