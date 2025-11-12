import { EDITING_MISSSIONS_UPDATED } from '../actions/editing-missions-updated.action';
import { EDITING_QUEST_UPDATED } from '../actions/editing-quest-updated.action';
import { RESET_EDITING_QUEST } from '../actions/reset-editing-quest.action';
import { QUEST_EDITOR_ERRORS_FOUND } from '../actions/quest-editor-errors-found.action';
import { QUEST_MISSION_TO_UPDATE_UPDATED } from "../actions/quest-mission-to-update-updated.action";

const INITIAL_STATE = {
  quest: {},
  missions: [],
  errors: [],
  missionToUpdate: {}
};

export const questEditor = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case EDITING_MISSSIONS_UPDATED:
      return {
        ...state,
        missions: action.missions
      };
    case EDITING_QUEST_UPDATED:
      return {
        ...state,
        quest: action.quest
      };
    case RESET_EDITING_QUEST:
      return {
        ...state,
        quest: {},
        missions: [],
        errors: [],
        missionToUpdate: {}
      }
    case QUEST_EDITOR_ERRORS_FOUND: 
      return {
        ...state,
        errors: action.errors
      }
    case QUEST_MISSION_TO_UPDATE_UPDATED:
      return {
        ...state,
        missionToUpdate: action.mission
      }
    default:
      return state;
  }
};
