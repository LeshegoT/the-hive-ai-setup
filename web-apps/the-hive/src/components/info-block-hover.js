import {LitElement, html} from 'lit';
const { shared } = require('../styles');
const styles = html`
  <style>
    ${shared()} :host {
      --max-width: 25em;
    }
    .info-icon {
      cursor: pointer;
    }
    .tooltip {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      background-color: var(--primary-red-color);
      max-width: var(--max-width);
      color: var(--app-light-text-color);
      padding: var(--standard-padding);
      position: absolute;
      border-radius: var(--medium-border-size);
      z-index:var(--z-index-info)
    }
    .tooltip::after {
      content: '';
      position: absolute;
      bottom: 100%;
      border: var(--medium-radius) solid;
      border-color: transparent transparent var(--primary-red-color) transparent;
    }
    .title {
      font-size: var(--font-size-small);
      font-weight: var(--medium-font-weight);
    }
    .message{
      font-size: var(--font-size-tiny);
      font-weight: var(--light-font-weight);
    }
    p {
      margin: 0;
    }
  </style>
`;
class InfoHover extends LitElement {
  static get properties() {
    return {
      infoTitle: { type: String },
      infoMessage: { type: String },
    };
  }

  render() {
    return html`
      ${styles}
      <div class="tooltip">
        <p class="title">${this.infoTitle}</p>
        ${this.infoMessage ? html`
              <p class="message">${this.infoMessage}</p>
            `
          : html``}

        <slot></slot>
      </div>
    `;
  }
}
window.customElements.define('e-info-hover', InfoHover);
