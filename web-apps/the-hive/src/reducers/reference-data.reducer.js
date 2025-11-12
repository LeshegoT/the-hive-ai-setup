import { REFERENCE_DATA_RECEIVED } from '../actions/reference-data-received.action';

const INITIAL_STATE = {
  missionTypes: [],
  questTypes: [],
  specialisations: [],
  levels: [],
  messageTypes: [],
  levelUpActivityTypes: [],
  sideQuestTypes: [],
  guideDetails: []
};

export const referenceData = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case REFERENCE_DATA_RECEIVED:
      return {
        ...state,
        ...action.referenceData
      };
    default:
      return state;
  }
};
