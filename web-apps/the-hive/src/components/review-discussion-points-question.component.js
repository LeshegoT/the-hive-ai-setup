import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { SECTION_TYPE_COMBINED_DISCUSSION } from '../services/review.service';
import ReviewLocalSaveService from '../services/review-local-save.service';
import { reviewShared } from '../styles';
import './review-word-count.component';

const styles = html`
  <style>
    ${reviewShared()} :host {
      width: 100%;
    }
    .errorMessage{
      display:block;
    }
  </style>
`;
class ReviewDiscussionPointsQuestion extends StatefulElement {
  constructor() {
    super();
    this.validAnswers = [];
  }

  render() {
    return html`
      ${styles}
      <section id="questionSection">
          ${this.question.questions.map((question) => {
            return html`
              <label class="mainQuestion medium-label">${question.name}:</label>
              ${this.renderStandardAnswer(question)}
            `;
          })}
      </section>
    `;
  }

  renderStandardAnswer(question) {
    let answer = ReviewLocalSaveService.retrieveReviewAnswer(question.id, this.assignmentId);
    return html`
      <label class="subQuestionText small-subtext">${question.question}</label>
       ${this.showRequiredErrorMessage(question.id)}
      <textarea
        name="generalComment"
        class="reviewComment"
        id="generalComment-${question.id}"
        placeholder="Add your Comments..."
        value=${answer?.generalComment}
      >${answer?.generalComment}</textarea>    
      <e-review-word-count .sentence=${answer?.generalComment} id="wordCount-${question.id}"></e-review-word-count>
    `;
  }

  async saveAnswer() {
    let discussionAnswers = this.question.questions.map((question) => ({
      id: question.id,
      name: question.name,
      generalComment: this.shadowRoot.getElementById('generalComment-' + question.id).value.trim(),
      type: SECTION_TYPE_COMBINED_DISCUSSION,
    }));

    await discussionAnswers.forEach(async(answer) => {
      await ReviewLocalSaveService.storeReviewAnswer(answer, this.assignmentId);
    });
  }

  checkIfValidAnswers(){
     let discussionAnswers = this.question.questions.map((question) => ({
       id: question.id,
       name: question.name,
       generalComment: this.shadowRoot.getElementById('generalComment-' + question.id).value.trim(),
       type: SECTION_TYPE_COMBINED_DISCUSSION,
     }));

     this.checkEachAnswer(discussionAnswers);

     return this.checkIfAllAnswersInSectionIsProvided(discussionAnswers);
  }

  checkEachAnswer(answers) {
    for (const answer of answers) {
      let matchingAnswer = this.validAnswers.find((answerZ) => answerZ.questionId == answer.id);
      if (matchingAnswer) {
        matchingAnswer.valid = answer.generalComment?.length > 0;
      }
    }
    this.validAnswers = [...this.validAnswers];
  }

  showRequiredErrorMessage(questionID) {
    let matchingAnswer = this.validAnswers.find((answerZ) => answerZ.questionId == questionID);
    if (matchingAnswer && !matchingAnswer.valid) {
      return html`
        <span class="errorMessage">*This field is required.</span>
      `;
    }
  }

  checkIfAllAnswersInSectionIsProvided(answers) {
    return answers.filter((answer) => answer.generalComment?.length == 0).length == 0;
  }

  configureWordCountEventListeners() {
    this.question.questions.map((question) => {
      if (this.shadowRoot.getElementById('generalComment-' + question.id)) {
        this.shadowRoot.getElementById('generalComment-' + question.id).addEventListener('keyup', () => {
          const wordCounter = this.shadowRoot.getElementById(`wordCount-${question.id}`);
          wordCounter.setAttribute('sentence', this.shadowRoot.getElementById('generalComment-' + question.id).value);
        });
      }
    });
  }

  firstUpdated() {
    this.configureWordCountEventListeners();
    this.validAnswers = this.question.questions.map((question) => ({ questionId: question.id, valid: true }));
  }

  static get properties() {
    return {
      question: Object,
      assignmentId: Number,
      revieweeDisplayString: String,
      validAnswers: Array,
    };
  }
}

window.customElements.define('e-review-discussion-points-question', ReviewDiscussionPointsQuestion);
