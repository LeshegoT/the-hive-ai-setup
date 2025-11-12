import {LitElement, html} from 'lit';
import { shared } from '../styles';
import configService from '../services/config.service';

const styles = html`
  <style>
    ${shared()} :host {
      --content-padding: 6em;
    }
    .notification-box {
      padding: var(--standard-padding);
      border-radius: var(--medium-radius);
      box-shadow: var(--shadow);
      margin-block: var(--content-padding);
      gap: var(--large-gap);
      z-index: var(--z-index-notification);
      right: 0;
      top:0;
      position: fixed;
    }
    .success {
      background: var(--success-color);
    }
    .error {
      background: var(--error-color);
    }
    .warning {
      background: var(--warning-color);
    }
    .info {
      background: var(--info-color);
    }
    .notification-title {
      font-size: var(--font-size-large);
      font-weight: var(--semi-bold-font-weight);
      margin: 0;
    }
    .notification-message {
      margin: 0;
      font-size: var(--font-size-small);
      font-weight: var(--regular-font-weight);
    }
    .notification-content {
      padding-inline-end: var(--content-padding);
    }
    .notification-icon {
      font-size: var(--font-size-extra-large);
    }
    ::slotted(a) {
      color: var(--app-info-font-color);
      text-decoration: underline;
    }
  </style>
`;

class Notification extends LitElement {
  static get properties() {
    return {
      type: { type: String },
    };
  }

  firstUpdated() {
    setTimeout(() => {
      this.remove();
    }, configService.refreshTimeout);
  }

  get title() {
    switch (this.type) {
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  }

  get icon() {
    switch (this.type) {
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'error_outline';
      case 'info':
        return 'info';
      case 'error':
        return 'highlight_off';
      default:
        return '';
    }
  }

  render() {
    return html`
      <style>
        ${styles}
      </style>
        <div class="notification-box ${this.type} inline-flex-items">
          <span class="material-icons-outlined notification-icon">${this.icon}</span>
          <div class="notification-content">
            <h1 class="notification-title">${this.title}</h1>
            <p class="notification-message">
              <slot></slot>
            </p>
          </div>
          <a @click="${this.remove}" class="material-icons-outlined notification-icon">close</a>
        </div>
    `;
  }
}

customElements.define('e-notification', Notification);
