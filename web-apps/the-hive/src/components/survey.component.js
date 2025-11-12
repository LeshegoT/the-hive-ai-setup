import { html, LitElement } from 'lit';
import { reviewShared } from '../styles';
import surveyService, {
  DASHBOARD_STATE,
  TEXT_QUESTION,
  TRUE_FALSE_QUESTION,
  LOOKUP_QUESTION,
  SINGLE_OPTION_QUESTION
} from '../services/survey.service';
import './text-question.component';
import './survey-header.component';
import './true-false-question.component'
import './single-option-question.component'
import { store } from '../store';
import {surveyViewUpdated, activeSurveyReceived} from '../actions/survey.action';
import './loader.component';

const SUCCESS_MODAL = 'successModal';
const ERROR_MODAL = 'errorModal';

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
      text-align: center;
    }

    #footerButtons button {
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

    #submitButton, #backButton{
      width: 10em;
    }

    @media only screen and (max-width: 1300px) {
      #surveyContainer {
        width: 80vw;
      }
    }

    @media only screen and (max-width: 1000px) {
      #surveyHeader {
        flex-direction: column;
        gap: 1.5em;
      }
    }

    @media only screen and (max-width: 800px) {

      #modalActionButtons button {
        width: 50%;
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

    }

    @media only screen and (max-width: 7680px) and (min-width: 2000px) {
      #surveyContainer {
        width: clamp(75rem, -35.943rem + 93.426vw, 412.5rem);
      }
    }
  </style>
`;

class Survey extends LitElement {
  render() {
    if (this.surveyAssignment) {
      return html`
        ${styles}${this.renderSuccessAnnouncement()} ${this.renderFailureAnnouncement()}
        <section id="surveyContainer">${this.renderSurveyHeader()} ${this.renderSurveyQuestions()}</section>
      `;
    } else
      return html`
        <e-loader></e-loader>
      `;
  }

  renderSurveyHeader() {
    return html`
      <div id="surveyHeader">
        <e-survey-header .deadline=${this.surveyAssignment.deadline}></e-survey-header>
      </div>
      <div id="sectionHeaders">
        <h2 id="sectionTitle" class="large-heading">${this.surveyAssignment.surveyName}</h2>
      </div>
    `;
  }

  renderSurveyQuestions() {
    if (this.questions) {
      return html`
        ${this.questions.map((question) => {
          return html`
            ${this.displayQuestionInput(question)}
          `;
        })}
        ${this.renderFooterButtons()}
      `;
    } else
      return html`
        <e-loader></e-loader>
      `;
  }

  displayQuestionInput(question) {
    switch (question.typeDescription) {
      case TEXT_QUESTION:
        return html`
          <e-text-question
            id="section-${question.surveyQuestionId}"
            .question=${question}
          ></e-text-question>
        `;
      case TRUE_FALSE_QUESTION:
        return html`
          <e-true-false-question
            id="section-${question.surveyQuestionId}"
            .question=${question}
          ></e-true-false-question>
        `;
      case SINGLE_OPTION_QUESTION:
      case LOOKUP_QUESTION:
        return html`
          <e-single-option-question
            id="section-${question.surveyQuestionId}"
            .question=${question}
          ></e-single-option-question>
        `;
    }
  }

  renderFooterButtons() {
    return html`
      <div id="footerButtons">
        <div id="rightFooterButtons">
          <button id="backButton" class="redLinedButton" @click=${() => this.returnToDashBoard()}>Back</button>
          <button @click=${this.submitSurvey} class="redButton" id="submitButton">Submit</button>
        </div>
      </div>
    `;
  }

  saveAnswers() {
    let allValid = true;
    for (let question of this.questions) {
      let child = this.shadowRoot.getElementById(`section-${question.surveyQuestionId}`);
      let saveValid = child.checkIfValidAnswers();
      if (saveValid) {
        let answer = child.saveAnswer();
        this.answers.push(answer);
      } else {
        allValid = false;
      }
    }
    return allValid;
  }

  showModal(model) {
    this.shadowRoot.getElementById(model).style.display = 'flex';
  }

  hideModal(model) {
    this.shadowRoot.getElementById(model).style.display = 'none';
  }

  renderSuccessAnnouncement() {
    return html`
      <div id="${SUCCESS_MODAL}" class="modalAnnouncement">
        <div class="modalContent">
          <img src="../../images/icons/success.svg" />
          <div id="modalInformation">
            <h1 class="x-large-label">Success!</h1>
            <p class="large-subtext-label">Your survey was successfully submitted!</p>
          </div>
          <div id="modalActionButtons">
            <button class="redButton" @click=${() => this.returnToDashBoard()}>Return to Dashboard</button>
          </div>
        </div>
      </div>
    `;
  }

  renderFailureAnnouncement() {
    return html`
      <div id="${ERROR_MODAL}" class="modalAnnouncement">
        <div class="modalContent">
          <img src="../../images/icons/error.svg" />
          <div id="modalInformation">
            <h1 class="x-large-label">We encountered an issue!</h1>
            <p class="large-subtext-label">You can return to the dashboard or try to submit again.</p>
          </div>
          <div id="modalActionButtons">
            <button class="redLinedButton" @click=${() => this.returnToDashBoard()}>Return to Dashboard</button>
            <button class="redButton" @click=${() => this.hideModal(ERROR_MODAL)}>Try Again</button>
          </div>
        </div>
      </div>
    `;
  }

  async submitSurvey() {
    this.answers = [];
    if (this.saveAnswers()) {
      const submitButton = this.shadowRoot.getElementById('submitButton');
      submitButton.disabled = true;
      surveyService
        .submitAssignment(this.surveyAssignment.surveyAssignmentId, this.answers)
        .then((requestSuccessStatus) => {
          if (requestSuccessStatus.success) {
            this.showModal(SUCCESS_MODAL);
          } else {
            this.showModal(ERROR_MODAL);
            submitButton.disabled = false;
          }
        });
    }
  }

  returnToDashBoard() {
    store.dispatch(activeSurveyReceived(undefined));
    store.dispatch(surveyViewUpdated(DASHBOARD_STATE));
  }

  async firstUpdated() {
    window.scrollTo({ top: 0 });
    this.questions = await surveyService.getSurveyQuestions(this.surveyAssignment.surveyId);
  }

  static get properties() {
    return {
      surveyAssignment: Object,
      answers: Array,
      questions: Array,
    };
  }
}
window.customElements.define('e-survey', Survey);
