import { html, LitElement } from 'lit';
import { shared, animations } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import updateService from '../services/update.service';
import { box } from './svg';

let styles = (newVersion) => html`
  <style>
    ${shared()} ${animations()} :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1em;
      margin: 0 -0.5em;
      background-color: var(--app-secondary-color);
      color: white;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
      text-align: left;
      font-size: 1.1em;
      cursor: pointer;

      will-change: transform;
      transition-property: visibility, transform;
      transition-duration: 0.2s;
      transform: ${newVersion ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100%, 0)'};
      visibility: ${newVersion ? 'visible' : 'hidden'};
      z-index: 4;
    }

    svg {
      display: block;
      float: left;
      width: 2em;
      height: 2em;
      margin: 0.75em;
      fill: white;
      stroke: white;
    }

    em > .desktop {
      display: none;
    }

    em > .mobile {
      display: inline;
    }

    @media (min-width: 460px) {
      :host {
        width: 45vw;
        margin: auto;
        font-size: 1.2em;
      }

      em {
        display: block;
      }

      em > .desktop {
        display: inline;
      }
      em > .mobile {
        display: none;
      }
    }
  </style>
`;

class UpdatePrompt extends connect(store)(LitElement) {
  render() {
    return html`
      ${styles(this.newVersion)}

      <div @click="${() => this.updateVersion()}">
        <div class="shake">
          ${box}
        </div>
        <span>There is a new version of The Hive available. </span>
        <em>
          Refresh the page to update.
        </em>
      </div>
    `;
  }

  static get properties() {
    return {
      newVersion: Boolean
    };
  }

  updateVersion() {
    updateService.update();
  }

  stateChanged(state) {
    this.newVersion = state.app.newVersion;
  }
}

window.customElements.define('e-update-prompt', UpdatePrompt);
