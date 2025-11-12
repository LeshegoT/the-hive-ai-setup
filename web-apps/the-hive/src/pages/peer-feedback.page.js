import { html } from 'lit';
import { shared } from '../styles';
import { StatefulPage } from './stateful-page-view-element';
import { selectFeedbackMessages, selectUserToBeReviewed, selectUserDisplayName } from '../selectors/peer-feedback.selector';
import {
  PEER_FEEDBACK_HOME_STATE,
  PEER_FEEDBACK_VIEW_STATE,
  PEER_FEEDBACK_POST_STATE,
} from '../services/peer-feedback.service';
import peerFeedbackService from '../services/peer-feedback.service';
import authService from '../services/auth.service';
import {
  selectFeedbackState,
  selectSearchValidationMessage,
} from '../selectors/peer-feedback.selector';
import '../components/feedback.component';
import '../components/peer-feedback-view.component';
import '../components/peer-feedback-post.component';
import { store } from '../store.js';
import { userToBeReviewedReceived } from '../actions/peer-feedback.action';
import '../components/feedback-breadcrumb.component';

const styles = html`
  <style>
    ${shared()} * {
      box-sizing: border-box;
    }

    #homeNaviagtionPanel {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
    }

    #navigateHomeButton {
      width: 20vw;
      padding: 0.5em;
      background: var(--app-dashboard-panel);
      border: 1px solid black;
      color: black;
      border-radius: 7px;
    }

    #navigateHomeButton:hover {
      border: 1px solid var(--app-primary-color);
      color: var(--app-primary-color);
    }

    @media only screen and (max-width: 500px) {
      e-title {
        margin-top: -4em;
      }
    }
  </style>
`;
class PeerFeedback extends StatefulPage {

  render() {
    return html`
      ${styles}
      <style>
        ${shared()}
      </style>
      <section>
        <e-title name="Employee Feedback" icon="images/logos/messages.svg"></e-title>
        <e-feedback-breadcumb></e-feedback-breadcumb>
        ${this.renderMainContent()}
      </section>
    `;
  }

  renderMainContent() {
    switch (this.feedbackState) {
      case PEER_FEEDBACK_VIEW_STATE:
        return html`
          <e-peer-feedback-view
            .feedbackState="${this.feedbackState}"
            .peerUpn="${this.userToBeReviewed ? this.userToBeReviewed : this.peerUpn}"
          ></e-peer-feedback-view>
        `;
      case PEER_FEEDBACK_POST_STATE:
        return html`
          <e-peer-feedback-post
            .peerUpn="${this.userToBeReviewed ? this.userToBeReviewed : this.peerUpn}"
          ></e-peer-feedback-post>
        `;
      default:
        return html`
          <e-feedback .messages="${this.messages}"></e-feedback>
        `;
    }
  }

  navigateHome() {
    store.dispatch(userToBeReviewedReceived(undefined));
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_HOME_STATE);
  }

  navigatePeer() {
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_VIEW_STATE);
  }

  navigateSelfReview() {
    this.peerUpn = authService.getUserPrincipleName();
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_POST_STATE);
  }

  stateChanged(state) {
    this.feedbackState = selectFeedbackState(state);
    this.validationMessage = selectSearchValidationMessage(state);
    this.messages = selectFeedbackMessages(state);
    this.userToBeReviewed = selectUserToBeReviewed(state);
    this.userDisplayName = selectUserDisplayName(state);

    window.onpopstate = function (event) {
      event.preventDefault();
      var currentState = selectFeedbackState(state) ; 
      if(currentState == PEER_FEEDBACK_VIEW_STATE || currentState == PEER_FEEDBACK_POST_STATE){
        store.dispatch(userToBeReviewedReceived(undefined));
        history.go(1);
      }
    };
  }

  static get properties() {
    return {
      validationMessage: String,
      peerUpn: String,
      feedbackState: String,
      userSearchOptions: Array,
      messages: Array,
      userToBeReviewed: String,
      userDisplayName: String,
    };
  }

  firstUpdated() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) {
      let assignmentId = urlParams.get('id');
      history.pushState({}, null, 'peer-feedback');
      peerFeedbackService.navigateFeedbackAssignment(assignmentId);
    } else {
      if(this.peerUpn){
        peerFeedbackService.userDisplayName(this.peerUpn);
      }
      peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_HOME_STATE);
    }
  }
}

window.customElements.define('e-peer-feedback', PeerFeedback);