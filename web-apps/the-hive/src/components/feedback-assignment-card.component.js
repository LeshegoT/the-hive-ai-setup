import { html } from 'lit';
import { store } from '../store.js';
import { StatefulElement } from './stateful-element';
import { selectHero } from '../selectors/hero.selectors';
import userService from '../services/user.service';
import { profile_placeholder } from './svg';
import { reviewViewUpdated, activeReviewReceived } from '../actions/review.action';
import reviewService, { REVIEW_SURVEY_STATE, REVIEW_TUTORIAL_STATE } from '../services/review.service';
import { reviewShared } from '../styles';
import './review-progress.component';
import './review-card-status.component';
import reviewLocalSaveService from '../services/review-local-save.service.js';
import announcementService from '../services/announcement.service.js';

const styles = html`
  <style>
    ${reviewShared()} .card {
      font-family: 'Inter';
      display: flex;
      flex-direction: column;
      padding-bottom: 1em;
      height: 16.75em;
      min-height: 16.75em;
      box-sizing: border-box;
      background: var(--app-dashboard-panel);
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
      border-radius: 4px;
    }

    .profile {
      max-width: 3.5em;
      height: 3.5em;
      aspect-ratio: 1 / 1;
      border-radius: 100%;
      background-size: cover;
      margin-left: 1.5em;
    }

    #title {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    #progress {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-left: 1.5em;
      margin-bottom: 1em;
      height: 100%;
    }

    #footer {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      margin: auto 1em 1em 1.5em;
      gap: 0.8em;
    }

    #profileContainer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-right: 1em;
    }

    #revieweeDetails {
      display: flex;
      flex-direction: row;
      margin-top: 0.5em;
    }

    #revieweeDetails > p {
      display: flex;
      flex-direction: column;
    }

    #reviewType {
      color: var(--app-review-header-text-color);
    }

    .redButton {
      height: 2.5em;
      min-height: fit-content;
      width: 13em;
      padding: 0.7em;
    }

    @media only screen and (max-width: 1100px) {
      .card {
        height: fit-content;
      }
    }

    @media only screen and (max-width: 700px) {
      #title {
        flex-direction: column-reverse;
      }

      #progress {
        margin: 2em 1.5em;
      }

      #footer {
        flex-direction: column;
        gap: 1em;
      }

      .profile {
        margin-top: -2.5em;
      }

      #revieweeDetails {
        flex-direction: column;
      }

      #reviewType {
        margin-left: 1.5em;
      }

      #revieweeName {
        margin-left: 1em;
      }

      .redButton {
        width: 100%;
      }
    }
  </style>
`;
class FeedbackAssignmentCard extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    return html`
      ${styles}
      <article class="card">
        <section id="title">${this.renderCardTitleInformation()}</section>
        <section id="progress">${this.renderCardProgressInformation()}</section>
        <section id="footer">${this.renderCardFooter()}</section>
      </article>
    `;
  }

  renderCardTitleInformation() {
    let reviewType;
    
    if(this.feedbackAssignment.isReview) {
      reviewType = reviewService.isSelfReview(this.feedbackAssignment.reviewee.upn, this.activeUser)
      ? `${this.feedbackAssignment.type} Self Review`
      : `${this.feedbackAssignment.type} Review`;
    } else {
      reviewType = this.feedbackAssignment.type;
    }

    return html`
      <div id="revieweeDetails">
        <div id="profileContainer">${this.renderProfileImage()}</div>
        <p>
          <label id="reviewType" class="small-subtext-label">${reviewType}</label>
          <label id="revieweeName" class="large-heading">${this.feedbackAssignment.reviewee.displayName}</label>
        </p>
      </div>
      <div>${this.renderFeedbackAssignmentStatus()}</div>
    `;
  }

  renderProfileImage() {
      if (this.image) {
      const background_image = `background-image: url(${this.image})`;
      return html`
        <div class="profile" .style="${background_image}"></div>
      `;
    } else {  
      return html`
        <div class="profile">${profile_placeholder}</div>
      `;
    }
  }

  renderFeedbackAssignmentStatus() {
    return html`
      <e-review-card-status .overDue=${this.isFeedbackOverdue(this.feedbackAssignment.dueBy)}></e-review-card-status>
    `;
  }

  renderCardProgressInformation() {
    if (this.feedbackStored) {
      return html`
        <e-review-progress .feedbackStored=${this.feedbackStored}></e-review-progress>
      `;
    }
  }

  renderCardFooter() {
    const dueDate = new Date(this.feedbackAssignment.dueBy);

    return html`
      <e-review-due-label .dueDate=${dueDate}></e-review-due-label>
      ${this.renderCardActionButton()}
    `;
  }

  renderCardActionButton() {
    if (this.feedbackStored) {
      return html`
        <button class="redButton" @click=${() => this.redirectToReviewView(REVIEW_SURVEY_STATE)}>
          ${this.feedbackAssignment.isReview ? 'Continue Review': 'Continue'}
        </button>
      `;
    } else {
      return html`
        <button class="redButton" @click=${() => this.redirectToReviewView(REVIEW_TUTORIAL_STATE)}>
          ${this.feedbackAssignment.isReview ? 'Start Review': 'Start'}
        </button>
      `;
    }
  }

  isFeedbackOverdue(feedbackExpirationDate) {
    return new Date(feedbackExpirationDate) <= new Date();
  }

  loadImage() {
    if (this.feedbackAssignment.reviewee.upn) {
      userService.getImage(this.feedbackAssignment.reviewee.upn).then((image) => (this.image = image));
    } else {
      this.image = undefined;
    }
  }

  async redirectToReviewView(view) {
    try{
      const status = (await reviewService.getAssignmentStatus(this.feedbackAssignment.assignmentId)).status;
      if (status == 'Pending'){
        store.dispatch(activeReviewReceived(this.feedbackAssignment));
        store.dispatch(reviewViewUpdated(view));
      }
      else{
        announcementService.createAnnouncement('review', { warning: true, body: 'This review has already been completed.' });
      }
    }
    catch{
      announcementService.createAnnouncement('review', { warning: true, body: 'An unexpected error occurred. Please check your internet connection.' });
    }
  }

  async retrieveStoredFeedback() {
     this.feedbackStored = await reviewLocalSaveService.getReview(this.feedbackAssignment.assignmentId);
  }

  stateChanged(state) {
    this.activeUser = selectHero(state);
  }

  static get properties() {
    return {
      activeUser: String,
      feedbackAssignment: Object,
      image: Object,
      feedbackStored: Object,
    };
  }

  firstUpdated() {
    this.feedbackStored = undefined;
    this.loadImage();
    this.retrieveStoredFeedback();
  }
}

window.customElements.define('e-feedback-assignment-card', FeedbackAssignmentCard);