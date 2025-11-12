import { html } from 'lit';
import { store } from '../store';
import { StatefulElement } from './stateful-element';
import {
  QUESTION_TYPE_RATING_ONLY,
  QUESTION_TYPE_EXTENDED_RATING,
  SECTION_TYPE_COMBINED_DISCUSSION,
} from '../services/review.service';
import ReviewLocalSaveService from '../services/review-local-save.service';
import { reviewShared } from '../styles';
import reviewService from '../services/review.service';
import './review-personal-details.component';
import './general-progress-bar.component';
import { selectHero } from '../selectors/hero.selectors';
import { edit } from './svg';
import { reviewSectionReceived } from '../actions/review.action';
const styles = html`
  <style>
    ${reviewShared()} :host {
      width: 100%;
      font-family: 'Inter';
    }

    .answerSection {
      display: flex;
      flex-direction: column;
      margin-bottom: 1em;
    }

    .questionName {
      display: inline-block;
      line-height: 23px;
      color: #var(--app-review-header-text-color);
      margin-bottom: 1em;
      margin-top: 1.5em;
      margin-left: 1em;
    }

    .ratingQuestionName {
      display: inline-block;
      color: var(--app-review-primary-text-color);
      margin-left: 1em;
    }

    .ratingDescription {
      color: var(--app-review-sub-header-text-color);
      margin-bottom: 0.5em;
    }

    .comment {
      display: flex;
      align-items: center;
      letter-spacing: 0.04em;
      color: rgba(0, 0, 0, 0.87);
      word-break: break-word;
      padding-right: 1em;
    }

    .commentName {
      color: var(--app-info-font-color);
      margin: 0.5em 0;
    }

    .commentSection {
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
      margin-left: 1em;
      margin-bottom: 1em;
    }

    .commentSection > div {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    #revieweeInformation {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      text-align: left;
      margin-bottom: 1em;
      margin-left: 1em;
    }

    .profile {
      border-radius: 100%;
      max-width: 9.25em;
      height: 9.25em;
      background-size: cover;
      margin: auto;
      margin-bottom: 1em;
    }

    #revieweeInformation label {
      margin-bottom: 1em;
    }

    #revieweeInformation #boldName {
      font-weight: 600;
    }

    #informationBanner {
      background: var(--app-info-background-color);
      color: var(--app-info-font-color);
      padding: 1em;
      margin-bottom: 1em;
      border-radius: 8px;
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .icon {
      filter: brightness(0) saturate(100%) invert(41%) sepia(92%) saturate(447%) hue-rotate(161deg) brightness(91%)
        contrast(96%);
    }

    #summarySection {
      margin-left: 0;
    }

    .ratingAnswer {
      display: flex;
      flex-direction: column;
      margin-top: 1.5em;
    }

    .ratingAnswer > div {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .ratingAnswer > div:nth-child(2) {
      justify-content: flex-end;
      text-align: right;
    }

    .progressBar {
      text-align: right;
      width: 30%;
    }

    .progressBar label {
      margin-left: 0.5em;
      font-weight: 600;
      text-align: right;
    }

    .progressBar e-general-progress-bar {
      display: inline-block;
      width: 80%;
    }

    #personalDetails {
      margin-bottom: 1.5em;
    }

    .editButton {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      width: 8em;
      margin-left: 1em;
      margin-top: 0.5em;
    }

    @media only screen and (max-width: 900px) {
      .progressBar {
        width: 100%;
      }

      .ratingAnswer > div {
        flex-direction: column;
      }

      .editButton {
        width: 50%;
        margin-left: 0;
        justify-content: center;
        gap: 0.5em;
      }
    }

    @media only screen and (max-width: 800px) {
      .commentSection {
        flex-direction: column;
      }

      .ratingDescription {
        margin-left: 1em;
      }
    }

    @media only screen and (max-width: 500px) {
      #informationBanner{
          flex-direction: column;
        }
    }

    @media only screen and (max-width: 400px) {
      .ratingDescription {
        margin-top: 1em;
      }

      .questionName,
      .ratingQuestionName,
      #revieweeInformation {
        margin-left: 0.5em;
      }

      .progressBar e-general-progress-bar {
        display: inline-block;
      }

      .editButton {
        width: 100%;
      }
    }
  </style>
`;
class ReviewSummary extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    if(this.reloadAnswers){
      this.setSummaryAnswers();
    }

    if(this.answers){
      let discussionPointAnswers = this.answers.filter((answer) => answer.type == SECTION_TYPE_COMBINED_DISCUSSION);
      return html`
        ${styles}
        <section id="questionSection summarySection">
          ${this.renderBanner()} ${this.renderRevieweeSummaryTitle()}
          ${reviewService.isSelfReview(this.review.reviewee.upn, this.activeUser) ? this.renderPersonalDetails() : ''}
          ${this.answers?.map((answer) => this.renderAnswer(answer))}
          ${this.renderDiscussionAnswers(discussionPointAnswers)}
        </section>
      `;
    }
  }

  renderBanner(){
    return html`
      <div id="informationBanner" class="x-small-subtext-label">
        <img src="images/icons/information.svg" class="icon" />
        <p><b>Note</b>: Your answers to these sections are editable until you select submit. Please verify that you are happy with
        your input.</p>
      </div>
    `;
  }

  renderRevieweeSummaryTitle() {
    if (reviewService.isSelfReview(this.review.reviewee.upn, this.activeUser)) {
      return html`
        <section id="revieweeInformation" class="medium-label">
          <label>
            Your answers for your
            <label id="boldName">${this.review.isReview ? 'Self Review': this.review.type}</label>
            are as follows:
          </label>
        </section>
      `;
    } else {
      return html`
        <section id="revieweeInformation" class="medium-label">
          <label>
            Your answers for
            <label id="boldName">${this.review.reviewee.displayName}</label>
            are as follows:
          </label>
        </section>
      `;
    }
  }

  renderPersonalDetails() {
    return html`
      <section id="personalDetails">
        <label class="questionName medium-heading">Personal Details</label>
        <e-review-personal-details></e-review-personal-details>
      </section>
    `;
  }

  renderAnswer(answer) {
    switch (answer.type) {
      case SECTION_TYPE_COMBINED_DISCUSSION: break;
      case QUESTION_TYPE_EXTENDED_RATING:
        return this.renderExtendedRatingAnswer(answer);
      case QUESTION_TYPE_RATING_ONLY:
        return this.renderRatingOnlyAnswer(answer);
      default:
        return this.renderStandardAnswer(answer);
    }
  }

  renderDiscussionAnswers(answers) {
    if(answers?.length > 0){
      return html`
        <section id="discussionPointAnswers">
          <div class="answerSection">
            <label class="questionName medium-heading">Discussion Points</label>

            ${answers.map((answer) => {
              return html `            
              <section class="commentSection">
                <div>
                  <label class="commentName discussion medium-subtext-label">${answer.name}</label>
                  <label class="comment x-small-subtext-label">${answer.generalComment}</label>
                </div>
              </section>`
            })}

            <section class="editSummarySection">
              <button class="blackLinedButton editButton" @click=${() => this.navigateToSection('Discussion Points')}>
                ${edit} Edit
              </button>
            </section>
          </div>
        </section>
      `;
    }
  }

  renderExtendedRatingAnswer(answer) {
      return html`
        <div class="answerSection">
          ${this.renderRating(answer)}
          <section class="commentSection">
            <div>
              <label class="commentName medium-subtext-label">Positive Comment</label>
              <label class="comment x-small-subtext-label">${answer.positiveComment}</label>
            </div>
            <div>
              <label class="commentName medium-subtext-label">Constructive Comment</label>
              <label class="comment x-small-subtext-label">${answer.constructiveComment}</label>
            </div>
          </section>
          <section class="editSummarySection">
            <button class="blackLinedButton editButton" @click=${() => this.navigateToSection(answer.name)}>
              ${edit} Edit
            </button>
          </section>
        </div>
      `;
  }

  renderRating(answer){
    let percentage = ((answer.rating.rating / answer.rating.total) * 100).toFixed(2);

      return html`
        <div class="ratingAnswer">
          <div>
            <label class="ratingQuestionName medium-heading">${answer.name}</label>
            <div class="progressBar">
              <e-general-progress-bar .percentage=${percentage} .type="${'info'}"></e-general-progress-bar>
              <label>${answer.rating.rating}</label>
            </div>
          </div>
          <div class="ratingDescription small-subtext-label">${answer.rating.description}</div>
        </div>
      `;

  }

  renderRatingOnlyAnswer(answer) {
    return html`
      <div class="answerSection">
        ${this.renderRating(answer)}
        <section class="editSummarySection">
          <button class="blackLinedButton editButton" @click=${() => this.navigateToSection(answer.name)}>
            ${edit} Edit
          </button>
        </section>
      </div>
    `;
  }

  renderStandardAnswer(answer) {
    return html`
      <div class="answerSection">
        <label class="questionName medium-heading">${answer.name}</label>
        <section class="commentSection">
          <div>
            <label class="commentName medium-subtext-label">Comment</label>
            <label class="comment x-small-subtext-label">${answer.generalComment}</label>
          </div>
        </section>
      </div>
    `;
  }

  navigateToSection(section){
    store.dispatch(reviewSectionReceived(section));
  }

  async setSummaryAnswers() {
    this.reloadAnswers = false;
    this.answers = (await ReviewLocalSaveService.getReview(this.assignmentId, true))?.answers; 
  }

  static get properties() {
    return {
      answers: Array,
      assignmentId: Number,
      review: Object,
      activeUser: String,
      reloadAnswers: Boolean,
    };
  }

  stateChanged(state) {
    this.activeUser = selectHero(state);
  }
}

window.customElements.define('e-review-summary', ReviewSummary);
