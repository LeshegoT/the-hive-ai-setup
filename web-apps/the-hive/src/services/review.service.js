import { get } from './shared';
import { post } from './shared.js';
import { del } from './shared.js';
import { BaseService } from './base.service';
import { reviewViewUpdated, activeReviewReceived } from '../actions/review.action';
import announcementService from '../services/announcement.service';
import reviewLocalSaveService from '../services/review-local-save.service.js';
import networkConnection from '../services/networkConnection.service';
export class ReviewService extends BaseService {
  constructor() {
    super();
  }

  async upnOutstandingReviews() {
    let response = await get(this.buildApiUrl(`/reviews/v2/outstanding/`));
    let results = await response.json();
    return results;
  }

  async upnNextOutstandingReview() {
    let response = await get(this.buildApiUrl(`/reviews/v2/outstanding/next`));


    if (response.ok) {
      let result = await response.json();

      if (result.assignmentId) {
        let storedFeedback = await reviewLocalSaveService.getReview(result.assignmentId);
        this.store.dispatch(activeReviewReceived(result));


        if (storedFeedback) {
          await this.store.dispatch(reviewViewUpdated(REVIEW_TUTORIAL_STATE));
          this.store.dispatch(reviewViewUpdated(REVIEW_SURVEY_STATE));
        } else {
          this.store.dispatch(reviewViewUpdated(REVIEW_TUTORIAL_STATE));
        }
      }else{
        this.store.dispatch(reviewViewUpdated(REVIEW_DASHBOARD_STATE));
      } 
    }else{
      this.store.dispatch(reviewViewUpdated(REVIEW_DASHBOARD_STATE));
    }

    
  }

  async assignmentSurvey(id) {
    let response = await get(this.buildApiUrl(`/assignment/v2/survey/${id}`));
    let results = await response.json();
    return results;
  }

  async submitReview(review) {

    if(!networkConnection.isConnectedToInternet()){
      return { success: false, error: 'No internet connection' };

     }else{
        return post(this.buildApiUrl(`review/v2`), review)
          .then((res) => {
            return { success: res.ok };
          })
          .catch((error) => {
            return { success: false, error: error };
          });
     }
    
  }

  isSelfReview(reviewee, reviewer) {
    return reviewee.toLowerCase() == reviewer.toLowerCase();
  }

  async navigateToFeedbackSurvey(id) {
    const response = await get(this.buildApiUrl(`assignment/v2/valid/${id}`));

    if(response.ok){
      const result = await response.json(); 
      const assignment = result.assignment;

      if(assignment){
        const status = assignment.status;

        if(status === 'Completed' || status === 'Retracted') {
          announcementService.createAnnouncement('review', { warning: true, body: 'This review has already been completed.' });
        } else if(status === 'Deleted') {
          announcementService.createAnnouncement('review', { warning: true, body: 'HR no longer requires your feedback for this review. We apologise for the inconvenience.' });
        } else {
          const storedFeedback = await reviewLocalSaveService.getReview(id);
          this.store.dispatch(activeReviewReceived(assignment));

          if(storedFeedback){
            this.store.dispatch(reviewViewUpdated(REVIEW_SURVEY_STATE));
          }else{
            this.store.dispatch(reviewViewUpdated(REVIEW_TUTORIAL_STATE));
          }
        }
      }else{
        this.showAnnouncement({ warning: true, body: 'This feedback assignment does not exist. Double check you have the correct link.' });
      }
    }else{
      this.showAnnouncement({ warning: true, body: 'Could not access review.' });
    }
  }

  showAnnouncement(announcement) {
    announcementService.createAnnouncement('review', announcement);
  }
  
  async getUserDetails() {
    return get(this.buildApiUrl(`userDetails/`))
      .then((response) => {
        if (response.ok){
          return response.json()
        }
        else throw response.statusText;
      })
      .catch(error => {});
  }

  async getUserQualifications(amountOfQualification) {
    return get(this.buildApiUrl(`qualifications-by-count/${amountOfQualification}`))
    .then((response) => {
        return response.json()
    })
  }

  async getAssignmentStatus(id){
    let response = await get(this.buildApiUrl(`assignment/v2/${id}/status`));
    let results = await response.json();
    return results;
  }
}





export const REVIEW_DASHBOARD_STATE = 'dashboard';
export const REVIEW_SURVEY_STATE = 'survey';
export const REVIEW_TUTORIAL_STATE = 'tutorial';


export const QUESTION_TYPE_RATING_ONLY = 'rating-only';
export const QUESTION_TYPE_EXTENDED_RATING = 'extended-rating';
export const QUESTION_TYPE_STANDARD_ANSWER = 'standard-answer';
export const SECTION_TYPE_COMBINED_DISCUSSION = 'discussion';

export default new ReviewService();
