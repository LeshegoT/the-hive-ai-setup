import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { store } from '../store.js';
import {
  selectTagRatings,
  selectAllFeedbackTags,
  selectFeedbackPositiveComment,
  selectFeedbackConstructiveComment,
  selectSelfAssignedFeedbackTemplate,
  selectFeedbackAssignmentID,
} from '../selectors/peer-feedback.selector';
import './votes.component';
import './progress-bar.component';
import {
  removePeerFeedback,
  feedbackPositiveCommentReceived,
  feedbackConstructiveCommentReceived,
  feedbackTagRating,
} from '../actions/peer-feedback.action';
import './speech-input.component';
import { selectSpeechText } from '../selectors/speech.selectors';
import { speechReceived } from '../actions/speech.action';
import feedbackLocalStorageService  from '../services/save-feedback-locally.service'
const styles = html`
  <style>
        .feedback-comment {
          width: 70vw;
          height: 10vh;
          padding: 1em;
          margin-bottom: 1em;
        }

        .input-group{
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }

        .feed-post-container {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          flex-wrap: wrap;
        }

        .feed-post-container > div {
          display: flex;
          justify-content: flex-start;
          width: 100%;
        }

        .tags {
          width: 90%;
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          flex-wrap: wrap;
        }

        .renderedTag {
          max-width: 18vw;
          background-color: var(--app-dashboard-panel);
          box-shadow: 1px 1px 4px var(--app-dashboard-shadow);
          border-radius: 7px;
          display: inline-flex;
          margin-right: 10px;
          margin-top: 0.5em;
          padding: 1em 0.5em 1em 1em;
          justify-content: space-between;
        }

        .renderedTag i{
           cursor: pointer;
        }

        .renderedTag i:hover{
          font-weight: bold;
        }

        #tagSection {
          display: flex;
          flex-direction: column;
        }

        .innerTagDetails {
          width: 90%;
        }

        .tags-input #selectedTag{
          min-width: 19.7vw;
          margin: 1em 0;
          padding: 1em;
        }

        #speechinput {
        width: 25px; // just wide enough to show mic icon
        height: 25px; // just high enough to show mic icon
        cursor:pointer;
        border: none;
        position: absolute;
        margin-left: 5px;
        outline: none;
        background: transparent;
    }

        @media only screen and (max-width: 900px) {
          .feedback-comment {
            width: 90vw;
            height: 15vh;
          }

          .feed-post-container {
            margin-top: 1em;
          }

          .feed-post-container > div {
            margin-top: 1em;
          }

          .renderedTag{
            max-width: 37vw;
            padding: 0.7em;
          }

          .tags-input #selectedTag{
            min-width: 85vw;
          }

          .tags{
            display: flex;
            flex-direction: row;
            justify-content: space-evenly;
          }
        }

        @media only screen and (max-width: 600px) {
          .feedback-comment {
            width: 85vw;
          }

          .renderedTag{
            max-width: 85vw;
            margin-right: 0;
          }

          .tags-input{
            max-width: 85vw;
            margin-right: 0;
          }

          .tags{
            flex-direction: column;
          }

        }


          .invalid-message {
            display: flex;
            justify-content: center;
            color: var(--app-primary-color);
            font-size: 0.7em;
            font-weight: bold;
          }

          .ratings-section,
          .discussion-points {
            display: flex;
            width: 45%;
            flex-direction: column;
            margin: 1em auto;
          }
        }
  </style>
`;

class TaggedFeedback extends StatefulElement {
  constructor() {
    super();
    this.inputValue = '';
    this.tags = [];
    this.invalidMessage = '';
    this.allTags = [];
    this.positiveComment = '';
    this.constructiveComment = '';
    this.showDefaultTags = true;
  }

  render() {
    return html`
      ${styles}
      <section>${this.renderPeerFeedbackSection()}</section>
    `;
  }

  renderPeerFeedbackSection() {
    return html`
      <div class="feed-post-container">
        <div>
          <div>
            ${this.checkIfFeedbackIsAssignment()
              ? this.renderPositiveConstructiveTextAreas()
              : this.renderTextArea()}
          </div>
        </div>
        <div id="tagSection">
          ${this.renderInputTags()} ${this.tags.length != 0 ? this.renderDisplayTags() : html``}
        </div>
      </div>
    `;
  }

