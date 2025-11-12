import { html, LitElement } from 'lit';
import { shared } from '../styles';
import { store } from '../store.js';
import message_service from '../services/message.service';
import mission_service from '../services/missions.service';
import auth_service from '../services/auth.service';
import multiplier_service from '../services/multiplier.service';
import points_service from '../services/points.service';
import { connect } from 'pwa-helpers/connect-mixin';
import { selectHero } from '../selectors/hero.selectors';
import { selectMessageTypes } from '../selectors/reference-data.selectors';
import { selectMultiplier } from '../selectors/multiplier.selector';
import { selectContentSearchOptions } from '../selectors/content.selector';
import content_service from '../services/content.service';
import configService from '../services/config.service';

import './icon-button.component';
import './rate-content.component';

let styles = html`
  <style>
    ${shared()} textarea {
      width: 100%;
      height: 5em;
      font-size: 1.1em;
    }

    textarea {
      box-sizing: border-box;
      width: 100%;
      padding: 0.5em;
    }

    .help-text {
      display: flex;
      justify-content: flex-end;
      margin: 0.5em 0;
    }

    .help-text a,
    .help-text a:visited {
      flex: 1;
      color: var(--app-tertiary-color);
      text-decoration: none;
      font-style: italic;
    }

    .help-text a:hover {
      text-decoration: underline;
    }

    .buttons {
      display: flex;
      justify-content: space-between;
      flex-direction: row-reverse;
    }

    button.comment {
      align-self: flex-start;
    }

    .error {
      border: 0.1em solid var(--app-primary-color);
      box-shadow: 0.5px 0.5px 1.5px var(--app-primary-color);
    }

    ${shared()} .type-container {
      margin-bottom: 0.5em;
    }

    .types {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      margin: 0.5em 0;
    }

    em {
      color: black;
    }

    .type-container input {
      margin: 0 0.5em;
      border: none;
      border-bottom: 1px solid var(--app-tertiary-color);
      font-size: 1em;
      color: var(--app-tertiary-color);
    }

    .type-container input::placeholder {
      color: var(--app-lighter-text-color);
    }

    .type-container input.error {
      border-bottom: 1px solid var(--app-primary-color);
      color: var(--app-primary-color);
    }

    .info {
      display: flex;
      flex-direction: column;
    }

    .info > span {
      flex: 1 1 0;
      margin: 1em 0;
    }

    input.date {
      font-size: 1.2em;
    }
    input.time {
      width: 4em;
    }
    input.title {
      width: inherit;
    }
    input.link {
      width: inherit;
    }

    e-rate-content{
      font-style: italic;
    }

    e-icon-button{
      background-color:#163979;
      color: white;
    }
    e-icon-button.selectedTask{
      background-color:#0d642a;
    }
    
    @media (min-width: 460px) {
      .info {
        flex-direction: row;
      }
      input.link, input.title {
        width: 20em;
      }
    }
  </style>
`;

class SubmitSelfDirectedMessage extends connect(store)(LitElement) {

  hasError(name) {
    return this.errors.indexOf(name) >= 0;
  }

  firstLetter(description) {
    return description[0].toLowerCase() + description.slice(1);
  }

  selected(type) {
    return type.messageTypeId === this.messageTypeId;
  }

  renderSelfDirected() {
    if (this.hero != auth_service.getUserPrincipleName()) return html``;

    return html`
      <div>
        <em>On </em>
        <input
          type="date"
          name="dateCompleted"
          class="date ${this.hasError('dateCompleted') ? 'error' : ''}"
        />

        <div class="types">
          ${this.types.map(
            (type) => html`
              <e-icon-button
                .icon="${type.icon}"
                .text="I ${this.firstLetter(type.description)}"
                .selected="${this.selected(type)}"
                class="${this.selected(type) ? 'selectedTask' : ''}"
                @click="${(e) => this.messageTypeSelected(type)}"
              ></e-icon-button>
            `
          )}
        </div>
        <div class="info">
        <span>
            <em>
              Titled:
              <input
                type="text"
                name="title"
                class="title ${this.hasError('title') ? 'error' : ''}"
                placeholder="title"
              />
            </em>
          </span>
          </div>
        <div class="info">
          <span>
            <em>
              and I spent approximately
              <input
                type="number"
                name="timeSpent"
                class="time ${this.hasError('timeSpent') ? 'error' : ''}"
                placeholder="#"
              />
              hours on it.
            </em>
          </span>
          <span>
            <em>
              Link reference:
              <input
                type="text"
                name="link"
                class="link ${this.hasError('link') ? 'error' : ''}"
                placeholder="http://"
                list="search-content"
                @input=${(e) => this.requestUpdate()}
              />
              <datalist id="search-content">
                ${this.renderContentOptions()}
              </datalist>
            </em>
          </span>
        </div>

        ${this.renderContentRating()}

        <em>I learned the following:</em>
      </div>
    `;
  }

