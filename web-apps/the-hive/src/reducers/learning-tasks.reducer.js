import { LEARNING_TASKS_RECEIVED } from '../actions/learning-tasks-received.action';

const INITIAL_STATE = {
  user: []
};

export const learningTasks = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case LEARNING_TASKS_RECEIVED:
      return {
        ...state,
        user: action.learningTasks
      };

    default:
      return state;
  }
};
