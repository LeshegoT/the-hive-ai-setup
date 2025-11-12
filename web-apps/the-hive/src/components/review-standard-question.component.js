import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { QUESTION_TYPE_STANDARD_ANSWER } from '../services/review.service';
import ReviewLocalSaveService from '../services/review-local-save.service';
import { reviewShared } from '../styles';
import './review-word-count.component';

const styles = html`
  <style>
    ${reviewShared()} :host {
      width: 100%;
    }
  </style>
`;
class ReviewStandardQuestion extends StatefulElement {
  constructor() {
    super();
    this.valid = true;
  }

  render() {
    return html`
      ${styles}
      <section id="questionSection">
        ${this.showRequiredErrorMessage()}
        <label class="mainQuestion medium-label">${this.question.question}</label>
        <label class="subQuestionText small-subtext">${this.question.question}</label>
        <textarea
          name="generalComment"
          class="reviewComment"
          id="generalComment-${this.question.id}"
          placeholder="Add your Comments..."
          value=${this.answer?.generalComment}
        >${this.answer?.generalComment}</textarea>
        <e-review-word-count .sentence=${this.generalComment} id="wordCount"></e-review-word-count>
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

  async saveAnswer() {
    let answer = {
      id: this.question.id,
      name: this.question.name,
      generalComment: this.shadowRoot.getElementById(`generalComment-${this.question.id}`).value.trim(),
      type: QUESTION_TYPE_STANDARD_ANSWER,
    };

    await ReviewLocalSaveService.storeReviewAnswer(answer, this.assignmentId);
  }

  checkIfValidAnswers(){
    let answer = {
      id: this.question.id,
      name: this.question.name,
      generalComment: this.shadowRoot.getElementById(`generalComment-${this.question.id}`).value.trim(),
      type: QUESTION_TYPE_STANDARD_ANSWER,
    };
    this.valid = this.checkIfAnswerIsProvided(answer);

    return this.valid;
  }

  checkIfAnswerIsProvided(answer) {
    return answer.generalComment?.length > 0;
  }

  static get properties() {
    return {
      question: Object,
      assignmentId: Number,
      answer: Object,
      valid: Boolean,
    };
  }

  configureWordCountEventListeners() {
    if (this.shadowRoot.getElementById('generalComment-' + this.question.id)) {
      this.shadowRoot.getElementById('generalComment-' + this.question.id).addEventListener('keyup', () => {
        const wordCounter = this.shadowRoot.getElementById('wordCount');
        wordCounter.setAttribute('sentence', this.shadowRoot.getElementById('generalComment').value);
      });
    }
  }

  async firstUpdated() {
    this.answer = ReviewLocalSaveService.retrieveReviewAnswer(this.question.id, this.assignmentId);
    this.configureWordCountEventListeners();
  }
}

window.customElements.define('e-review-standard-question', ReviewStandardQuestion);
