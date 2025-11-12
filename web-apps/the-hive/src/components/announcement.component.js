import { html, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import multiplierService from '../services/multiplier.service';
import pointsService from '../services/points.service';
import peerFeedbackService from '../services/peer-feedback.service';
import navigationService from '../services/navigation.service';
import { selectAnnouncement } from '../selectors/announcement.selectors';
import PEER_FEEDBACK_HOME_STATE from '../services/peer-feedback.service';

import './points-display.component';
import { selectAllPoints } from '../selectors/points.selectors.js';
import { selectMultiplier } from '../selectors/multiplier.selector.js';
import { bucks } from './svg.js';

let styles = html`
  <style>
    .announcement-container {
      background-color: white;
      float: right;
      width: 90%;
      height: 25%;
      border-radius: 5px;
      box-shadow: 2px 3px 12px var(--app-dashboard-shadow);
      right: 5%;
      bottom: 1%;
      position: fixed;
      z-index: 3;
      animation: 6s ease 0s 1 animateAnnouncement;
      overflow: hidden;
    }

    .announcement-title {
      margin-left: 5%;
      color: var(--app-primary-color);
    }

    .announcement-body {
      margin-left: 5%;
      text-align: center
    }
    .bucks{
      display:flex;
      justify-content: center
    }

    .announcement-container .feedback{
      padding:0;
    }

    #feedback-announcement {
      cursor: pointer;
    }

    .feedback-list {
      word-break: break-all;
      list-style-type: none;
    }

    .feedback-list li {
      width: 60%;
      display: flex;
      margin-bottom: 0.3em;
    }

    .feedbackLabel {
      margin-left: 1em;
    }

    .feedbackNumber {
      color: white;
      background-color: var(--app-dashboard-shadow);
      border-radius: 50%;
      font-size: 1.3rem;
      font-weight: bolder;
      display: inline-block;
      justify-content: center;
      align-items: center;
      width: 1.5em;
      height: 1.5em;
    }

    section > div > svg {
      height: 40%;
      width: 20%;
    }

    #mainComponent {
      top: 6em;
      position: fixed;
      left: 5%;
      width: 90%;
      height: fit-content;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      padding: 1em;
      font-size: 13.33px;
      font-weight: bold;
      animation: 6s ease 0s 1 animateAnnouncement;
    }

    .informationBanner {
      background-color: var(--app-success-background-color);
      color: var(--app-success-font-color);
    }

    .warningBanner {
      background-color: var(--app-warning-background-color);
      color: var(--app-warning-font-color);
    }

    #action {
      cursor: pointer;
    }

    .warningBanner #action {
      filter: brightness(0) saturate(100%) invert(25%) sepia(86%) saturate(2136%) hue-rotate(339deg) brightness(76%)
        contrast(106%);
    }

    .hidden {
      visibility: hidden;
    }

    @media (min-width: 600px) {
      .announcement-container {
        width: 400px;
        right: 0.5%;
        bottom: 1%;
      }
    }

    @keyframes animateAnnouncement {
      0% {
        transform: translateY(100%);
        transform: scaleY(0);
      }
      5% {
        transform: scaleY(1);
      }
      9% {
        transform: translateY(0%);
      }
      90% {
        transform: scaleY(1);
        transform: translateY(0%);
      }
      100% {
        transform: scaleY(0);
        transform: translateY(100%);
      }
    }
  </style>
`;

class Announcement extends connect(store)(LitElement) {
  static get properties() {
    return {
      announcement: Object,
      allPoints: Object,
      multiplier: Number
    };
  }

  firstUpdated() {
    this.displayed = false;
    pointsService.getPointTypes();
    multiplierService.getMultiplier();
    pointsService.todaysPointsInformation();
  }

  renderScore() {
    return html`
      <section class="announcement-container">
        <e-points-display></e-points-display>
      </section>
    `;
  }
  renderStore() {
    return html`
      <section class="announcement-container">
        <h1 class="announcement-title">${this.announcement.details.title}</h1>
        <p class="announcement-body">${this.announcement.details.body}</p>
        <div class="bucks">${bucks}</div>
      </section>
    `;
  }

  renderFeedback() {
    return html`
      <section id="feedback-announcement" class="announcement-container feedback" @click=${this.navigateFeedback}>
        <h1 class="announcement-title">${this.announcement.details.title}</h1>
        <ul class="announcement-body feedback-list">
          ${this.announcement.details.body.feedback.length > 0
            ? html`
                <li>
                  <span class="feedbackNumber">${this.announcement.details.body.feedback.length}</span>
                  <label class="feedbackLabel">New Messages</label>
                </li>
              `
            : html``}
          ${this.announcement.details.body.assignments.length > 0
            ? html`
                <li>
                  <span class="feedbackNumber">${this.announcement.details.body.assignments.length}</span>
                  <label class="feedbackLabel">Pending Requests</label>
                </li>
              `
            : html``}
        </ul>
      </section>
    `;
  }

  navigateFeedback() {
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_HOME_STATE);
    let path = '/peer-feedback';
    navigationService.navigate(path);
  }

  renderGeneral() {
    return html`
      <section class="announcement-container">
        <h1 class="announcement-title">${this.announcement.details.title}</h1>
        <p class="announcement-body">${this.announcement.details.body}</p>
      </section>
    `;
  }

  renderReview() {
    return html`
      <section id="mainComponent" class=${this.announcement.details.warning ? 'warningBanner' : 'informationBanner'}>
        <div id="message">${this.announcement.details.body}</div>
        <div id="action"><img src="../../images/icons/close.svg" @click=${this.dismiss} /></div>
      </section>
      
    `;
  }

  dismiss() {
    const banner = this.shadowRoot.getElementById('mainComponent');
    banner.classList.add('hidden');
  }

  renderAnnouncement() {
    switch (this.announcement.type) {
      case 'store':
        return this.renderStore();
      case 'feedback':
        return this.renderFeedback();
      case 'review':
        return this.renderReview();
      default:
        return this.renderGeneral();
    }
  }

  render() {
    if (this.announcement.display) {
      if (this.announcement.type == 'score' && this.confirmStateIsSet()) {
        return html`
          ${styles} ${this.renderScore()}
        `;
      }

      return html`
        ${styles} ${this.renderAnnouncement()}
      `;
    }

    return html``;
  }

  confirmStateIsSet() {
    if (this.allPoints && this.multiplier) {
      return true;
    }

    return false;
  }

  stateChanged(state) {
    this.announcement = selectAnnouncement(state);
    this.allPoints = selectAllPoints(state);
    this.multiplier = selectMultiplier(state);
  }
}

window.customElements.define('e-announcement', Announcement);