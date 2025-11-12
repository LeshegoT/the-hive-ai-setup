import { html, LitElement } from 'lit';
import { shared } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { selectLevelUpUsers } from '../selectors/level-up.selectors';
import levelUpService from '../services/level-up.service';

import '../components/hero-title.component';

let styles = html`
  <style>
    ${shared()}

    .registered-users {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    e-hero-title {
      margin-top: 0.5em;
    }

    @media (min-width: 460px) {
      e-hero-title {
        flex-basis: 33%;
      }
    }
  </style>
`;

class LevelUpAttendees extends connect(store)(LitElement) {
  renderRegisteredUsers() {
    if (!this.registeredUsers || this.registeredUsers.length == 0) {
      return html``;
    }

    return html`
      <h3>Registered Heroes</h3>
      <div class="registered-users">
        ${this.registeredUsers.map(
          (user) => html`
            <e-hero-title
              .hero="${user.upn}"
              hideEmail="true"
            ></e-hero-title>
          `
        )}
      </div>
    `;
  }

  render() {
    return html`
      ${styles}

      ${this.renderRegisteredUsers()}
    `;
  }

  static get properties() {
    return {
      levelUp: Object,
      registeredUsers: Array,
      checkedAttendees: Boolean
    };
  }

  firstUpdated () {
    this.registeredUsers = [];
  }

  updated() {
    if (this.levelUp && !this.checkedAttendees && (!this.registeredUsers || this.registeredUsers.length == 0)) {
      levelUpService.getLevelUpUsers(this.levelUp.levelUpId);
      this.checkedAttendees = true;
    }
  }

  stateChanged(state) {
    this.registeredUsers = selectLevelUpUsers(state);
  }
}

window.customElements.define('e-level-up-attendees', LevelUpAttendees);
