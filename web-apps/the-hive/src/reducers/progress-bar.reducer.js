import { PROGRESS_BAR_STATE_RECEIVED } from '../actions/progress-bar.action';

const INITIAL_STATE = {
  progressBarState: 0
};

export const progressBar = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case PROGRESS_BAR_STATE_RECEIVED:
      return {
        ...state,
        progressBarState: action.progressStatePos
      }
    default:
      return state;
  }
};