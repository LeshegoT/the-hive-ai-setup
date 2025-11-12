import { html } from 'lit';
import { shared, animations } from '../styles';
import { StatefulPage } from './stateful-page-view-element.js';
import { selectHero } from '../selectors/hero.selectors';
import authService from '../services/auth.service';

import '../components/message-list.component';
import '../components/title.component';
import '../components/submit-self-directed-message.component';

let styles = html`
  <style>
    ${shared()} ${animations()} e-submit-message {
      padding: 2em 3em 1em 3em;
      margin-top: -2em;
    }
    e-submit-self-directed-message {
      padding: 2em 3em 1em 3em;
    }
  </style>
`;

class Log extends StatefulPage  {
  render() {
    return html`
      ${styles}
      <section class="fade-in">
        <e-title name="${this.hero !== this.username ? "Hero's Quest" : 'Quest'} Log" icon="images/logos/messages.svg"></e-title>
        <e-submit-self-directed-message></e-submit-self-directed-message>
        <e-message-list></e-message-list>
      </section>
    `;
  }

  static get properties() {
    return {
      hero: String,
      username: String
    };
  }

  async firstUpdated() {
    this.username = authService.getUserPrincipleName();
  }

  stateChanged(state) {
    this.hero = selectHero(state);
  }
}

window.customElements.define('e-log', Log);
