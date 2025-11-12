import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';
import ReviewLocalSaveService from '../services/review-local-save.service';

const styles = html`
  <style>
    ${reviewShared()} :host {
      width: 100%;
    }

    .ratingOption {
      display: flex;
      flex-direction: row;
    }

    @media only screen and (max-width: 1000px) {
      .sectionRating {
        height: auto;
        width: auto;
      }
    }
  </style>
`;
class ReviewRatingScale extends StatefulElement {
  constructor() {
    super();
    this.valid = true;
  }

  render() {
    return html`
      ${styles}
      <label class="mainQuestion medium-label">${this.question.question}</label>
      ${this.showRequiredErrorMessage()}
    
      <div class="sectionRatingContainer">
        ${this.question.scale.map((rating) => {
          return html`
            <div class='ratingOption'>
              <input
                type="radio"
                class="sectionRating"
                id="radio-${rating.rating}-${this.question.id}-${this.assignmentId}"
                name="radio-${this.question.id}-${this.assignmentId}"
                data-description="${rating.description}"
                value="${rating.rating}"
                ?checked=${this.answer?.rating.rating == rating.rating}
                @click=${(event) => this.updateSelectedRating(event)}
              />
              <label class="subQuestionText small-subtext-label" for="radio-${rating.rating}-${this.question.id}-${this.assignmentId}">
                ${rating.description}
              </label>
            </div>
          `;
        })}
      </div>
    `;
  }

  updateSelectedRating(event) {
    this.selectedRating = {
      rating: event.target.value,
      description: event.target.getAttribute('data-description'),
      total: this.question.scale.length,
    };
  }

  showRequiredErrorMessage() {
    if (!this.valid) {
      return html`
        <span class="errorMessage">*This field is required.</span>
      `;
    }
  }

  static get properties() {
    return {
      question: Object,
      selectedRating: Object,
      answer: Object,
      assignmentId: Number,
      valid: Boolean,
    };
  }

  firstUpdated() {
    this.answer = ReviewLocalSaveService.retrieveReviewAnswer(this.question.id, this.assignmentId);
    if (this.answer) {
      this.selectedRating = {
        rating: this.answer.rating.rating,
        description: this.answer.rating.description,
        total: this.answer.rating.total,
      };
    } else {
      this.selectedRating = {
        rating: 0,
        description: '',
        total: this.question.scale.length,
      };
    }
  }
}

window.customElements.define('e-review-rating-scale', ReviewRatingScale);
