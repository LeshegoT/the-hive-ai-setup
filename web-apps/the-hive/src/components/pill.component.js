import {LitElement, html} from 'lit';
const styles = html`
  <style>
    :host {
      --small-pill-min-width: 4rem;
      --large-pill-min-width: 5rem;
      --large-pill-height: 2rem;
      --small-pill-height: 1.5rem;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-red-color);
      border-radius: var(--large-radius);
      padding-inline:var(--standard-padding);

      &.large {
        min-width: var(--large-pill-min-width);
        height: var(--large-pill-height);
        font-size: var(--font-size-tiny);
      }

      &.small {
        font-size: var(--font-size-extra-tiny);
        min-width: var(--small-pill-min-width);
        height: var(--small-pill-height);
      }

      &.primary {
        background: var(--primary-red-color);
        color: var(--app-light-text-color);
      }

      &.secondary {
        background: var(--secondary-blue-color);
        color: var(--app-light-text-color);
      }

      &.neutral {
        background: var(--neutral-grey-color);
        color: var(--app-light-text-color);
      }

      &.white {
        background: var(--app-light-text-color);
        color: var(--primary-red-color);
      }
      &.warning {
        background: var(--expires-soon-color);
        color: var(--app-light-text-color);
      }
    }
  </style>
`;
class Pill extends LitElement {
  static get properties() {
    return {
      size: { type: String },
      color: { type: String },
    };
  }
  render() {
    return html`
      ${styles}
      <p class="pill ${this.size} ${this.color}">
        <slot></slot>
      </p>
    `;
  }
}
customElements.define('e-pill', Pill);
