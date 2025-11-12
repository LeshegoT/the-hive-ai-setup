import { html } from 'lit';
import { StatefulElement } from './stateful-element';

import {
  selectTagRatings,
  selectAllFeedbackTags,
  selectUserDisplayName,
  selectUserToBeReviewed,
  selectFeedbackPositiveComment,
  selectFeedbackConstructiveComment,
  selectSelfAssignedFeedbackTemplate,
  selectFeedbackAssignmentID,
  selectFeedbackLoadingLock,
} from '../selectors/peer-feedback.selector';
import peerFeedbackService from '../services/peer-feedback.service';
import userService from '../services/user.service';
import { store } from '../store.js';
import '../components/votes.component';
import {
  removePeerFeedback,
  userToBeReviewedReceived,
  feedbackLoadingLock,
  feedbackTemplateReceived,
  feedbackPositiveCommentReceived,
  feedbackConstructiveCommentReceived,
} from '../actions/peer-feedback.action';
import { PEER_FEEDBACK_VIEW_STATE } from '../services/peer-feedback.service';
import { selectHero } from '../selectors/hero.selectors';
import './assigned-feedback-self.component';
import './tagged-feedback.component';
import { profile_placeholder } from './svg';
import './loader.component';
import announcementService from '../services/announcement.service';
import authService from '../services/auth.service';
import networkConnection from '../services/networkConnection.service';
import feedbackLocalStorageService  from '../services/save-feedback-locally.service';
const styles = html`
  <style>
    .container {
      display: flex;
      flex-direction: row;
      justify-content: center;
      margin: 0 3em;
    }

    #profile-panel {
      flex-grow: 1;
      text-align: center;
      padding: 1em 2em;
      word-wrap: break-word;
      margin-left: 3em;
      box-shadow: 2px 3px 4px var(--app-dashboard-shadow);
      background-color: white;
      border-bottom: 5px solid var(--app-dashboard-color);
      border-radius: 5px;
    }

    #profile-panel:hover {
      box-shadow: 1px 1px 4px var(--app-dashboard-shadow);
      border-bottom: 5px solid var(--app-primary-color);
      cursor: pointer;
    }

    #feedback-panel {
      flex-grow: 5;
      margin-left: 2vw;
    }

    .revieweeProfile {
      height: 7em;
      width: 7em;
      border: 1px solid var(--app-tertiary-color);
      border-radius: 100%;
      background-size: cover;
      background-position: 60%;
      margin: auto;
      margin-top: 1em;
    }

    .profile-title {
      color: var(--app-primary-color);
      margin: 5px;
      text-align: center;
      word-wrap: break-word;
    }

    .post-button {
      border: 1px solid var(--app-secondary-color);
      color: var(--app-secondary-color);
      background-color: var(--app-dashboard-panel);
      border-radius: 7px;
      width: 10vw;
      padding: 1em;
      cursor: pointer;
      font-size: medium;
      font-weight: bold;
    }

    .submit-button {
      color: var(--app-light-text-color);
      background-color: var(--app-secondary-color);
    }

    .invalid-message {
      color: var(--app-primary-color);
      font-size: medium;
      font-weight: bold;
      display: inline-block;
      white-space: pre;
      margin-bottom: 1em;
      margin-top: 0.5em;
    }

    #user-details p {
      color: var(--app-tertiary-color);
      margin: 0 0.5em;
      font-weight: 100;
      font-size: small;
    }

    #user-details {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 15em;
    }

    .buttons-container {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .buttons-container button {
      margin-left: 0.5em;
    }

    @media only screen and (max-width: 900px) {
      .container {
        flex-wrap: wrap;
        margin: 0;
      }

      #feedback-panel {
        flex-grow: 0;
        width: 100%;
        margin-left: 0;
      }

      #profile-panel {
        display: flex;
        flex-grow: 0;
        padding: 1em;
        width: 100%;
        border: none;
        border-bottom: solid 2px var(--app-dashboard-color);
        margin-left: 0;
      }

      .revieweeProfile {
        margin: 0;
        margin-right: 1em;
        margin-top: -0.5em;
      }

      .user-title {
        margin-bottom: 0.5em;
      }
      .profile-title {
        text-align: left;
      }

      .post-button {
        width: 90vw;
        margin-bottom: 1em;
      }

      #user-details {
        min-height: auto;
      }

      .buttons-container {
        flex-direction: column;
      }
    }

    @media only screen and (max-width: 400px) {
      .revieweeProfile {
        height: 5em;
        width: 5em;
        margin-top: 0.5em;
      }

      #feedback-panel {
        margin: 0.5em;
      }

      .invalid-message {
        margin-left: 1em;
        margin-top: 1em;
      }
    }
  </style>
`;
class PeerFeedbackPost extends StatefulElement {
  constructor() {
    super();
    this.tags = [];
    this.allTags = [];
    this.badges = [];
    this.invalidMessage = '';
  }
  render() {
    return html`
      ${styles}
      <section class="container">
        ${this.lock
          ? html`
              <e-loader></e-loader>
            `
          : html`
              <div id="profile-panel" @click="${(e) => this.viewUser(this.feedbacksAssignedToUser)}">
                ${this.image
                  ? html`
                      <div class="revieweeProfile" .style="background-image: url(${this.image})"></div>
                    `
                  : html`
                      <div class="revieweeProfile">${profile_placeholder}</div>
                    `}
                <div id="user-details">
                  <h4 class="user-title">${this.userDisplayName}</h4>
                  ${this.heroDetails
                    ? html`
                        <div>
                          <p>${this.heroDetails.city}</p>
                          <p>${this.heroDetails.department}</p>
                          <p>${this.heroDetails.jobTitle}</p>
                        </div>
                      `
                    : html``}
                </div>
              </div>
              <div id="feedback-panel">
                ${this.checkIfSelfReview() ? this.renderSelfFeedback() : this.renderPeerFeedback()}
              </div>
            `}
      </section>
    `;
  }

