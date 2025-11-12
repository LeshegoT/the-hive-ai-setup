import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';
import './option.component';

const styles = html`
  <style>
    ${reviewShared()} :host {
      width: 100%;
    }
  </style>
`;
class SingleOptionQuestion extends StatefulElement {
  constructor() {
    super();
    this.valid = true;
  }

  render() {
    return html`
      ${styles}
      <section id="questionSection">
        <e-option
          id="ratingScale"
          .question=${this.question}
          .valid=${this.valid}
          .questionOptions=${this.question.options}
        ></e-option>
      </section>
    `;
  }

  saveAnswer() {
    let answer = {
      questionId: this.question.surveyQuestionId,
      questionTypeId: this.question.surveyQuestionTypeId,
      responseText: this.shadowRoot.getElementById('ratingScale').selectedOption,
    };
    return answer;
  }

  checkIfValidAnswers() {
    let answer = {
      questionId: this.question.surveyQuestionId,
      questionTypeId: this.question.surveyQuestionTypeId,
      responseText: this.shadowRoot.getElementById('ratingScale').selectedOption,
    };
    this.valid = this.checkIfAnswerIsProvided(answer);
    return this.valid;
  }

  checkIfAnswerIsProvided(answer) {
    return answer.responseText !== null;
  }

  static get properties() {
    return {
      question: Object,
      valid: Boolean,
    };
  }
}

window.customElements.define('e-single-option-question', SingleOptionQuestion);
