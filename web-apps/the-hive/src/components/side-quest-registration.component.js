import { html, LitElement } from 'lit';
import { selectSideQuestById } from '../selectors/side-quests.selectors';
import { shared, link } from '../styles';
import sideQuestService from '../services/side-quests.service';
import { material_card, material_button, material_icon_button } from '../styles';
import { StatefulElement } from './stateful-element';
const styles = html`
  <style>
    ${link()}

    .icon {
      color: var(--app-primary-color);
      flex-basis: 10%;
      margin-top: 0.1em;
    }

    .button:hover {
      color: var(--app-primary-color);
    }
  </style>
`;

const sideQuestStyle = html`
<style>
${shared()} 
  .is-registered {
    float: right;
    margin-top: -2em;
    color: var(--app-secondary-color);
  }

  .buttons {
    display: flex;
    justify-content: space-between;
  }

  button,
  a {
    font-size: 1em;
  }
  </style>
`

const homeStyles = html`
  <style>
    ${material_card()} ${material_button()} ${material_icon_button()}

    .mdc-card:hover .divider > .icon {
      background-color: var(--app-primary-color);
    }

    .subtitle {
      font-size: 0.9em;
      color: var(--app-tertiary-color);
    }

    button.mdc-button {
      font-size: 0.8em;
    }

    button.mdc-button:hover {
      color: var(--app-primary-color);
    }
  </style>
`;

export class SideQuestRegistration extends StatefulElement {
  renderRegistration() {
    if(!this.sideQuest)return html``;


    if (this.sideQuest.externalEvent) {
      return html`
        <a class="button" target="_blank" .href="${this.sideQuest.link}"> Go Register</a>
      `;
    }

    if (this.sideQuest.hasAttended) {
      return html`
        <i>Completed</i><br />
      `;
    }

    if (Date.now() > this.sideQuest.startDate) {
      return html`
        <i>Missed</i><br />
      `;
    }

    if (this.sideQuest.hasRSVPed) {
      return html`
      ${sideQuestStyle}
        <i class="subtitle">Registered</i><br />
      `;
    }

    if (this.page == 'home') {
      return html`
        ${homeStyles}

        <button
          class="mdc-button mdc-card__action mdc-card__action--button"
          @click=${(e) => this.registerForSideQuest()}
        >
          Register
        </button>
      `;
    } else {

      return html`
      ${sideQuestStyle}

      <button id="register" type="button" @click="${(e) => this.registerForSideQuest()}">
      Register
      </button>
      `;
    }
  }
  
  render() {
    if (!this.sideQuest) return html``;
    
    return html`
      ${styles}  
      ${this.renderRegistration()}
    `;
  }

  registerForSideQuest() {
    sideQuestService.registerForSideQuest(this.sideQuest.id);
  }

  static get properties() {
    return {
      id: Number,
      sideQuest: Object,
      page: String
    };
  }

  stateChanged(state) {
    if (this.id) 
        this.sideQuest = selectSideQuestById(state, this.id);
  }
}

window.customElements.define('e-side-quest-registration', SideQuestRegistration);