  renderTextArea() {
    return html`
      <div class="input-group">
        <e-sub-title text="Feedback" icon="images/logos/messages.svg"></e-sub-title>
        <e-speech-input .type=${'positiveComment'}></e-speech-input>
      </div>
      <textarea name="positiveComment" class="feedback-comment" id="positiveComment" placeholder="Type your general feedback (positive and constructive) ...." >${this.positiveComment}</textarea
      >
    `;
  }

  renderPositiveConstructiveTextAreas() {
    return html`
      <div class="input-group">
        <e-sub-title text="Positive Feedback" icon="images/logos/messages.svg"></e-sub-title>
        <e-speech-input .type=${'positiveComment'}></e-speech-input>
      </div>
      <textarea name="positiveComment" class="feedback-comment" id="positiveComment" placeholder="Type your general positive feedback ....">${this.positiveComment}</textarea>

      <div class="input-group">
        <e-sub-title text="Constructive Feedback" icon="images/logos/messages.svg"></e-sub-title>
        <e-speech-input .type=${'constructiveComment'}></e-speech-input>
      </div>
      <textarea name="constructiveComment" class="feedback-comment" id="constructiveComment" placeholder="Type your general constructive feedback ....">${this.constructiveComment}</textarea
      >
    `;
  }
  renderInputTags() {
    return html`
      <e-sub-title text="Tags" icon="images/logos/content.svg"></e-sub-title>
      <div class="tags-input">
        ${this.assignedFeedback ? `` : this.renderTagSelectInput()}
        <datalist id="tags">
          ${this.allTags
            .filter((tag) => !this.tags.find((i) => i.name === tag.tagName))
            .map(
              (t) =>
                html`
                  <option>${t['tagName']}</option>
                `
            )}
        </datalist>
      </div>
    `;
  }

  renderTagSelectInput(){
    return html`
      <input
        id="selectedTag"
        type="text"
        value=${this.inputValue}
        placeholder="Select tag(s)"
        @input=${(e) => this.createTag(e.target.value)}
        list="tags"
        class="input-tags"
        autocomplete="off"
      />`
  }

  renderDisplayTags() {
    return html`
      <div class="tags">${this.tags.map((tag) => this.renderIndividualTag(tag))}</div>
    `;
  }

  removeSelectedPeerFeedback(tag) {
    store.dispatch(removePeerFeedback(tag));
  }

  renderIndividualTag(tag) {
    return html`
      <div class="renderedTag">
        <e-votes .option=${tag} .vote=${tag} type="feedback" class="innerTagDetails"></e-votes>
        ${this.assignedFeedback ? `` : this.renderRemove(tag)}
      </div>
    `;
  }

  renderRemove(tag) {
    return html`
      <span @click=${(e) => this.removeSelectedPeerFeedback(tag)} style="margin-top: -0.7em;">
        <i>X</i>
      </span>
    `;
  }

  createTag(inputTagName) {
    if (this.allTags.some((tag) => tag.tagName == inputTagName)) {
      this.inputValue = inputTagName;
      this.shadowRoot.getElementById('selectedTag').blur();
      this.addTag(inputTagName);
    }
  }
  addTag(e) {
    const trimmedInput = this.inputValue.trim();

    if (
      trimmedInput.length &&
      !this.tags.includes(trimmedInput) &&
      this.allTags.some((e) => e.tagName === trimmedInput)
    ) {
      this.addTagToTags(trimmedInput);
      this.inputValue = '';
      this.shadowRoot.getElementById('selectedTag').value = '';
    }
  }

  addTagToTags(tagName) {
    let tagFound = this.allTags.find((t) => t.tagName === tagName);
    this.tags.push({ name: tagName, description: tagFound.tagDescription });
    store.dispatch(
      feedbackTagRating({
        tagRating: { rating: undefined, tagName: tagName, description: tagFound.tagDescription },
      })
    );
  }

