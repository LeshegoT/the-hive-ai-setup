import { QUESTIONS_AND_ANSWERS_RECEIVED } from '../actions/questions-and-answers-received.action';
import { USER_ANSWERS_UPDATED } from '../actions/user-answers-updated.action';
import { USER_ANSWER_ERROR_UPDATED } from '../actions/user-answer-error-updated.action';

const INITIAL_STATE = {
  all: [],
  answers: [],
  user: [],
  hasError: false
};

export const questions = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case QUESTIONS_AND_ANSWERS_RECEIVED:
      return {
        ...state,
        all: action.questions,
        answers: action.answers,
        user: action.user
      };

    case USER_ANSWERS_UPDATED:
      return {
        ...state,
        user: action.user
      };

    case USER_ANSWER_ERROR_UPDATED: {
      return {
        ...state,
        hasError: action.hasError
      };
    }

    default:
      return state;
  }
};
