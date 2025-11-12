import { USER_DATA_RECEIVED } from '../actions/user-data-received.action';
import { MESSAGES_RECEIVED } from '../actions/messages-received.action';

const INITIAL_STATE = {
  all: [],
  feedback: []
};

export const messages = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    //TODO: I think this can be deleted, need to test to make sure it can - Gery, 2019/09/09
    case USER_DATA_RECEIVED:
      if (!action.messages) return state;

      return {
        ...state,
        all: [...action.messages]
      };

    case MESSAGES_RECEIVED:
      // We may receive a message multiple times, so we need to dedupe the contents of
      // the array. - Mike 2019/06/26
      let all = [...state.all, ...action.messages].reduce((array, message) => {
        let alreadyPresent = array.find((m) => m.messageId === message.messageId);

        if (alreadyPresent) return array;

        return [...array, message];
      }, []);

      return { ...state, all };

    default:
      return state;
  }
};
