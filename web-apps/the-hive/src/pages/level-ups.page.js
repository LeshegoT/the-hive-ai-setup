import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element';
import { shared, animations, hex, link, lists, activities } from '../styles';
import {
  selectUpcomingLevelUps,
  selectPastLevelUps
} from '../selectors/level-up.selectors';
import levelUpService from '../services/level-up.service';
import { formatDate } from '../services/format.service';
import { checkbox } from '../components/svg';

import '../components/title.component';
import '../components/hex-name.component';
import '../components/sub-title.component';

const styles = html`
  <style>
    ${shared()} ${hex()} ${animations()} ${link()} ${lists()} ${activities()} e-title {
      margin-bottom: 2em;
    }
    
    section {
      margin-bottom: 5em;
    }

    .levelUpText{
      width: 100%;
      margin: 1em;
    }

    .labelLevelUp {
      padding-left: 2.5em;
    }

    .selectHistory{
      border-radius: 25px;
      padding: 5px;
    }

  </style>
`;

class LevelUps extends StatefulPage {
  render() {
    return html`
      ${styles}

      <section class="fade-in">
        <e-title name="Level Ups" icon="images/logos/level-up.svg"></e-title>

        ${this.levelUps &&
          this.levelUps.map(
            (levelUp, index) => html`
              <a class="hex-group" href="/level-up/${levelUp.levelUpId}">
                <e-hex-name
                  .icon="${levelUp.icon}"
                  .name="${levelUp.name}: ${formatDate(levelUp.startDate)} - ${formatDate(
                    levelUp.endDate
                  )}"
                  .index="${index}"
                ></e-hex-name>
              </a>
            `
          )}
      </section>
      <section>
        <e-sub-title text="Past Level Ups" icon="images/logos/past.svg"></e-sub-title>
        ${this.pastLevelUpYears
          ? html `
              <form>
              <label class="labelLevelUp">Level Up Year : </label>
                <select class="selectHistory" @change="${(e) => this.updatePastLevelUpView(e.target.value)}">
                      ${this.pastLevelUpYears.map(
                      (levelOrder) => html`
                    <option value="${levelOrder}">${levelOrder}</option>
                    `)}
                </select>
              </form>
                `
          : html ``
        } 
        
        <ul class="past">
          <!-- This is not very pretty yet. It is going to change when we add the links for the past events.
          The links are in a separate trello card. - Gery, 2019/11/04 -->
          ${this.levelUpsToRender &&
            this.levelUpsToRender.map(
              (levelUp) => html`
                <li class="levelUpText">
                  <a href="/level-up/${levelUp.levelUpId}">
                    ${checkbox}
                    <span class="activity">
                      <span class="description">
                        ${levelUp.name} - ${formatDate(levelUp.startDate)}
                      </span>
                    </span>
                  </a>
                </li>
              `
            )}
        </ul>
      </section>
    `;
  }

  firstUpdated() {
    if (!this.levelUps || !this.levelUps.length) {
      levelUpService.getLevelUps();
    }
  }

  static get properties() {
    return {
      levelUps: Array,
      pastLevelUps: Array,
      pastLevelUpYears: Array,
      levelUpsToRender: Array
    };
  }

  stateChanged(state) {
    this.levelUps = selectUpcomingLevelUps(state);
    this.pastLevelUps = selectPastLevelUps(state).reverse();
    this.levelUpsToRender = this.pastLevelUps;
    this.getPastLevelUpYears();
  }

  getPastLevelUpYears() {
      this.pastLevelUpYears = this.pastLevelUps.map(item => item.startDate.getFullYear()).filter((value, index, self) => self.indexOf(value) === index);
      if(this.pastLevelUpYears.length > 0){
        this.pastLevelUpYears.sort(function(a,b){return b - a});
        this.updatePastLevelUpView(this.pastLevelUpYears[0]);
      }
  }

  updatePastLevelUpView(selectedYear) {
      this.levelUpsToRender = this.pastLevelUps;
      let today = new Date();
      this.levelUpsToRender = this.levelUpsToRender.filter((l) => l.startDate < today).sort((a,b) => b.startDate - a.startDate);
      this.levelUpsToRender = this.levelUpsToRender.filter(e => e.startDate.getFullYear() == selectedYear);
  }

}

window.customElements.define('e-level-ups', LevelUps);
