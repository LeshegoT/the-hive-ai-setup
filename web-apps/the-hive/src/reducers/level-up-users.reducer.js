import { LEVEL_UP_USERS_RECEIVED } from '../actions/level-up-users-received.action';

const INITIAL_STATE = {
  all: []
};

export const levelUpUsers = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case LEVEL_UP_USERS_RECEIVED:
      return {
        ...state,
        all: action.levelUpUsers
      };
    default:
      return state;
  }
};
