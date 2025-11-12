import { html, LitElement } from 'lit';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import {
  PEER_FEEDBACK_HOME_STATE,
  PEER_FEEDBACK_VIEW_STATE,
  PEER_FEEDBACK_POST_STATE,
} from '../services/peer-feedback.service';
import { selectFeedbackState } from '../selectors/peer-feedback.selector';
import {
  feedbackLoadingLock,
  feedbackTemplateReceived,
  userToBeReviewedReceived,
  feedbackPositiveCommentReceived,
  feedbackConstructiveCommentReceived,
  assignedSelfReviewReceived,
} from '../actions/peer-feedback.action';
import {
  selectUserDisplayName,
  selectUserToBeReviewed,
} from '../selectors/peer-feedback.selector';
import { selectHero } from '../selectors/hero.selectors';
import peerFeedbackService from '../services/peer-feedback.service.js';


const styles = html`
  <style>
    .breadcrumb {
      font: 0.75em sans-serif;
      list-style: none;
      margin-top: -3.5em;
      margin-left: 5.5em;
    }

    .breadcrumb li {
      display: inline-block;
    }

    .breadcrumb li a {
      background-color: var(--app-dashboard-background);
      box-sizing: border-box;
      color: var(--app-dark-text-color);
      display: block;
      max-height: 2em;
      padding: 0.5em 1em 0.5em 1.5em;
      position: relative;
      text-decoration: none;
      transition: 0.25s;
      margin-left: -0.14em;
    }

    .breadcrumb li a:before {
      border-top: 1em solid transparent;
      border-bottom: 1em solid transparent;
      border-left: 1em solid #fff;
      content: '';
      position: absolute;
      top: 0;
      right: -1em;
      z-index: 1;
    }

    .breadcrumb li a:after {
      border-top: 1em solid transparent;
      border-bottom: 1em solid transparent;
      border-left: 1em solid var(--app-dashboard-background);
      content: '';
      position: absolute;
      top: 0;
      right: -1em;
      transition: 0.25s;
      z-index: 1;
    }

    .breadcrumb li a:hover {
      background-color: var(--app-tertiary-color);
      color: var(--app-drawer-text-color);
      cursor: pointer;
    }

    .breadcrumb li a:hover:after {
      border-left-color: var(--app-tertiary-color);
    }

    .breadcrumb li:last-child a {
      background-color: var(--app-header-selected-color);
      pointer-events: none;
      color: var(--app-drawer-text-color);
    }

    .breadcrumb li:last-child a:after {
      border-left-color: var(--app-header-selected-color);
    }

    @media only screen and (max-width: 1000px) {
    }

    @media only screen and (max-width: 500px) {
      .breadcrumb {
        margin-left: -2em;
      }
      .breadcrumb li a {
        min-width: 18em;
      }
    }
  </style>
`;

class FeedbackBreadcrumb extends connect(store)(LitElement) {
    render() {
        return html`
          ${styles}
          <ul class="breadcrumb">
            ${this.stateList.map(
              (state) =>
                html`
                  <li><a @click=${state.functionCall}>${state.label}</a></li>
                `
            )}
          </ul>
        `;
    }

  populateStateList() {
    const homeTab =  {functionCall: this.navigateHome, label: `Feedback Home`}; 
    const peerViewTab = {functionCall: this.navigatePeerView, label: `${this.peerDisplayName}`}; 
    const postTab =  {functionCall: null, label: `Give Feedback`}; 

    switch (this.feedbackState) {
      case PEER_FEEDBACK_VIEW_STATE:
        this.stateList = [ homeTab, peerViewTab ];
        break;
      case PEER_FEEDBACK_POST_STATE:
        this.stateList = [ homeTab, peerViewTab, postTab ];
        break;
      default:
        this.stateList = [ homeTab ];
        break;
    }
  }

  async navigatePeerView() {
    store.dispatch(feedbackLoadingLock(true));
    this.resetCachedState();

    if (this.heroUPN !== this.peerUPN) {
      await peerFeedbackService.getAllFeedbacksAssignedToUser(this.heroUPN);
      await peerFeedbackService.peersFeedbackMessages(this.peerUpn);
    } else {
      await peerFeedbackService.getAllFeedbacksAssignedToUser(this.heroUPN);
      await peerFeedbackService.getFeedbackMessages(this.heroUPN);
    }
    store.dispatch(feedbackLoadingLock(false));
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_VIEW_STATE);
  }

  async navigateHome() {
    this.resetCachedState();
    store.dispatch(userToBeReviewedReceived(undefined));
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_HOME_STATE);
  }

  resetCachedState(){
        store.dispatch(feedbackTemplateReceived(undefined));
        store.dispatch(assignedSelfReviewReceived([]));
        store.dispatch(feedbackPositiveCommentReceived(''));
        store.dispatch(feedbackConstructiveCommentReceived(''));
  }

  static get properties() {
    return {
      feedbackState: String,
      peerDisplayName: String,
      stateList: Array,
      heroUPN: String,
      peerUPN: String,
    };
  }

  async stateChanged(state) {
    this.heroUPN = selectHero(state);
    this.feedbackState = selectFeedbackState(state);
    this.peerDisplayName = await selectUserDisplayName(state);
    this.peerUPN = selectUserToBeReviewed(state);

    if (this.peerDisplayName || this.feedbackState == PEER_FEEDBACK_HOME_STATE) {
      this.populateStateList();
    }
  }
}
window.customElements.define('e-feedback-breadcumb', FeedbackBreadcrumb);
