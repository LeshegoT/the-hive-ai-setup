import { html, LitElement } from 'lit';
import { shared } from '../styles';
import { store } from '../store.js';
import message_service from '../services/message.service';
import navigation_service from '../services/navigation.service';
import { connect } from 'pwa-helpers/connect-mixin';
import { selectHero } from '../selectors/hero.selectors';
import missions_service from '../services/missions.service';
import multiplier_service from '../services/multiplier.service';
import points_service from '../services/points.service';
import { selectSideQuest } from '../selectors/side-quests.selectors';
import { selectMultiplier } from '../selectors/multiplier.selector';
import { selectMessageTypes } from '../selectors/reference-data.selectors';
import config_service from '../services/config.service';

let styles = html`
  <style>
    ${shared()} textarea {
      width: 100%;
      height: 5em;
      font-size: 1.1em;
    }

    input[type='checkbox'] {
      height: 1.75em;
      width: 1.75em;
      margin-right: 0.5em;
    }

    textarea {
      box-sizing: border-box;
      width: 100%;
      padding: 0.5em;
    }

    .complete {
      display: flex;
      justify-content: flex-end;
      margin: 0.5em 0;
    }

    .complete a,
    .complete a:visited {
      flex: 1;
      color: var(--app-tertiary-color);
      text-decoration: none;
      font-style: italic;
    }

    .complete a:hover {
      text-decoration: underline;
    }

    .buttons {
      display: flex;
      justify-content: space-between;
      flex-direction: row-reverse;
    }

    .hide {
      display: none;
    }

    button.comment {
      align-self: flex-start;
    }

    .error {
      border: 0.1em solid var(--app-primary-color);
      box-shadow: 0.5px 0.5px 1.5px var(--app-primary-color);
    }
  </style>
`;

class SubmitMessage extends connect(store)(LitElement) {
  renderCompleteMission() {
    if (!this.mission || this.mission.dateCompleted) return html``;

    return html`
      <input id="complete" name="complete" type="checkbox" />
      <label for="complete">Mark as completed</label>
    `;
  }

  renderRating() {
    if (!config_service.config.RATING_CONTENT_ENABLED || !config_service.config.TAG_CONTENT_ENABLED) {
      return html``;
    } else if (!(this.rateContent && this.messageType && this.messageType.contentMediaTypeId)) {
      return html``;
    } else {
      return html`
      <e-rate-content 
      name="rating"
      id="content-rating" 
      @rating-changed=${(e) => this.ratingId = e.detail.ratingId}
      @tags-changed=${(e) => this.tags = e.detail.tags}
        ></e-rate-content>
      `;
    }
  }

  renderCustomCheckBox() {
    if (!this.customCheckCallback || !this.customCheckLabel) return html``;

    return html`
      <input id="customCheck" name="customCheck" type="checkbox" />
      <label for="customCheck">${this.customCheckLabel}</label>
    `;
  }

  renderBack() {
    if (!this.showBack) return html``;

    return html`
      <button type="button" class="back big" @click=${(e) => this.back()}>Back</button>
    `;
  }

  renderMarkdownTip() {
    if (!this.noMarkdownSupport)
      return html`
        <a href="https://guides.github.com/features/mastering-markdown/" target="_blank">
          (protip: this field supports markdown)
        </a>
      `;

    return html``;
  }

  render() {
    return html`
      ${styles}

      <form @submit=${(e) => this.submit(e)}>
        <div>
          <textarea name="comment" class="${this.error ? 'error' : ''}"></textarea>
        </div>
        <div class="complete">
          ${this.renderMarkdownTip()} ${this.renderCompleteMission()} ${this.renderCustomCheckBox()}
        </div>
        ${this.renderRating()}
        <div class="buttons">
          <button type="submit" class="comment big">Comment</button>
          ${this.renderBack()}
        </div>
      </form>
    `;
  }

  static get properties() {
    return {
      hero: String,
      showBack: Boolean,
      preventScrollToTop: Boolean,
      mission: Object,
      course: Object,
      sideQuest: Object,
      quest: Object,
      error: Boolean,
      callback: Function,
      toTarget: String,
      customCheckCallback: Function,
      customCheckLabel: String,
      multiplier: Number,
      messageType: Object,
      rateContent: Boolean,
    };
  }

  firstUpdated() {
    multiplier_service.getMultiplier();
  }

  back() {
    window.history.back();
  }

  getMessageType(messageTypes) {
    let messageType = messageTypes.find((type) => type.code === 'conversation');

    if (this.quest) {
      messageType = messageTypes.find((type) => type.code === 'quest');
    }

    if (this.mission) {
      messageType = messageTypes.find((type) => type.code === 'mission');
      if (messageType) {
        messageType.contentMediaTypeId = this.mission.contentMediaTypeId;
      }
    }

    if (this.sideQuest) {
      messageType = messageTypes.find((type) => type.code === 'side-quest');
    }

    if (this.course) {
      messageType = messageTypes.find((type) => type.code === 'course');
    }

    return messageType;
  }

  async submit(e) {
    e.preventDefault();

    const form = e.target;

    let comment = form.comment.value.trim();

    this.error = false;
    if (!comment) {
      this.error = true;
    }


    if (this.error) {
      return;
    }

    comment = message_service.sanitizeInput(comment);

    let completed;
    if (form.complete) completed = form.complete.checked;

    let link;

    let questId;
    if (this.quest) {
      questId = this.quest.questId;
    }

    let missionId;
    if (this.mission) {
      missionId = this.mission.missionId;
      link = this.mission.link;
    }

    let sideQuestId;
    if (this.sideQuest) {
      sideQuestId = this.sideQuest.id;
    }

    let courseId;
    if (this.course) {
      courseId = this.course.courseId;
      link = `${config_service.baseUrl}/course/${this.course.code}`;
    }

    let content;
    if (this.rateContent && this.messageType.contentMediaTypeId) {
      content = {
        url: link,
        userPrincipalName: this.hero,
        mediaTypeId: this.messageType.contentMediaTypeId,
        tags: this.tags,
        ratingId: this.ratingId
      }
    }

    let message = await message_service.createMessage(
      this.toTarget || this.hero,
      comment,
      completed,
      questId,
      missionId,
      sideQuestId,
      courseId,
      this.messageType.messageTypeId,
      undefined,
      this.multiplier,
      this.messageType.isSelfDirected,
      content
    );
    
    if (this.customCheckCallback && form.customCheck.checked) this.customCheckCallback();
    form.reset();
    
    if (this.callback) this.callback();
    
    if (completed) {
      missions_service.completeMission(missionId, this.mission.type.missionTypeId, this.hero);
      navigation_service.navigate('/');
      points_service.pointsScored();
    } else if (!this.preventScrollToTop) {
      window.scroll({
        top: 0,
        left: 0,
      });
    }
    
    if (message && message.content && config_service.config.RATING_CONTENT_ENABLED) {
      this.shadowRoot.getElementById("content-rating").reset();
    }
  }

  stateChanged(state) {
    this.hero = selectHero(state);
    this.sideQuest = selectSideQuest(state);
    this.multiplier = selectMultiplier(state);
    let messageTypes = selectMessageTypes(state);
    this.messageType = this.getMessageType(messageTypes);
  }
}

window.customElements.define('e-submit-message', SubmitMessage);