  renderContentRating() {
    if (!configService.config.RATING_CONTENT_ENABLED || !configService.config.TAG_CONTENT_ENABLED) {
      return html``;
    } else if(this.mediaTypeId) {
      return html`
        <e-rate-content 
          id="content-rating"
          @rating-changed=${(e) => this.ratingId = e.detail.ratingId}
          @tags-changed=${(e) => this.tags = e.detail.tags}
        ></e-rate-content>
      `;
    } else {
      return '';
    }
  }

  renderContentOptions() {
    let options = this.contentSearchOptions.map((content) =>
      html`
        <option value="${content.url}">
      `);
    return  html`${options}`;
  }

  renderMarkdownTip() {
    if (!this.noMarkdownSupport)
      return html`
        <a
            href="https://guides.github.com/features/mastering-markdown/"
            target="_blank"
          >
            (protip: this field supports markdown)
          </a>
      `;
    
    return html``;
  }

  render() {
    return html`
      ${styles}
      <form class="type-container" @submit=${(e) => this.submit(e)}>
        ${this.renderSelfDirected()}
        <div>
          <textarea name="comment" class="${this.hasError('comment') ? 'error' : ''}"></textarea>
        </div>
        <div class="help-text">
          ${this.renderMarkdownTip()}
        </div>
        <div class="buttons">
          <button type="submit" class="comment big">Comment</button>
        </div>
      </form>
    `;
  }

  static get properties() {
    return {
      hero: String,
      types: Array,
      errors: Array,
      messageTypeId: Number,
      selectedButton: Object,
      multiplier: Number,
      messageTypes: Array
    };
  }

  messageTypeSelected(messageType) {
    if (messageType.messageTypeId === this.messageTypeId) {
      //This is for deselecting a type, if you click on the same one twice it will deselect it
      //Gery - 2019/10/09
      this.messageTypeId = 0;
      this.mediaTypeId = undefined;
      this.errors = [];
    } else {
      this.messageTypeId = messageType.messageTypeId;
      this.rating = 0;
      this.mediaTypeId = messageType.contentMediaTypeId;
    }
  }

  async submit(e) {
    e.preventDefault();

    const form = e.target;
    let comment = form.comment.value.trim();

    this.validate(form, comment);

    if (this.errors.length) return;
    this.errors = [];

    comment = message_service.sanitizeInput(comment);

    let messageTypeId = this.messageTypes.find((type) => type.code === 'conversation').messageTypeId;

    let learningTask;
    if (this.messageTypeId) {
      messageTypeId = this.messageTypeId;
      learningTask = {
        dateCompleted: form.dateCompleted.value,
        title: form.title.value,
        link: form.link.value,
        timeSpent: form.timeSpent.value
      };
    }

    let isSelfDirected = this.messageTypes.find(type => type.messageTypeId === messageTypeId).selfDirected;

    let content;
    if (this.mediaTypeId) {
      content = {
        url: form.link.value,
        userPrincipalName: this.hero,
        mediaTypeId: this.mediaTypeId,
      };
      if (configService.config.TAG_CONTENT_ENABLED) {
        content.tags = this.tags;
      }else{
        // If tagging is disabled, we do not need to set tags.
      }
      if (configService.config.RATING_CONTENT_ENABLED) {
        content.ratingId = this.ratingId;
      }else{
        // If rating is disabled, we do not need to set rating.
      }
    }

    let message = await message_service.createMessage(
      this.hero,
      comment,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      messageTypeId,
      learningTask,
      this.multiplier,
      isSelfDirected,
      content
    );

    if (message.content && configService.config.RATING_CONTENT_ENABLED) {
      this.shadowRoot.getElementById("content-rating").reset();
    }

    mission_service.createMissionInteraction(this.hero, messageTypeId);

    this.messageTypeId = 0;
    this.mediaTypeId = undefined;
    form.reset();
    window.scroll({
      top: 0,
      left: 0
    });

    points_service.pointsScored();
  }

  validate(form, comment) {
    let errors = [];

    if (!comment) {
      errors.push('comment');
    }

    if (this.messageTypeId) {
      if (!form.dateCompleted.value) {
        errors.push('dateCompleted');
      }

      if (!form.title.value) {
        errors.push('title');
      }

      if (!form.link.value) {
        errors.push('link');
      }

      if (!form.timeSpent.value) {
        errors.push('timeSpent');
      }
    }
    if (this.mediaTypeId && configService.config.RATING_CONTENT_ENABLED) {
      const contentRating = this.shadowRoot.getElementById("content-rating");
      if (contentRating) {
        if (!contentRating.isValid()) {
          errors.push('rating');
        }
      } else {
        // If the rate system is disabled, we do not require a rating.
      }
    }

    this.errors = [...errors];
  }

  firstUpdated(){
    multiplier_service.getMultiplier();
    content_service.getContent();
  }

  stateChanged(state) {
    this.hero = selectHero(state);
    let allTypes = selectMessageTypes(state);
    this.types = allTypes.filter((t) => t.selfDirected);
    this.errors = [];
    this.multiplier = selectMultiplier(state);
    this.messageTypes = selectMessageTypes(state);
    this.contentSearchOptions = selectContentSearchOptions(state)
  }
}

window.customElements.define('e-submit-self-directed-message', SubmitSelfDirectedMessage);
