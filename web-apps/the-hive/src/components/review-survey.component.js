import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { selectActiveReview, selectActiveSection } from '../selectors/review.selectors';
import { selectHero } from '../selectors/hero.selectors';
import { store } from '../store';
import { reviewViewUpdated, activeReviewReceived, reviewSectionReceived } from '../actions/review.action';
import {
  REVIEW_DASHBOARD_STATE,
  QUESTION_TYPE_RATING_ONLY,
  QUESTION_TYPE_EXTENDED_RATING,
  SECTION_TYPE_COMBINED_DISCUSSION,
} from '../services/review.service';

import '../services/save-feedback-locally.service';
import reviewService from '../services/review.service';
import { reviewShared } from '../styles';
import  { debounce } from '../debounce'
import configService from '../services/config.service';

import './review-progress.component';
import './review-due-label.component';
import './review-survey-header.component';
import './review-summary.component';
import './review-extended-rating-question.component';
import './review-rating-only-question.component';
import './review-standard-question.component';
import './review-discussion-points-question.component';
import './review-anonymous-toggle.component';
import reviewLocalSaveService from '../services/review-local-save.service';
import './review-personal-details.component';
import './review-survey-progress-stepper.component';
import './loader.component';

const REVIEW_SECTION_TITLE = 'Review';
const PERSONAL_SECTION_TITLE = 'Personal Details';

const SUCCESS_MODAL = 'successModal';
const ERROR_MODAL = 'errorModal';
const NO_INTERNET_MODAL = 'noInternetModal';


const styles = html`
  <style>
    ${reviewShared()} :host {
      display: flex;
      flex-direction: row;
      justify-content: center;
      font-family: 'Inter';
    }

    #surveyContainer {
      background: var(--app-header-background-color);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.9em 1.8em 1em;
      gap: 1.75em;
      width: 60vw;
      height: fit-content;
      min-height: 60vh;
      margin: auto;
      box-shadow: 4px 4px 25px rgba(0, 0, 0, 0.15);
      border-radius: 4px;
    }

    #surveyHeader {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    #sectionHeaders {
      width: 100%;
      border-bottom: solid 1px var(--app-review-divider-color);
    }

    #sectionTitle {
      margin: 0;
    }

    #footerButtons {
      bottom: 0;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
      margin-top: auto;
    }

    #footerButtons > div {
      flex: 1;
      margin-top: auto;
    }

    #rightFooterButtons {
      text-align: right;
    }

    #footerButtons button{
      margin: 0.1em;
    }

    .redButton {
      height: 2.5em;
      padding: 0 1em;
    }

    button[disabled] {
      background-color: var(--app-disabled-button-color);
      color: #b8c0cc;
      cursor: wait;
    }

    .redLinedButton {
      height: 2.5em;
      padding: 0 1em;
    }

    #personalDetailsNotification {
      margin: 0;
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    #anonymousBanner {
      background: var(--app-info-background-color);
      margin-top: 1em;
      width: 60%;
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      padding: 1em;
      border-radius: 8px;
    }

    #anonymous {
      margin-top: 2em;
      margin-bottom: 0.5em;
      text-align: left;
    }

    .anonymousHeading {
      margin-right: 1.5em;
      display: inline-block;
      margin-bottom: 0;
    }

    .icon {
      filter: brightness(0) saturate(100%) invert(41%) sepia(92%) saturate(447%) hue-rotate(161deg) brightness(91%)
        contrast(96%);
    }

    .modalAnnouncement {
      display: none;
      flex-direction: column;
      justify-content: center;
      position: fixed;
      z-index: 1;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.6);
    }

    .modalContent {
      background-color: #fefefe;
      margin: auto;
      padding: 3em;
      border: 1px solid #888;
      width: 40%;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 2em;
      border-radius: 4px;
    }

    .modalContent img {
      width: 6em;
      aspect-ratio: 1/1;
      margin: auto;
    }

    #modalActionButtons {
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 1em;
    }

    #modalActionButtons button {
      width: 30%;
    }

    @media only screen and (max-width: 1300px) {
      #surveyContainer {
        width: 80vw;
      }
    }

    @media only screen and (max-width: 1000px) {
      #surveyHeader{
        flex-direction: column;
        gap: 1.5em;
      }
    }

    @media only screen and (max-width: 800px) {
      #sectionNavigation {
        width: fit-content;
      }

      #modalActionButtons button {
        width: 50%;
      }

      #anonymousBanner {
        width: 90%;
        margin-bottom: 2em;
      }
    }

    @media only screen and (max-width: 500px) {
      #footerButtons {
        flex-direction: column;
        text-align: center;
      }

      #footerButtons button {
        width: 90%;
        margin: 0.5em;
      }

      #rightFooterButtons {
        text-align: center;
      }

      #modalActionButtons button,
      .modalContent {
        width: auto;
      }

      #modalActionButtons {
        flex-direction: column;
      }

      #surveyContainer {
        width: 70vw;
      }

      .anonymousHeading {
        margin-right: 0.5em;
      }

      #anonymousBanner{
        flex-direction: column;
        align-items: center;
      }
    }

    @media only screen and (max-width:7680px) and (min-width: 2000px)  {
      #surveyContainer{
          width: clamp(75rem, -35.943rem + 93.426vw, 412.5rem);
      }
    }
  </style>
`;

