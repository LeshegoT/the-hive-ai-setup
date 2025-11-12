import { html, LitElement } from 'lit';
import { shared, hex, link } from '../styles';

import './hex.component';

let styles = html`
  <style>
    ${shared()} ${hex()} ${link()} :host {
      width: 100%;
    }
    
    @media (max-width: 460px) {
      :host {
        font-size: 1em;
      }
    }
  </style>
`;

class HexName extends LitElement {
  render() {
    let indent = this.index % 2 === 0 ? '' : 'odd-name';
    let simpleListStyle = this.simpleList ? 'simple-list' : '';
    return html`
      ${styles}

      <span class="hex-name ${simpleListStyle} ${this.size} ${this.done}">
        <e-hex .icon="${this.icon}"></e-hex>
        <span class="name ${indent}">${this.name}</span>
      </span>
    `;
  }

  static get properties() {
    return {
      index: Number,
      icon: String,
      name: String,
      size: String,
      done: String,
      simpleList: Boolean
    };
  }
}

window.customElements.define('e-hex-name', HexName);
