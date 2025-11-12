import { SIDE_QUESTS_RECEIVED } from '../actions/side-quests-received.action';
import { SIDE_QUEST_REGISTERED } from '../actions/side-quest-registered.action';
import { USER_DATA_RECEIVED } from '../actions/user-data-received.action';

const INITIAL_STATE = {
  all: undefined,
  user: []
};

export const sideQuests = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SIDE_QUESTS_RECEIVED:
      return {
        ...state,
        all: action.sideQuests
      };

    case USER_DATA_RECEIVED:
      return {
        ...state,
        user: [...state.user, ...action.sideQuests]
      };

    case SIDE_QUEST_REGISTERED:
      return {
        ...state,
        user: [...state.user, action.sideQuest]
      };

    default:
      return state;
  }
};
