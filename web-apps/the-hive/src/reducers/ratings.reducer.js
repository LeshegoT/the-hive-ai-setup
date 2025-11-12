import { RATINGS_RECEIVED } from '../actions/ratings-received.action';

const INITIAL_STATE = {
  values: [],
};

export const ratings = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case RATINGS_RECEIVED:
            return {
                ...state,
                values: action.ratings
            };
        
        default:
            return state;
    }
};