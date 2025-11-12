import { VOTING_OPTIONS_RECEIVED } from '../actions/voting-options-received.action';
import { USER_VOTES_RECEIVED } from '../actions/user-votes-received.action';
import { VOTING_EVENT_RECEIVED } from '../actions/voting-event-received.action';
import { VOTING_ACTIVE_EVENTS_RECEIVED } from '../actions/voting-active-events-received.action';

const INITIAL_STATE = {
  all: [],
  user: []
};

export const votingOptions = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case VOTING_OPTIONS_RECEIVED:
      return {
        ...state,
        all: action.votingOptions
      };

    default:
      return state;
  }
};

export const votingActiveEvents = (state = INITIAL_STATE,action) => {
  switch(action.type) {
    case VOTING_ACTIVE_EVENTS_RECEIVED:
      return{
        ...state,
        all:action.votingActiveEvents
      };

      default:
        return state;
  }
};

export const userVotes = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case USER_VOTES_RECEIVED:
      return {
        ...state,
        user: action.userVotes
      };

    default:
      return state;
  }
};

export const votingEvent = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case VOTING_EVENT_RECEIVED:
      return {
        ...state,
        details: action.event[0]
      };

    default:
      return state;
  }
};
