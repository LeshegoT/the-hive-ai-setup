import { html } from 'lit';
import { shared } from '../styles';
import { hex } from '../styles';

import { StatefulPage } from './stateful-page-view-element.js';
import { selectHero } from '../selectors/hero.selectors';
import { selectQuestMissions } from '../selectors/quest.selectors';
import { selectMapMission } from '../selectors/map.selectors';
import { selectCurrentQuest, selectHasOldQuests } from '../selectors/quest.selectors.js';
import { selectAllLevelUps } from '../selectors/level-up.selectors';
import { formatFullDate } from '../services/format.service';
import { loggedIn } from '../selectors/auth.selectors';
import questService from '../services/quest.service';
import levelUpService from '../services/level-up.service';
import ConfigService from '../services/config.service';

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
import '../components/icon.component';
import '../components/top-leaders.component';
import './leaderboard.page';
import '../components/new-quest.component';
import '../components/score-overview.component';
import { selectMapMessagesForSelfDirected } from '../selectors/messages.selectors';

let styles = html`
  <style>
    ${shared()}
    
    ${hex()}
    
    .background {
      background-color: var(app-dashboard-background);
      min-height: 100%;
      width: 100%;
      padding: 20px 0px 20px;
      margin: 0;
    }

    .dash-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(3, 1fr);
      grid-gap: 20px;
      padding-top: 3em;
    }

    .dash-card {
      box-shadow: 2px 3px 4px var(--app-dashboard-shadow);
      background-color: white;
      border-bottom: 5px solid var(--app-dashboard-color);
      border-radius: 5px;
    }

    .dash-card:hover {
      border-bottom: 5px solid var(--app-primary-color);
      box-shadow: 2px 3px 8px #708090;
    }

    #main-quest {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 1;
      grid-row-end: 2;
      overflow-y: scroll;
      max-height: 80vh; /*This is temporary to get a basic version of the dahsboard into prod */
    }

    #side-quest {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 2;
      grid-row-end: 3;
      overflow-y: scroll;
      max-height: 80vh; /* This is temporary to get a basic version of the dahsboard into prod */
    }

    #leaderboard {
      grid-area: leaderboard;
      overflow-y: scroll;
      grid-row: span 1;
      height: 845px;
    }

    #stats {
      grid-area: stats;
      width: 100%;
    }

    #achievements {
      grid-area: achievements;
      grid-row: span 2;
    }

    #score {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 3;
      grid-row-end: 4;
    }

    .dash-title-container {
      height: 50px;
      display: flex;
      margin: 1rem;
    }

    .dash-title {
      vertical-align: center;
      height: 50px;
      color: var(--app-primary-color);
      font-size: 24px;
      font-weight: bold;
      margin: 8px 10px;
    }

    .dash-icon {
      height: 50px;
    }

    .middle-card {
      height: 400px;
      padding: 5px;
    }

    #achievements-card {
      margin-bottom: 20px;
    }

    e-card-list {
      padding: 0 2%;
      width: 96%;
    }

    .temp-hidden {
      display: none;
    }

    .no-map {
      height: inherit;
      background-color: var(app-dashboard-color);
    }

    .self-directed-content {
      margin-top: 0;
    }

    .guide-chat {
      margin-top: 0;
    }

    .self-directed-missions {
      margin-left: 10px;
      margin-bottom: 4rem;
    }

    main {
      height: 100%;
    }

    .map-padding {
      height: 1em;
    }

    @media (min-width: 70rem) {
      .dash-container {
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(3, 1fr);
        grid-gap: 20px;
      }

      #main-quest {
        grid-column-start: 1;
        grid-column-end: 4;
        grid-row-start: 1;
        grid-row-end: 3;
      }

      #side-quest {
        grid-column-start: 4;
        grid-column-end: 5;
        grid-row-start: 1;
        grid-row-end: 4;
        max-height: 100vh;
      }

      #score {
        grid-column-start: 1;
        grid-column-end: 4;
        grid-row-start: 3;
        grid-row-end: 4;
      }

      .self-directed-content {
        float: left;
        width: 60%;
        height: 100%;
      }

      .self-directed-missions {
        float: left;
        margin-top: 4rem;
        height: 100%;
      }
    }
  </style>
`;

