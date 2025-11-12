import { BaseService } from './base.service';
import { get, post , del} from './shared';
export class ReviewLocalSaveService extends BaseService {
  async storeReview(review) {
    const retrievedReviewJson = localStorage.getItem(`feedback-${review.assignmentId}`);

    const reviewToBeSavedJson = JSON.stringify(review);
    if(retrievedReviewJson === reviewToBeSavedJson) {
      // Do not save as nothing has changed
    } else {
      localStorage.setItem(`feedback-${review.assignmentId}`, JSON.stringify(review));
      await this.storeAzureReviewResponse(review);
    }    
  }

  async storeReviewAnswer(answer, feedackassignmentId) {
    let retrievedReview = JSON.parse(localStorage.getItem(`feedback-${feedackassignmentId}`));

    if( retrievedReview != null ){
        let existsingAnswerIndex = retrievedReview.answers.map((savedAnswer)=> savedAnswer.id).indexOf(answer.id);

        if (existsingAnswerIndex == -1) {
            retrievedReview.answers.push(answer);
        }else{
            retrievedReview.answers[existsingAnswerIndex] = answer;
        }

      return this.storeReview(retrievedReview);
    }
  }

  async updateReviewAnonymousIndication(anonymous, feedackassignmentId) {
    let retrievedReview = JSON.parse(localStorage.getItem(`feedback-${feedackassignmentId}`));

    if (retrievedReview != null) {
      retrievedReview.anonymous = anonymous;
      return this.storeReview(retrievedReview);
    }
  }

  async updateQuestionTotal(total, feedbackAssignmentId){
    let retrievedReview = JSON.parse(localStorage.getItem(`feedback-${feedbackAssignmentId}`));

    if (retrievedReview != null) {
      retrievedReview.questionTotal = total;
      return this.storeReview(retrievedReview);
    }
  }

  async getReview(feedackassignmentId, forceLocal = false) {
    let localStoredReview = JSON.parse(localStorage.getItem(`feedback-${feedackassignmentId}`));

    if (!localStoredReview || (!forceLocal && this.isLocalStorageOlderThanFiveMinutes(localStoredReview))) {

        let azureReviewStoredProgress = await this.retrieveAzureReviewResponse(feedackassignmentId);
        if (azureReviewStoredProgress) {
          localStorage.setItem(
            `feedback-${feedackassignmentId}`,
            JSON.stringify({ ...azureReviewStoredProgress, retrievedAt: new Date() })
          );
          return azureReviewStoredProgress;
        }

    }

    return localStoredReview;
  }

  isLocalStorageOlderThanFiveMinutes(localStoredReview) {
    const FIVE_MINUTES = 5 * 60 * 1000;
    const now = new Date();
    const retrievedAt = localStoredReview?.retrievedAt ? new Date(localStoredReview.retrievedAt) : new Date();
    return now - retrievedAt > FIVE_MINUTES;
  }

  retrieveReviewAnswer(questionId, feedackassignmentId) {
    let retrievedAnswers = JSON.parse(localStorage.getItem(`feedback-${feedackassignmentId}`));
    return retrievedAnswers?.answers.find((a) => a.id === questionId) ;
  }

  retrieveReviewAnonymousIndication(feedackassignmentId) {
    let retrievedAnswers = JSON.parse(localStorage.getItem(`feedback-${feedackassignmentId}`));
    return retrievedAnswers?.anonymous;
  }

  removeSpecificFeedbackInLocalStorage(feedackassignmentId) {
    localStorage.removeItem(`feedback-${feedackassignmentId}`);
    this.removeAzureReviewResponse(feedackassignmentId);
  }

  async storeAzureReviewResponse(review) {
    post(this.buildApiUrl(`/review/progress/${review.assignmentId}`), review);
  }

  async retrieveAzureReviewResponse(assignmentId) {
    try {
      let response = await get(this.buildApiUrl(`/review/progress/${assignmentId}`));
      if (response.ok) {
        let result = await response.json();
        if (result && Object.keys(result).length !== 0) {
          return result;
        }else{
          return false;
        }
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async removeAzureReviewResponse(assignmentId) {
    await del(this.buildApiUrl(`/review/progress/${assignmentId}`));
  }
}

export default new ReviewLocalSaveService();
