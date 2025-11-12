import { html, LitElement } from 'lit';
import { shared } from '../styles';
import './feedback-messages.component';
import {
  selectPublishedFeedbackMessages,
  selectUserDisplayName,
  selectUserAssignedFeedbacks,
  selectFeedbackLoadingLock,
} from '../selectors/peer-feedback.selector';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import peerFeedbackService from '../services/peer-feedback.service.js';
import { PEER_FEEDBACK_POST_STATE, PEER_FEEDBACK_HOME_STATE } from '../services/peer-feedback.service';
import { profile_placeholder } from './svg';
import userService from '../services/user.service';
import {
  feedbackTemplateReceived,
  userToBeReviewedReceived,
  feedbackAssignmentIdReceived,
  feedbackLoadingLock,
} from '../actions/peer-feedback.action';
import './gear-list-item.component';
import './hex.component';
import { selectHero } from '../selectors/hero.selectors';
import './loader.component';

const styles = html`
  <style>
    .container {
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
      margin: 0 3em;
    }

    .icon {
      filter: invert(1);
      width: 1em;
      margin-left: 0.5em;
    }

    #home-icon {
      width: 1em;
      margin-left: 0.5em;
    }

    #profile-panel {
      flex-grow: 1;
      height: 660px;
      max-width: fit-content;
      text-align: center;
      padding: 2em 1em;
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
    }

    #message-panel {
      flex-grow: 5;
      height: 660px;
      margin-left: 2vw;
      max-width: 75vw;
      word-wrap: break-word;
    }

    .profile-title {
      color: var(--app-primary-color);
      margin: 5px;
      text-align: center;
      word-wrap: break-word;
    }

    .feedback-button {
      display: flex;
      justify-content: center;
    }

    .give-feedback {
      align-self: flex-end;
      justify-content: center;
      background: var(--app-header-background-color);
      color: var(--app-dashboard-color);
      font-size: 1em;
      padding: 0.56em 0.94em;
      border-radius: 7px;
      border: 1px solid var(--app-dashboard-color);
      width: 12em;
      margin-top: 1em;
    }

    .give-feedback:hover {
      border: 1px solid var(--app-primary-color);
      color: var(--app-primary-color);
      cursor: pointer;
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

    .pagetitle {
      width: 90%;
      margin: auto;
      margin-bottom: 2em;
      color: var(--app-tertiary-color);
      border-bottom: 2px solid var(--app-tertiary-color);
    }

    .no-published-feedback {
      display: flex;
      flex-direction: row;
      justify-content: center;
    }

    .gearList:nth-child(odd) {
      margin: 0 0em 0.5em 0;
    }

    .gearList:nth-child(even) {
      margin: -1.5em 0em 0em -0.5em;
    }

    e-gear-list-item:first-child {
      margin-top: 3em;
    }


    @media only screen and (max-width: 1000px) {
      .container {
        margin: 0;
      }
    }

    @media only screen and (max-width: 900px) {
      #profile-panel {
        margin-left: 1em;
      }

      #message-panel {
        max-width: 75vw;
      }

      .give-feedback {
        width: 15vw;
      }

      .revieweeProfile {
        margin: 0;
        margin-right: 1em;
        margin-top: -0.5em;
      }

      .user-title {
        margin-bottom: 0.5em;
      }

      .pagetitle h2 {
        font-size: medium;
      }
    }

    @media only screen and (max-width: 700px) {
      .container {
        flex-wrap: wrap;
        margin-top: -2em;
      }

      #profile-panel {
        flex-grow: 0;
        max-width: 85vw;
        height: fit-content;
        margin-left: 0;

        display: flex;
        flex-direction: column;
      }

      #message-panel {
        flex-grow: 0;
        max-width: 85vw;
        margin-left: 0;
        margin-top: 2em;
        height: fit-content;
      }

      .give-feedback {
        width: 65vw;
      }

      .revieweeProfile {
        height: 5em;
        width: 5em;
        margin: auto;
        margin-top: 0.5em;
      }

      .give-feedback {
        font-size: small;
      }
    }
  </style>
`;

