import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';
import './review-word-count.component';

const styles = html`
  <style>
    ${reviewShared()} :host {
      width: 100%;
    }

    .textAnswer {
      font-family: 'Inter';
      font-weight: 400;
      width: 95%;
      padding: 1em 0.5em 0;
      border-left: 1px solid var(--app-review-input-border-color);
      border-top: 1px solid var(--app-review-input-border-color);
      border-right: 1px solid var(--app-review-input-border-color);
      margin: 1em 0 0 3em;
    }

    @media only screen and (max-width: 500px) {
      .textAnswer {
        margin: 0;
      }

    }
  </style>
`;
class TextQuestion extends StatefulElement {
  constructor() {
    super();
    this.valid = true;
  }

  render() {
    return html`
      ${styles}
      <section id="questionSection">
        ${this.showRequiredErrorMessage()}
        <label class="mainQuestion medium-label">${this.question.questionText}</label>
        <textarea
          name="textAnswer"
          class="textAnswer"
          id="textAnswer-${this.question.surveyQuestionId}"
          placeholder="Add your Comments..."
          value=${this.question.preferredResponse}
        >
          ${this.question.preferredResponse}
        </textarea>
        <e-review-word-count
          .sentence=${this.question.preferredResponse}
          id="wordCount-${this.question.surveyQuestionId}"
        ></e-review-word-count>
      </section>
    `;
  }

  showRequiredErrorMessage() {
    if (!this.valid) {
      return html`
        <span class="errorMessage">*This field is required.</span>
      `;
    }
  }

   saveAnswer() {
    let answer = {
      questionId: this.question.surveyQuestionId,
      questionTypeId: this.question.surveyQuestionTypeId,
      responseText: this.shadowRoot.getElementById(`textAnswer-${this.question.surveyQuestionId}`).value.trim(),
    };
    return answer;
  }

  checkIfValidAnswers() {
    let answer = {
      questionId: this.question.surveyQuestionId,
      questionTypeId: this.question.surveyQuestionTypeId,
      responseText: this.shadowRoot.getElementById(`textAnswer-${this.question.surveyQuestionId}`).value.trim(),
    };
    this.valid = this.checkIfAnswerIsProvided(answer);

    return this.valid;
  }

  checkIfAnswerIsProvided(answer) {
    return answer.responseText.length > 0;
  }

  static get properties() {
    return {
      question: Object,
      answer: Object,
      valid: Boolean,
    };
  }

  configureWordCountEventListeners() {
      if (this.shadowRoot.getElementById('textAnswer-' + this.question.surveyQuestionId)) {
        this.shadowRoot
          .getElementById('textAnswer-' + this.question.surveyQuestionId)
          .addEventListener('keyup', () => {
            const wordCounter = this.shadowRoot.getElementById(`wordCount-${this.question.surveyQuestionId}`);
            wordCounter.setAttribute(
              'sentence',
              this.shadowRoot.getElementById('textAnswer-' + this.question.surveyQuestionId).value
            );
          });
      };
  }

  async firstUpdated() {
    this.configureWordCountEventListeners();
  }
}

window.customElements.define('e-text-question', TextQuestion);