class Dashboard extends StatefulPage {
  renderMap() {
    if (this.quest && ConfigService.loaded && ConfigService.config.MAP_ENABLED) {
      return html`
        <e-hex-map></e-hex-map>
      `;
    }

    return html`<div class="map-padding"></div>`;
  }

  renderMessageInput() {
    if (this.mapMission && this.mapMission.type.code === 'conversation')
      return html`
        <e-submit-message></e-submit-message>
      `;
  }

  renderSelfDirectedSection() {
    if (this.showSelfDirectedDetails && this.selectedSelfDirectedMission)
      return html`
        <div class="selfDirectedToggle">
          <button class="new-entry" type="button" @click="${(e) => this.toggleSelfDirected()}">Add new entry</button>
        </div>
        <div>
          <e-title
            .name="${this.selectedSelfDirectedMission.title
              ? this.selectedSelfDirectedMission.title
              : this.selectedSelfDirectedMission.name}"
            .icon="${this.selectedSelfDirectedMission.icon}"
          ></e-title>
          <div class="selfDirectedToggle"></div>
        </div>

        <article>
          <h3>Your notes...</h3>
          <a href="${this.selectedSelfDirectedMission.link}" target="_blank">
            <e-conversation-message
              .message="${this.selectedSelfDirectedMission}"
              .me="${true}"
              class="${true} fade-in"
            ></e-conversation-message>
          </a>
        </article>
      `;

    return html`
      <e-submit-self-directed-message .noMarkdownSupport="${true}"></e-submit-self-directed-message>
    `;
  }

  renderQuestComponenets() {
    let conversationClass =
      this.mapMission && this.mapMission.type.code === 'conversation' ? 'conversation-container' : '';
    let hideGuide = this.mapMission && this.mapMission.type.code === 'conversation' ? '' : 'guide-hidden';

    if (this.quest && this.mapMission && this.mapMission.type.code === 'self-directed') {
      return this.renderQuestComponentsSelfDirected();
    }

    if (this.quest && this.mapMission) {
      return this.renderQuestComponentsWithMapMissionDetails(conversationClass);
    }

    if (this.quest) {
      return this.renderQuestComponentsQuestOnly(conversationClass, hideGuide);
    }
  }

  renderQuestComponentsSelfDirected() {
    return html`
      <main>
        <article class="main-content-section">
          <section class="self-directed-content">${this.renderSelfDirectedSection()}</section>
        </article>
        <article class="side-content-section self-directed-missions">
          ${this.selfDirectedMapMissions.map(
            (mission, index) =>
              html`
                <div class="hex-group" @click="${(e) => this.selectSelfDirected(mission)}">
                  <e-hex-name
                    .icon="${mission.icon}"
                    .name="${mission.title ? mission.title : mission.name} - ${formatFullDate(mission.creationDate)}"
                    .index="${index + 1}"
                    .simpleList="${true}"
                  ></e-hex-name>
                </div>
              `
          )}
        </article>
      </main>
    `;
  }

  renderQuestComponentsWithMapMissionDetails(conversationClass) {
    return html`
      <section class='guide-chat'>
        <div>
          <e-title .name="${this.mapMission.name}" .icon="${this.mapMission.type.icon}"></e-title>
          ${this.renderMissionDetailsButton()}
          <p>${this.mapMission.type.code === 'conversation' ? 'Chat to your guide' : 'Your notes...'}</p>
        </div>
        ${this.renderMessageList(conversationClass)} ${this.renderMessageInput()}
      </section>
    `;
  }

  renderQuestComponentsQuestOnly(conversationClass, hideGuide) {
    return html`
      <section>
        <e-hero-title
          .hero="${this.quest.guideUserPrincipleName}"
          orientation="left"
          hideemail="true"
          class="${hideGuide}"
        ></e-hero-title>
        <e-message-list
          class="${conversationClass}"
          mapList="${this.hero === this.username}"
          hero="${this.hero}"
        ></e-message-list>
        ${this.renderMessageInput()}
      </section>
    `;
  }

