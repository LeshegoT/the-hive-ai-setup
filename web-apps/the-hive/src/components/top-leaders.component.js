import { html, LitElement } from 'lit';
import { shared } from '../styles';
import service from '../services/leaderboard.service';

import '../components/leaderboard-hero.component';

let styles = html`
  <style>
    ${shared()}
  </style>
`;

class TopLeaders extends LitElement{
  render() {
    return html`
      ${styles}

      <section>

      </section>
    `;
  }

}

window.customElements.define('e-top-leaders', TopLeaders);