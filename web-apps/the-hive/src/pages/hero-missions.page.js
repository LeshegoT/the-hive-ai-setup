import { html } from 'lit';
import { shared, hex } from '../styles';
import { selectMissions } from '../selectors/quest.selectors';
import missions_service from '../services/missions.service';
import questService from '../services/quest.service';
import { selectHeroQuest, selectHero } from '../selectors/hero.selectors';

import '../components/hero.component';
import '../components/mission-name.component';
import { StatefulPage } from './stateful-page-view-element';

let styles = html`
  <style>
    ${shared()} ${hex()}
  </style>
`;

class HeroMissions extends StatefulPage {
  render() {
    return html`
      ${styles}

      <section>
        <e-hero .quest="${this.quest}"></e-hero>

        <div>
          ${this.missions.map(
            (mission, index) =>
              html`
                <e-mission-name
                  class="hex-group"
                  .mission="${mission}"
                  .index="${index}"
                ></e-mission-name>
              `
          )}
          <button type="button" class="back big" @click=${(e) => this.back()}>Back</button>
        </div>
      </section>
    `;
  }

  back() {
    window.history.back();
  }

  static get properties() {
    return {
      quest: Object,
      missions: Array
    };
  }

  firstUpdated() {
    if (!this.quest) {
      questService.getQuest(this.hero);
    }
    if (this.quest) {
      missions_service.getHeroMissions(this.quest.heroUserPrincipleName);
    }
  }

  stateChanged(state) {
    this.hero = selectHero(state);
    this.quest = selectHeroQuest(state);
    this.missions = selectMissions(state);
  }
}

window.customElements.define('e-hero-missions', HeroMissions);
