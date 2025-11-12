import { BaseService } from './base.service';
import ConfigService from '../services/config.service';
export class FeedbackLocalStorageService extends BaseService {
  constructor() {
    super();
  }

  storeReviewerFeedbackInLocalStorage(feedackassignmentId, positiveComment, constructiveComment, answers, tags) {
    const reviewerFeedback = {
      assignmentId: feedackassignmentId,
      reviewerPositiveComment: positiveComment,
      reviewerConstructiveComment: constructiveComment,
      answers,
      tags,
    };

    localStorage.setItem(`feedackassignmentId-${feedackassignmentId}`, JSON.stringify(reviewerFeedback));
  }

  getFeedback(feedackassignmentId) {
    let retrieveFeedback = ConfigService.config.PEER_FEEDBACK_LOCAL_SAVE_ENABLED ? JSON.parse(localStorage.getItem(`feedackassignmentId-${feedackassignmentId}`)) : null;

    return retrieveFeedback ? retrieveFeedback : undefined;
  }

  findSpecificFeedbackAnswer(questionId, feedackassignmentId) {
    let retrievedAnswers = ConfigService.config.PEER_FEEDBACK_LOCAL_SAVE_ENABLED ? JSON.parse(localStorage.getItem(`feedackassignmentId-${feedackassignmentId}`)) : null;
    return retrievedAnswers  ? retrievedAnswers.answers.find((a) => a.questionId === questionId) : undefined;
  }

  removeSpecificFeedbackInLocalStorage(feedackassignmentId) {
    localStorage.removeItem(`feedackassignmentId-${feedackassignmentId}`);
  }
}

export default new FeedbackLocalStorageService ();
