import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element.js';
import { shared, animations, hex, link, lists, activities } from '../styles';
import { selectActiveSideQuests, selectPastSideQuests } from '../selectors/side-quests.selectors.js';
import { formatDateTime } from '../services/format.service';
import sideQuestService from '../services/side-quests.service';
import { checkbox } from '../components/svg';
import '../components/title.component';
import '../components/side-quest-name.component';
import '../components/hex-name.component';
import '../components/loader.component.js'

const styles = html`
  <style>
    ${shared()} ${hex()} ${animations()} ${link()} ${lists()} ${activities()} e-title {
      margin-bottom: 2em;
    }
    
    section {
      margin-bottom: 2em;
    }

    .questText{
      width: 100%;
      margin: 1em;
    }

    .labelSideQuest {
      padding-left: 2.5em;
    }

    .selectHistory{
      border-radius: 25px;
      padding: 5px;
    }


  </style>
`;

class SideQuests extends StatefulPage {
  constructor(){
    super();
    this.selectedYear = null;
  }
  render() {
    return html`
      ${styles}
      <div class="fade-in">
        <section class="fade-in">
          <e-title class="title" name="Side Quests" icon="images/logos/side-quest.svg"></e-title>
          ${this.sideQuests !== undefined
            ? this.renderSideQuests()
            : html`
                <e-loader></e-loader>
              `}
        </section>
        <section>
        <e-sub-title text="Past Side Quests" icon="images/logos/past.svg"></e-sub-title>
        ${this.availableYears && this.availableYears.length > 0
          ? html`
              <form>
                <label class="labelSideQuest">Side Quest Year : </label>
                  <select class="selectHistory" @change="${(e) => this.updateSideQuestYearView(e.target.value)}">
                    ${this.availableYears.map(
                      (year) => html`
                        <option value="${year}" ?selected="${this.selectedYear === year}">
                          ${year}
                        </option>
                      `
                    )}
                  </select>
                </form>
              `
            : html``}
        
          <ul class="past">
            ${this.sideQuestsToRender && this.sideQuestsToRender.length > 0
              ? this.sideQuestsToRender.map(
                  (sideQuest) => html`
                    <li class="questText">
                      <a href="/side-quest/${sideQuest.id}">
                        ${checkbox}
                        <span class="activity">
                          <span class="description">
                            ${sideQuest.name} - ${formatDateTime(sideQuest.startDate)}
                          </span>
                        </span>
                      </a>
                    </li>
                  `
                )
              : this.availableYears && this.availableYears.length > 0
                ? html`<li class="questText">No side quests found for ${this.selectedYear}</li>`
                : html``}
          </ul>
        </section>
      </div>
    `;
  }

  showNoSideQuests() {
    return html`
    <div class="fade-in">
      <h1>Oops! No available side quests.</h1>
      <p>
        It appears we currently don't have any upcoming side quests on record. Keep a
        constant look out on this page for side quests. They'll appear here as soon as
        they are confirmed. Contact ATC on atcteam@bbd.co.za if you think this is a
        mistake.
      </p>
      <p>Head back <a href="/">home</a> to work on more of your missions.</p>
      </div>
    `;
  }

  static get properties() {
    return {
      sideQuests: { type: Array },
      allSideQuests: { type: Array },
      sideQuestsToRender: { type: Array },
      availableYears: { type: Array },
      selectedYear: { type: Number },
    };
  }

  async firstUpdated() {
      await sideQuestService.getSideQuests();
  }

  stateChanged(state) {
    if (state.sideQuests && state.sideQuests.all) {
      this.sideQuests = selectActiveSideQuests(state);
      
      this.allSideQuests = [...state.sideQuests.all];
      
      this.generateAvailableYears();
      
      if (!this.selectedYear && this.availableYears && this.availableYears.length > 0) {
        this.selectedYear = this.availableYears[0];
        this.updateSideQuestYearView(this.selectedYear);
      } else if (this.selectedYear) {
        this.updateSideQuestYearView(this.selectedYear);
      }
    } else {
      /*Side quests are still loading*/
      this.sideQuests = undefined;
    }
  }

  generateAvailableYears() {
    if (!this.allSideQuests || this.allSideQuests.length === 0) {
      this.availableYears = [];
    } else {
      const currentDateTime = new Date();
      
      const years = this.allSideQuests
        .filter(sideQuest => {
          const date = sideQuest.startDate instanceof Date ? sideQuest.startDate : new Date(sideQuest.startDate);
          return date < currentDateTime;
        })
        .map(sideQuest => {
          const date = sideQuest.startDate;
          return date instanceof Date ? date.getFullYear() : new Date(date).getFullYear();
        })
        .filter((year, index, array) => array.indexOf(year) === index)
        .sort((a, b) => b - a);

      this.availableYears = years;
    }
  }

  updateSideQuestYearView(selectedYear) {
    this.selectedYear = parseInt(selectedYear);
    
    if (!this.allSideQuests || this.allSideQuests.length === 0) {
      this.sideQuestsToRender = [];
    } else {

    const currentDateTime = new Date();

    this.sideQuestsToRender = this.allSideQuests
      .filter(sideQuest => {
        const date = sideQuest.startDate instanceof Date ? sideQuest.startDate : new Date(sideQuest.startDate);
        const year = date.getFullYear();
        
        return year === this.selectedYear && date < currentDateTime;
      })
      .sort((a, b) => {
        const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
        const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
        return dateB - dateA;
      });
    }
  }

  renderSideQuests() {
    if (!this.sideQuests || this.sideQuests.length === 0) {
      return this.showNoSideQuests();
    } else {
    return html`
      ${this.sideQuests.map(
        (sideQuest, index) => html`
          <a class="hex-group" href="/side-quest/${sideQuest.id}">
            <e-hex-name
              .icon="${sideQuest.icon}"
              .name="${sideQuest.name} - ${formatDateTime(sideQuest.startDate)}"
              .index="${index}"
            ></e-hex-name>
          </a>
        `
      )}
    `;
    }
  }
}

window.customElements.define('e-side-quests', SideQuests);
