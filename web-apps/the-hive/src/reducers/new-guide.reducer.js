import { GUIDE_APPLICATIONS_RECEIVED } from "../actions/guide-applications-received.action";

const INITIAL_STATE = {
  myApplications: [
  ],
};

export const guideApplications = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case GUIDE_APPLICATIONS_RECEIVED:
      return {
        ...state,
        myApplications: action.guideApplications,
      };

    default:
      return state;
  }
};