export class ReviewSurvey extends StatefulElement {

  constructor() {
    super();
    this.onSaveAnswer = debounce(this.saveAnswer.bind(this), configService.feedbackFormDebounceThresholdInMilliseconds);
  }

  render() {
    if (this.review) {
      return html`
        ${styles} ${this.renderSuccessAnnouncement()} ${this.renderFailureAnnouncement()}${this.renderNoInternetAnnouncement()}
        <section id="surveyContainer">${this.renderSurveyHeader()} ${this.renderSurveySections()}</section>
      `;
    }else{
      return html `
      <e-loader></e-loader>`
    }
  }

  renderSuccessAnnouncement() {
    return html`
      <div id="${SUCCESS_MODAL}" class="modalAnnouncement">
        <div class="modalContent">
          <img src="../../images/icons/success.svg" />
          <div id="modalInformation">
            <h1 class="x-large-label">Success!</h1>
            <p class="large-subtext-label">Your feedback was successfully submitted!</p>
          </div>
          <div id="modalActionButtons">
            <button class="redLinedButton" @click=${() => this.returnToDashBoard()}>Home</button>
            <button class="redButton" @click=${() => this.getNextReviewAssignment()}>Next Review</button>
          </div>
        </div>
      </div>
    `;
  }

  renderFailureAnnouncement() {
    const emailSubject = encodeURIComponent('Error submitting peer feedback');
    const emailBody = encodeURIComponent('Hi The Hive Support Team,\n\nI was attempting to submit peer feedback for my colleague, but I encountered an issue and could not complete the submission.\n\nCould you please assist me in resolving this issue.\n\nThank you for your help!');
    const reviewsSupportEmail = encodeURIComponent('reviews-support@bbd.co.za');
    const emailLink = `mailto:${reviewsSupportEmail}?subject=${emailSubject}&body=${emailBody}`;
    return html`
      <div id="${ERROR_MODAL}" class="modalAnnouncement">
        <div class="modalContent">
          <img src="../../images/icons/error.svg" />
          <div id="modalInformation">
            <h1 class="x-large-label">We encountered an issue!</h1>
            <p class="large-subtext-label">Don't worry, your feedback was saved but unfortunately could not be submitted right now.</p>
            <p class="large-subtext-label">You can save your progress or try to submit again. If the issue persists, <a href=${emailLink}>click here to contact The Hive support team</a>.</p>
          </div>
          <div id="modalActionButtons">
            <button class="redLinedButton" @click=${() => this.saveForLater()}>Save for Later</button>
            <button class="redButton" @click=${() => this.hideModal(ERROR_MODAL)}>Try Again</button>
          </div>
        </div>
      </div>
    `;
  }

