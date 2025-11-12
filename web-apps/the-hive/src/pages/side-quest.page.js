import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element.js';
import { shared, animations, hex, link } from '../styles';
import {
  selectSideQuest,
  selectSideQuestMission
} from '../selectors/side-quests.selectors.js';
import sideQuestService from '../services/side-quests.service';
import { formatDateTime } from '../services/format.service';
import markdownService from '../services/markdown.service.js';

import '../components/title.component';
import '../components/side-quest-name.component';
import '../components/icon.component';
import '../components/submit-message.component';
import '../components/sub-title.component';
import '../components/message-list.component';
import '../components/youtube-content.component';

const styles = html`
  <style>
    ${shared()} ${hex()} ${animations()} ${link()}.is-registered {
      float: right;
      margin-top: -2em;
    }

    .buttons {
      display: flex;
      justify-content: space-between;
    }

    button,
    a {
      font-size: 1em;
    }

    .details {
      display: flex;
      margin: 1em 0;
      justify-content: space-evenly;
    }

    .detail-box {
      display: inline-flex;
      padding: 0.5em 0;
    }

    .icon {
      color: var(--app-primary-color);
      flex-basis: 10%;
      margin-top: 0.1em;
    }

    .detail-text {
      flex-basis: 90%;
    }

    @media (max-width: 460px) {
      .details {
        display: inline-block;
        flex-wrap: wrap;
      }
    }
  </style>
`;

class SideQuest extends StatefulPage {
  renderRegister(sideQuest) {
    if (sideQuest.externalEvent) {
      return html`
        <a class="button" target="_blank" .href="${sideQuest.link}"> Go Register</a>
      `;
    }

    if (sideQuest.hasAttended) {
      return html`
        <i>Completed</i><br />
      `;
    }

    if (Date.now() > sideQuest.startDate) {
      return html`
        <i>Missed</i><br />
      `;
    }

    if (sideQuest.hasRSVPed) {
      return html`
        <i>Registered</i><br />
      `;
    } else {
      return html`
        <button id="register" type="button" @click="${(e) => this.register(sideQuest)}">
          Register
        </button>
      `;
    }
  }

  renderDetails(sideQuest) {
    if (!this.sideQuest) return html``;

    return html`
      <div class="details">
        ${!this.sideQuest.startDate
          ? html``
          : html`
              <div class="detail-box">
                <e-icon class="icon" icon="images/logos/calendar.svg"></e-icon>
                <div class="detail-text">
                  <strong>Date:</strong> ${formatDateTime(this.sideQuest.startDate)}
                </div>
              </div>
            `}
        ${this.sideQuest.externalEvent && this.sideQuest.link
          ? html`
              <div class="detail-box">
                <e-icon class="icon" icon="images/logos/external-link.svg"></e-icon>
                <div class="detail-text">
                  <a target="_blank" href=${this.sideQuest.link}>
                    ${this.sideQuest.name} site
                  </a>
                </div>
              </div>
            `
          : html`
              <div></div>
            `}
        ${!this.sideQuest.venue
          ? html``
          : html`
              <div class="detail-box">
                <e-icon class="icon" icon="images/logos/location.svg"></e-icon>
                <div class="detail-text">
                  <strong>Venue:</strong> ${this.sideQuest.venue}
                </div>
              </div>
            `}
      </div>
    `;
  }

  renderRecording(){
    if (!this.sideQuest || !this.sideQuest.youTubeKey) return html``;

    return html`
      <section class="fade-in">
        <e-youtube-content .youtubeKey="${this.sideQuest.youTubeKey}" ></e-youtube-content>
      </section>
    `;

  }
  render() {
    if (!this.sideQuest) return html``;

    return html`
      ${styles}
      <section class="fade-in">
        <e-title .name="${this.sideQuest.name}" .icon="${this.sideQuest.icon}"></e-title>

        <div class="is-registered">
          ${this.renderRegister(this.sideQuest)}
        </div>
        ${this.renderDetails(this.sideQuest)}
        <h4>${this.sideQuest.typeDescription}</h4>

        <p>${this.description}</p>
      </section>
      
      ${this.renderRecording()}

      <section>
        <e-sub-title text="Your thoughts" icon="images/logos/messages.svg"></e-sub-title>

        <e-message-list .sideQuestId="${this.sideQuest.id}"></e-message-list>
        <p>
          Reflect on what you've learned from this side quest:
        </p>
        <e-submit-message .mission="${this.mission}" showBack="true"></e-submit-message>
      </section>
    `;
  }
  static get properties() {
    return {
      id: Number,
      sideQuest: Object,
      mission: Object,
      description: String
    };
  }

  firstUpdated() {
    if (!this.sideQuest) {
      sideQuestService.getSideQuests();
    }
  }

  updated() {
    if (this.sideQuest && !this.description) {
      this.description = markdownService.convertMarkdownToHtml(
        this.sideQuest.description
      );
    }
  }

  register(sideQuest) {
    sideQuestService.registerForSideQuest(sideQuest.id);
  }

  stateChanged(state) {
    this.sideQuest = selectSideQuest(state);
    this.mission = selectSideQuestMission(state);
  }
}

window.customElements.define('e-side-quest', SideQuest);
