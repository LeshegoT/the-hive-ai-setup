import { html, LitElement } from 'lit';
import { shared, link } from '../styles';
import { store } from '../store';
import { parseISOFormatDate, formatFullDateTime, formatFullDate } from '../services/format.service';
import { navigateComponent } from '../actions/app.action';

import './profile.component';
import './hero-title.component';

let styles = html`
  <style>
    ${shared()} ${link()} div.hero {
      padding: 2em;

      color: var(--app-tertiary-color);
    }

    .details {
      display: flex;
    }

    .details > * {
      flex: 1 1 auto;
    }

    h3 {
      color: var(--app-secondary-color);
    }

    h3 > span {
      font-weight: lighter;
    }

    .details > div > span {
      font-weight: bold;
    }

    .details > div:last-child {
      text-align: right;
    }

    button {
      font-size: 1em;
      min-width: 10em;
      margin-top: 1em;
    }

    .hero > span {
      margin-top: 0.5em;
      color: var(--app-primary-color);
      display: block;
      font-size: 1.1em;
    }

    .notify-bubble {
      position: relative;
      width: 1.5em;
      height: 1.5em;
      line-height: 1.5em;
      bottom: 1em;
      right: 1em;
      background-color: var(--app-header-selected-color);
      color: white;
      font-size: 0.65em;
      border-radius: 50%;
      box-shadow: 1px 1px 1px gray;
      display: inline-block;
      text-align: center;
    }
  </style>
`;

class Hero extends LitElement {
  renderButtons() {
    if (!this.buttons) return html``;

    let logButton = html`
      <button
        @click="${(e) => this.navigate('/log', btoa(this.quest.heroUserPrincipleName))}"
      >
        Log
      </button>
    `;

    if (this.quest.status !== 'in-progress') {
      return html`
        <span>This quest is ${this.quest.status}!</span>
        <div class="buttons">
          ${logButton}
          <button @click="${(e) => this.navigate(`/guide-feedback`, this.quest.questId)}">
            Give Feedback
          </button><span class="notify-bubble">!</span>
        </div>
      `;
    }

    let showTimeWarning = html``;
    if (this.quest.endDate <= new Date()) {
      showTimeWarning = html`
        <span>
          <b>Out of time!</b>
          Chat to your hero to decide what the next steps are.
        </span>
      `;
    }

    return html`
      ${showTimeWarning}
      <div class="buttons">
        <button
          @click="${(e) =>
            this.navigate('/missions', btoa(this.quest.heroUserPrincipleName))}"
        >
          Missions
        </button>
        ${logButton}
        <button @click="${(e) => this.navigate('/quest', this.quest.questId)}">
          Edit
        </button>
      </div>
    `;
  }

  render() {
    if (!this.quest) return html``;

    return html`
      ${styles}

      <div class="hero">
        <e-hero-title .hero="${this.quest.heroUserPrincipleName}"></e-hero-title>
        <h3>Goal: <span>${this.quest.goal}</span></h3>
        
        <div class="details">
        <h3>Status: <span>${this.quest.status}</span></h3>
        <h3>Last Activity: <span>${formatFullDateTime(parseISOFormatDate(this.quest.lastActive))}</span></h3>
        <h3>Completed Missions: <span>${this.quest.completedMissions} / ${this.quest.totalMissions}</span></h3>
        </div>
        <div class="details">
          <div><span>Start Date:</span> ${formatFullDate(parseISOFormatDate(this.quest.startDate))}</div>
          <div><span>Spec:</span> ${this.quest.specialisation.name}</div>
        </div>
        <div class="details">
          <div><span>End Date:</span> ${formatFullDate(parseISOFormatDate(this.quest.endDate))}</div>
          <div><span>Level:</span> ${this.quest.questType.name}</div>
        </div>
        ${this.renderButtons()}
      </div>
    `;
  }

  navigate(url, queryString) {
    store.dispatch(navigateComponent(`${url}/${queryString}`));
  }

  static get properties() {
    return {
      quest: Object,
      buttons: Boolean
    };
  }
}

window.customElements.define('e-hero', Hero);
