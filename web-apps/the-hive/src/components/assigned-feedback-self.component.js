import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { store } from '../store.js';
import {
  selectAssignedSelfReviewQuestions,
  selectTagRatings,
  selectAllFeedbackTags,
  selectSelfAssignedFeedbackTemplate,
  selectFeedbackPositiveComment,
  selectFeedbackConstructiveComment,
  selectFeedbackAssignmentID,
} from '../selectors/peer-feedback.selector';
import peerFeedbackService from '../services/peer-feedback.service';
import { ASSIGNED_SELF_FEEDBACK_ABILITY_STATE, PEER_FEEDBACK_HOME_STATE } from '../services/peer-feedback.service';
import './votes.component';
import './progress-bar.component';
import progressBarService from '../services/progress-bar.service';
import {
  feedbackPositiveCommentReceived,
  feedbackConstructiveCommentReceived,
  feedbackSelfQuestionsAndAnswersReceived,
  feedbackTemplateReceived,
  assignedSelfReviewReceived,
  feedbackLoadingLock,
  feedbackTagRating,
} from '../actions/peer-feedback.action';
import { selectHero } from '../selectors/hero.selectors';
import './tagged-feedback.component';
import './speech-input.component';
import { selectSpeechText } from '../selectors/speech.selectors';
import { speechReceived } from '../actions/speech.action';
import announcementService from '../services/announcement.service';
import authService from '../services/auth.service';
import networkConnection from '../services/networkConnection.service';
import feedbackLocalStorageService  from '../services/save-feedback-locally.service';
const styles = html`
  <style>
    .invalid-message {
      color: var(--app-primary-color);
      font-size: medium;
      font-weight: bold;
      display: inline-block;
      white-space: pre;
      margin-bottom: 1em;
      margin-top: 0.5em;
    }

    .buttons-container {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .post-button {
      border: 1px solid var(--app-secondary-color);
      color: var(--app-secondary-color);
      background-color: var(--app-dashboard-panel);
      border-radius: 7px;
      width: 10vw;
      padding: 1em;
      cursor: pointer;
      font-size: medium;
      font-weight: bold;
    }

    .next-button,
    .submit-button {
      color: var(--app-light-text-color);
      background-color: var(--app-secondary-color);
    }

    .disabled {
      pointer-events: none;
      opacity: 0.65;
      border: 1px solid var(--app-lighter-text-color);
      color: var(--app-lighter-text-color);
    }

    .progress-bar {
      margin-bottom: 1em;
    }

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
      .progress-bar {
        margin-top: 1em;
      }

      .post-button {
        width: 90vw;
        margin-bottom: 1em;
      }

      .question-title {
        font-size: medium;
      }

      .feedback-comment {
        width: 85vw;
      }

      .buttons-container {
        flex-direction: column;
      }
    }
  </style>
`;

class AssignedFeedbackSelf extends StatefulElement {
  constructor() {
    super();
    this.inputValue = '';
    this.tags = [];
    this.invalidMessage = '';
    this.tagRating = [];
    this.allTags = [];
    this.statePosition = 1;
    this.positiveComment = '';
    this.constructiveComment = '';
    this.answers = [];
    this.assignedSelfReviewQuestions = [];
    store.dispatch(feedbackPositiveCommentReceived(''));
    store.dispatch(feedbackConstructiveCommentReceived(''));
    this.displayDefaultTags = true;
  }

  render() {
    this.VALID_STATES = this.assignedSelfReviewQuestions.length;

    return html`
      ${styles}
      ${this.VALID_STATES != 0
        ? html`
            <div class="progress-bar">
              <e-progress-bar .counter=${this.VALID_STATES}></e-progress-bar>
            </div>
          `
        : ``}
      <section>
        ${this.renderAssignedSelfFeedbackSections()} ${this.renderNavButtons()}
      </section>
    `;
  }

