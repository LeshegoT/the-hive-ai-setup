import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';

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
class Option extends StatefulElement {
  constructor() {
    super();
    this.valid = true;
  }

  render() {
    return html`
      ${styles}
      <label class="mainQuestion medium-label">${this.question.questionText}</label>
      ${this.showRequiredErrorMessage()}

      <div class="sectionRatingContainer">
        ${this.questionOptions.map((option) => {
          return html`
            <div class="ratingOption">
              <input
                type="radio"
                class="sectionRating"
                id="radio"
                name="radio"
                data-description="radio"
                value=${option.optionQuestionId}
                ?checked="${option.optionQuestionId == this.selectedOption}"
                @click=${(event) => this.updateSelectedOption(event)}
              />
              <label class="subQuestionText small-subtext-label" for="radio">${option.optionDescription}</label>
            </div>
          `;
        })}
      </div>
    `;
  }

  updateSelectedOption(event) {
    this.selectedOption = event.target.value;
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
      selectedOption: Number,
      assignmentId: Number,
      valid: Boolean,
      questionOptions: Array,
    };
  }

  firstUpdated() {
    if (this.question?.preferredResponse){
      this.selectedOption = this.question.preferredResponse;
    }
    else{
      this.selectedOption = null;
    }
    
  }
}

window.customElements.define('e-option', Option);
