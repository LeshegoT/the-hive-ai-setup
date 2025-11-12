import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import ReviewLocalSaveService from '../services/review-local-save.service';
import { QUESTION_TYPE_EXTENDED_RATING } from '../services/review.service';
import { reviewShared } from '../styles';
import './review-rating-scale.component';
import './review-word-count.component';

const styles = html`
  <style>
    ${reviewShared()} :host {
      width: 100%;
    }
  </style>
`;
class ReviewExtendedRatingQuestion extends StatefulElement {
  constructor() {
    super();
    this.validAnswer = {
      wasRatingProvided: true,
      wasPositiveCommentProvided: true,
      wasConstructiveCommentProvided: true,
    };
  }

  render() {
    return html`
      ${styles}
      <section id="questionSection">
        <e-review-rating-scale
          id="ratingScale"
          .question=${this.question}
          .valid=${this.validAnswer.wasRatingProvided}
          .assignmentId=${this.assignmentId}
        ></e-review-rating-scale>

          <label class="mainQuestion medium-label">
            Do you have any positive comments for ${this.revieweeDisplayString} regarding ${this.question.name}?
          </label>
          ${this.showRequiredErrorMessage(this.validAnswer.wasPositiveCommentProvided)}

          <textarea
            name="positiveComment"
            class="reviewComment"
            id="positiveComment"
            placeholder="Add your Comments..."
            value=${this.answer?.positiveComment}
          >${this.answer?.positiveComment}</textarea>
          <e-review-word-count .sentence=${this.answer?.positiveComment} id="wordCountPositive"></e-review-word-count>
          <label class="mainQuestion medium-label">
            Do you have any constructive comments for ${this.revieweeDisplayString} regarding ${this.question.name}?
          </label>
          ${this.showRequiredErrorMessage(this.validAnswer.wasConstructiveCommentProvided)}
          <textarea
            name="constructiveComment"
            class="reviewComment"
            id="constructiveComment"
            placeholder="Add your Comments..."
            value=${this.answer?.constructiveComment}
          >${this.answer?.constructiveComment}</textarea>
          <e-review-word-count
            .sentence=${this.answer?.constructiveComment}
            id="wordCountConstructive"
          ></e-review-word-count>

      </section>
    `;
  }

  showRequiredErrorMessage(isValid) {
    if (!isValid) {
      return html`
        <span class="errorMessage">*Please provide a minimum of three words.</span>
      `;
    }
  }

  async saveAnswer() {
    let answer = {
      id: this.question.id,
      name: this.question.name,
      rating: this.shadowRoot.getElementById('ratingScale').selectedRating,
      positiveComment: this.shadowRoot.getElementById('positiveComment').value.trim(),
      constructiveComment: this.shadowRoot.getElementById('constructiveComment').value.trim(),
      type: QUESTION_TYPE_EXTENDED_RATING,
    };

    await ReviewLocalSaveService.storeReviewAnswer(answer, this.assignmentId);
  }

  checkIfValidAnswers(){
    let answer = {
      id: this.question.id,
      name: this.question.name,
      rating: this.shadowRoot.getElementById('ratingScale').selectedRating,
      positiveComment: this.shadowRoot.getElementById('positiveComment').value.trim(),
      constructiveComment: this.shadowRoot.getElementById('constructiveComment').value.trim(),
      type: QUESTION_TYPE_EXTENDED_RATING,
    };

    this.validAnswer = {
      wasRatingProvided: this.checkRatingAnswer(answer),
      wasPositiveCommentProvided: this.checkPositiveAnswer(answer),
      wasConstructiveCommentProvided: this.checkConstructiveAnswer(answer),
    };

    return (this.validAnswer.wasRatingProvided && this.validAnswer.wasPositiveCommentProvided && this.validAnswer.wasConstructiveCommentProvided);
  }

  checkRatingAnswer(answer) {
    return answer.rating?.rating !== 0;
  }

  checkPositiveAnswer(answer) {
    return this.countWords(answer.positiveComment) >= 3;
  }

  checkConstructiveAnswer(answer) {
    return this.countWords(answer.constructiveComment) >= 3;
  }

  static get properties() {
    return {
      question: Object,
      assignmentId: Number,
      revieweeDisplayString: String,
      answer: Object,
      validAnswer: Object,
    };
  }

  configureWordCountEventListeners(){
    if (this.shadowRoot.getElementById('constructiveComment')) {
      this.shadowRoot.getElementById('constructiveComment').addEventListener('keyup', () => {
        const wordCounter = this.shadowRoot.getElementById('wordCountConstructive');
        wordCounter.setAttribute('sentence', this.shadowRoot.getElementById('constructiveComment').value);
      });
    }
    if (this.shadowRoot.getElementById('positiveComment')) {
      this.shadowRoot.getElementById('positiveComment').addEventListener('keyup', () => {
        const wordCounter = this.shadowRoot.getElementById('wordCountPositive');
        wordCounter.setAttribute('sentence', this.shadowRoot.getElementById('positiveComment').value);
      });
    }
  }

  firstUpdated() {
    this.answer = ReviewLocalSaveService.retrieveReviewAnswer(this.question.id, this.assignmentId);
    this.configureWordCountEventListeners();
  }

  countWords(sentence){
    let splitSentence = sentence.split(' ');
    const allowedRegex = /[a-zA-Z]/;
    return splitSentence.filter((word) => allowedRegex.test(word)).length;
  }
}

window.customElements.define('e-review-extended-rating-question', ReviewExtendedRatingQuestion);
