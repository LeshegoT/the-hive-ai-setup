import { LEVEL_UP_ACTIVITIES_RECEIVED } from "../actions/level-up-activities-received.action";
import { USER_LEVEL_UP_ACTIVITIES_RECEIVED } from '../actions/user-level-up-activities-received.action';

const INITIAL_STATE = {
  all: [],
  user: []
};

export const levelUpActivities = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case LEVEL_UP_ACTIVITIES_RECEIVED:
      return {
        ...state,
        all: action.levelUpActivities
      };
    case USER_LEVEL_UP_ACTIVITIES_RECEIVED:
      return {
        ...state,
        user: action.userLevelUpActivities
      }

    default:
      return state;
  }
};
