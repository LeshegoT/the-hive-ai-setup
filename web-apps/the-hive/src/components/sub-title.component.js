import { html, LitElement } from 'lit';

import './hex.component';

let styles = html`
  <style>
    :host {
      display: flex;
    }

    .hex {
      height: 3.5em;
      width: 3.5em;
      stroke: rgb(150, 150, 150);
      fill: rgb(150, 150, 150);
    }

    .text {
      flex: auto;
      font-size: 1.5em;
      margin: 0.3em 0em 0em 1em;
      /* font-weight: bold; */
      color: var(--app-tertiary-color);
    }
  </style>
`;

class SubTitle extends LitElement {
  render() {
    return html`
      ${styles}
      <e-hex .icon="${this.icon}"></e-hex>
      <span class="text"> ${this.text} </span>
    `;
  }

  static get properties() {
    return {
      text: String,
      icon: String
    };
  }
}

window.customElements.define('e-sub-title', SubTitle);
