import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { store } from '../store.js';
import { shared } from '../styles';
import {selectFeedbackQuestionsAndAnswers,} from '../selectors/peer-feedback.selector';
import './votes.component';
import './progress-bar.component';
import {feedbackSelfQuestionsAndAnswersReceived,} from '../actions/peer-feedback.action';
import './tagged-feedback.component';
import './speech-input.component';
import { selectSpeechText } from '../selectors/speech.selectors';
import { speechReceived } from '../actions/speech.action';


const styles = html`
  <style>
    .feedback-comment {
      width: 70vw;
      height: 10vh;
      padding: 1em;
      margin-bottom: 1em;
    }

    .input-group {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .question-title {
      color: var(--app-tertiary-color);
    }

    @media only screen and (max-width: 900px) {
      .question-title {
        font-size: medium;
      }

      .feedback-comment {
        width: 85vw;
      }
    }
  </style>
`;
class QuestionFeedback extends StatefulElement {
  constructor() {
    super();
    this.answer = '';
    this.question = '';
  }

  renderQuestionSection() {
    return html`
      <div class="question-container">
        <div class="input-group">
          <h2 class="question-title">${this.question}</h2>
          <e-speech-input></e-speech-input>
         </div>
          <textarea
            name="comment"
            class="feedback-comment"
            id="questionText"
            placeholder="Type your feedback..."
            value=${this.answer}
          ></textarea>
        </div>
      </div>
    `;
  }


  render() {
    return html`
      ${styles}
      <section>${this.renderQuestionSection()}</section>
    `;
  }

  static get properties() {
    return {
      questions: Array,
      question: String,
      answer: String,
      questionIndex: Number,
      speech: String,
    };
  }

  firstUpdated() {
       if (this.shadowRoot.getElementById('questionText')) {
         this.shadowRoot.getElementById('questionText').addEventListener('keyup', () => {
             this.answer = this.shadowRoot.getElementById('questionText').value;
             this.questions[this.questionIndex].answer = this.answer;
             store.dispatch(feedbackSelfQuestionsAndAnswersReceived(this.questions));
         });
       }
  }

  stateChanged(state) {
    this.questions = selectFeedbackQuestionsAndAnswers(state);
    this.questionIndex = this.questions.length - 1;

    if (this.question != this.questions[this.questionIndex].question) {
      if (this.shadowRoot.getElementById('questionText')) {
        this.shadowRoot.getElementById('questionText').value = '';
      }
    }

    this.question = this.questions[this.questionIndex].question;
    this.asnwer = this.questions[this.questionIndex].answer;

    this.speech = selectSpeechText(state);

    if (this.shadowRoot.getElementById('questionText') && this.speech.length > 0) {
      if (this.shadowRoot.getElementById('questionText').value.length > 0) {
        this.speech = ' ' + this.speech;
      }

      this.shadowRoot.getElementById('questionText').value += this.speech;
      store.dispatch(speechReceived(''));
    }
  }
}

window.customElements.define('e-question-feedback', QuestionFeedback);
