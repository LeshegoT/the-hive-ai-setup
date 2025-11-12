import { html } from 'lit';
import { animations, shared } from '../styles';
import { StatefulElement } from './stateful-element';

import {
  selectActiveParts,
  selectAvatarBody,
  selectNumberOfPartsAvailable
} from '../selectors/avatar.selectors.js';

import './avatar-editor.component';
import './avatar.component';

import { gift } from './svg';

let styles = (level) => html`
  <style>
    ${shared()} ${animations()}
    :host {
      position: relative;
      width: ${level === 'apprentice' ? '15em' : '20em'};
      right: ${level === 'apprentice' ? '0' : '1.5em'};
      top: ${level === 'apprentice' ? '0' : '0.5em'};
    }

    a.claim {
      display: block;
      position: absolute;
      left: 0em;
      bottom: 3.8em;
      width: 2em;
      height: 2em;
      text-decoration: none;
    }

    a.claim svg {
      fill: var(--app-tertiary-color);
    }

    a.claim svg:hover {
      fill: var(--app-secondary-color);
    }

    a.claim em {
      display: block;
      position: absolute;
      background-color: var(--app-primary-color);
      color: #fff;
      width: 20px;
      height: 20px;
      border-radius: 20px;
      font-size: 16px;
      line-height: 20px;
      text-align: center;
      font-style: normal;
      right: -10px;
      bottom: -10px;
    }

    e-avatar-editor {
      position: absolute;
      right: 0em;
      bottom: 3.8em;
    }
  </style>
`;

class MyAvatar extends StatefulElement {
  renderClaimParts() {
    if (this.hideEditor || !this.numberOfPartsAvailable) return html``;

    return html`
      <a class="claim shake" href="/claim">
        ${gift}
        <em>${this.numberOfPartsAvailable}</em>
      </a>
    `;
  }

  renderEditor() {
    if (this.hideEditor) return html``;

    return html`
      <e-avatar-editor></e-avatar-editor>
    `;
  }

  render() {
    return html`
      ${styles(this.body?.level?.code??'apprentice')}
      <e-avatar .body="${this.body}" .parts="${this.parts}"></e-avatar>
      ${this.renderClaimParts()} ${this.renderEditor()}
    `;
  }

  static get properties() {
    return {
      body: Object,
      parts: Array,
      numberOfPartsAvailable: Number,
      hideEditor: Boolean
    };
  }

  stateChanged(state) {
    // I think we should look at combining body and parts together. - Mike 2019/06/19
    this.body = selectAvatarBody(state);
    this.parts = selectActiveParts(state);
    this.numberOfPartsAvailable = selectNumberOfPartsAvailable(state);
  }
}

window.customElements.define('e-my-avatar', MyAvatar);
