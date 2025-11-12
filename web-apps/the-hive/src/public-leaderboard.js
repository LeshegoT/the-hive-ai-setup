import { html } from 'lit';
import { variables, shared } from './styles';
import { StatefulPage } from './pages/stateful-page-view-element';
import service from './services/leaderboard.service';

import './components/title.component';
import './components/leaderboard-hero.component';
import './components/avatar.component';

const styles = () => html`
  <style>
    ${variables()} ${shared()} :host {
      display: block;
      margin: 3.2em;
    }

    img.logo {
      display: block;
      margin: -4em 0em -6em 0;
      height: 16em;
      align-self: flex-end;
    }

    .container {
      display: flex;
    }

    .heroes {
      flex: 1 1 60vw;
    }

    .avatar-container {
      flex: 1 1 40vw;
      display: flex;
      flex-direction: column;
    }

    e-leaderboard-hero {
      flex: 1 1 50vw;

      /* height: 8em; */
      font-size: 2.6em;
    }

    e-avatar {
      display: block;
      width: 35em;
      margin: auto;
      margin-right: -1em;
      margin-top: -3em;
      margin-bottom: -8em;
    }

    .shadow {
      z-index: -1;
      border-radius: 50%;
      width: 25em;
      height: 6em;
      background: black;
      opacity: 0.5;
      filter: blur(10px);
      transform: scale(1, 0.2);
      align-self: flex-end;
      margin-right: 5em;
      margin-top: -3.6em;
    }
  </style>
`;

class PublicLeaderboard extends StatefulPage {
  render() {
    let selected_hero = this.leaderboard[this.index];
    if (!selected_hero) return html``;

    let { red, green, blue } = selected_hero.avatar;
    let isSelected = (hero) => (hero === selected_hero ? 'selected' : '');
    let highlightColour = (hero) => (isSelected(hero) ? { red, green, blue } : null);

    return html`
      ${styles(red, green, blue)}

      <div class="container">
        <div class="heroes">
          ${this.leaderboard.map(
            (hero, i) => html`
              <e-leaderboard-hero
                .hero=${hero}
                skip_auth="true"
                class="${isSelected(hero)}"
                .highlightColour="${highlightColour(hero)}"
              ></e-leaderboard-hero>
            `
          )}
        </div>
        <div class="avatar-container">
          <img class="logo" src="images/hive.svg" alt="The Hive" />
          <e-avatar
            .body="${selected_hero.avatar}"
            .parts="${selected_hero.parts}"
          ></e-avatar>
          <div class="shadow">&nbsp;</div>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      leaderboard: Array,
      index: Number
    };
  }

  firstUpdated() {
    service.fetch_public_leaderboard();

    this.index = 0;

    setInterval(() => {
      this.index++;

      if (this.index >= this.leaderboard.length) this.index = 0;
    }, 5000);
  }

  stateChanged(state) {
    super.stateChanged(state);
    
    this.leaderboard = state.leaderboard.heroes;
  }
}

window.customElements.define('public-leaderboard', PublicLeaderboard);
