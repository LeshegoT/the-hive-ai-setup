import { USER_DATA_RECEIVED } from '../actions/user-data-received.action';
import { PARTS_RECEIVED } from '../actions/parts-received.action';
import { AVATAR_COLOUR_CHANGED } from '../actions/avatar-colour-changed.action';
import { AVATAR_PARTS_CHANGED } from '../actions/avatar-parts-changed.action';
import { CLAIM_PARTS_RECEIVED } from '../actions/claim-parts-received.action';
import { CLAIM_PARTS_CHOSEN } from '../actions/claim-parts-chosen.action';
import { QUEST_CREATED } from '../actions/quest-created.action';

const INITIAL_STATE = {
  body: {},
  parts: [],
  all: [],
  claimParts: [],
  numberOfPartsAvailable: 0
};

export const avatar = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case USER_DATA_RECEIVED:
      return {
        ...state,
        body: action.avatar,
        parts: action.parts,
        numberOfPartsAvailable: action.numberOfPartsAvailable
      };
    case PARTS_RECEIVED:
      return {
        ...state,
        all: action.parts
      };
    case AVATAR_COLOUR_CHANGED:
      let body = {
        ...state.body,
        red: action.red,
        green: action.green,
        blue: action.blue
      };

      return {
        ...state,
        body
      };

    case AVATAR_PARTS_CHANGED:
      return { ...state, parts: action.parts };

    case CLAIM_PARTS_RECEIVED:
      return { ...state, claimParts: action.claimParts };

    case CLAIM_PARTS_CHOSEN:
      return {
        ...state,
        parts: action.parts,
        claimParts: [],
        numberOfPartsAvailable: 0
      };

    case QUEST_CREATED:
      return {
        ...state,
        numberOfPartsAvailable: action.numberOfPartsAvailable,
        body: action.avatar
      };
      
    default:
      return state;
  }
};
