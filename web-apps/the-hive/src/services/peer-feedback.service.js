import { get, patch, post, del } from './shared';
import authService from './auth.service.js';
import { BaseService } from './base.service';
import announcementService from '../services/announcement.service';

import {
  feedbackTagsReceived,
  publishedFeedbackReceived,
  feedbackState,
  feedbackReceived,
  feedbacksAssignedToUserReceived,
  userDisplayNameReceived,
  userTeamMembersReceived,
  assignedSelfReviewReceived,
  assignedSelfFeedbackStateReceived,
  feedbackTemplateReceived,
  userToBeReviewedReceived,
  feedbackAssignmentIdReceived,
  feedbackRetractionRecieved,
} from '../actions/peer-feedback.action';
export class PeerFeedbackService extends BaseService {
  constructor() {
    super();
  }

  async postFeedback(request, {upn, assignedToUser}) {
    return post(this.buildApiUrl(`feedback`), request).then((response) => {
      if (response.ok) {
        if(upn){
          this.peersFeedbackMessages(upn);
        }
        if (assignedToUser){
          this.getAllFeedbacksAssignedToUser(assignedToUser);
        }
          return response.json().then((json) => ({ success: true, data: json }));
        } else {
          return response.json().then((json) => ({ success: false,  error: json.errorMessage }));
        }
      },
      (error) => {
        return { success: false, error: error };
      }
    );
  }

  async checkAndMarkFeedbackAssignmentAsViewed(assignmentId) {
    const response = await patch(this.buildApiUrl(`assignment/${assignmentId}/status`));
    return response.status;
  }

  async allFeedbackTags() {
    let response = await get(this.buildApiUrl(`all-tags`));
    let results = await response.json();
    this.store.dispatch(feedbackTagsReceived(results));
    return results;
  }

  async peersFeedbackMessages(upn) {
    if (upn) {
      let response = await get(this.buildApiUrl(`feedback/${upn}`));
      let result = await response.json();
      this.store.dispatch(publishedFeedbackReceived(result));
    } else {
      console.error('No upn provided');
    }
  }

  updateFeedbackState(newState) {
    this.store.dispatch(feedbackState(newState));
  }

  async addPeerFeedbackReply(reply, messageId) {
    let request = { reply, messageId };
    await post(this.buildApiUrl('addPeerFeedbackReply'), request);
  }

  async peerFeedbackPublish(messageId) {
    let request = { messageId };
    return await post(this.buildApiUrl('feedback-publish'), request);
  }

  async getFeedbackMessages(upn) {
    let response = await get(this.buildApiUrl(`feedback/${upn}`));
    let messages = await response.json();
    this.store.dispatch(feedbackReceived(messages));
  }

  async navigateFeedbackAssignment(id) {
    let response = await get(this.buildApiUrl(`assignment/${id}`));
    let result = await response.json();

    if (Object.keys(result).length === 0) {
      announcementService.createAnnouncement('none', {
        title: 'Assigned Feedback',
        body: `Could not access assignment`,
      });
      this.updateFeedbackState(PEER_FEEDBACK_HOME_STATE);
    } else if (result.messageID !== null) {
      announcementService.createAnnouncement('none', {
        title: 'Assigned Feedback',
        body: `This feedback has already been completed.`,
      });
      this.updateFeedbackState(PEER_FEEDBACK_HOME_STATE);
    } else {
      this.store.dispatch(userToBeReviewedReceived(result.reviewee));
      this.store.dispatch(
        feedbackTemplateReceived({ id: result.feedbackAssignmentTemplateID, name: result.templateName })
      );
      this.store.dispatch(feedbackAssignmentIdReceived(result.feedbackAssignmentID));
      this.updateFeedbackState(PEER_FEEDBACK_POST_STATE);
    }
  }

  async getAllFeedbacksAssignedToUser(upn) {
    let response = await get(this.buildApiUrl(`user-assigned-feedbacks/${upn}`));
    let result = await response.json();
    this.store.dispatch(feedbacksAssignedToUserReceived(result));
  }

  async populateDisplayName(upn) {
    let response = await get(this.buildApiUrl(`display-name/${upn}`));
    let result = await response.json();
    this.store.dispatch(userDisplayNameReceived(result));
  }

  async populateTeamMembers() {
    let response = await get(this.buildApiUrl(`feedback/team-members`));
    let result = await response.json();
    this.store.dispatch(userTeamMembersReceived(result));
  }

  async getAssignedSelfReviewQuestions(id) {
    let result;
    if (id == undefined) {
      result = [];
    } else {
      let response = await get(this.buildApiUrl(`/feedback/questions/${id}`));
      result = await response.json();
    }

    this.store.dispatch(assignedSelfReviewReceived(result));
  }

  updateAssignedSelfFeedbackState(newState) {
    this.store.dispatch(assignedSelfFeedbackStateReceived(newState));
  }
  
  async addEmployeeFeedback(heroUserPrincipleName, text, tags) {
    return this.postFeedback({
      about: heroUserPrincipleName,
      by: authService.getUserPrincipleName(),
      createdAt: new Date(),
      comment: text,
      tags: tags,
    }, { assignedToUser: heroUserPrincipleName });
  }

  async addAssignedSelfFeedback(commentPositive, commentConstructive, tags, answers, assignmentId) {
    return this.postFeedback({
      about: authService.getUserPrincipleName(),
      by: authService.getUserPrincipleName(),
      createdAt: new Date(),
      positiveComment: commentPositive,
      constructiveComment: commentConstructive,
      tags: tags,
      answers: answers,
      assignmentId: assignmentId,
    }, { upn: authService.getUserPrincipleName(), assignedToUser: authService.getUserPrincipleName() });
  }

  async addAssignedPeerFeedback(commentPositive, commentConstructive, tags, answers, assignmentId, upn) {
    return this.postFeedback({
      about: upn,
      by: authService.getUserPrincipleName(),
      createdAt: new Date(),
      positiveComment: commentPositive,
      constructiveComment: commentConstructive,
      tags: tags,
      answers: answers,
      assignmentId: assignmentId,
    }, { upn, assignedToUser: authService.getUserPrincipleName() });
  }

  async retractFeedbackMessage(messageId, reasonForDelete, aboutUpn, byUpn) {
    del(this.buildApiUrl(`feedback/${messageId}`), reasonForDelete).then(() => {
      announcementService.createAnnouncement('none', {
        title: 'Feedback Retraction',
        body: `Feedback successfully removed`,
      });
      if (aboutUpn != byUpn) {
        this.peersFeedbackMessages(aboutUpn);
      } else {
        this.getFeedbackMessages(byUpn);
      }

      this.getAllFeedbacksAssignedToUser(byUpn);    
    });
  }

  async getAllRetractioReason() {
    let response = await get(this.buildApiUrl(`retraction`));
    let results = await response.json();
    this.store.dispatch(feedbackRetractionRecieved(results));
  }
}

export const PEER_FEEDBACK_HOME_STATE = 'home';
export const PEER_FEEDBACK_VIEW_STATE = 'view_peer';
export const PEER_FEEDBACK_POST_STATE = 'post';
export const ASSIGNED_SELF_FEEDBACK_ABILITY_STATE = 'ability';

export default new PeerFeedbackService();
