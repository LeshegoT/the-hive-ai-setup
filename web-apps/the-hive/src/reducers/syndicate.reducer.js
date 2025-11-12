import { SYNDICATE_FORMATION_DETAILS_RECEIVED } from '../actions/syndicate.action';
import { SYNDICATE_FORMATIONS_RECEIVED } from '../actions/syndicate.action';

const INITIAL_STATE = {
};

export const syndicateFormationDetails = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SYNDICATE_FORMATION_DETAILS_RECEIVED:
      return {
        ...state,
        ...action.formationDetails
      };
    default:
      return state;
  }
};
export const syndicateFormations = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SYNDICATE_FORMATIONS_RECEIVED:
      return {
        ...state,
        formations: action.formations
      };
    default:
      return state;
  }
};
