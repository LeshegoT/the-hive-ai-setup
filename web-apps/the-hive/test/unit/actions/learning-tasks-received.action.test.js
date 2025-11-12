import {
  LEARNING_TASKS_RECEIVED,
  learningTasksReceived
} from '../../../src/actions/learning-tasks-received.action';

import { expect } from '@open-wc/testing';

describe('Action - LEARNING_TASKS_RECEIVED', () => {
  it('returns a new action', async () => {
    let learningTasks = [{ messageTypeId: 1 }, { messageTypeId: 2 }];

    const action = learningTasksReceived(learningTasks);

    expect(action.type).to.equal(LEARNING_TASKS_RECEIVED);
    expect(action).to.deep.equal({
      type: LEARNING_TASKS_RECEIVED,
      learningTasks
    });
  });
});
