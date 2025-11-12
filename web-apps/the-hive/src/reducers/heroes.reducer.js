import { USER_DATA_RECEIVED } from '../actions/user-data-received.action';
import { HEROES_RECEIVED } from '../actions/heroes-received.action';
import { HERO_QUEST_RECEIVED } from '../actions/hero-quest-received.action';
import { QUEST_EXISTS_ERROR_RECEIVED } from '../actions/quest-exists-error-received.action';

const INITIAL_STATE = {
  all: [],
  isGuide: false,
  existingQuest: {},
  guideRequests: []
};

export const heroes = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case USER_DATA_RECEIVED:
      return {
        ...state,
        isGuide: action.isGuide,
        guideRequests: action.guideRequests
      };
    case HEROES_RECEIVED:
      return {
        ...state,
        all: action.heroes
      }
    case HERO_QUEST_RECEIVED:
      return {
        ...state,
        all: [...state.all, action.quest]
      }
    case QUEST_EXISTS_ERROR_RECEIVED:
      return {
        ...state,
        existingQuest: action.quest
      }
    default:
      return state;
  }
};
