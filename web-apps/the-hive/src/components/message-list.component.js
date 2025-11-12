import { html, LitElement } from 'lit';
import authService from '../services/auth.service';
import './message.component';
import './conversation-message.component';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import {
  selectHeroMessages,
  selectMessagesForMission,
  selectMessagesForCourse,
  selectMessagesForSideQuest,
  selectMapMessagesForMission,
  selectMapMessagesForCourse,
  selectMapMessagesForLevelUp,
  selectMapMessagesForConversation,
  selectMapMessagesForSelfDirected
} from '../selectors/messages.selectors';
import { selectMapMission } from '../selectors/map.selectors';
import message_service from '../services/message.service';
import { selectHero } from '../selectors/hero.selectors';
import { animations } from '../styles';

let styles = html`
  <style>
    ${animations()} :host {
      margin: 1em 0;
      display: flex;
      flex-direction: column;
    }

    e-message {
      flex: 0 0 auto;
      align-self: flex-start;
    }

    e-message.my-message {
      align-self: flex-start;
      background-color: #eee;
    }

    e-conversation-message {
      flex: 0 0 auto;
      align-self: flex-start;
      max-width: 90%;
    }

    e-conversation-message.my-message {
      align-self: flex-end;
      background-color: #eee;
    }
  </style>
`;

class MessageList extends connect(store)(LitElement) {
  render() {
    return html`
      ${styles}
      ${this.renderMessages()}

      <footer>
        &nbsp;
      </footer>
    `;
  }

  renderMessages() {
    let my = (message) =>
      message.createdByUserPrincipleName == this.username && 'my-message';

    if(this.mapMission)
      return html`
        ${this.messages &&
        this.messages.map(
          (message) => html`
            <e-conversation-message
              .message="${message}"
              .me="${my(message)}"
              class="${my(message)} fade-in"
            ></e-conversation-message>
          `
        )}
      `;

    return html`
      ${this.messages &&
      this.messages.map(
        (message) => html`
          <e-message
            .message="${message}"
            .me="${my(message)}"
            class="${my(message)} fade-in"
          ></e-message>
        `
      )}
    `;
  }

  static get properties() {
    return {
      hero: String,
      username: String,
      questId: String,
      missionId: String,
      levelUpId: String,
      courseId: String,
      sideQuestId: String,
      messages: Array,
      offset: Number,
      mapList: Boolean,
      mapMission: Object
    };
  }

  firstUpdated() {
    this.username = authService.getUserPrincipleName();

    if (!this.mapList) {
      this.offset = 0;

      try {
        const options = {
          threshold: [1.0]
        };

        let callback = (entities, options) => {
          let footer = entities[0];

          if (footer.isIntersecting) {
            message_service.getMessages(
              this.hero,
              this.offset,
              this.questId,
              this.missionId,
              this.courseId,
              this.sideQuestId
            );
            this.offset++;
          }
        };

        this.observer = new IntersectionObserver(callback, options);
        this.observer.observe(this.renderRoot.querySelector('footer'));
      } catch (ex) {
        console.error(ex);
      }
    }
  }

  selectMapMessages(state) {
    switch(this.mapMission.type.code) {
      case 'course':
        this.messages = selectMapMessagesForCourse(state);
        return;
      case 'level-up':
        this.messages = selectMapMessagesForLevelUp(state);
        return;
      case 'conversation':
        this.messages = selectMapMessagesForConversation(state);
        return;
      case 'self-directed':
        this.messages = selectMapMessagesForSelfDirected(state);
        return;
      default:
        this.messages = selectMapMessagesForMission(state);
        return;
    }
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  stateChanged(state) {
    this.hero = selectHero(state);

    // This is gross... - Mike, 2019/06/29
    if (this.questId) {
      this.messages = null;
    } else if (this.missionId) {
      this.messages = selectMessagesForMission(state);
    } else if (this.courseId) {
      this.messages = selectMessagesForCourse(state);
    } else if (this.sideQuestId) {
      this.messages = selectMessagesForSideQuest(state);
    } else if (this.mapList) {
      this.mapMission = selectMapMission(state);
      if (this.mapMission)
        this.selectMapMessages(state);
    } else {
      this.messages = selectHeroMessages(state);
    }
  }
}

window.customElements.define('e-message-list', MessageList);