  renderNoInternetAnnouncement() {
    return html`
      <div id="${NO_INTERNET_MODAL}" class="modalAnnouncement">
        <div class="modalContent">
          <img src="../../images/icons/error.svg" />
          <div id="modalInformation">
            <h1 class="x-large-label">Your internet connection does not seem to be stable.</h1>
            <p class="large-subtext-label">
              Don't worry, your feedback was saved but unfortunately could not be submitted right now.
            </p>
            <p class="large-subtext-label">You can save your progress or try to submit again.</p>
          </div>
          <div id="modalActionButtons">
            <button class="redLinedButton" @click=${this.saveForLater.bind(this)}>Save for Later</button>
            <button class="redButton" @click=${() => this.hideModal(NO_INTERNET_MODAL)}>Try Again</button>
          </div>
        </div>
      </div>
    `;
  }

  showModal(model) {
    this.shadowRoot.getElementById(model).style.display = 'flex';
  }

  hideModal(model) {
    this.shadowRoot.getElementById(model).style.display = 'none';
  }

  async getNextReviewAssignment(){
    await reviewService.upnNextOutstandingReview();
  }

  renderSurveyHeader() {
    return html`
      <div id="surveyHeader">
        <e-review-survey-header
          .isReview=${this.review.isReview}
          .reviewType=${this.review.type}
          .reviewee=${this.review.reviewee}
          .activeUser=${this.activeUser}
          .deadline=${this.review.dueBy}
        ></e-review-survey-header>
          <e-review-survey-progress-stepper .sections=${this.sections} .currentSection=${this.currentSection}>
          </e-review-survey-progress-stepper>
      </div>
    `;
  }

  renderSurveySections() {
    if (this.survey) {
      return html`
        ${this.renderSurveySectionHeaders()} ${this.renderSurveySectionQuestions()}
      `;
    } else {
      return html`
        <e-loader></e-loader>
      `;
    }
  }

  renderSurveySectionHeaders() {
    return html`
      <div id="sectionHeaders">
        <h2 id="sectionTitle" class="large-heading">${this.currentSection.name}</h2>
      </div>
    `;
  }

  renderSurveySectionQuestions() {
    return html`
      ${this.survey.questions.map((question) => {
        return html`
          ${this.displayQuestionInput(question)}
        `;
      })}
      ${this.renderPersonalDetails()}
      <e-review-summary
        class=${this.currentSection.name == REVIEW_SECTION_TITLE ? 'visibleSection' : 'hiddenSection'}
        id="section-${REVIEW_SECTION_TITLE}"
        .assignmentId=${this.review.assignmentId}
        .review=${this.review}
        .reloadAnswers=${this.currentSection.name == REVIEW_SECTION_TITLE}
      ></e-review-summary>
      ${this.renderFooterButtons()}
    `;
  }

  renderPersonalDetails(){
    if(this.currentSection.name == PERSONAL_SECTION_TITLE){
      return html`
        <p id="personalDetailsNotification">
          <label class="medium-subtext-label">
            Please
            <b>CONFIRM</b>
            your personal details.
          </label>
          <label class="medium-subtext-label">
            If any of the personal information is
            <b>INCORRECT</b>
            please update them on
            <a href="https://icapture.bbd.co.za/" target="_blank">iCapture</a>
            .
          </label>
          <label class="medium-subtext-label">
            If any of the qualifications are
            <b>INCORRECT</b>
            please update them on
            <a href="/skills" target="_blank">Skills</a>
            .
          </label>
          <label class="medium-subtext-label">
            Please note, due to batch processing, changes made on iCapture may take up to 72 hours to reflect.
          </label>
        </p>
        <e-review-personal-details id="section-${PERSONAL_SECTION_TITLE}"></e-review-personal-details>
      `;
    }
    
  }

