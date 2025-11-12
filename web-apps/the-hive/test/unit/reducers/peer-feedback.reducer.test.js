import { expect } from '@open-wc/testing';
import { peerFeedback } from '../../../src/reducers/peer-feedback.reducer';
import { initialise_reducer_test, test_reducer_action } from '../shared/reducer';
import {
  FEEDBACK_TEMPLATE_RECEIVED,
  FEEDBACK_POSITIVE_COMMENT_RECEIVED,
  FEEDBACK_CONSTRUCTIVE_COMMENT_RECEIVED,
  FEEDBACK_SELF_QUESTIONS_AND_ANSWERS_RECEIVED,
  FEEDBACK_TAGS_RECEIVED,
  PEER_FEEDBACK_TAGS_RECEIVED,
  FEEDBACK_STATE_UPDATED,
  SEARCH_EMAIL,
  SEARCH_VALIDATION,
  SEARCH_VALIDATION_MESSAGE,
  PUBLISHED_FEEDBACK_RECEIVED,
  FEEDBACK_RECEIVED,
  FEEDBACKS_ASSIGNED_TO_USER_RECEIVED,
  USER_TO_BE_REVIEWED_RECEIVED,
  USER_DISPLAY_NAME_RECEIVED,
  USER_TEAM_MEMBERS_RECEIVED,
} from '../../../src/actions/peer-feedback.action';


describe('Reducer - Peer Feedback', () => {
  let initial_state = {
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

  let test_reducer_state = initialise_reducer_test(peerFeedback, initial_state);

  it('should initialise correctly.', () => {
    let state = peerFeedback(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a PEER_FEEDBACK_TAGS_RECEIVED action.`, () => {
    let action = {
      type: PEER_FEEDBACK_TAGS_RECEIVED,
      tags: ["tag"]
    };

    let delta = {
      peerTags: action.tags
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a FEEDBACK_TAGS_RECEIVED action.`, () => {
    let action = {
      type: FEEDBACK_TAGS_RECEIVED,
      tags: ["tag"]
    };

    let delta = {
      all: action.tags
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a SEARCH_EMAIL action.`, () => {
    let action = {
      type: SEARCH_EMAIL,
      email: "email"
    };

    let delta = {
      all: action.email
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a SEARCH_VALIDATION action.`, () => {
    let action = {
      type: SEARCH_VALIDATION,
      search: "search"
    };

    let delta = {
      valid: action.search
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a SEARCH_VALIDATION_MESSAGE action.`, () => {
    let action = {
      type: SEARCH_VALIDATION_MESSAGE,
      message: ["message"]
    };

    let delta = {
      message: action.message
    };

    test_reducer_state(action, delta);
  });
  
  it(`should update the state on a PUBLISHED_FEEDBACK_RECEIVED action.`, () => {
    let action = {
      type: PUBLISHED_FEEDBACK_RECEIVED,
      messages: ["message"]
    };

    let delta = {
      messages: action.messages
    };

    test_reducer_state(action, delta);
  });
  
  it(`should update the state on a FEEDBACK_RECEIVED action.`, () => {
    let action = {
      type: FEEDBACK_RECEIVED,
       messages: ["message"]
    };

    let delta = {
      feedback: action.messages
    };

    test_reducer_state(action, delta);
  });
  
  it(`should update the state on a FEEDBACKS_ASSIGNED_TO_USER_RECEIVED action.`, () => {
    let action = {
      type: FEEDBACKS_ASSIGNED_TO_USER_RECEIVED,
      assignedFeedbacks: ["feedback"]
    };

    let delta = {
      feedbacksAssignedToUser: action.assignedFeedbacks
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a USER_TO_BE_REVIEWED_RECEIVED action.`, () => {
    let action = {
      type: USER_TO_BE_REVIEWED_RECEIVED,
      reviewedUser: "user"
    };

    let delta = {
      userToBeReviewed: action.reviewedUser,
    };

    test_reducer_state(action, delta);
  });

  test_reducer_action(peerFeedback, initial_state, FEEDBACK_TEMPLATE_RECEIVED, { template: "template" });
  test_reducer_action(peerFeedback, initial_state, FEEDBACK_POSITIVE_COMMENT_RECEIVED, { positiveComment: 'positiveComment' });
  test_reducer_action(peerFeedback, initial_state, FEEDBACK_CONSTRUCTIVE_COMMENT_RECEIVED, { constructiveComment: 'constructiveComment' });
  test_reducer_action(peerFeedback, initial_state, FEEDBACK_SELF_QUESTIONS_AND_ANSWERS_RECEIVED, { answers: "answers" });
  test_reducer_action(peerFeedback, initial_state, FEEDBACK_STATE_UPDATED, { feedbackState: "feedbackState" });
  test_reducer_action(peerFeedback, initial_state, USER_DISPLAY_NAME_RECEIVED, { userDisplayName: "userDisplayName" });
  test_reducer_action(peerFeedback, initial_state, USER_TEAM_MEMBERS_RECEIVED, { userTeamMembers: "userTeamMembers" });
});
