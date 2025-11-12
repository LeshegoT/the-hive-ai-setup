import { COURSES_RECEIVED } from '../actions/courses-received.action';
import { USER_PRESCRIBED_COURSES_RECEIVED } from '../actions/user-prescribed-courses-received.action';
import { USER_COMPLETED_COURSES_RECEIVED } from '../actions/completed-courses-received.action';

const INITIAL_STATE = {
  all: [],
  prescribed: [],
  completed: []
};

export const courses = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case COURSES_RECEIVED:
      return {
        ...state,
        all: action.courses,
      };

    case USER_PRESCRIBED_COURSES_RECEIVED:
      return {
        ...state,
        prescribed: action.courses,
      };

    case USER_COMPLETED_COURSES_RECEIVED:
      return {
        ...state,
        completed: action.courses,
      };

    default:
      return state;
  }
};
