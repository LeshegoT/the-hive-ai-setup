import { html, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { link } from '../styles/index.js';
import userService from '../services/user.service';
import message_service from '../services/message.service';
import { selectHero } from '../selectors/hero.selectors';
import { selectPublishedFeedbackMessages, selectFeedbackRetractionReasons } from '../selectors/peer-feedback.selector';
import peerFeedbackService from '../services/peer-feedback.service';
import { star } from '../components/svg';
import { PEER_FEEDBACK_VIEW_STATE } from '../services/peer-feedback.service';
import './speech-output.component';

import './profile.component';
import '@material/web/switch/switch.js';

let styles = (message) => html`
  <style>
    ${link()} :host {
      border: 1px solid var(--app-tertiary-color);
      border-radius: 7px;
      margin: 10px auto;
      width: 100%;
      flex-direction: row;
    }

    e-profile {
      display: inline-block;
      margin: 0.4em;
      flex: 0;
      max-height: 3.125em;
    }

    .messageFeedbackType {
      color: var(--app-dashboard-shadow);
      font-weight: bold;
      font-size: small;
    }

    .sound-panel {
      background-color: var(--app-dashboard-background);
      border-radius: 25%;
      width: fit-content;
      padding: 0 0.2em;
    }

    #icon-mic {
      width: 1.5em;
      height: 1.5em;
      filter: invert(50%);
      cursor: pointer;
      display: inline-block;
    }

    #icon-mic-stop {
      display: inline-block;
      cursor: pointer;
    }

    .PULSE {
      /* Chrome, Safari, Opera */
      -webkit-animation: PULSE 1.25s infinite;

      /* Internet Explorer */
      -ms-animation: PULSE 1s infinite;

      /* Standard Syntax */
      animation: PULSE 1.25s infinite;
    }

    /* Chrome, Safari, Opera */
    @-webkit-keyframes PULSE {
      0%,
      100% {
        -webkit-filter: invert(60%) sepia(93%) saturate(1131%) hue-rotate(132deg) brightness(97%) contrast(97%);
      }
      50% {
        -webkit-filter: invert(50%);
      }
    }

    /* Internet Explorer */
    @-ms-keyframes PULSE {
      0% {
        filter: invert(60%) sepia(93%) saturate(1131%) hue-rotate(132deg) brightness(97%) contrast(97%);
      }
      110% {
        color: invert(50%);
      }
    }

    /* Standard Syntax */
    @keyframes PULSE {
      0%,
      100% {
        -webkit-filter: invert(60%) sepia(93%) saturate(1131%) hue-rotate(132deg) brightness(97%) contrast(97%);
      }
      50% {
        -webkit-filter: invert(50%);
      }
    }

    .container {
      margin: 0 0.4em;
      flex: 1 1 44%;
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
    }

    .message {
      font-weight: lighter;
      width: 100%;
      padding: 0 0.4em;
    }

    span {
      font-size: 0.9em;
      display: inline-block;
      color: var(--app-dashboard-color);
      font-weight: bold;
    }

    time {
      font-size: 0.7em;
      display: inline-block;
      color: var(--app-tertiary-color);
      display: flex;
    }

    p {
      margin: 0;
      mergin-left: 3.5em;
    }

    .reply {
      width: 100%;
      border-top: 1px solid var(--app-lighter-text-color);
      padding: 0.5em 0;
    }

    .publisher {
      color: red;
    }

    .feedback-card {
      padding: 0.5em;
      display: flex;
      max-width: 100%;
      display: flex;
      flex-wrap: wrap;
    }

    .reply-input-container {
      margin: 0.5em;
      display: flex;
      width: 100%;
      height: 90%;
    }

    .reply-input-container button {
      color: var(--app-dashboard-color);
      border: 1px solid var(--app-tertiary-color);
      cursor: pointer;
      outline: none;
      border-radius: 7px;
      margin-left: 0.4em;
    }
    .reply-input-container select {
      color: var(--app-dashboard-color);
      border: 2px solid var(--app-tertiary-color);
      outline: none;
      border-radius: 7px;
      margin-left: 0.4em;
    }

    .reply-input-container input:focus {
      outline: none;
    }

    .reply-display span {
      color: var(--app-tertiary-color);
      font-weight: bold;
    }

    .reply-display {
      width: 85%;
      height: 90%;
      margin: 0 0 0 0.9em;
    }

    .reply-input {
      border: none;
      width: 85%;
    }

    pre {
      max-width: 16em;
      overflow: scroll;
      border: 1px solid var(--app-lighter-text-color);
      padding: 0.5em;
    }

    .tags-container {
      display: flex;
      padding: 0 0.7em;
      width: 100%;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .tag {
      width: fit-content;
      text-align: center;
      font-size: small;
      border: solid 1px var(--app-section-even-color);
      border-radius: 0.5em;
      margin: 0 0.2em 0;
      padding: 0.5em 0 0 0;
    }

    .private-toggle {
      display: flex;
      justify-content: center;
    }
    .private-toggle a {
      margin-right: 0.5em;
    }

    .tag > span {
      color: var(--app-dashboard-color);
    }

    .publish-feedback {
      text-align: center;
    }

    .publish-feedback span {
      font-weight: normal;
      color: var(--app-tertiary-color);
    }

    .publish-feedback a {
      cursor: pointer;
      color: var(--app-dashboard-color);
      width: fit-content;
      margin: 0.5em 0.5em 0 0;
      text-align: center;
      padding: 0 0.8em;
      font-size: 0.8em;
      border-radius: 12px;
    }

    .messageText {
      border: none;
      white-space: pre-line;
      overflow: hidden;
      font-family: inherit;
    }

    .retractOpen {
      border-radius: 100px;
      background: var(--app-dashboard-panel);
      min-width: 9em;
      width: 90%;
      border: solid 1.5px;
      margin-right: 1em;
    }

    .retractOpen:hover {
      cursor: pointer;
      border-color: var(--app-primary-color);
    }

    #retract-input-container {
      display: none;
      margin: 0 0 -1px -1px;
      border: solid 1px var(--app-primary-color);
      border-radius: 0 0 7px 7px;
    }

    @media (min-width: 460px) {
      pre {
        max-width: 100%;
      }

      ${link()} :host {
        max-width: 90%;
      }

      .publish-feedback {
        text-align: left;
        justify-content: space-between;
      }
    }

    .rating-checked > svg {
      fill: orange;
    }
    .unchecked {
      fill: silver;
    }

    .star > svg {
      width: 1.9em;
      height: 1.9em;
    }

    @media (max-width: 425px) {
      .star > svg {
        width: 1em;
        height: 1em;
      }

      .publish-feedback {
        margin-left: 1em;
        margin-top: 1em;
        width: 90%;
        text-align: center;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }

      .retractOpen {
        width: 100%;
      }
    }
  </style>
`;

class PeerFeedbackMessages extends connect(store)(LitElement) {
  render() {
    if (!this.message) return html``;

    return html`
      ${styles(this.message)}

      <div class="feedback-card">
        <e-profile .person="${this.message.by}"></e-profile>

        <div class="container">
          <span>${
            this.displayName
              ? this.displayName
              : html`
                  Client Feedback
                `
          }</span>
          <time>${this.message.createdAt.split('T')[0]}</time>

        </div>
        ${this.renderPublish()}
        ${this.renderTextMessage()}

        <div class="tags-container">${this.message.tags && this.message.tags.map((tag) => this.displayTag(tag))}</div>
      </div>
      ${
        this.message.by != this.message.about && this.feedbackState !== PEER_FEEDBACK_VIEW_STATE && !this.message.reply
          ? html`
              <div class="reply">${this.renderReplyInput()}</div>
            `
          : ` `
      }
      ${
        this.message.reply
          ? html`
              <div class="reply">${this.renderReplyDisplay(this.message.reply)}</div>
            `
          : ``
      }
      ${
        this.message.by == this.hero
          ? html`
              <div class="reply" id="retract-input-container">${this.renderRetractDisplay()}</div>
            `
          : html``
      }
    `;
  }

  renderTextMessage(){
    return html`
      <div class="message">
        <p>
          ${this.message.comment.map((comment) => {
            let sanitizedComment = message_service.sanitizeInput(comment.text) ;
            return html`
              <label class="messageFeedbackType">${comment.type}</label>
              <e-speech-output text="${sanitizedComment}"></e-speech-output>
              <pre class="messageText">
                  ${sanitizedComment}
                </pre
              >
            `;
          })}
        </p>
      </div>
    `;
  }

  renderReplyInput() {
    return html`
      <div class="reply-input-container">
        <input
          class="reply-input"
          id="reply"
          type="text"
          name="comment"
          .value="${this.message.reply}"
          maxlength="100"
          placeholder="Write a comment"
        />
        <button type="button" class="comment" @click="${(e) => this.submitComment()}">Comment</button>
      </div>
    `;
  }

  renderReplyDisplay(message) {
    return html`
      <div class="reply-display">
        <span>${message}</span>
      </div>
    `;
  }

  renderPublish() {
    this.message.published ? (this.buttonText = 'Public') : (this.buttonText = 'Private');

    if (this.message.about === this.hero || this.message.by === this.hero) {
      if (this.feedbackState === PEER_FEEDBACK_VIEW_STATE) {
        return html`
          <div class="publish-feedback">
            ${this.message.by == this.hero ? this.renderRetractButton() : html``}
            ${!this.message.published
              ? html`
                  <span>Not visible to everyone</span>
                `
              : html``}
          </div>
        `;
      } else {
        return html`
          <div class="publish-feedback">
            ${this.message.by == this.hero ? this.renderRetractButton() : html``} 
          </div>
          ${this.renderPublishToggle()}
        `;
      }
    } else {
      if (this.message.about === this.hero){
        return html`
          <div class="publish-feedback">${this.renderPublishToggle()}</div>
        `;
      } 
    }

    return html``;
  }

  renderRetractButton() {
    return html`
      <div>
        <button class="retractOpen" id="startRetractProcess" @click=${(e) => this.openRetractFeedback()}>
          Retract
        </button>
      </div>
    `;
  }

  renderPublishToggle() {
    let checked = this.message.published;

    return html`
      <div class="private-toggle">
        <a type="submit" @click=${this.publishFeedback}>${this.buttonText}</a>
        <md-switch .checked="${checked}" @change="${(e) => this.publishFeedback()}"></md-switch>
      </div>
    `;
  }

  renderRetractDropDown() {
    return html`
      <select class="reply-input" id="retract" type="text" name="comment">
        ${this.retractedReason.map(
          (element) =>
            html`
              <option value="${element.retractionReasonID}">${element.retractionReason}</option>
            `
        )}
      </select>
    `;
  }

  renderRetractDisplay() {
    return html`
      <div class="reply-input-container">
        ${this.renderRetractDropDown()}
        <button type="button" class="comment" @click="${(e) => this.submitFeedbackRetraction()}">Retract</button>
        <button type="button" class="comment" @click="${(e) => this.closeRetractFeedback()}">Cancel</button>
      </div>
    `;
  }

  openRetractFeedback() {
    this.shadowRoot.getElementById('retract-input-container').style.display = 'flex';
    this.shadowRoot.getElementById('startRetractProcess').style.display = 'none';
  }

  closeRetractFeedback() {
    this.shadowRoot.getElementById('retract-input-container').style.display = 'none';
    this.shadowRoot.getElementById('startRetractProcess').style.display = 'block';
  }

  submitFeedbackRetraction() {
    let reasonForRetract = this.shadowRoot.getElementById('retract').value;
    if (reasonForRetract && reasonForRetract.length > 0) {
      let requestBody = {
        reason: reasonForRetract,
      };

      this.closeRetractFeedback();
      peerFeedbackService.retractFeedbackMessage(
        this.message.messageId,
        requestBody,
        this.message.about,
        this.message.by
      );
    }
  }

  async publishFeedback() {
    let response = await peerFeedbackService.peerFeedbackPublish(this.message.messageId);
    
    if(response.status === 200){
      if (!this.message.published) {
        this.message.published = true;
        this.buttonText = 'Public';
      } else {
        this.message.published = false;
        this.buttonText = 'Private';
      }
    }

  }

  submitComment() {
    let text = this.shadowRoot.getElementById('reply').value;
    if (!text) {
      this.error = true;
      return;
    }

    text = message_service.sanitizeInput(text);
    peerFeedbackService.addPeerFeedbackReply(text, this.message.messageId);
    this.message.reply = text;
    this.requestUpdate();
  }

  stopSpeech() {
    this.speechSynth.cancel();
  }

  static get properties() {
    return {
      message: Object,
      displayName: String,
      hero: String,
      allUserMessages: Array,
      searchedUserMessages: Array,
      ratingHighlights: Number,
      buttonText: String,
      feedbackState: String,
      speechSynth: Object,
      retractedReason: Array,
    };
  }

  displayTag(tag) {
    return html`
      <div class="tag">
        <span>${tag.name}</span>
        <div>${this.renderRating(tag.rating)}</div>
      </div>
    `;
  }

  renderRating(rating) {
    let content = [];
    const ratingTotal = 5;
    this.ratingHighlights = 1;

    for (let i = 0; i < ratingTotal; i++) {
      content.push(html`
        <span class="button star ${rating > i ? 'rating-checked' : 'unchecked'}">${star}</span>
      `);
    }

    return html`
      ${content}
    `;
  }

  updated(changedProps) {
    if (changedProps.has('message')) {
      // We moved this from firstUpdated to updated, because it wasn't changing the message
      // displayName reliably. Here be dragons. - Mike Geyser, 16 Jan 2020
      this.displayName = this.message.by;
      if (this.displayName === 'System') return;

      if (this.displayName) {
        userService
          .getActiveDirectoryProfile(this.message.by)
          .then((profile) => (this.displayName = profile.displayName));
      }
    }
  }

  firstUpdated() {
    this.speechSynth = window.speechSynthesis;
  }

  stateChanged(state) {
    this.hero = selectHero(state);
    this.peerFeedbackTags = selectPublishedFeedbackMessages(state);
    this.retractedReason = selectFeedbackRetractionReasons(state);
  }
}

window.customElements.define('e-peer-feedback-messages', PeerFeedbackMessages);