  renderNavButtons() {
    return html`
      <div class="buttons-container">
        <div>
          ${this.renderBackButton()}
          ${this.renderNextButton()}
        </div>
        <div>
            ${this.renderCancelButton()}
            ${this.renderSubmitButton()}
        </div>
        
      </div>
    `;
  }

  renderBackButton(){
      return html`
          ${this.assignedSelfReviewQuestions.length != 0
            ? html`
                <button
                  @click=${this.goToPreviousState}
                  type="button"
                  class="back-button post-button ${this.statePosition < 2 ? 'disabled' : ''}"
                >
                  Back
                </button>
              `
            : ``}
      `;
  }


  renderNextButton(){
      return html`
        ${this.statePosition - 1 !== this.assignedSelfReviewQuestions.length &&
        this.assignedSelfReviewQuestions.length != 0
          ? html`
              <button @click=${this.goToNextState} type="button" class="next-button post-button">Save and Continue</button>
            `
          : ``}
      `;
  }

  renderSubmitButton(){
    return html`
      <button
        @click=${this.postFeedback}
        type="button"
        class="${this.statePosition - 1 === this.assignedSelfReviewQuestions.length ||this.assignedSelfReviewQuestions.length == 0 ? 'submit-button'  : 'disabled'} post-button"
        id="postButton" >
          Complete Review
      </button>
    `;
  }

  renderCancelButton(){
    return html`
      <button @click="${this.returnToPeerFeedBackInitialView}" id="postButton" type="button" class="post-button">
        Cancel
      </button>
    `;
  }

