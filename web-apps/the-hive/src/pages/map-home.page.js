import { html } from 'lit';
import { shared } from '../styles';
import { hex, link } from '../styles';

import { StatefulPage } from './stateful-page-view-element.js';
import { selectHero } from '../selectors/hero.selectors';
import authService from '../services/auth.service';
import questService from '../services/quest.service.js';
import { selectQuestMissions } from '../selectors/quest.selectors';
import { selectMapMission } from '../selectors/map.selectors';
import { selectCurrentQuest, selectHasOldQuests } from '../selectors/quest.selectors.js';
import { selectAllLevelUps } from '../selectors/level-up.selectors';
import levelUpService from '../services/level-up.service';
import { formatFullDate } from '../services/format.service';

import '../components/message-list.component';
import '../components/title.component';
import '../components/submit-self-directed-message.component';
import '../components/hex-map.component';
import '../components/tutorial.component';
import '../components/quest.component';
import '../components/card-list.component';
import '../components/new-quest.component';
import '../components/sub-title.component';
import '../components/submit-message.component';
import '../components/conversation-message.component';
import '../components/icon.component'
import { selectMapMessagesForSelfDirected } from '../selectors/messages.selectors';
import { loggedIn } from '../selectors/auth.selectors';

let styles = html`
  <style>
    ${shared()}
    ${hex()} ${link()}
    .toggle {
      background: transparent;
      border: 1px solid var(--app-tertiary-color);
      margin: 0.5em 2em;
      outline: none;
    }

    .toggle:hover {
      border: 1px solid var(--app-primary-color);
      background: transparent;
      color: var(--app-primary-color);
    }

    .toggleActive {
      border: 1px solid var(--app-primary-color);
      background: transparent;
      color: var(--app-primary-color);
    }

    .hidden {
      display: none;
    }

    .main-content {
      margin-bottom: 1em;
      background: none;
    }

    main{
      display: flex;
      flex-flow: row wrap;
      justify-content: space-evenly;
    }
    .main-content-section{
      order:1;
      flex-grow: 2;
      flex-basis: 2em;
    }
    .side-content-section{
      order:3;
      flex-grow: 1;
      flex-basis: 2em;

      max-height: 30em;
      overflow: auto;
      display: flex;
    }

    .self-directed-missions{
      flex-flow: column;
      padding-top: 3em;
    }

    e-hex-name:nth-child(odd){
      cursor: pointer;
      padding: 0;
      margin: 0;
    }

    e-message {
      flex: 0 0 auto;
      align-self: flex-start;
    }

    e-message.my-message {
      align-self: flex-end;
      background-color: #eee;
    }

    .conversation-container {
      max-height: 25em;
      overflow: auto;
      display: flex;
      flex-direction: column-reverse;
    }

    e-message-list.conversation-container {
      border-top: 1px solid var(--app-lighter-text-color);
    }

    e-submit-self-directed-message{
      padding: 0 3em;
    }

    .selfDirectedToggle{
      text-align: right;
    }

    .mission-details{
      float: right;
      margin-top: -2em;
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

class Home extends StatefulPage {
  renderMainContent() {
    let hideClass = this.mapMission ? 'hidden' : '';
    if (this.quest && !this.mapMission) {
      return html`
        <main>
          <e-quest class="main-content-section"></e-quest>
          <article class="side-content-section">
            <e-card-list></e-card-list>
          </article>
        </main>
      `;
    }

    if (this.oldQuests) {
      return html`
        <section class="${hideClass}">
          <e-new-quest class="tutorial-section"></e-new-quest>
          <e-card-list></e-card-list>
        </section>

      `;
    }

    return html`
      <section class="${hideClass}">
        <e-tutorial class="tutorial-section"></e-tutorial>
        <e-card-list></e-card-list>
      </section>
    `;
  }

  renderMessageInput() {
    if (this.mapMission && this.mapMission.type.code === 'conversation')
      return html`
        <e-submit-message></e-submit-message>
      `;
  }

  renderSelfDirectedSection(){
    if ( this.showSelfDirectedDetails && this.selectedSelfDirectedMission)
      return html`
        <div class="selfDirectedToggle">
          <button class="new-entry" type="button" @click="${ e => this.toggleSelfDirected()}">Add new entry</button>
        </div>
        <div>
          <e-title
            .name="${this.selectedSelfDirectedMission.title ? this.selectedSelfDirectedMission.title : this.selectedSelfDirectedMission.name}"
            .icon="${this.selectedSelfDirectedMission.icon}">
          </e-title>
        <div class="selfDirectedToggle">
        </div>
        </div>

        <article>
        <h3>Your notes...</h3>
        <a
          href='${this.selectedSelfDirectedMission.link}'
          target="_blank"
         >
          <e-conversation-message
              .message="${this.selectedSelfDirectedMission}"
              .me="${true}"
              class="${true} fade-in"
          ></e-conversation-message>
        </a>
        </article>
      `;

    return html `
      <e-submit-self-directed-message .noMarkdownSupport="${true}"></e-submit-self-directed-message>
    `;
  }

  renderQuestComponenets() {
    let shownClass = this.mapMission ? '' : 'hidden';
    let conversationClass = this.mapMission && this.mapMission.type.code === 'conversation' ? 'conversation-container' : '';
    let hideGuide = this.mapMission && this.mapMission.type.code === 'conversation' ? '' : 'guide-hidden';

    if( this.quest && this.mapMission && this.mapMission.type.code === 'self-directed'){
      return html`
        <main>
          <article class="main-content-section">
            <section class="self-directed-content">
              ${this.renderSelfDirectedSection()}
            </section>
          </article>
          <article class="side-content-section self-directed-missions">
              ${this.selfDirectedMapMissions.map(
              (mission, index) =>
                html`
                <div class="hex-group" @click="${ e => this.selectSelfDirected(mission)}">
                    <e-hex-name
                      .icon="${mission.icon}"
                      .name="${mission.title ? mission.title : mission.name} - ${formatFullDate(mission.creationDate)}"
                      .index="${index + 1}"
                      .simpleList = "${true}"
                    ></e-hex-name>
                </div>
                `
            )}
          </article>
        </main>
      `;
    }
    if (this.quest && this.mapMission)
      return html`
      <section>
        <div>
          <e-title
            .name="${this.mapMission.name}"
            .icon="${this.mapMission.type.icon}">
          </e-title>
          ${this.renderMissionDetailsButton()}
          <p>${this.mapMission.type.code === 'conversation' ? 'Chat to your guide' : 'Your notes...'} </p>
        </div>
       ${this.renderMessageList(conversationClass)}
       ${this.renderMessageInput()}
      </section>
    `
    if (this.quest)
      return html`
      <section>
        <e-hero-title
          .hero="${this.quest.guideUserPrincipleName}"
          orientation="left"
          hideemail="true"
          class="${hideGuide}"
        ></e-hero-title>
        <e-message-list class="${conversationClass}" mapList = "${this.hero === this.username}" hero="${this.hero}"></e-message-list>
        ${this.renderMessageInput()}
      </section>
    `
  }

  renderMessageList(conversationClass){
    if(this.mapMission.type === 'completeQuest') return html``;
    return html`
      <e-message-list class="${conversationClass}" mapList = "${this.hero === this.username}" hero="${this.hero}"></e-message-list>
    `;
  }

  renderMissionDetailsButton(){
    if(this.mapMission.type === 'completeQuest')
      return html`
        <a class="button mission-details" .href="${`/quest/${this.quest.questId}/complete`}">Mission Details</a>
      `;

    return html`
      <a class="button mission-details" .href="/hero/${btoa(this.hero)}/mission/${this.mapMission.missionId}">Mission Details</a>
    `;
  }

  renderMap() {
    if (this.quest)
      return html`<e-hex-map></e-hex-map>`
  }

  render() {
    return html`
      ${styles}
      ${this.renderMap()}
      ${this.renderMainContent()}
      ${this.renderQuestComponenets()}
    `;
  }

  selectSelfDirected(selectedMission){
    this.showSelfDirectedDetails = true;
    this.selectedSelfDirectedMission = selectedMission;
  }

  toggleSelfDirected() {
    this.showSelfDirectedDetails = !this.showSelfDirectedDetails;
  }

  static get properties() {
    return {
      quest: Object,
      oldQuests: Boolean,
      hero: String,
      username: String,
      selectedSelfDirectedMission: Boolean,
      showSelfDirectedDetails: Boolean,
      loggedIn:Boolean,
      mapMission: Object,
      allLevelUps: Array,
      selfDirectedMapMissions: Array
    };
  }

  async connectedCallback() {
    super.connectedCallback();
  }

  async firstUpdated() {
    this.showSelfDirected = false;
  }

  stateChanged(state) {
    let loggedInState = loggedIn(state);
    if(loggedInState){
      this.quest = selectCurrentQuest(state);
      this.oldQuests = selectHasOldQuests(state);
      this.allLevelUps = selectAllLevelUps(state);

      this.hero = selectHero(state);
      this.missions = selectQuestMissions(state);
      this.mapMission = selectMapMission(state);
      this.selfDirectedMapMissions = selectMapMessagesForSelfDirected(state);
      this.username = authService.getUserPrincipleName();
      if (!this.quest || !this.quest.questId) {
        questService.getOldQuests();
      }

      if (!this.allLevelUps || !this.allLevelUps.length)
        levelUpService.getLevelUps();

    // TODO: else this is a guide viewing a hero's map and we need to adjust everything accordingly
    }
  }
}

window.customElements.define('e-home', Home);
