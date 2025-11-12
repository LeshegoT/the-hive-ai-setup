import { SURVEY_VIEW_UPDATED, ACTIVE_SURVEY_RECEIVED } from '../actions/survey.action';

const INITIAL_STATE = {
  view: undefined,
  survey: undefined,
};

export const survey = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SURVEY_VIEW_UPDATED:
      return {
        ...state,
        view: action.view,
      };
    case ACTIVE_SURVEY_RECEIVED:
      return {
        ...state,
        survey: action.survey,
      };

    default:
      return state;
  }
};
