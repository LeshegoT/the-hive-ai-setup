import { LEVEL_UPS_RECEIVED } from '../actions/level-ups-received.action';
import { USER_LEVEL_UPS_RECEIVED } from '../actions/user-level-ups-received.action';

const INITIAL_STATE = {
  all: [],
  user: []
};

export const levelUps = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case LEVEL_UPS_RECEIVED:
      return {
        ...state,
        all: action.levelUps
      };
    case USER_LEVEL_UPS_RECEIVED:
      return {
        ...state,
        user: action.userLevelUps
      };
    default:
      return state;
  }
};
