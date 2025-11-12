import { MULTIPLIER_RECEIVED } from '../actions/multiplier.action';

const INITIAL_STATE = {
  value: 1,
};

export const multiplier = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case MULTIPLIER_RECEIVED:
            return {
                ...state,
                value: action.multiplier.value
            };
        
        default:
            return state;
    }
};