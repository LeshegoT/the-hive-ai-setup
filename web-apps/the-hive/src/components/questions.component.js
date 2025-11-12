import { html } from 'lit';
import { shared } from '../styles';
import { StatefulElement } from './stateful-element';
import {
  selectUserAnswers,
  selectUserAnswerHasError
} from '../selectors/question.selector';
import questionService from '../services/question.service';

let styles = html`
  <style>
    ${shared()} .questions {
      background: var(--app-section-even-color);
      padding: 1em 1.5em 2em;
      margin: 0 0 3em;
    }

    .error {
      border: 2px solid var(--app-primary-color);
    }
  </style>
`;

class Questions extends StatefulElement {
  checkAnswer(currentAnswerId, userAnswer) {
    if (!userAnswer) return false;

    return currentAnswerId === userAnswer.questionAnswerId;
  }

  renderError() {
    return this.hasError ? 'error' : '';
  }

  renderAnswers(answers, questionId, userAnswer) {
    if (this.done) {
      let answerText = answers.find((a) => a.questionAnswerId === userAnswer.questionAnswerId).text;
      return html`<span>${answerText}</span>`;
    }

    return html`
      <form @change="${(e) => this.answerChanged(e)}">
        ${answers.map(
          (a) => html`
            <div>
              <input
                type="radio"
                name="${questionId}"
                value="${a.questionAnswerId}"
                .checked="${this.checkAnswer(a.questionAnswerId, userAnswer)}"
              />
              <label>${a.text}</label>
            </div>
          `
        )}
      </form>
    `;
  }

  render() {
    return html`
      ${styles}

      <div class="questions ${this.renderError()}">
        ${this.questions.map(
          (q) => html`
            <h3>${q.text}</h3>
            ${this.renderAnswers(q.answers, q.questionId, q.userAnswer)}
          `
        )}
      </div>
    `;
  }

  answerChanged(e) {
    questionService.updateUserAnswer(
      this.userAnswers,
      parseInt(e.target.name),
      parseInt(e.target.value)
    );
  }

  static get properties() {
    return {
      questions: Array,
      hasError: Boolean,
      done: Number
    };
  }

  stateChanged(state) {
    this.userAnswers = selectUserAnswers(state);
    this.hasError = selectUserAnswerHasError(state);
  }
}

window.customElements.define('e-questions', Questions);
