import { MAP_MISSION_RECEIVED } from '../actions/map-mission-received.action';

const INITIAL_STATE = {
  mission: null
};

export const map = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case MAP_MISSION_RECEIVED:
      return {
        ...state,
        mission: action.mapMission
      }; 

    default:
      return state;
  }
};
