import { html } from 'lit';
import { store } from '../store';
import { selectHeroQuests, selectExistingQuest } from '../selectors/hero.selectors';
import { selectGuideRequests } from '../selectors/hero.selectors.js';
import { getUserData } from '../services/user-data.service';
import { shared, animations, link } from '../styles';
import heroService from '../services/hero.service';
import { formatDate } from '../services/format.service';
import { questExistsErrorReceived } from '../actions/quest-exists-error-received.action';
import authService from '../services/auth.service';
import guideService from '../services/guide.service';

import '../components/title.component';
import '../components/hero.component';
import '../components/select.component';
import { edit, clear } from '../components/svg';
import { StatefulPage } from './stateful-page-view-element';

let styles = html`
  <style>
    ${shared()} ${animations()} ${link()} :host {
      display: block;
    }

    a.button {
      font-size: 0.8em;
      margin-left: auto;
    }

    e-hero:first-of-type {
      margin-top: 3em;
    }

    e-hero:nth-of-type(odd) {
      background: var(--app-section-even-color);
    }

    .existing {
      color: var(--app-secondary-color);
      margin: 3em auto 5em;
      border-bottom: 1px solid var(--app-tertiary-color);
    }

    .buttons {
      display: flex;
    }

    .buttons > e-hero-title {
      flex: 1 1 auto;
    }

    .buttons > div {
      display: flex;
      flex-direction: column-reverse;
    }

    .buttons > div > a {
      flex: 0 0 auto;
      margin-right: 1em;
      display: flex;
      margin-bottom: 0.6em;
    }

    .buttons > div > a:hover svg {
      stroke: none;
    }

    .existing > h4 > span {
      font-weight: lighter;
    }

    .existing > h4 {
      margin: 0 3.3em;
    }

    table {
      border: 1px solid var(--app-tertiary-color);
      border-collapse: collapse;
      margin-bottom: 1.5em;
      width: 100%;
    }

    th, td {
      padding: 0.25em 0.75em;
      text-align: center;
    }

    tr:nth-child(even) {
      background-color: var(--app-section-even-color);
    }

    .cancel {
      color: var(--app-primary-color);
    }

    @media (min-width: 460px) {
      .buttons > div {
        flex-direction: row;
      }
    }
    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1em;
      margin: 1em 0;
      padding: 0.8em 1.2em;
      background: var(--app-section-odd-color);
      border-radius: 8px;
    }

    @media (max-width: 600px) {
      .controls {
        flex-direction: column;
        align-items: stretch;
      }
    }
  </style>
`;

class HeroQuestSummary extends StatefulPage {
  renderExistingQuestError() {
    if (!this.existingQuest || !this.existingQuest.questId) return html``;

    let button = html`
      <a
        href="/quest/${this.existingQuest.questId}"
        @click="${(e) => this.closeExisting()}"
      >
        ${edit} Edit
      </a>
    `;

    if (this.existingQuest.guideUserPrincipleName !== authService.getUserPrincipleName()) {
      button = html``;
    }

    let endDate = this.existingQuest.endDate;
    let endDateText = endDate >= new Date() ? `ends on` : `ended on`;

    return html`
      <section class="existing">
        <div class="buttons">
          <e-hero-title
            .hero="${this.existingQuest.heroUserPrincipleName}"
          ></e-hero-title>
          <div>
            ${button}
            <a @click="${(e) => this.closeExisting()}">${clear} Close</a>
          </div>
        </div>
        <h4>
          This hero already has a quest in progress.
          <span
            >It started on ${formatDate(this.existingQuest.startDate)} and ${endDateText} ${formatDate(endDate)}.
          </span>
        </h4>
        <h4>Guide: <span>${this.existingQuest.guideUserPrincipleName}</span></h4>
      </section>
    `;
  }

  renderGuideRequests() {
    const pendingRequests = this.guideRequests.filter(
      (request) =>
        request.guideUserPrincipleName.toLowerCase() == authService.getUserPrincipleName().toLowerCase()
        && request.requestStatusType == 'PENDING'
    );

    if (pendingRequests.length) {
      return html`
          <h3>Pending Requests</h3>
          <table>
            <tr>
              <th>Hero</th>
              <th>Request Justification</th>
              <th>Accept</th>
              <th>Reject</th>
            </tr>
            ${pendingRequests.map((request) => {
              return html`
              <tr>
                <td>
                  ${request.heroUserPrincipleName}
                </td>
                <td>
                  ${request.justification}
                </td>
                <td>
                  <button @click="${(e) => this.acceptRequest(request)}">Accept</button>
                </td>
                <td>
                  <button class="cancel" @click="${(e) => this.rejectRequest(request)}">Reject</button>
                </td>
              </tr>
            `;
            })}
          </table>
      `;
    }

    return html``;
  }

