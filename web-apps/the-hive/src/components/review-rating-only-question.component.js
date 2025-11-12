import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { QUESTION_TYPE_RATING_ONLY } from '../services/review.service';
import ReviewLocalSaveService from '../services/review-local-save.service';
import { reviewShared } from '../styles';
import './review-rating-scale.component';

const styles = html`
  <style>
    ${reviewShared()} :host {
      width: 100%;
    }
  </style>
`;
class ReviewRatingOnlyQuestion extends StatefulElement {
  constructor() {
    super();
    this.valid = true;
  }

  render() {
    return html`
      ${styles}
      <section id="questionSection">
        <e-review-rating-scale
          id="ratingScale"
          .question=${this.question}
          .assignmentId=${this.assignmentId}
          .valid=${this.valid}
        ></e-review-rating-scale>
      </section>
    `;
  }

  async saveAnswer() {
    let answer = {
      id: this.question.id,
      name: this.question.name,
      rating: this.shadowRoot.getElementById('ratingScale').selectedRating,
      type: QUESTION_TYPE_RATING_ONLY,
    };

    await ReviewLocalSaveService.storeReviewAnswer(answer, this.assignmentId);
  }

  checkIfValidAnswers(){
    let answer = {
      id: this.question.id,
      name: this.question.name,
      rating: this.shadowRoot.getElementById('ratingScale').selectedRating,
      type: QUESTION_TYPE_RATING_ONLY,
    };
    this.valid = this.checkIfAnswerIsProvided(answer);
    return this.valid;
  }

  checkIfAnswerIsProvided(answer) {
    return answer.rating?.rating !== 0;
  }

  static get properties() {
    return {
      question: Object,
      assignmentId: Number,
      valid: Boolean,
    };
  }
}

window.customElements.define('e-review-rating-only-question', ReviewRatingOnlyQuestion);
