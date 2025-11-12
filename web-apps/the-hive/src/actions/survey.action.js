export const SURVEY_VIEW_UPDATED = 'SURVEY_VIEW_UPDATED';
export const ACTIVE_SURVEY_RECEIVED = 'ACTIVE_SURVEY_RECEIVED';


export const surveyViewUpdated = (view) => {
  return {
    type: SURVEY_VIEW_UPDATED,
    view,
  };
};

export const activeSurveyReceived = (survey) => {
  return {
    type: ACTIVE_SURVEY_RECEIVED,
    survey,
  };
};
