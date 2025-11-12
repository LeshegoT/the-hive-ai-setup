import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { selectActiveReview } from '../selectors/review.selectors';
import { selectHero } from '../selectors/hero.selectors';
import { REVIEW_SURVEY_STATE } from '../services/review.service';
import { store } from '../store.js';
import { reviewViewUpdated } from '../actions/review.action';
import { profile_placeholder } from './svg';
import userService from '../services/user.service';
import { reviewShared } from '../styles';
import feedbackService from '../services/peer-feedback.service';

const styles = html`
  <style>
    ${reviewShared()}
    :host{
      display: flex;
      flex-direction: row;
      justify-content: center;
      font-family: 'Inter';
    }

    #tutorialContainer {
      justify-content: center;
      align-items: center;
      flex-direction: column;
      flex-wrap: wrap;
      display: flex;
      box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
      background-color: white;
      border-radius: 4px;
      padding: 5em 0.5em 6em 0.5em;
      width: 60vw;
      min-height: 40vh;
    }

    h1 {
      text-align: center;
      margin: 0;
    }

    h2 {
      margin: 0;
      text-align: center;
    }

    .icon {
      margin-right: 1em;
      height: 2em;
      margin-top: 1em;
    }

    .profile {
      border-radius: 100%;
      max-width: 5em;
      height: 5em;
      background-size: cover;
      margin: auto;
      margin-bottom: 1em;
      aspect-ratio: 1/1;
    }

    article {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 55%;
      margin-top: 1em;
    }

    .imageSection {
      display: flex;
      flex-direction: column;
      text-align: center;
      justify-content: center;
      flex: 1;
    }

    .imageSection div {
      padding: 0.5em;
    }

    .paragraph {
      display: flex;
      flex-direction: column;
      border-left: 1px solid #b8c0cc;
      padding-left: 2em;
      justify-content: center;
      flex: 2;
    }

    .reviewee {
      padding: 0;
      margin: 0;
    }

    .sentence {
      display: flex;
    }

    .redText {
      color: #c72026;
    }

    .redButton {
      padding: 10px 22px;
      margin-top: 2em;
    }

    @media screen and (max-width: 1300px) {
      #tutorialContainer {
        width: 80vw;
      }
    }

    @media screen and (max-width: 950px) {
      article {
        width: 90%;
      }
    }

    @media screen and (max-width: 850px) {
      article {
        width: 100%;
      }
    }

    @media screen and (max-width: 700px) {
      article {
        flex-direction: column;
        align-items: center;
      }

      .paragraph {
        border-left: none;
        border-top: 1px solid #b8c0cc;
        padding-left: 0;
        padding: 1em;
      }

      .imageSection {
        margin-right: 0;
        margin-bottom: 1em;
      }
    }

    @media screen and (max-width: 650px) {
      #tutorialContainer {
        padding: 1em 0.5em;
      }
    }

    @media only screen and (max-width:7680px) and (min-width: 2000px)  {
      #tutorialContainer{
          width: clamp(75rem, -35.943rem + 93.426vw, 412.5rem);
      }
    }
  </style>
`;
class FeedbackTutorial extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    const dueDate = new Date(this.review.dueBy);
    return html`
      ${styles}
      <section id="tutorialContainer">
        <h2 class="x-large-subtext-label">${this.review.isReview ? `${this.review.type} Review`: this.review.type}:</h2>
        ${this.renderReviewTypeHeading()}
        <article>
          <section class="imageSection">
            <div>
              <p class="reviewee">${this.renderImage()}</p>
              <p class="reviewee large-label">${this.review.reviewee.displayName}</p>
            </div>
          </section>
          <section class="paragraph x-small-subtext-label">
            <section class="sentence">
              <img class="icon" src="../../images/icons/suitcase.svg" />
              <p>
                We would like your feedback on ${this.isSelf ? '' : 'your colleague, '}
                <b>${this.isSelf ? 'yourself' : this.review.reviewee.displayName}</b>.
              </p>
            </section>
            <section class="sentence">
              <img class="icon" src="../../images/icons/calendar.svg" />
              <p>
                You have until
                <b class="redText">
                  ${dueDate.getDate()} ${dueDate.toLocaleString('default', { month: 'long' })} ${dueDate.getFullYear()}
                </b>
                to complete this assignment.
              </p>
            </section>
            <section class="sentence">
              <img class="icon" src="../../images/icons/submit.svg" />
              <p>
                Remember to click the
                <b>SUBMIT button</b>
                when you're done.
              </p>
            </section>
          </section>
        </article>
        <button class="redButton" @click="${() => this.changeView(REVIEW_SURVEY_STATE)}">Start ${this.review.isReview ? 'Review': this.review.type}</button>
      </section>
    `;
  }

  renderReviewTypeHeading() {
    if(this.review.isReview) {
      return html`
        <h1 class="xlarge-heading">${this.isSelf ? 'Self Review' : 'Colleague Review'}</h1>
      `
    } else {
      return html``;
    }
  }

  loadImage() {
    if (this.review.reviewee.upn) {
      userService.getImage(this.review.reviewee.upn).then((image) => (this.image = image));
    } else {
      this.image = undefined;
    }
  }

  renderImage() {
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

  changeView(view) {
    store.dispatch(reviewViewUpdated(view));
  }

  stateChanged(state) {
    this.review = selectActiveReview(state);
    this.activeUser = selectHero(state);
    this.isSelf = this.review.reviewee.upn.toLowerCase() == this.activeUser.toLowerCase();
  }

  static get properties() {
    return {
      isSelf: Boolean,
      review: Object,
      activeUser: Object,
      image: Object,
    };
  }

  async firstUpdated() {
    window.scrollTo({ top: 0 });
    this.loadImage();
    feedbackService.checkAndMarkFeedbackAssignmentAsViewed(this.review.assignmentId);
  }
}

window.customElements.define('e-feedback-tutorial', FeedbackTutorial);
