export const FEEDBACK_TAGS_RECEIVED = 'FEEDBACK_TAGS_RECEIVED';
export const FEEDBACK_TAG_RATING_RECEIVED = 'FEEDBACK_TAG_RATING_RECEIVED';
export const REMOVE_PEER_FEEDBACK_TAGS = 'REMOVE_PEER_FEEDBACK_TAGS';
export const SEARCH_EMAIL = 'SEARCH_EMAIL';
export const SEARCH_VALIDATION = 'SEARCH_VALIDATION';
export const SEARCH_VALIDATION_MESSAGE = 'SEARCH_VALIDATION_MESSAGE';
export const FEEDBACK_STATE_UPDATED = 'FEEDBACK_STATE_UPDATED';
export const FEEDBACK_RECEIVED = 'FEEDBACK_RECEIVED';
export const PEER_FEEDBACK_TAGS_RECEIVED = 'PEER_FEEDBACK_TAGS_RECEIVED';
export const PUBLISHED_FEEDBACK_RECEIVED = 'PUBLISHED_FEEDBACK_RECEIVED';
export const FEEDBACKS_ASSIGNED_TO_USER_RECEIVED = 'FEEDBACKS_ASSIGNED_TO_USER_RECEIVED';
export const USER_TO_BE_REVIEWED_RECEIVED = 'USER_TO_BE_REVIEWED_RECEIVED';
export const USER_DISPLAY_NAME_RECEIVED = 'USER_DISPLAY_NAME_RECEIVED';
export const USER_TEAM_MEMBERS_RECEIVED = 'USER_TEAM_MEMBERS_RECEIVED';
export const ASSIGNED_SELF_REVIEW_RECEIVED = 'ASSIGNED_SELF_REVIEW_RECEIVED';
export const ASSIGNED_SELF_FEEDBACK_STATE_RECEIVED = 'ASSIGNED_SELF_FEEDBACK_STATE_RECEIVED';
export const FEEDBACK_TEMPLATE_RECEIVED = 'FEEDBACK_TEMPLATE_RECEIVED';
export const FEEDBACK_POSITIVE_COMMENT_RECEIVED = 'FEEDBACK_POSITIVE_COMMENT_RECEIVED';
export const FEEDBACK_CONSTRUCTIVE_COMMENT_RECEIVED = 'FEEDBACK_CONSTRUCTIVE_COMMENT_RECEIVED';
export const FEEDBACK_SELF_QUESTIONS_AND_ANSWERS_RECEIVED = "FEEDBACK_SELF_QUESTIONS_AND_ANSWERS_RECEIVED";
export const FEEDBACK_ASSIGNMENT_ID_RECEIVED = 'FEEDBACK_ASSIGNMENT_ID_RECEIVED';
export const FEEDBACK_LOADING_LOCK = 'FEEDBACK_LOADING_LOCK';
export const FEEDBACK_RETRACT_REASON = 'FEEDBACK_RETRACT_REASON';

export const feedbackRetractionRecieved = (retractionReasons) => {
  return {
    type: FEEDBACK_RETRACT_REASON,
    retractionReasons,
  };
};

export const feedbackLoadingLock = (lock) => {
  return {
    type: FEEDBACK_LOADING_LOCK,
    lock,
  };
};

export const feedbackAssignmentIdReceived = (assignmentId) => {
  return {
    type: FEEDBACK_ASSIGNMENT_ID_RECEIVED,
    assignmentId,
  };
};

export const feedbackTemplateReceived = (template) => {
  return {
    type: FEEDBACK_TEMPLATE_RECEIVED,
    template,
  };
};

export const feedbackTagsReceived = (tags) => {
  return {
    type: FEEDBACK_TAGS_RECEIVED,
    tags,
  };
};


export const peerFeedbackTagsReceived = (tags) => {
  return {
    type: PEER_FEEDBACK_TAGS_RECEIVED,
    tags,
  };
};


export const publishedFeedbackReceived = (messages) => {
  return {
    type: PUBLISHED_FEEDBACK_RECEIVED,
    messages,
  };
};

export const feedbackTagRating = (tagRating) => {
  return {
    type: FEEDBACK_TAG_RATING_RECEIVED,
    tagRating,
  };
};

export const removePeerFeedback = (tagRating) => {
  return {
    type: REMOVE_PEER_FEEDBACK_TAGS,
    tagRating,
  };
};

export const searchEmail = (email) => {
  return {
    type: SEARCH_EMAIL,
    email,
  };
};

export const searchValidation = (search) => {
  return {
    type: SEARCH_VALIDATION,
    search,
  };
};

export const searchValidationMessage = (message) => {
  return {
    type: SEARCH_VALIDATION_MESSAGE,
    message,
  };
};

export const feedbackState = (feedbackState) => {
  return {
    type: FEEDBACK_STATE_UPDATED,
    feedbackState,
  };
};

export const peerUpn = (peerUpn) => {
  return {
    type: FEEDBACK_PEER_UPN,
    peerUpn,
  };
};

export const feedbackReceived = (messages) => {
  return {
    type: FEEDBACK_RECEIVED,
    messages,
  };
};

export const feedbacksAssignedToUserReceived = (assignedFeedbacks) => {
  assignedFeedbacks = assignedFeedbacks.map(assignedFeedback => {
    let feedbackDeadline = new Date(assignedFeedback.feedbackDeadline);
    return {
      ...assignedFeedback,
      feedbackDeadline
    }
  });
  return {
    type: FEEDBACKS_ASSIGNED_TO_USER_RECEIVED,
    assignedFeedbacks,
  };
};

export const userToBeReviewedReceived = (reviewedUser) => {
  return {
    type: USER_TO_BE_REVIEWED_RECEIVED,
    reviewedUser,
  };
};

export const userDisplayNameReceived = (userDisplayName) => {
  return {
    type: USER_DISPLAY_NAME_RECEIVED,
    userDisplayName,
  };
};

export const userTeamMembersReceived = (userTeamMembers) => {
  return {
    type: USER_TEAM_MEMBERS_RECEIVED,
    userTeamMembers
  }
};

export const assignedSelfReviewReceived = (assignedSelfReviewQuestions) => {
  return {
    type: ASSIGNED_SELF_REVIEW_RECEIVED,
    assignedSelfReviewQuestions
  }
};

export const assignedSelfFeedbackStateReceived = (assignedSelfFeedbackState) => {
  return {
    type: ASSIGNED_SELF_FEEDBACK_STATE_RECEIVED,
    assignedSelfFeedbackState
  }
}


export const feedbackPositiveCommentReceived = (positiveComment) => {
  return {
    type: FEEDBACK_POSITIVE_COMMENT_RECEIVED,
    positiveComment,
  };
};

export const feedbackConstructiveCommentReceived = (constructiveComment) => {
  return {
    type: FEEDBACK_CONSTRUCTIVE_COMMENT_RECEIVED,
    constructiveComment,
  };
};

  export const feedbackSelfQuestionsAndAnswersReceived = (answers) => {
  return {
    type: FEEDBACK_SELF_QUESTIONS_AND_ANSWERS_RECEIVED,
    answers,
  };
}