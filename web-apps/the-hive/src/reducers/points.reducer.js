import { POINTS_RECEIVED, POINT_TYPES_RECEIVED } from '../actions/points.action';

const INITIAL_STATE = {
  all: [],
  types:[]
};

export const points = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case POINTS_RECEIVED:
      return {
        ...state,
        all: action.points,
      };

    case POINT_TYPES_RECEIVED:
      return {
        ...state,
        types: action.types.pointTypes,
      };

    default:
      return state;
  }
};