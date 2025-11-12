import { EASTER_EGG_RECEIVED } from "../actions/easter-egg.action";

const INITIAL_STATE = {
  code: '',
  display: false
};

export const easterEgg = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EASTER_EGG_RECEIVED:
            return {
                code: action.guid,
                display: action.display
            }
            
        default:
            return {}
    }
}