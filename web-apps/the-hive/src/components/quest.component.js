import { html, LitElement } from 'lit';
import { shared, animations, hex } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import {
  selectQuest,
  selectQuestMissions,
  selectQuestDaysRemaining
} from '../selectors/quest.selectors';
import { edit,request } from './svg';
import navigationService from '../services/navigation.service';

import './my-avatar.component';
import './dial.component';
import './mission-name.component';
import './hero-title.component';
import { selectGuideRequests } from '../selectors/hero.selectors.js';
import authService from '../services/auth.service';

let styles = html`
  <style>
    ${shared()} ${animations()} ${hex()} :host {
      position: relative;
      display: block;
      min-height: 25em;
    }

    :host > div {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    h3 {
      font-size: 1.3em;
      font-weight: lighter;
      padding-left: 0;
      margin: 0;
      text-align: center;
    }

    h3 > b {
      margin-left: 0.2em;
    }

    h4 {
      font-size: var(--readable-font-size);
      font-weight: lighter;
      margin: 0;
      margin-bottom: 2em;
    }

    h4 span {
      display: block;
      margin: 0;
    }

    h4 span b {
      margin: 0 0.25em;
    }

    div.avatar-container {
      position: relative;
      width: 15em;
      height: 22em;
      margin: 4em auto;
    }

    e-dial {
      width: 18em;
      position: absolute;
      bottom: 6em;
      left: -1.5em;
      top: -5em;
    }

    e-avatar {
      margin-bottom: -1em;
      right: 0;
    }
    e-my-avatar {
      top: -3em;
      right: 1em;
    }
    h4 > *,
    .your-guide {
      display: flex;
      height: 3em;
      align-items: center;
      margin:20px auto 20px auto;
    }

    h4 > * b {
      margin-left: 1em;
    }

    .your-guide > * {
      align-self: center;
    }

    .edit {
      background: transparent;
      border: 1px solid var(--app-tertiary-color);
      font-size: 0.8em;
      padding: none;
    }

    .edit:hover {
      border: 1px solid var(--app-primary-color);
      background: transparent;
      color: var(--app-primary-color);
    }

    .edit svg {
      fill: var(--app-tertiary-color);
      cursor: pointer;
      margin: -0.2em 0;
    }
    .edit:hover svg {
      fill: var(--app-primary-color);
    }

    .complete {
      margin: 0 0 0 2em;
      align-self: center;
    }

    a.hex-group {
      text-decoration-line: none;
    }

    .request-link {
      border: 1px solid var(--app-secondary-color);
      border-radius: 5px;
      padding: 5px 10px;
      font-weight: 500;
      color: var(--app-secondary-color);
    }

    .request-link svg {
      position: relative;
      height: 20px;
      fill: var(--app-secondary-color);
      top: 4px;
    }

    e-mission-name {
      margin-left: 2rem;
    }

    .missions {
      margin-top: 2em;
      margin-left: 2em;
    }

    @media (min-width: 60rem) {
      :host > div {
        flex-direction: row;
      }

      h3 {
        font-size: 1.5em;
      }

      div.avatar-container {
        margin: 4em 1em 0 1em;
      }

      .missions {
        margin: 0;
        min-height: 20em;
        padding-top: 2em;
      }

      .request-link {
        margin-left: 0.5em;
        text-decoration: none;
        color: var(--app-secondary-color);
      }

      .request-link:hover {
        color: var(--app-primary-color);
        border-color: var(--app-primary-color);
      }

      .request-link:hover svg {
        fill: var(--app-primary-color);
      }

      div.quest-content {
        display: flex;
        justify-content: space-evenly;
      }

      .your-guide {
        margin: 0;
      }

      e-mission-name {
        margin-left: 0;
      }
    }
  </style>
`;

class Quest extends connect(store)(LitElement) {
  showGuide() {
    let pendingGuide = this.guideRequests.filter(
      (request) =>
        request.heroUserPrincipleName.toLowerCase() == authService.getUserPrincipleName().toLowerCase() &&
        request.requestStatusType == 'PENDING'
    );

    if (this.quest.guideUserPrincipleName)
      return html`
        <div class="your-guide">
          <span>
            Guide:
          </span>
          <e-hero-title
            .hero="${this.quest.guideUserPrincipleName}"
            orientation="right"
            hideemail="true"
          ></e-hero-title>
          <a href="/guide-request" class="request-link">My Guide</a>
        </div>
      `;

    if (pendingGuide.length > 0)
      return html`
        <div class="your-guide">
          <span>Guide:</span>
          <e-hero-title
            .hero="${pendingGuide[0].guideUserPrincipleName}"
            orientation="right"
            hideemail="true"
          ></e-hero-title>
          <a href="/guide-request" class="request-link">Change Guide</a>
        </div>
      `;

      return html`
        <div class="your-guide"><span>Guide: <a href="/guide-request" class="request-link">
        ${request}
        Request a Guide</a></span></div>
      `;
  }

  showTimeUp() {
    if (this.daysRemaining > 0) return html``;

    return html`
      <div class="time">
        <b>You're out of time! </b> <a href="/log">Chat to your guide</a> about what
        happens next.
      </div>
    `;
  }

  render() {
    const { quest, missions } = this;
    if (!quest || !missions.length) return html``;
    return html`
      ${styles}
        <h3 class="fade-in quest-heading">
          <span><b>${quest.questType ? quest.questType.name : ''}</b></span>
          Goal: <b>${quest.goal}</b>
          <button class="edit" @click=${() => navigationService.navigate(`/quest/${quest.questId}`)}>${edit} Edit Quest</button>
        </h3>
        <div class="fade-in quest-content" >
          ${this.showGuide()}
        </div>
      <div class="fade-in quest-content">
        <div>
          <div class="missions">
            ${this.missions.map(
              (mission, index) => {
                return html`
                          <e-mission-name
                            class="hex-group"
                            .mission="${mission}"
                            .missionLink="${this.getSpecialLink(mission)}"
                            .index="${index}"
                          ></e-mission-name>
                        `
              }
            )}
          </div>
        </div>
        <div class="avatar-container">
          <e-dial></e-dial>
          <e-my-avatar></e-my-avatar>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      quest: Object,
      missions: Array
    };
  }
  getSpecialLink(mission){
    if (mission.type === 'completeQuest') 
      return `/quest/${this.quest.questId}/complete`;
  }

  getIncompleteMissions(){
    return this.missions.filter(m => {
      let comepleted = !!m.dateCompleted || 
        (!!m.course && (m.course.completedSections >=  m.course.totalSections))
      ;
      return !comepleted;
    });
  }

  stateChanged(state) {
    this.quest = selectQuest(state);
    this.missions = selectQuestMissions(state);
    this.daysRemaining = selectQuestDaysRemaining(state);
    this.guideRequests = selectGuideRequests(state);
  }
}

window.customElements.define('e-quest', Quest);