  displayQuestionInput(question) {
    switch (question.type) {
      case QUESTION_TYPE_EXTENDED_RATING:
        return html`
          <e-review-extended-rating-question
            id="section-${question.name}"
            class=${this.currentSection.name == question.name ? 'visibleSection' : 'hiddenSection'}
            .question=${question}
            .assignmentId=${this.review.assignmentId}
            .revieweeDisplayString=${this.isSelfReview ? 'yourself' : this.review.reviewee.displayName}
          ></e-review-extended-rating-question>
        `;
      case QUESTION_TYPE_RATING_ONLY:
        return html`
          <e-review-rating-only-question
            class=${this.currentSection.name == question.name ? 'visibleSection' : 'hiddenSection'}
            id="section-${question.name}"
            .question=${question}
            .assignmentId=${this.review.assignmentId}
          ></e-review-rating-only-question>
        `;
      case SECTION_TYPE_COMBINED_DISCUSSION:
        return html`
          <e-review-discussion-points-question
            class=${this.currentSection.name == question.name ? 'visibleSection' : 'hiddenSection'}
            id="section-${question.name}"
            .question=${question}
            .assignmentId=${this.review.assignmentId}
          ></e-review-discussion-points-question>
        `;
      default:
        return html`
              <e-review-standard-question
                class=${this.currentSection.name == question.name ? 'visibleSection' : 'hiddenSection'}
                id="section-${question.name}"
                .question=${question}
                .assignmentId=${this.review.assignmentId}
              ></e-review-standard>
            `;
    }
  }

  renderFooterButtons() {
    return html`
      <div id="footerButtons">
        <div id="leftFooterButtons">${this.renderAnonymousSection()}${this.renderPreviousButton()}</div>
        <div id="rightFooterButtons">${this.renderSaveForLaterButton()} ${this.renderSaveAndContinueButton()} ${this.renderSubmitButton()}</div>
      </div>
    `;
  }

  renderAnonymousSection() {
    if (!this.isSelfReview && this.currentSection.name == REVIEW_SECTION_TITLE) {
      this.anonymous = reviewLocalSaveService.retrieveReviewAnonymousIndication(this.review.assignmentId);
      
      return html`
      <article id="anonymous">
            <section>
            <h3 class="anonymousHeading medium-heading">Remain Anonymous</h3>
              <e-review-anonymous-toggle
              .anonymous=${this.anonymous}
              .assignmentId=${this.review.assignmentId}
            ></e-review-anonymous-toggle>
            </section>
            <section id="anonymousBanner" class="xx-small-subtext-label">
              <img src="images/icons/information.svg" class="icon" />
              <p id="anonymousInfo">
                ${
                  this.anonymous
                    ? 'While the executives may be able to associate your feedback with your name, you will remain anonymous to the person you are reviewing.'
                    : 'The person you are reviewing will be able to associate your feedback with your name.'
                }
              </p>
            </section>
          </section>
      </article>
      `;
    }
  }

  renderPreviousButton() {
    if (this.currentSection.name !== REVIEW_SECTION_TITLE) {
      let previousSection = this.sections.find((section) => section.next == this.currentSection.name);

      if (previousSection) {
        return html`
          <button @click=${() => this.navigateToSection(previousSection.name)} class="blackLinedButton">
            Previous
          </button>
        `;
      }
    }
  }

  renderSaveForLaterButton() {
    return html`
      <button class="redLinedButton" @click=${this.saveForLater.bind(this)}>Save for Later</button>
    `;
  }

  renderSaveAndContinueButton() {
    if (this.currentSection.next) {
      return html`
        <button @click=${this.navigateToNextSection.bind(this)} class="redButton">
          Save and Continue
        </button>
      `;
    }
  }

  renderSubmitButton() {
    if (!this.currentSection.next) {
      return html`
        <button @click=${() => this.submitReview()} class="redButton" id="submitButton">Submit</button>
      `;
    }
  }

  async navigateToNextSection() {
    return this.navigateToSection(this.currentSection.next);
  }

  async navigateToSection(nextSection) {
    this.onSaveAnswer.resolvePending();
    let saveValid = true;
    if (this.currentSection.name != REVIEW_SECTION_TITLE && this.currentSection.name != PERSONAL_SECTION_TITLE) {
      let child = this.shadowRoot.getElementById(`section-${this.currentSection.name}`);
      saveValid = child.checkIfValidAnswers();
    }
    if (saveValid || nextSection != this.currentSection.next) {
      this.updateCurrentSection(nextSection);
    }
  }

  updateCurrentSection(sectionName){
    window.scrollTo({ top: 0 });
    this.currentSection = this.sections.find((section) => section.name == sectionName);
    store.dispatch(reviewSectionReceived(sectionName));
  }

