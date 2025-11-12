import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';
import reviewService from '../services/review.service';
import userService from '../services/user.service';
import './review-due-label.component';
import { profile_placeholder } from './svg';

const styles = html`
  <style>
    ${reviewShared()} #reviewHeading {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
    }

    #reviewTitle {
      text-align: left;
      color: var(--app-review-primary-text-color);
      margin: 0;
      line-height: 1em;
    }

    #revieweeDisplayName {
      text-align: left;
      color: var(--app-review-primary-text-color);
      margin: 0;
      line-height: 1.5em;
    }

    #details {
      margin-bottom: 1em;
    }

    #rightPanel,
    #leftPanel {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .profile {
      width: 7em;
      border-radius: 100%;
      max-width: 7em;
      background-size: cover;
      margin: auto;
      margin-bottom: 1em;
      aspect-ratio: 1/1;
      margin-right: 1em;
    }

    @media only screen and (max-width: 500px) {
      #reviewHeading {
        flex-direction: column;
        align-items: center;
      }

      #leftPanel {
        margin-left: 0em;
        margin: auto;
      }

      #reviewTitle,
      #revieweeDisplayName {
        text-align: center;
      }

      .profile {
        margin: 0;
        margin-bottom: 1em;
      }
    }
  </style>
`;

export class ReviewSurveyHeader extends StatefulElement {
  constructor() {
    super();
  }

  render() {
      return html`
        ${styles}
        <section id="reviewHeading">
          <div id="leftPanel">${this.renderProfile()}</div>
          <div id="rightPanel">
            <div id="details">${this.renderRevieweeDetails()}</div>
            ${this.renderSurveyDueDate()}
          </div>
        </section>
      `;
  }

  renderRevieweeDetails() {
    if(this.isReview) {
      if (this.isSelfReview) {
        return html`
          <h1 id="reviewTitle" class="large-label">Self Review</h1>
        `;
      } else {
        return html`
          <h1 id="reviewTitle" class="large-label">Colleague Review</h1>
          <h2 id="revieweeDisplayName" class="large-subtext-label">${this.reviewee.displayName}</h2>
        `;
      }
    } else {
      return html`
        <h1 id="reviewTitle" class="large-label">${this.reviewType}</h1>
      `;
    }
  }

  renderSurveyDueDate() {
    const dueDate = new Date(this.deadline);

    return html`
      <e-review-due-label .dueDate=${dueDate}></e-review-due-label>
    `;
  }

  renderProfile() {
    if (!this.isSelfReview){
      if (this.image) {
        let background_image = `background-image: url(${this.image})`;
        return html`
          <div class="profile" .style="${background_image}"></div>
        `;
      } else {
        return html`
          <div class="profile">${profile_placeholder}</div>
        `;
      }
    }

  }

  loadImage() {
    if (!this.isSelfReview && this.reviewee?.upn) {
      userService.getImage(this.reviewee.upn).then((image) => (this.image = image));
    } else {
      this.image = undefined;
    }
  }

  static get properties() {
    return {
      reviewee: Object,
      activeUser: String,
      deadline: Date,
      isSelfReview: Boolean,
      isReview: Boolean,
      reviewType: String,
      image: Object,
    };
  }

  async firstUpdated() {}

  stateChanged(state) {
    this.isSelfReview = reviewService.isSelfReview(this.reviewee.upn, this.activeUser);
    this.loadImage();
  }
}

window.customElements.define('e-review-survey-header', ReviewSurveyHeader);