class PeerFeedbackView extends connect(store)(LitElement) {
  render() {
    return html`
      ${styles}
      <section class="container">
        <div id="profile-panel">
          ${this.image
            ? html`
                <div class="revieweeProfile" .style="background-image: url(${this.image})"></div>
              `
            : html`
                <div class="revieweeProfile">${profile_placeholder}</div>
              `}
          <div>
            <h4 class="user-title">${this.userDisplayName}</h4>
          </div>
          ${this.feedbacksAssignedToUser.length > 0
            ? html`
                ${this.renderFeedbackAssignments()}
              `
            : html``}
          <div class="feedback-button">
            <button class="give-feedback" type="button" @click="${(e) =>this.leaveFeedback('no-template' , undefined )}">
              ${this.hero == this.peerUpn ? html `Self Feedback` :  html `Give Feedback`}
              <img src="../../images/icons/peer-feedback.svg" class="icon" />
            </button>
          </div>
          <div class="feedback-button">
            <button class="give-feedback" @click=${(e) => this.navigateHome()}>
              Feedback Home
              <img src="../../images/icons/home.svg" id="home-icon" />
            </button>
          </div>
        </div>

        <div id="message-panel">
          <span style="border-bottom: solid 1px black;">
            <h1 class="pagetitle">What People Said About ${this.userDisplayName}</h1>
          </span>

          ${this.messages && !!this.messages.length
            ? html`
                <e-feedback-messages
                  .messages=${this.messages}
                  .feedbackState=${this.feedbackState}
                ></e-feedback-messages>
              `
            : html`
                ${this.lock 
              ? html `<e-loader></e-loader>` 
              : html `
                <div class="no-published-feedback">
                  <h4>${this.userDisplayName} does not have any feedback.</h4>
                </div>` 
              }
            `}
        </div>
      </section>
    `;
  }

  renderFeedbackAssignments() {
    return html`
      ${this.feedbacksAssignedToUser &&
      this.feedbacksAssignedToUser.map(
        (assignedFeedback) =>
          html`
            ${assignedFeedback.messageId === null
              ? html`
                  <e-gear-list-item
                    .item=${{
                      name: "Requested Feedback",
                      subName: this.displayFeedbackDueDate(assignedFeedback.feedbackDeadline).values[0],
                      icon: 'images/logos/review.svg',
                      displayNumber: 0,
                    }}
                    class="${this.displayFeedbackDueDate(assignedFeedback.feedbackDeadline).values[0] == 'Overdue'
                      ? 'gearList overdueGearListItem'
                      : 'gearList'}
                    id="assignedFeedback"
                    @click="${(e) =>
                      this.leaveFeedback(
                        { id: assignedFeedback.templateId, name: assignedFeedback.templateName },
                        assignedFeedback.feedbackAssignmentId
                      )}"
                  ></e-gear-list-item>
                `
              : html``}
          `
      )}
    `;
  }

  displayFeedbackDueDate(feedbackExpirationDate) {
    return html`
      ${this.daysRemaining(feedbackExpirationDate) > 0
        ? 'Due in ' + this.daysRemaining(feedbackExpirationDate) + ' days'
        : 'Overdue'}
    `;
  }

  daysRemaining(feedbackExpirationDate) {
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    const daysRemaining = ((feedbackExpirationDate.getTime() - today.getTime()) / oneDay).toFixed(0);

    return daysRemaining;
  }

  static get properties() {
    return {
      thumbnail: Object,
      messages: Array,
      peerUpn: String,
      feedbackState: String,
      userDisplayName: String,
      image: String,
      feedbacksAssignedToUser: Array,
      hero: String,
      lock: Boolean,
    };
  }

  navigateHome() {
    store.dispatch(userToBeReviewedReceived(undefined));
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_HOME_STATE);
  }

  leaveFeedback(reviewTemplate, assignmentId) {
    if (reviewTemplate !== 'no-template') {
      store.dispatch(feedbackTemplateReceived(reviewTemplate));
      store.dispatch(feedbackAssignmentIdReceived(assignmentId));
    } else {
      if (this.feedbacksAssignedToUser.length > 0) {
        //redirect user to complete an assigned feedback
        store.dispatch(feedbackTemplateReceived({ id: this.feedbacksAssignedToUser[0].templateId }));
        store.dispatch(feedbackAssignmentIdReceived(this.feedbacksAssignedToUser[0].feedbackAssignmentId));
      }else{
        store.dispatch(feedbackTemplateReceived({ id: undefined }));
        store.dispatch(feedbackAssignmentIdReceived(undefined));
      }
    }

    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_POST_STATE);
  }

  stateChanged(state) {
    this.hero = selectHero(state);
    this.messages = selectPublishedFeedbackMessages(state);
    this.userDisplayName = selectUserDisplayName(state);
    this.feedbacksAssignedToUser = selectUserAssignedFeedbacks(state).filter( (feedback) => feedback.reviewee == this.peerUpn ) ;
    this.lock = selectFeedbackLoadingLock(state);
  }

  async firstUpdated() {
    store.dispatch(feedbackLoadingLock(true));
    store.dispatch(feedbackTemplateReceived(undefined));
    await peerFeedbackService.peersFeedbackMessages(this.peerUpn);
    await peerFeedbackService.populateDisplayName(this.peerUpn);
    await peerFeedbackService.getAllFeedbacksAssignedToUser(this.hero);
    userService.getImage(this.peerUpn).then((image) => (this.image = image));
    store.dispatch(feedbackLoadingLock(false));
  }
}
window.customElements.define('e-peer-feedback-view', PeerFeedbackView);
