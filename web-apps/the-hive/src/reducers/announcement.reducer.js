import { ANNOUNCEMENT_RECEIVED } from '../actions/announcement.action';

const INITIAL_STATE = {
    display:false
}

export const announcement = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case ANNOUNCEMENT_RECEIVED:
            return {
                ...state,
                ...action.announcement
            }
        
        default: return state;
    }
}