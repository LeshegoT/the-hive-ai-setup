import { get } from './shared';
import { post } from './shared.js';
import { BaseService } from './base.service';

export class SurveyService extends BaseService {
  constructor() {
    super();
  }

  async getSurveyAssignments() {
    let response = await get(this.buildApiUrl(`/surveyAssignments/`));
    let results = await response.json();
    return results;
  }

  async getSurveyQuestions(surveyId){
    let response = await get(this.buildApiUrl(`/survey/${surveyId}/questions/`));
    let results = await response.json();
    return results;
  }

  async submitAssignment(surveyAssignmentId, responses){
     return post(this.buildApiUrl(`/surveyAssignment/${surveyAssignmentId}/`), responses)
       .then((res) => {
         return { success: res.ok };
       })
       .catch((error) => {
         return { success: false, error: error };
       });
  }
}

export const DASHBOARD_STATE = 'dashboard';
export const SURVEY_STATE = 'survey';

export const TEXT_QUESTION = 'Text';
export const TRUE_FALSE_QUESTION = 'True_False';
export const LOOKUP_QUESTION = 'Lookup';
export const SINGLE_OPTION_QUESTION = 'Single Option';


export default new SurveyService();