  acceptRequest(request) {
    guideService.acceptGuideRequest(request);
    getUserData();
  }

  rejectRequest(request) {
    guideService.rejectGuideRequest(request);
    getUserData();
  }

  render() {
    if (!this.quests || this.quests.length === 0) {
      return html`
        ${styles}
        <section>
          <e-title name="Your Heroes" icon="images/logos/wizard.svg"></e-title>
          <div class="controls">
            <a class="button" href="/quest">Create new quest</a>
          </div>
          <p style="text-align: center; margin: 2em 0;">You don't have any heroes yet.</p>
        </section>
      `;
    } else {
      // Proceed with rendering quests
    }

    const filteredQuests = this.quests.filter(quest =>
      this.activeFilter === 'all' || quest.status === this.activeFilter
    );

      // Sort by last activity (newest first)
    const sortedQuests = [...filteredQuests].sort((a, b) => {
      // If one is not in-progress and the other is, prioritize the non-in-progress
      if (a.status !== 'in-progress' && b.status === 'in-progress') {
        return -1;
      } else if (a.status === 'in-progress' && b.status !== 'in-progress') {
        return 1;
      } else {
        // If both are same status, sort by lastActive (newest first)
        return new Date(b.lastActive) - new Date(a.lastActive);
      }
    });
    return html`
      ${styles}

      <section>
        <e-title name="Your Heroes" icon="images/logos/wizard.svg"></e-title>

        <div class="controls">
          ${this.quests && this.quests.length > 0 ? html`
            <e-select
              label="Filter Quests"
              .options="${this.filterOptions.map(option => option.label)}"
              .value="${(this.filterOptions.find(option => option.value === this.activeFilter) || this.filterOptions[0]).label}"
              @selected="${this.handleFilterChange}"
              name="quest-filter"
              style="margin-bottom: 1rem;"
            ></e-select>
          ` : ''}
          <a class="button" href="/quest">Create new quest</a>
        </div>

        ${this.renderGuideRequests()}
        ${this.renderExistingQuestError()}

        ${(() => {
          if (sortedQuests.length > 0) {
            return html`
              ${sortedQuests.map(
                (q) => html`
                  <e-hero
                    .quest="${q}"
                    .buttons="${true}"
                  ></e-hero>
                `
              )}
            `;
          } else {
            return html`
              <p style="text-align: center; margin: 2em 0;">No heroes found matching the current filters.</p>
            `;
          }
        })()}
      </section>
    `;
  }

  closeExisting() {
    store.dispatch(questExistsErrorReceived({}));
  }

  firstUpdated() {
    heroService.getHeroes();
  }

  static get properties() {
    return {
      quests: { type: Array },
      existingQuest: { type: Object },
      guideRequests: { type: Array },
      activeFilter: {
        type: String,
        attribute: 'active-filter',
        reflect: true,
        hasChanged: (value, oldValue) => value !== oldValue
      },
      filterOptions: { type: Array }
    };
  }

  constructor() {
    super();
    this.activeFilter = 'all';
    this.quests = [];
    this.loading = true;
    this.error = '';
    this.isGuide = false;
    this.filterOptions = [
      { value: 'all', label: 'All Quests' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'paused', label: 'Paused' },
      { value: 'abandoned', label: 'Abandoned' },
      { value: 'completed', label: 'Completed' }
    ];
    this.handleFilterChange = this.handleFilterChange.bind(this);
  }

  handleFilterChange(event) {
    const selectedOption = this.filterOptions.find(option => option.label === event.detail);
    if (selectedOption) {
      this.activeFilter = selectedOption.value;
    } else {
      // Default to 'all' if no matching option is found
      this.activeFilter = 'all';
    }
  }

  stateChanged(state) {
    this.quests = selectHeroQuests(state);
    this.existingQuest = selectExistingQuest(state);
    this.guideRequests = selectGuideRequests(state);
  }
}

window.customElements.define('e-hero-quest-summary', HeroQuestSummary);