  checkIfSelfReview(){
    return this.hero.toLowerCase() === this.feedbacksAssignedToUser?.toLowerCase();
  }

  viewUser(upn) {
    store.dispatch(userToBeReviewedReceived(upn));
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_VIEW_STATE);
  }

  renderSelfFeedback() {
    return html`
      <e-assigned-feedback-self></e-assigned-feedback-self>
    `;
  }

  renderPeerFeedback() {
    return html`
      <e-tagged-feedback></e-tagged-feedback>
      <div>
        <div>
          <label class="invalid-message">${this.invalidMessage}</label>
        </div>
        <div class="buttons-container">
          <div>
            <button @click="${this.returnToPeerFeedBackInitialView}" id="postButton" type="button" class="post-button">
              Cancel
            </button>
          </div>
          <div>
          <button @click="${this.saveForLater}" id="saveForLater" type="button" class="post-button save-for-later-button">
              Save For Later
            </button>
            <button @click="${this.postFeedback}" id="postButton" type="button" class="post-button submit-button">
              Complete Review
            </button>
          </div>
        </div>
      </div>
    `;
  }

  postFeedback() {
    this.saveFeedbackProgress();
    const networkAnnouncement = { title: 'Error', body: 'Internet disconnected. Please publish again' };
    
    if (networkConnection.isConnectedToInternet() === false) {
      this.showAnnouncement(networkAnnouncement);
     } else {
      this.proceedPostFeedbackAttempt();
    }
  }

  saveForLater(){
    const savedAnnouncement = { title: 'Saved', body: 'Feedback saved for later' };
    this.saveFeedbackProgress();
    this.showAnnouncement(savedAnnouncement);
  }

  saveFeedbackProgress(){
    if (this.assignmentId){
      feedbackLocalStorageService.storeReviewerFeedbackInLocalStorage(this.assignmentId,this.positiveComment,this.constructiveComment,[],this.tags);
    }
  }


  proceedPostFeedbackAttempt() {
    this.shadowRoot.getElementById('postButton').disabled = true;
    this.invalidMessage = '';
    this.tags = this.tags.filter((tag) => tag.rating !== undefined && tag.rating !== 0);
    this.validateRatings();
    if (!this.invalidMessage) {
      if (this.template?.id != undefined) {
        peerFeedbackService
          .addAssignedPeerFeedback(this.positiveComment, this.constructiveComment, this.tags, [], this.assignmentId, this.peerUpn)
          .then((response) => {
            this.checkPostSuccess(response);
          });
      } else {
        peerFeedbackService
          .addEmployeeFeedback(this.peerUpn, this.positiveComment, this.tags)
          .then((response)=>{
             this.checkPostSuccess(response);
          })
      }
    } else {
      this.shadowRoot.getElementById('postButton').disabled = false;
    }
  }

  checkPostSuccess(response) {
    if(response.success){
      this.showAnnouncement({ title: 'Feedback', body: 'Feedback successfully published' });
      this.returnToPeerFeedBackInitialView();
    } else {
      let error = response.error ? response.error: "An unexpected error occurred, please publish again.";
      this.showAnnouncement({ title: 'Error!', body: error });
    }
  }

  validateRatings() {
    if((!this.assignedFeedback && !this.positiveComment) || (this.assignedFeedback && (!this.positiveComment || !this.constructiveComment))){
      this.invalidMessage += `* Please type your feedback first\n`;
    }

    if (this.tags.length === 0) {
      this.invalidMessage += `* Please select and rate a tag\n`;
    } else if (!this.tags.every((tag) => tag.rating)) {
      this.invalidMessage += `* Please provide a rating for each selected tag\n`;
    } else if (this.assignedFeedback && this.tags.length !== this.allTags.filter((tag) => tag.autoDisplay).length) {
      this.invalidMessage += `* Please provide a rating for each selected tag\n`;
    }
  }

  async returnToPeerFeedBackInitialView() {
    store.dispatch(feedbackLoadingLock(true));
    this.resetCachedState();

    if (this.peerUpn) {
      await peerFeedbackService.getAllFeedbacksAssignedToUser(this.hero);
      await peerFeedbackService.peersFeedbackMessages(this.peerUpn);
    } else {
      await peerFeedbackService.getAllFeedbacksAssignedToUser(this.hero);
      await peerFeedbackService.getFeedbackMessages(this.feedbacksAssignedToUser);
    }
    store.dispatch(feedbackLoadingLock(false));
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_VIEW_STATE);
  }

  resetCachedState() {
    store.dispatch(feedbackTemplateReceived(undefined));
    store.dispatch(feedbackPositiveCommentReceived(''));
    store.dispatch(feedbackConstructiveCommentReceived(''));
  }

  showAnnouncement({title, body}) {
    announcementService.createAnnouncement('none', {
      title: title,
      body: body,
    });
  }
 
  async firstUpdated() {
    store.dispatch(feedbackLoadingLock(true));
    this.shouldSetDefaultTag = true;

    this.selectedTagsRatings.forEach((tag) => {
      store.dispatch(removePeerFeedback(tag));
    });

    await peerFeedbackService.allFeedbackTags();
    await peerFeedbackService.populateDisplayName(this.peerUpn);
    userService.getImage(this.peerUpn).then((image) => (this.image = image));
    this.heroDetails = await userService.retrieveActiveDirectoryProfile(this.peerUpn);
    store.dispatch(feedbackLoadingLock(false));
  }
  
  assignIDsToRatings() {
    let retrievedFeedback = feedbackLocalStorageService.getFeedback(this.assignmentId);
    this.tags = this.selectedTagsRatings.map((tag) => {
      let templateTag = this.allTags.find((t) => t.tagName === tag.name);
      return {
        id: templateTag.tagId,
        name: tag.name,
        rating: tag.rating ? tag.rating : this.getTagRating(retrievedFeedback, templateTag.tagId),
        description: templateTag.tagDescription,
      };
    });
  }

  getTagRating(retrievedFeedback, id) {
    if (retrievedFeedback) {
      return retrievedFeedback.tags.find((tag) => tag.id === id).rating;
    } else {
      return 0;
    }
  }

  stateChanged(state) {
    this.invalidMessage = '';
    this.allTags = selectAllFeedbackTags(state);
    this.selectedTagsRatings = selectTagRatings(state);
    this.userDisplayName = selectUserDisplayName(state);
    this.feedbacksAssignedToUser = selectUserToBeReviewed(state);
    this.hero = selectHero(state);
    this.template = selectSelfAssignedFeedbackTemplate(state);
    this.assignmentId = selectFeedbackAssignmentID(state);

    this.assignedFeedback = !!(this.template?.id && this.assignmentId);

    if (this.hero != this.feedbacksAssignedToUser) {
      this.positiveComment = selectFeedbackPositiveComment(state);
      this.constructiveComment = selectFeedbackConstructiveComment(state);
      this.assignIDsToRatings();
    }
    this.lock = selectFeedbackLoadingLock(state);
  }

  static get properties() {
    return {
      allTags: Object,
      tags: { type: Array },
      invalidMessage: String,
      selectedTagsRatings: Array,
      peerUpn: String,
      userDisplayName: String,
      feedbacksAssignedToUser: Array,
      hero: String,
      template: String,
      positiveComment: String,
      constructiveComment: String,
      assignmentId: String,
      image: String,
      lock: Boolean,
      heroDetails: Object,
    };
  }
}

window.customElements.define('e-peer-feedback-post', PeerFeedbackPost);
