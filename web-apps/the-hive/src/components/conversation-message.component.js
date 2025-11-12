import { html, css, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { link } from '../styles/index.js';
import userService from '../services/user.service';

import './profile.component';
import './mission-name.component';
import './hex-name.component';

let styles = html`
  <style>
    ${link()} :host {
      min-width: 20%;
      min-height: 60px;
      margin: 10px 0;
      padding: 0.2em 0.5em;
      display: flex;
      border: 1px solid var(--app-tertiary-color);
      border-radius: 1em;
    }

    .container {
      margin: 0.1em 0.1em;
      flex: 1 1 auto;
    }

    .message {
      font-weight: lighter;
      width: 100%;
    }

    span,
    time {
      display: inline-block;
      color: var(--app-tertiary-color);
      font-size: 0.7em;
    }

    pre {
      max-width: 16em;
      overflow: scroll;
      border: 1px solid var(--app-lighter-text-color);
      padding: 0.5em;
    }

    @media (min-width: 460px) {
      pre {
        max-width: 100%;
      }
    }
  </style>
`;

class ConversationMessage extends connect(store)(LitElement) {
  render() {
    if (!this.message) return html``;

    let illegalChars = /[<>/]/ig;
    const map = {
      '<': '&lt;',
      '>': '&gt;',
      "/": '&#x2F;',
    };
    let messageText = this.message.text.replace(illegalChars, (match) => map[match]);

    return html`
      ${styles}
      <style>
        :host {
          flex-direction: ${this.me ? 'row-reverse' : 'row'};
        }
      </style>

      <div class="container">
        <span>${this.me ? '' : this.displayName}</span>
        <time>${this.message.creationDate.toLocaleString()}</time>
        <div>
          ${this.message.typeId}
        </div>

        <div class="message">${messageText}</div>
      </div>
    `;
  }

  static get properties() {
    return {
      message: Object,
      me: Boolean,
      displayName: String
    };
  }

  updated(changedProps) {
    if (changedProps.has('message')) {
      // We moved this from firstUpdated to updated, because it wasn't changing the message
      // displayName reliably. Here be dragons. - Mike Geyser, 16 Jan 2020
      this.displayName = this.message.createdByUserPrincipleName;
      
      userService
        .getActiveDirectoryProfile(this.message.createdByUserPrincipleName)
        .then((profile) => (this.displayName = profile.displayName));
    }
  }
}

window.customElements.define('e-conversation-message', ConversationMessage);
