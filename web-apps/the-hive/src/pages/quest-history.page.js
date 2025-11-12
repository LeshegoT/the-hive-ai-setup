import { html, LitElement } from 'lit';
import { shared, animations, hex, lists } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import questService from '../services/quest.service';
import { formatNumericDate } from '../services/format.service';

import { selectQuestsWithMissions } from '../selectors/quest.selectors';

import '../components/mission-name.component';
import '../components/hero-title.component';

let styles = html`
  <style>
    ${shared()} ${hex()} ${animations()} .quest:nth-of-type(odd) {
      background: var(--app-section-even-color);
    }

    .detailGroups {
      display: flex;
      flex-wrap: wrap;
    }

    h3 {
      color: var(--app-secondary-color);
      font-size: 1.5em;
    }

    h3 > span {
      font-weight: lighter;
    }

    .details > div > span {
      font-weight: bold;
    }

    button > span {
      float: right;
    }

    .accordion {
      color: var(--app-secondary-color);
      background: #ddd;
      cursor: pointer;
      padding: 0.8em;
      width: 100%;
      text-align: left;
      border: none;
      border-radius: 0;
      outline: none;
      transition: 0.4s;
      font-size: 1.3em;
    }

    .active,
    .accordion:hover {
      background: #ccc;
    }

    .accordion-panel {
      padding: 0 2em;
      padding-top: 0;
      background-color: white;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.2s ease-out, padding-top 0.2s ease-out;
    }

    .detail {
      display: flex;
      white-space: nowrap;
    }

    .details {
      display: flex;
      flex-direction: column;
      flex-basis: 50%;
    }

    .details > span {
      flex-basis: 10%;
    }

    .detail span {
      margin: auto 0.3em auto 2em;
    }

    .detail e-hero-title {
      font-size: 0.9em;
      white-space: normal;
      flex-wrap: wrap;
    }

    .icon {
      pointer-events: none;
    }

    @media (min-width: 460px) {
      div.quest {
        padding: 2em 4em 2em 2em;
      }

      .missions {
        padding: 1em 0em 1em 2em;
      }

      .detailGroups > .details:last-child > .detail {
        align-self: flex-end;
      }
    }
  </style>
`;

class QuestHistory extends connect(store)(LitElement) {
  renderGuide(upn) {
    if (!upn)
      return html`
        <span>Guide: None</span>
      `;

    return html`
      <span>Guide:</span>
      <e-hero-title .hero="${upn}" orientation="right"></e-hero-title>
    `;
  }

  render() {
    return html`
      ${styles}

      <section class="fade-in">
        ${this.quests.map(
          (quest) => html`
            <div class="quest">
              <h3>Goal: <span>${quest.goal}</span></h3>
              <div class="detailGroups">
                <div class="details">
                  <div class="detail">
                    ${this.renderGuide(quest.guideUserPrincipleName)}
                  </div>
                  <div class="detail">
                    <span>Start Date:</span>
                    <div>${formatNumericDate(quest.startDate)}</div>
                  </div>
                  <div class="detail">
                    <span>End Date:</span>
                    <div>${formatNumericDate(quest.endDate)}</div>
                  </div>
                </div>
                <div class="details">
                  <div class="detail">
                    <span>Level:</span>
                    <div>${quest.level}</div>
                  </div>
                  <div class="detail">
                    <span>Spec:</span>
                    <div>${quest.specialisation}</div>
                  </div>
                  <div class="detail">
                    <span>Status:</span>
                    <div>${quest.status}</div>
                  </div>
                </div>
              </div>

              <div class="missions">
                <button class="accordion" @click="${(e) => this.toggleAccordion(e)}">
                  Missions:<span class="icon">+</span>
                </button>
                <div class="accordion-panel">
                  ${quest.missions.map(
                    (mission, index) => html`
                      <e-mission-name
                        class="hex-group"
                        .mission="${mission}"
                        .index="${index}"
                        .questStatus="${quest.status}"
                      ></e-mission-name>
                    `
                  )}
                </div>
              </div>
            </div>
          `
        )}
      </section>
    `;
  }

  static get properties() {
    return {
      quests: { type: Array }
    };
  }

  toggleAccordion(e) {
    e.target.classList.toggle('active');
    let panel = e.target.nextElementSibling;
    let symbol = e.target.firstElementChild;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
      panel.style.paddingTop = '0em';
      symbol.innerHTML = '+';
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      panel.style.paddingTop = '3em';
      symbol.innerHTML = '-';
    }
  }

  firstUpdated() {
    if (!this.quests || !this.quests.length) {
      questService.getHeroQuests();
    }
  }

  stateChanged(state) {
    this.quests = selectQuestsWithMissions(state);
  }
}

window.customElements.define('e-quest-history', QuestHistory);
