import {LitElement, html} from 'lit';
import { shared } from '../styles';

const styles = html`
  <style>
    ${shared()} .overlay {
      display: none;
      inset: 0;
      justify-content: center;
      align-items: center;
      margin: var(--standard-margin);
      position: fixed;
      z-index: var(--z-index-overlay);
    }
    .overlay.active {
      display: flex;
      background-color: var(--shadow-color);
      margin: 0;
    }
    .confirmation-box {
      background-color: var(--app-light-text-color);
      padding: var(--large-padding);
      border-radius: var(--small-radius);
      box-shadow: var(--shadow);
    }
    .confirmation-buttons,
    .confirmation-message {
      display: flex;
      margin-block: var(--standard-margin);
      justify-content: space-between;
    }
    .confirmation-message {
      gap: var(--large-gap);
    }
    p.confirm {
      font-weight: var(--medium-font-weight);
      margin: 0;
    }
    .icon {
      color: var(--neutral-grey-color);
    }
  </style>
`;

class ConfirmationDialog extends LitElement {
  static get properties() {
    return {
      active: { type: Boolean },
    };
  }

  constructor() {
    super();
  }

  show() {
    this.shadowRoot.querySelector('.overlay').classList.add('active');
  }

  hide() {
    this.shadowRoot.querySelector('.overlay').classList.remove('active');
  }

  confirm() {
    this.dispatchEvent(new CustomEvent('confirm', { detail: true }));
    this.hide();
  }

  cancel() {
    this.dispatchEvent(new CustomEvent('confirm', { detail: false }));
    this.hide();
  }

  render() {
    return html`
      ${styles}
      <div class="overlay ${this.active ? 'active' : ''}">
        <div class="confirmation-box">
          <div class="confirmation-message inline-flex-items">
            <p class="confirm"><slot></slot></p>
            <a class="material-icons-outlined icon" @click=${this.cancel}>close</a>
          </div>

          <div class="confirmation-buttons">
            <e-button size="large" color="secondary" @click=${this.cancel}>Cancel</e-button>
            <e-button size="large" color="primary" @click=${this.confirm}>Delete</e-button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('confirmation-dialog', ConfirmationDialog);
