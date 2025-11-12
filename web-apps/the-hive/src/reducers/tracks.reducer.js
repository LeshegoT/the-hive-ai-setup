import { TRACKS_RECEIVED } from '../actions/tracks-received.action';

const INITIAL_STATE = {
  all: []
};

export const tracks = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case TRACKS_RECEIVED:
      return {
        ...state,
        all: action.tracks
      };

    default:
      return state;
  }
};