  renderMessageList(conversationClass) {
    if (this.mapMission.type === 'completeQuest') return html``;
    return html`
      <e-message-list
        class="${conversationClass}"
        mapList="${this.hero === this.username}"
        hero="${this.hero}"
      ></e-message-list>
    `;
  }

  renderMissionDetailsButton() {
    if (this.mapMission.type === 'completeQuest')
      return html`
        <a class="button mission-details" .href="${`/quest/${this.quest.questId}/complete`}">Mission Details</a>
      `;

    return html`
      <a class="button mission-details" .href="/hero/${btoa(this.hero)}/mission/${this.mapMission.missionId}">
        Mission Details
      </a>
    `;
  }

  selectSelfDirected(selectedMission) {
    this.showSelfDirectedDetails = true;
    this.selectedSelfDirectedMission = selectedMission;
  }

  toggleSelfDirected() {
    this.showSelfDirectedDetails = !this.showSelfDirectedDetails;
  }

  renderMainContent(){
    return html`
      <section class="background">
        <div class="dash-container">
          <div class="dash-card" id="main-quest">
            <div class="dash-title-container">
              <img class="dash-icon" src="../../images/icons/quest-colour.svg" />
              <p class="dash-title">Main Quest</p>
            </div>
              ${this.renderQuests()}
          </div>
          <div class="dash-card" id="side-quest">
            <div class="dash-title-container">
              <img class="dash-icon" src="../../images/icons/coming-up-colour.svg" />
              <span class="dash-title">Coming Up</span>
            </div>
            <article class="side-content-section">
              <e-card-list></e-card-list>
            </article>
          </div>

          <div class="dash-card temp-hidden" id="leaderboard">
            <div class="dash-title-container">
              <img class="dash-icon" src="../../images/icons/leaderboard-colour.svg" />
              <p class="dash-title">Leaderboard</p>
              <div class="filler"></div>
            </div>
            <e-top-leaders></e-top-leaders>
          </div>
          <div class="temp-hidden" id="achievements">
            <div class="dash-card middle-card" id="achievements-card">
              <div class="dash-title-container">
                <img class="dash-icon" src="../../images/icons/stats-colour.svg" />
                <p class="dash-title">Stats</p>
              </div>
            </div>
            <div class="dash-card middle-card">
              <div class="dash-title-container">
                <img class="dash-icon" src="../../images/icons/achievements-colour.svg" />
                <p class="dash-title">Achievements</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderQuests() {
    if (this.quest) {
      return html`<e-quest class="main-content-section"></e-quest>`;
    } else {
      if(ConfigService.config.QUEST_TUTORIAL_ENABLED) {
        return html`<e-tutorial classs="main-content-section"></e-tutorial>`;
      } else {
        return html`<e-new-quest classs="main-content-section"></e-new-quest>`;
      }
    }
  }

  render() {
    if(this.mapMission){
      return html`
        ${styles} ${this.renderMap()} ${this.renderQuestComponenets()}
      `;
    } else{
      return html`
        ${styles} ${this.renderMap()} ${this.renderMainContent()}
      `;
    }
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

      if (!this.allLevelUps || !this.allLevelUps.length) levelUpService.getLevelUps();
      // TODO: else this is a guide viewing a hero's map and we need to adjust everything accordingly
    }
  }

  firstUpdated(){
    if (!this.quest || !this.quest.questId) {
      questService.getOldQuests();
    }
  }

  static get properties() {
    return {
      quest: Object,
      oldQuests: Boolean,
      hero: String,
      username: String,
      selectedSelfDirectedMission: Boolean,
      showSelfDirectedDetails: Boolean,
      mapMission: Object,
      allLevelUps: Array,
      selfDirectedMapMissions: Array,
    };
  }
}

window.customElements.define('e-dashboard', Dashboard);
