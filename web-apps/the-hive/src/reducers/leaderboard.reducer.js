import { LEADERBOARD_RECEIVED } from '../actions/leaderboard-received.action';
import { LAST_MONTH_POINTS_RECEIVED } from '../actions/last-month-points-received.action';

const INITIAL_STATE = {
  heroes: []
};

export const leaderboard = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case LEADERBOARD_RECEIVED:
      return {
        ...state,
        heroes: action.heroes
      };
    case LAST_MONTH_POINTS_RECEIVED:
      return {
        ...state,
        lastMonthPoints: action.points.total
      };
    default:
      return state;
  }
};
