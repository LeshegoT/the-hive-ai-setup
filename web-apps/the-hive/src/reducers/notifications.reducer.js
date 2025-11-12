import { NOTIFICATIONS_RECEIVED } from '../actions/notifications-received.action';

const INITIAL_STATE = {
  all: []
};

export const notifications = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case NOTIFICATIONS_RECEIVED:
      if (!action.notifications) return state;

      return {
        ...state,
        all: action.notifications
      }; 

    default:
      return state;
  }
};
