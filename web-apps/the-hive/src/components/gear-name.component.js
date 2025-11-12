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

class GearName extends LitElement {
  render() {
 
    return html`
      ${styles}
      <span class="hex-name gear-name">
        <e-hex
          .icon="${this.icon}"
          .highlight="${this.subName && this.subName.includes('Overdue') ? true : false}"
        ></e-hex>
        <div class="hex-container ${this.displayNumber % 2 != 0 ? 'offset-gear' : ''}">
          <span class="name name-gear">${this.name}</span>
          ${this.subName !== undefined
            ? html`
                <span class="sub-gear-name">${this.subName}</span>
              `
            : html``}
        </div>
      </span>
    `;
  }

  static get properties() {
    return {
      index: Number,
      icon: String,
      name: String,
      subName: String,
      size: String,
      done: String,
      simpleList: Boolean,
      displayNumber: Number
    };
  }
}

window.customElements.define('e-gear-name', GearName);
