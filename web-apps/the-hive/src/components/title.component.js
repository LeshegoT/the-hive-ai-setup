import { html, LitElement } from 'lit';
import { shared } from '../styles';

import './hex.component';

const emphasise = (name) => {
  const name_parts = name.split(' ');

  return html`
    <em>${name_parts.shift()}</em> ${name_parts.map(
      (part) =>
        html`
          ${part}
        `
    )}
  `;
};

const styles = html`
  <style>
    ${shared()} em {
      font-style: normal;
      font-weight: bold;
      color: var(--app-primary-color);
    }

    .title {
      display: flex;
      margin-top: 4em;
    }

    .hex {
      height: 3.5em;
      width: 3.5em;
      transform-origin: 50% 50%;
      stroke-width: 1.2px;
      stroke: #000000;
    }

    .name {
      flex: auto;
      border: 0 solid var(--app-secondary-color);
      border-width: 0 0 2px 0;
      font-size: 1.3em;
      margin: 0.35em 0 1.17em -0.3em;
      font-weight: lighter;
    }

    .name span {
      padding: 0.25em 0.75em;
    }

    @media (min-width: 460px) {
      .title {
        margin: 0 -2em;
      }

      .hex {
        height: 5em;
        width: 5em;
      }
      .name {
        font-size: 1.5em;
        margin: 0.65em 0 1.17em -0.3em;
      }

      .name span {
        padding: 0.25em 1.5em;
      }
    }
  </style>
`;

class Title extends LitElement {
  render() {
    return html`
      ${styles}

      <h3 class="title">
        <e-hex .icon="${this.icon}"></e-hex>
        <span class="name"> <span>${emphasise(this.name)}</span> </span>
      </h3>
    `;
  }

  static get properties() {
    return {
      name: String,
      icon: String
    };
  }
}

window.customElements.define('e-title', Title);