  async saveAnswer() {
    if (this.currentSection.name != REVIEW_SECTION_TITLE && this.currentSection.name != PERSONAL_SECTION_TITLE) {
      let child = this.shadowRoot.getElementById(`section-${this.currentSection.name}`);
      await child.saveAnswer();
    }
  }

  async saveForLater() {
    await this.onSaveAnswer.resolvePending();
    this.returnToDashBoard();
  }

  async submitReview(){
    const submitButton = this.shadowRoot.getElementById('submitButton');
    submitButton.disabled = true ;

    let reviewAnswers = await reviewLocalSaveService.getReview(this.review.assignmentId, true);
    if(reviewAnswers?.answers){
      let reviewResponse = {
        assignmentId: this.review.assignmentId,
        answers: reviewAnswers.answers,
        anonymous: reviewAnswers.anonymous,
      };

      reviewService.submitReview(reviewResponse).then((requestSuccessStatus) => {
        if (requestSuccessStatus.success) {
          reviewLocalSaveService.removeSpecificFeedbackInLocalStorage(this.review.assignmentId);
          this.showModal(SUCCESS_MODAL);
        } else {
          if (requestSuccessStatus.error === 'No internet connection') {
            this.showModal(NO_INTERNET_MODAL);
          } else {
            this.showModal(ERROR_MODAL);
          }
          submitButton.disabled = false;
        }
      });
    }
  }

  returnToDashBoard() {
    store.dispatch(activeReviewReceived(undefined));
    store.dispatch(reviewViewUpdated(REVIEW_DASHBOARD_STATE));
  }

  configureSections() {
    this.sections = this.survey.questions.map((question, index) => ({
      name: question.name,
      next: index + 1 < this.survey.questions.length ? this.survey.questions[index + 1].name : REVIEW_SECTION_TITLE,
    }));

    this.sections.push({
      name: REVIEW_SECTION_TITLE,
    });

    if (this.isSelfReview) {
      let firstSection = this.sections[0].name;
      this.sections.unshift({
        name: PERSONAL_SECTION_TITLE,
        next: firstSection,
      });
    }

    Object.freeze(this.sections);
    this.currentSection = this.sections[0];
    store.dispatch(reviewSectionReceived(this.currentSection.name));
  }

  async configureLocalStorageForReview(total){
    let storedReviewProgress = await reviewLocalSaveService.getReview(this.review.assignmentId);
    if (!storedReviewProgress) {
      reviewLocalSaveService.storeReview({
        assignmentId: this.review.assignmentId,
        surveyId: this.survey.id,
        answers: [],
        questionTotal: total,
        retrievedAt: new Date(),
        anonymous: false ,
      });
    } 
    else if (storedReviewProgress.questionTotal != total) {
      await reviewLocalSaveService.updateQuestionTotal(total, this.review.assignmentId);
    }
  }

  static get properties() {
    return {
      review: Object,
      survey: Object,
      activeUser: String,
      currentSection: Object,
      answers: Array,
      sections: Array,
      anonymous: Boolean,
      isSelfReview: Boolean,
    };
  }

  async firstUpdated() {
    window.scrollTo({ top: 0});
    this.isSelfReview = reviewService.isSelfReview(this.review.reviewee.upn, this.activeUser);
    let surveyResponse = await reviewService.assignmentSurvey(this.review.assignmentId);
    this.survey = surveyResponse.survey;
    this.configureSections();
    this.configureLocalStorageForReview(surveyResponse.totalQuestions);
    this.shadowRoot.getElementById('surveyContainer').addEventListener('focusout', this.onSaveAnswer.debounced);
    this.anonymous = reviewLocalSaveService.retrieveReviewAnonymousIndication(this.review.assignmentId);
  }

  stateChanged(state) {
    this.review = selectActiveReview(state);
    this.activeUser = selectHero(state);

    let sectionNavigation = selectActiveSection(state);
    let sectionInSections = this.sections?.find((section) => section.name == sectionNavigation);
    if (sectionNavigation) {
      this.currentSection = sectionInSections;
    }
  }
}

window.customElements.define('e-review-survey', ReviewSurvey);