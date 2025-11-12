import { html, LitElement } from 'lit';
import authService from '../services/auth.service';
import './peer-feedback-messages.component';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { selectHero } from '../selectors/hero.selectors';
import { animations } from '../styles';

let styles = html`
  <style>
    ${animations()} :host {
      margin: 1em 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      height: 620px;
    }

    @supports (-moz-appearance: none) {
      :host {
        scrollbar-color: var(--app-primary-color);
        scrollbar-width: thin;
      }
    }

    :host::-webkit-scrollbar {
      width: 10px;
      background-color: rgba(159, 159, 159, 0.2);
      border-radius: 100px;
    }

    :host::-webkit-scrollbar-thumb {
      background: var(--app-primary-color);
      border-radius: 100px;
    }
  </style>
`;

class FeedbackMessages extends connect(store)(LitElement) {
  render() {
    return html`
      ${styles} ${this.renderMessages()}

      <footer>&nbsp;</footer>
    `;
  }

  renderMessages() {
    return html`
      ${this.messages &&
      this.messages.map(
        (message) => html`
          <e-peer-feedback-messages
            .message=${message}
            .feedbackState=${this.feedbackState}
          ></e-peer-feedback-messages>
        `
      )}
    `;
  }

  static get properties() {
    return {
      hero: String,
      messages: Array,
      feedbackState: String,
    };
  }

  firstUpdated() {
    this.username = authService.getUserPrincipleName();
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  stateChanged(state) {
    this.hero = selectHero(state);
  }
}

window.customElements.define('e-feedback-messages', FeedbackMessages);
