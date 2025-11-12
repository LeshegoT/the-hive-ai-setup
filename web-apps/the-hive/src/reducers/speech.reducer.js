import { 
    SPEECH_RECEIVED,
} from '../actions/speech.action';


const INITIAL_STATE = {
  speech: undefined,
};

export const speech = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SPEECH_RECEIVED:
      return {
        ...state,
        speech: action.speech,
      };

    default:
      return state;
  }
};
