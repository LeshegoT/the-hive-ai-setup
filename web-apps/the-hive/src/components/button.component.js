import {LitElement, html} from 'lit';
import { shared } from '../styles';

const styles = html`
  <style>
    ${shared()} :host {
      --small-button-height: 1.5rem;
      --medium-button-height: 2rem;
      --large-button-height: 2.5rem;

      --small-button-min-width: 3.75rem;
      --medium-button-min-width: 5rem;
      --large-button-min-width: 6.25rem;

      --button-icon-size: 1.5em;
    }
    button {
      font-weight: var(--semi-bold-font-weight);
      border-radius: var(--app-small-border-radius);
      color: var(--app-light-text-color);
      border: var(--small-border-size) solid;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: var(--small-gap);
      background: var(--app-light-text-color);
      text-shadow:none;
      box-shadow:none;
    }
    button:hover {
      background: var(--neutral-light-grey-color);
    }
    .primary {
      background-color: var(--app-primary-color);
      border: var(--small-border-size) solid var(--app-primary-color);
    }
    .primary:hover {
      background-color: var(--app-warning-font-color-secondary);
      border: var(--small-border-size) solid var(--app-warning-font-color-secondary);
    }
    .secondary {
      background-color: var(--app-light-text-color);
      color: var(--primary-red-color);
      border-color: var(--primary-red-color);
    }
    .secondary:hover {
      background-color: var(--light-red-color);
    }
    .tertiary {
      background-color: var(--app-light-text-color);
      color: var(--app-review-primary-text-color);
      border-color: var(--small-border-size) solid var(--app-review-primary-text-color);
    }
    .tertiary:hover {
      background-color: var(--neutral-light-grey-color);
    }
    .small {
      min-width: var(--small-button-height);
      height: 1.5rem;
      font-size: var(--font-size-extra-tiny);
    }
    .medium {
      min-width: var(--medium-button-min-width);
      height: var(--medium-button-height);
      font-size: var(--font-size-tiny);
    }
    .large {
      height: var(--large-button-height);
      min-width: var(--large-button-min-width);
      font-size: var(--font-size-small);
    }
    button:disabled {
      color: var(--app-light-text-color);
      background: var(--neutral-grey-color);
      pointer-events: none;
      border: none;
    }
    .material-symbols-outlined {
      font-weight: var(--light-font-weight);
    }
  </style>
`;
class Button extends LitElement {
  static get properties() {
    return {
      color: Object,
      size: Object,
      rightIconName: { type: String },
      leftIconName: { type: String },
      disabled: { type: Boolean },
    };
  }

  render() {
    return html`
      ${styles}
      <button class="${this.size} ${this.color} inline-flex-items" ?disabled="${this.disabled}">
        ${this.leftIconName
          ? html`
              <span class="material-symbols-outlined icon">${this.leftIconName}</span>
            `
          : ''}
        <slot></slot>
        ${this.rightIconName
          ? html`
              <span class="material-symbols-outlined icon">${this.rightIconName}</span>
            `
          : ''}
      </button>
    `;
  }
}

customElements.define('e-button', Button);
