import { USER_DATA_RECEIVED } from '../actions/user-data-received.action';
import { QUEST_CREATED } from '../actions/quest-created.action';
import { QUEST_UPDATED } from '../actions/quest-updated.action';
import { MISSIONS_RECEIVED } from '../actions/missions-received.action';
import { HERO_MISSIONS_RECEIVED } from '../actions/hero-missions-received.action';
import { HERO_QUESTS_RECEIVED } from '../actions/hero-quests-received.action';
import { USER_HAS_OLD_QUESTS } from '../actions/user-has-old-quests.action';

const INITIAL_STATE = {
  current: {},
  missions: [],
  all: [],
  oldQuests: false,
  pausedQuests: []
};

export const quests = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case USER_DATA_RECEIVED:
      return {
        ...state,
        current: action.quest,
        missions: [...action.missions]
      };

    case QUEST_CREATED:
      return {
        ...state,
        current: action.quest,
        missions: action.missions
      };

    case QUEST_UPDATED:
      return {
        ...state,
        current: action.quest,
        missions: action.missions
      };

    case MISSIONS_RECEIVED:
      return {
        ...state,
        missions: action.missions
      };

    case HERO_MISSIONS_RECEIVED:
      return {
        ...state,
        missions: [...action.missions]
      };

    case HERO_QUESTS_RECEIVED:
      return {
        ...state,
        all: action.quests
      };
      
    case USER_HAS_OLD_QUESTS:
      return {
        ...state,
        oldQuests: action.quests.length > 0,
        pausedQuests: action.quests.filter(quest => quest.status == 'paused')
      };

    default:
      return state;
  }
};
