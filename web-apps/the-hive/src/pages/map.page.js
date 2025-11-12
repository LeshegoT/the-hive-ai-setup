import { html } from 'lit';
import { shared } from '../styles';
import { StatefulPage } from './stateful-page-view-element.js';
import { selectHero } from '../selectors/hero.selectors';
import authService from '../services/auth.service';
import questService from '../services/quest.service.js';
import { selectQuestMissions } from '../selectors/quest.selectors';
import { selectMapMission } from '../selectors/map.selectors';
import { selectCurrentQuest, selectHasOldQuests } from '../selectors/quest.selectors.js';
import { selectAllLevelUps } from '../selectors/level-up.selectors';
import levelUpService from '../services/level-up.service';

import '../components/message-list.component';
import '../components/title.component';
import '../components/submit-self-directed-message.component';
import '../components/hex-map.component';
import '../components/tutorial.component';
import '../components/quest.component';
import '../components/card-list.component';
import '../components/new-quest.component';
import '../components/submit-message.component';

let styles = html`
  <style>
    ${shared()}

    .hidden {
      display: none;
    }

    .main-content {
      margin-bottom: 2em;
      background: none;
    }

    .conversation-container {
      max-height: 25em;
      overflow: auto;
      display: flex;
    }

    .conversation {
      flex-direction: column-reverse;
    }

    e-message-list.conversation-container {
      border-top: 1px solid var(--app-lighter-text-color);
    }

    .guide-hidden {
      display: none;
    }

    /* width */
    ::-webkit-scrollbar {
      width: 10px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
      background: var(--app-section-even-color);
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
      background: #888;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
      background: var(--app-tertiary-color);
    }
  </style>
`;

class Map extends StatefulPage  {
  renderMainContent() {
    if (this.quest) {
      return html`
        <e-quest class="quest-section"></e-quest>
      `;
    }

    if (this.oldQuests) {
      return html`
        <e-new-quest class="tutorial-section"></e-new-quest>
      `;
    }

    return html`
      <e-tutorial class="tutorial-section"></e-tutorial>
    `;
  }

  renderMessageInput() {
    if(this.mapMission && this.mapMission.type.code === 'conversation')
      return html`
        <e-submit-message .noMarkdownSupport="${true}"
        ></e-submit-message>
      `;
  }

  render() {
    let popupStyle = this.mapMission && this.mapMission.type.code === 'self-directed' ? 'display: block' : 'display: none';
    let shownClass = this.mapMission ? '' : 'hidden';
    let hideClass = this.mapMission ? 'hidden' : '';
    let conversationClass = this.mapMission && this.mapMission.type.code === 'conversation' ? 'conversation' : '';

    if(!this.quest)
      return html`
        <style>
          ${shared()}
        </style>

        <section>
          <h2>You don't currently have a quest</h2>
          <p>The quest map works much better when you have a learning quest. Head back <a href="/">home</a> to create one.</p>
        </section>
      `;

    return html`
      ${styles}
      <section class="fade-in">
        <e-title name="${this.hero !== this.username ? "Hero's Map" : 'Map'}" icon="images/logos/location.svg"></e-title>
        <e-hex-map></e-hex-map>
      </section>

      <section class="${hideClass} main-content">
          ${this.renderMainContent()}
      </section>
      <section class="${shownClass} main-content">
        <e-submit-self-directed-message .style="${popupStyle}" .noMarkdownSupport="${true}"></e-submit-self-directed-message>
        <e-hero-title
          .hero="${this.quest.guideUserPrincipleName}"
          orientation="left"
          hideemail="true"
          class="${shownClass}"
        ></e-hero-title>
        <e-message-list class="${conversationClass} conversation-container" mapList = "${this.hero === this.username}" hero="${this.hero}"></e-message-list>
        ${this.renderMessageInput()}
      </section>
    `;
  }

  toggleSelfDirected() {
    this.showSelfDirected = !this.showSelfDirected;
  }

  static get properties() {
    return {
      quest: Object,
      oldQuests: Boolean,
      hero: String,
      username: String,
      showSelfDirected: Boolean,
      mapMission: Object,
      allLevelUps: Array
    };
  }

  async connectedCallback() {
    super.connectedCallback();
  }

  async firstUpdated() {
    this.username = authService.getUserPrincipleName();
    this.showSelfDirected = false;

    if (!this.quest || !this.quest.questId) {
      questService.getOldQuests();
    }

    if (!this.allLevelUps || !this.allLevelUps.length)
      await levelUpService.getLevelUps();
  }

  stateChanged(state) {
    this.quest = selectCurrentQuest(state);
    this.oldQuests = selectHasOldQuests(state);
    this.allLevelUps = selectAllLevelUps(state);

    this.hero = selectHero(state);
    this.missions = selectQuestMissions(state);
    this.mapMission = selectMapMission(state);

    // TODO: else this is a guide viewing a hero's map and we need to adjust everything accordingly
  }
}

window.customElements.define('e-map', Map);