  assignIDsToRatings() {
     let retrievedFeedbackTags = feedbackLocalStorageService.getFeedback(this.assignmentId);
     if (retrievedFeedbackTags===undefined) {
       this.tags = this.selectedTagsRatings.map((tag) => {
         return {
          id: this.allTags.find((t) => t.tagName === tag.name).tagId,
          name: tag.name,
          rating: tag.rating ? tag.rating : 0,
          description: tag.description,
         };
       });
     } else {
        this.tags = this.selectedTagsRatings.map((tag) => {
        let id = this.allTags.find((t) => t.tagName === tag.name).tagId;
          return {
           id: id,
           name: tag.name,
           rating: tag.rating ? tag.rating : retrievedFeedbackTags.tags.find((tag) => tag.id === id).rating,
           description: tag.description,
        };
        });
    }
  }

  displayLocalStorageFeedback(){
    store.dispatch(feedbackConstructiveCommentReceived(''));
    store.dispatch(feedbackPositiveCommentReceived(''));

    let retrievedFeedback = feedbackLocalStorageService.getFeedback(this.assignmentId);
    if(retrievedFeedback !==undefined){
       store.dispatch(feedbackConstructiveCommentReceived(retrievedFeedback.reviewerConstructiveComment));
       store.dispatch(feedbackPositiveCommentReceived(retrievedFeedback.reviewerPositiveComment));
    }
  }

  checkIfFeedbackIsAssignment(){
    return !!(this.template?.id && this.assignmentId);
  }

  static get properties() {
    return {
      invalidMessage: String,
      allTags: Object,
      tags: { type: Array },
      inputValue: { type: String },
      selectedTagsRatings: Array,
      positiveComment: String,
      constructiveComment: String,
      speech: String,
      showDefaultTags: Boolean,
      assignedFeedback: Boolean,
      assignmentId: Number,
      template: String,
    };
  }
  firstUpdated() {
    this.displayLocalStorageFeedback();
    this.selectedTagsRatings.forEach((tag) => {
      store.dispatch(removePeerFeedback(tag));
    });
    this.assignedFeedback = !!(this.template?.id && this.assignmentId);

    if (this.shadowRoot.getElementById('positiveComment')) {
      this.shadowRoot.getElementById('positiveComment').addEventListener('keyup', () => {
        if (this.shadowRoot.getElementById('positiveComment').value != this.positiveComment) {
          store.dispatch(feedbackPositiveCommentReceived(this.shadowRoot.getElementById('positiveComment').value));
        }
      });
    }

    if (this.shadowRoot.getElementById('constructiveComment')) {
      this.shadowRoot.getElementById('constructiveComment').addEventListener('keyup', () => {
        if (this.shadowRoot.getElementById('constructiveComment').value != this.constructiveComment) {
          store.dispatch(
            feedbackConstructiveCommentReceived(this.shadowRoot.getElementById('constructiveComment').value)
          );
        }
      });
    }

    if (this.showDefaultTags) {
      this.allTags.filter((tag) => tag.autoDisplay).forEach((tag) => this.addTagToTags(tag.tagName));
    }
  }

  addSpeechToComment(){
    let focusInput = this.speech.type;
    this.shadowRoot.getElementById(focusInput).value += ' ' + this.speech.text.trim();
    store.dispatch(speechReceived(undefined));
    this.shadowRoot.getElementById(focusInput).dispatchEvent(new KeyboardEvent('keyup'));
  }

  stateChanged(state) {
    this.allTags = selectAllFeedbackTags(state);
    this.selectedTagsRatings = selectTagRatings(state);
    this.assignIDsToRatings();
    this.positiveComment = selectFeedbackPositiveComment(state);
    this.constructiveComment = selectFeedbackConstructiveComment(state);
    this.speech = selectSpeechText(state);
    this.template = selectSelfAssignedFeedbackTemplate(state);
    this.assignmentId = selectFeedbackAssignmentID(state);

    if (this.speech?.text && this.speech?.type) {
      this.addSpeechToComment();
    }
  }
}

window.customElements.define('e-tagged-feedback', TaggedFeedback);
