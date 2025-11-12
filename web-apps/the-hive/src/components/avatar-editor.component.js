import { html, svg, LitElement } from 'lit';
import { shared } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import avatarService from '../services/avatar.service.js';
import { selectAvatarBody, selectUserParts } from '../selectors/avatar.selectors';
import { avatarColourChanged } from '../actions/avatar-colour-changed.action';
import { avatarPartsChanged } from '../actions/avatar-parts-changed.action';
import { cog } from './svg';

import './part-box.component';

let styles = html`
  <style>
    ${shared()} .cog {
      width: 2em;
      height: 2em;
    }

    .cog svg {
      fill: var(--app-tertiary-color);
      cursor: pointer;
    }

    .cog:hover svg {
      fill: var(--app-secondary-color);
    }

    .popup {
      position: absolute;
      background: var(--app-section-even-color);
      top: 2em;
      right: 0em;
      width: 23em;
      padding: 0.5em;
      box-shadow: 0.3em 0.3em 0.5em var(--app-tertiary-color);
      display: none;
      font-size: 0.9em;
      color: var(--app-tertiary-color);
      display: flex;
      flex-direction: column;
      z-index: 2;
    }

    .colour {
      display: flex;
      margin-bottom: 0.5em;
    }

    .colour label {
      margin: 0 0.5em 0 2em;
      flex: 0 0 auto;
    }

    .colour input {
      margin-right: 1.7em;
      flex: 1 1 auto;
    }

    .coming-soon {
      height: 4em;
      width: 4em;
      margin: 0.2em auto;
      border: 1px solid var(--app-tertiary-color);
      text-align: center;
    }
    

    .parts {
      display: flex;
    }

    .part-type {
      flex: 1 0 auto;
    }

    .heading {
      text-align: center;
      text-transform: capitalize;
    }

    input[type='color'] {
      display: inline-block;
    }

    e-part-box {
      height: 4em;
      width: 4em;
      margin: 0.2em auto;
    }

    @media (max-width: 25em) {
      .popup {
        width: 90vw;
        right: -3em;
      }
    }
  </style>
`;

class AvatarEditor extends connect(store)(LitElement) {
  constructor() {
    super();
  }
  render() {
    if (!this.body) return html``;

    const hex = (d) =>
      Number(d)
        .toString(16)
        .padStart(2, '0');

    let hexColour = `#${hex(this.body.red)}${hex(this.body.green)}${hex(this.body.blue)}`;

    let popupStyle = this.open ? 'display: block' : 'display: none';

    let renderPart = (part) => html`
      <e-part-box
        .part="${part}"
        .body="${this.body}"
        @click="${(e) => this.changePart(part.code, part.partType)}"
      ></e-part-box>
    `;

    let comingSoon = html`
      <div class="coming-soon">Coming soon!</div>
    `;

    return html`
      ${styles}
      <div class="cog" @click=${(e) => this.toggleEditor(e)}>
        ${cog}
      </div>

      <div class="popup" .style="${popupStyle}">
        <div class="colour">
          <label for="colour">Colour: </label>
          <input
            type="color"
            name="colour"
            @change=${(e) => this.changeColor(e)}
            .value="${hexColour}"
          />
        </div>

        <div class="parts">
          ${Object.keys(this.parts).map((partType) => {
            let parts = this.parts[partType];
            return html`
              <div class="part-type">
                <div class="heading">${partType}:</div>
                ${parts && parts.length
                  ? parts.map((part) => renderPart(part))
                  : comingSoon}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  toggleEditor() {
    if (this.open) {
      // Already open. Update avatar, clear event listener, and close
      avatarService.updateAvatar(this.body, Object.values(this.parts).flat(1));

      document.removeEventListener('click', this.externalClickEvent);
    } else {
      // Already closed. add event listener, and open.
      if (!this.internalClickEvent) {
        this.internalClickEvent = (e) => e.stopPropagation();
        this.addEventListener('click', this.internalClickEvent);
      }

      this.externalClickEvent = (e) => {
        this.toggleEditor();
      };
      document.addEventListener('click', this.externalClickEvent);
    }

    // Toggle!
    this.open = !this.open;
  }

  changeColor(e) {
    let hex = e.target.value;
    const red = parseInt(hex.substring(1, 3), 16);
    const green = parseInt(hex.substring(3, 5), 16);
    const blue = parseInt(hex.substring(5, 7), 16);

    store.dispatch(avatarColourChanged(red, green, blue));
  }

  changePart(code, partType) {
    let partsOfType = this.parts[partType].map((p) => {
      let active = p.code === code;

      return { ...p, active };
    });

    //TODO: this seems hacky, Gery - 18 June
    // TODO: this will be addressed when we get to the locked parts feature. - Mike 2019/06/19
    let parts = {
      ...this.parts
    };
    parts[partType] = [...partsOfType];

    store.dispatch(avatarPartsChanged(Object.values(parts).flat(1)));
  }

  static get properties() {
    return {
      body: Object,
      parts: Array,
      open: Boolean
    };
  }

  stateChanged(state) {
    this.body = selectAvatarBody(state);
    this.parts = selectUserParts(state);
  }
}

window.customElements.define('e-avatar-editor', AvatarEditor);
