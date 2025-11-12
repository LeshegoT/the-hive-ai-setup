import { html, LitElement } from 'lit';
import { shared } from '../styles';
import { StatefulPage } from './stateful-page-view-element';
import service from '../services/leaderboard.service';
import authService from '../services/auth.service';

import '../components/title.component';
import '../components/leaderboard-hero.component';

let styles = html`
  <style>
    ${shared()}
  </style>
`;

class Leaderboard extends StatefulPage {

  renderMyHero(visible_heroes) {
    let my_hero = this.leaderboard.find(hero => hero.userPrincipleName === authService.getUserPrincipleName())
    if (!my_hero) return html``;

    if (!visible_heroes.find(hero => hero.userPrincipleName === my_hero.userPrincipleName))
      return html`<e-leaderboard-hero .hero=${my_hero} alternateRows="true"></e-leaderboard-hero>`;
  }

  render() {
    if (!this.leaderboard) return html``;

    let visible_heroes = this.leaderboard.slice(0, this.bottom_index);

    return html`
      ${styles}

      <section>
        <e-title
          name="${this.title || 'Weekly Leaderboard'}"
          icon="images/logos/success.svg"
        ></e-title>

        ${visible_heroes.map(
          (hero) => html`
            <e-leaderboard-hero .hero=${hero} alternateRows="true"></e-leaderboard-hero>
          `
        )}

        ${this.renderMyHero(visible_heroes)}

      </section>

      <footer>
        &nbsp;
      </footer>
    `;
  }

  static get properties() {
    return {
      leaderboard: Array,
      bottom_index: Number,
      title: String
    };
  }

  firstUpdated() {
    service.fetch_leaderboard();

    try {
      const options = {
        threshold: [1.0]
      };

      this.bottom_index = 10;

      let callback = (entities, options) => {
        let footer = entities[0];

        if (footer.isIntersecting) {
          this.bottom_index += 5;
        }
      };

      this.observer = new IntersectionObserver(callback, options);
      this.observer.observe(this.renderRoot.querySelector('footer'));
    } catch (ex) {
      console.error(ex);
    }
  }

  stateChanged(state) {
    super.stateChanged(state);
    this.leaderboard = state.leaderboard.heroes;
  }
}

window.customElements.define('e-leaderboard', Leaderboard);