  async returnToPeerFeedBackInitialView() {
    store.dispatch(feedbackLoadingLock(true));

    store.dispatch(feedbackTemplateReceived(undefined));
    store.dispatch(assignedSelfReviewReceived([]));
    await peerFeedbackService.getAllFeedbacksAssignedToUser(this.hero);
    await peerFeedbackService.getFeedbackMessages(this.hero);
    store.dispatch(feedbackPositiveCommentReceived(''));
    store.dispatch(feedbackConstructiveCommentReceived(''));

    store.dispatch(feedbackLoadingLock(false));
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_HOME_STATE);
  }

  assignIDsToRatings() {
    let retrievedFeedback = feedbackLocalStorageService.getFeedback(this.assignmentId);
    this.tags = this.selectedTagsRatings.map((tag) => {
      let templateTag = this.allTags.find((t) => t.tagName === tag.name);
      return {
        id: templateTag.tagId,
        name: tag.name,
        rating: tag.rating ? tag.rating : this.getTagRating(retrievedFeedback, templateTag.tagId),
        description: templateTag.tagDescription,
      };
    });
  }

  getTagRating(retrievedFeedback, id){
    if(retrievedFeedback){
      return retrievedFeedback.tags.find((tag) => tag.id === id).rating
    }else{
      return 0;
    }
  }

  goToNextState() {
    this.invalidMessage = '';

    if (this.statePosition == 1) {
      this.assignIDsToRatings();
      this.validateFeedback();
    } else if (this.shadowRoot.getElementById('questionText').value == 0) {
      this.invalidMessage = '* Please type your feedback first.\n';
    }

    if (this.statePosition < this.assignedSelfReviewQuestions.length + 1 && !this.invalidMessage) {
      if (this.statePosition > 1) {
        this.currentlyDisplayedQuestion.answer = this.shadowRoot.getElementById('questionText').value;
      }else{
        this.displayDefaultTags = false;
      }
      this.saveFeedbackProgress();
      this.statePosition++;
      this.updateCurrentlyDisplayedQuestion();
      
    }
  }

  validateFeedback() {
    if (!this.positiveComment || !this.constructiveComment) {
      this.invalidMessage += `* Please type your feedback first\n`;
    }

    if (!this.tags.every((tag) => tag.rating)) {
      this.invalidMessage += `* Please provide a rating for each tag\n`;
    }
  }

  goToPreviousState(){
    this.currentlyDisplayedQuestion.answer = this.shadowRoot.getElementById('questionText').value;
    this.saveFeedbackProgress();
    this.statePosition--;
    this.updateCurrentlyDisplayedQuestion();
  }

  async updateCurrentlyDisplayedQuestion(){
    let userAnswers = this.manageAnswers();
      this.currentlyDisplayedQuestion = userAnswers.find((question) => question.position == this.statePosition - 1);
      progressBarService.updateProgressBar(this.statePosition);
      await this.renderAssignedSelfFeedbackSections();
      if(this.statePosition > 1){
          let retrievedSpecificFeedbackAnswer=feedbackLocalStorageService.findSpecificFeedbackAnswer(this.currentlyDisplayedQuestion.questionId,this.assignmentId);
          if(retrievedSpecificFeedbackAnswer !== undefined) {
            this.shadowRoot.getElementById('questionText').value = retrievedSpecificFeedbackAnswer.answer;
          }else {
            this.shadowRoot.getElementById('questionText').value = this.currentlyDisplayedQuestion.answer;
          }
      }
  }
  renderAssignedSelfFeedbackSections() {
    if (this.statePosition > 1) {
      return this.renderQuestionSection();
    } else {
      if(this.tags.length > 0){
        this.tags.forEach(tag =>{
            store.dispatch(
              feedbackTagRating({
                tagRating: { rating: tag.rating, tagName: tag.name, description: tag.description },
              })
            );
        })

      }
      return this.renderPeerFeedbackSection();
    }
  }

  renderPeerFeedbackSection() {
    return html`
      <e-tagged-feedback
        .showDefaultTags=${this.displayDefaultTags}
        .selectedTagsRatings=${this.selectedTagsRatings}
        .positiveComment=${this.positiveComment}
        .constructiveComment=${this.constructiveComment}
        .assignedFeedback=${true}
      ></e-tagged-feedback>
      <div>
        <span class="invalid-message" id="invalid-message">${this.invalidMessage}</span>
      </div>
    `;
  }

  renderQuestionSection() {
    return html`
      <div class="question-container">
        <div class="input-group">
          <h2 class="question-title">${this.currentlyDisplayedQuestion.question}</h2>
          <e-speech-input .type=${"questionText"}></e-speech-input>
         </div>
          <textarea
            name="comment-${this.currentlyDisplayedQuestion.questionId}"
            id="questionText"
            class="feedback-comment"
            placeholder="Type your feedback..."
            value="${this.currentlyDisplayedQuestion.answer}"
          ></textarea>
        </div>
      </div>

      <div>
        <span class="invalid-message" id="invalid-message">${this.invalidMessage}</span>
      </div>
    `;
  }

  postFeedback() {
    const networkAnnouncement = { title: 'Error', body: 'Internet disconnected. Please publish again' };

    if (this.statePosition > 1) {
      this.currentlyDisplayedQuestion.answer = this.shadowRoot.getElementById('questionText').value;
    }

    this.saveFeedbackProgress();

    if(networkConnection.isConnectedToInternet() === false){
      this.showAnnouncement(networkAnnouncement);
    } else {
      this.proceedPostFeedbackAttempt();
    }

  }

  saveFeedbackProgress(){
     feedbackLocalStorageService.storeReviewerFeedbackInLocalStorage(this.assignmentId, this.positiveComment,this.constructiveComment, this.manageAnswers(), this.tags);
  }

  proceedPostFeedbackAttempt(){

    this.shadowRoot.getElementById('postButton').disabled = true;
    this.invalidMessage = '';
    if (this.statePosition == 1) {
      this.assignIDsToRatings();
      this.validateFeedback();
    } else if (this.shadowRoot.getElementById('questionText').value == 0) {
      this.invalidMessage = '* Please type your feedback first.\n';
    }

    if (!this.invalidMessage) {

        if (this.statePosition == 1) {
          peerFeedbackService
            .addAssignedSelfFeedback(this.positiveComment.trim(), this.constructiveComment.trim(), this.tags, [], this.assignmentId)
            .then((response) =>{
              this.checkPostSuccess(response);
            })
        } else {
          let userAnswers = this.manageAnswers();
          peerFeedbackService
            .addAssignedSelfFeedback(this.positiveComment.trim(), this.constructiveComment.trim(), this.tags, userAnswers , this.assignmentId)
            .then((response) => {
              this.checkPostSuccess(response);
            });
        }
      
    } else {
      this.shadowRoot.getElementById('postButton').disabled = false;
    }
  }

  checkPostSuccess(response) {
    if (response.success) {
      this.showAnnouncement({ title: 'Feedback', body: 'Feedback successfully published' });
      this.returnToPeerFeedBackInitialView();
    } else {
      let error = response.error ? response.error : "An unexpected error occurred, please publish again.";
      this.showAnnouncement({ title: 'Error!', body: error });
    }
  }

  showAnnouncement({title, body}) {
    announcementService.createAnnouncement('none', {
      title: title,
      body: body,
    });
  }

  manageAnswers(){
    let retrievedAnswers=feedbackLocalStorageService.getFeedback(this.assignmentId);
    if(retrievedAnswers===undefined){
      return this.answers;
    }else{
     const updatedAnswers = retrievedAnswers.answers.map((answer) => {
       if (answer.questionId === this.currentlyDisplayedQuestion?.questionId) {
         return { ...answer, answer: this.currentlyDisplayedQuestion.answer };
       } else {
         return answer;
       }
     });
     return updatedAnswers;
    }
  }
  
  static get properties() {
    return {
      assignedSelfReviewQuestions: Array,
      invalidMessage: String,
      statePosition: Number,
      template: String,
      allTags: Object,
      tags: { type: Array },
      tagRating: Array,
      inputValue: { type: String },
      selectedTagsRatings: Array,
      hero: String,
      positiveComment: String,
      constructiveComment: String,
      answers: Array,
      VALID_STATES: Number,
      assignmentId: Number,
      currentlyDisplayedQuestion: Object,
      speech: String,
      displayDefaultTags: Boolean, 
    };
  }

  async setTemplateQuestionData(){
    if (this.template) {
      await peerFeedbackService.getAssignedSelfReviewQuestions(this.template.id);
    }

    this.answers = this.assignedSelfReviewQuestions.map((question, index) => {
      return {
        questionId: question.questionId,
        question: question.question,
        answer: '',
        position: question.position,
      };
    });

  }


  async firstUpdated() {
    this.setTemplateQuestionData();

    this.displayDefaultTags = true;

    this.statePosition = 1;
    peerFeedbackService.updateAssignedSelfFeedbackState(ASSIGNED_SELF_FEEDBACK_ABILITY_STATE);

    if (this.shadowRoot.getElementById('questionText')) {
      this.shadowRoot.getElementById('questionText').addEventListener('keyup', () => {
        this.answer = this.shadowRoot.getElementById('questionText').value;
        this.questions[this.questionIndex].answer = this.answer;
        store.dispatch(feedbackSelfQuestionsAndAnswersReceived(this.questions));
      });
    }
  }

  stateChanged(state) {
    this.selectedTagsRatings = selectTagRatings(state);
    this.template = selectSelfAssignedFeedbackTemplate(state);
    this.assignedSelfReviewQuestions = selectAssignedSelfReviewQuestions(state);
    this.hero = selectHero(state);
    this.positiveComment = selectFeedbackPositiveComment(state);
    this.constructiveComment = selectFeedbackConstructiveComment(state);
    this.allTags = selectAllFeedbackTags(state);
    this.assignmentId = selectFeedbackAssignmentID(state);
    this.speech = selectSpeechText(state);

    if (this.shadowRoot.getElementById('questionText') && this.speech?.text) {
      if (this.shadowRoot.getElementById('questionText').value.length > 0) {
        this.speech.text = ' ' + this.speech.text;
      }
      this.shadowRoot.getElementById('questionText').value += this.speech.text;
      store.dispatch(speechReceived(undefined));
    }
  }
}

window.customElements.define('e-assigned-feedback-self', AssignedFeedbackSelf);
