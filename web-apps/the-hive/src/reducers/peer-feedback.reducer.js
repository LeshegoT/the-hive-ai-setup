import {
  FEEDBACK_TAGS_RECEIVED,
  PEER_FEEDBACK_TAGS_RECEIVED,
  FEEDBACK_TAG_RATING_RECEIVED,
  PUBLISHED_FEEDBACK_RECEIVED,
  REMOVE_PEER_FEEDBACK_TAGS,
  SEARCH_EMAIL,
  SEARCH_VALIDATION,
  SEARCH_VALIDATION_MESSAGE,
  FEEDBACK_STATE_UPDATED,
  FEEDBACK_RECEIVED,
  FEEDBACKS_ASSIGNED_TO_USER_RECEIVED,
  USER_TO_BE_REVIEWED_RECEIVED,
  USER_DISPLAY_NAME_RECEIVED,
  USER_TEAM_MEMBERS_RECEIVED,
  ASSIGNED_SELF_REVIEW_RECEIVED,
  ASSIGNED_SELF_FEEDBACK_STATE_RECEIVED,
  FEEDBACK_TEMPLATE_RECEIVED,
  FEEDBACK_POSITIVE_COMMENT_RECEIVED,
  FEEDBACK_CONSTRUCTIVE_COMMENT_RECEIVED,
  FEEDBACK_SELF_QUESTIONS_AND_ANSWERS_RECEIVED,
  FEEDBACK_ASSIGNMENT_ID_RECEIVED,
  FEEDBACK_LOADING_LOCK,
  FEEDBACK_RETRACT_REASON,
} from '../actions/peer-feedback.action';

const INITIAL_STATE = {
  all: [],
  peerTags: [],
  messages: [],
  tagRating: [],
  valid: false,
  message: undefined,
  feedbackState: undefined,
  feedback: [],
  feedbacksAssignedToUser: [],
  userToBeReviewed: undefined,
  userDisplayName: undefined,
  userTeamMembers: [],
  assignedSelfReviewQuestions: [],
  assignedSelfFeedbackState: undefined,
  template: undefined,
  positiveComment: undefined,
  constructiveComment: undefined,
  answers: [],
  assignmentId: undefined,
  lock: false,
  retractionReasons: [],
};

export const peerFeedback = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case FEEDBACK_LOADING_LOCK:
      return {
        ...state,
        lock: action.lock,
      };
    case FEEDBACK_ASSIGNMENT_ID_RECEIVED:
      return {
        ...state,
        assignmentId: action.assignmentId,
      };
    case FEEDBACK_TEMPLATE_RECEIVED:
      return {
        ...state,
        template: action.template,
      };
    case FEEDBACK_POSITIVE_COMMENT_RECEIVED:
      return {
        ...state,
        positiveComment: action.positiveComment,
      };
    case FEEDBACK_CONSTRUCTIVE_COMMENT_RECEIVED:
      return {
        ...state,
        constructiveComment: action.constructiveComment,
      };
    case FEEDBACK_SELF_QUESTIONS_AND_ANSWERS_RECEIVED:
      return {
        ...state,
        answers: action.answers,
      };
    case FEEDBACK_TAGS_RECEIVED:
      return {
        ...state,
        all: action.tags,
      };
    case PEER_FEEDBACK_TAGS_RECEIVED:
      return {
        ...state,
        peerTags: action.tags,
      };
    case FEEDBACK_TAG_RATING_RECEIVED:
      return {
        ...state,
        tagRating: updateTagRating(state.tagRating, action.tagRating.tagRating),
      };
    case REMOVE_PEER_FEEDBACK_TAGS:
      return {
        ...state,
        tagRating: removeTagRating([...state.tagRating], action.tagRating.name),
      };
    case FEEDBACK_STATE_UPDATED:
      return {
        ...state,
        feedbackState: action.feedbackState,
      };
    case SEARCH_EMAIL:
      return {
        ...state,
        all: action.email,
      };
    case SEARCH_VALIDATION:
      return {
        ...state,
        valid: action.search,
      };
    case SEARCH_VALIDATION_MESSAGE:
      return {
        ...state,
        message: action.message,
      };
    case PUBLISHED_FEEDBACK_RECEIVED:
      return {
        ...state,
        messages: action.messages,
      };
    case PUBLISHED_FEEDBACK_RECEIVED:
      return {
        ...state,
        messages: action.messages,
      };
    case FEEDBACK_RECEIVED:
      return {
        ...state,
        feedback: action.messages,
      };
    case FEEDBACKS_ASSIGNED_TO_USER_RECEIVED:
      return {
        ...state,
        feedbacksAssignedToUser: action.assignedFeedbacks,
      };
    case USER_TO_BE_REVIEWED_RECEIVED:
      return {
        ...state,
        userToBeReviewed: action.reviewedUser,
      };
    case USER_DISPLAY_NAME_RECEIVED:
      return {
        ...state,
        userDisplayName: action.userDisplayName,
      };
    case USER_TEAM_MEMBERS_RECEIVED:
      return {
        ...state,
        userTeamMembers: action.userTeamMembers,
      };
    case ASSIGNED_SELF_REVIEW_RECEIVED:
      return {
        ...state,
        assignedSelfReviewQuestions: action.assignedSelfReviewQuestions,
      };
    case ASSIGNED_SELF_FEEDBACK_STATE_RECEIVED:
      return {
        ...state,
        assignedSelfFeedbackState: action.assignedSelfFeedbackState,
      };
    case FEEDBACK_RETRACT_REASON:
      return {
        ...state,
        retractionReasons: action.retractionReasons,
      };

    default:
      return state;
  }
};

const updateTagRating = (tagRatings, newRating) => {
  const index = tagRatings.findIndex(tag => tag.name === newRating.tagName);

  if (index >= 0) {
    tagRatings[index] = { name: newRating.tagName, rating: newRating.rating , id: newRating.id, description: newRating.description};
  } else {
    tagRatings.push({
      name: newRating.tagName,
      rating: newRating.rating,
      id: newRating.id,
      description: newRating.description,
    });
  }
  return tagRatings;
};

const removeTagRating = (tagRatings, removedRatingName) => { 
  tagRatings = tagRatings.filter((messages) => messages.name !== removedRatingName);
  return tagRatings;
};