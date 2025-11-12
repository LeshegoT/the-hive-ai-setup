import { html, css, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import markdownService from '../services/markdown.service.js';
import { link } from '../styles/index.js';
import userService from '../services/user.service';

import './profile.component';
import './mission-name.component';
import './hex-name.component';

let styles = html`
  <style>
    ${link()} :host {
      min-width: 60%;
      min-height: 60px;
      margin: 10px 0;
      padding: 0.5em;
      display: flex;
      border: 1px solid var(--app-tertiary-color);
      border-radius: 1em;
    }

    e-profile {
      display: inline-block;
      margin: 0.4em;
      flex: 0;
    }

    .container {
      margin: 0.4em;
      flex: 1 1 auto;
    }

    .message {
      /* color: var(--app-tertiary-color); */
      font-weight: lighter;
      width: 100%;
    }

    span,
    time {
      display: inline-block;
      color: var(--app-tertiary-color);
      font-size: 0.9em;
    }

    e-mission-name {
      display: block;
      margin: 0.3em 0em -0.5em 0.4em;
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

    .message-details {
      margin: var(--small-font-size) 0;
      padding: var(--small-font-size);
      border-radius: var(--small-radius);
      border-left: 3px solid var(--app-primary-color);
    }
    
    .detail-row {
      display: flex;
      margin: var(--small-font-size) 0;
      align-items: flex-start;
    }
    
    .detail-label {
      font-weight: var(--semi-bold-font-weight);
      color: var(--app-tertiary-color);
      min-width: var(--page-top-padding);
      text-align: right;
      padding-right: var(--font-size-small);
      flex-shrink: 0;
    }
    
    .detail-value {
      flex: 1;
      word-break: break-word;
      line-height: 1.5;
    }
    
    .detail-label {
      text-align: left;
      min-width: auto;
      padding-right: 0;
      padding-bottom: var(--small-margin);
    }
  </style>
`;

class Message extends connect(store)(LitElement) {
  renderHexTitle() {
    return html`
      <e-hex-name
        .icon="${this.message.icon}"
        .name="${this.message.name}"
        size="small"
      ></e-hex-name>
    `;
  }

  renderQuestTitle() {
    return html`
      <a class="hex-group" href="/quest-history">
        ${this.renderHexTitle()}
      </a>
    `;
  }

  renderMissionTitle() {
    let mission = {
      missionId: this.message.missionId,
      name: this.message.name,
      type: {
        code: this.message.code,
        icon: this.message.icon
      },
      deleted: this.message.deleted
    };

    return html`
      <e-mission-name .mission="${mission}" size="small"></e-mission-name>
    `;
  }

  renderCourseTitle() {
    return html`
      <a class="hex-group" href="/course/${this.message.code}">
        ${this.renderHexTitle()}
      </a>
    `;
  }

  renderSelfDirectedTitle() {
    return html`
      <a class="hex-group" target="_blank" href="${this.message.link}">
        ${this.renderHexTitle()}
      </a>
    `;
  }

  renderSideQuestTitle() {
    return html`
      <a class="hex-group" href="/side-quest/${this.message.sideQuestId}">
        ${this.renderHexTitle()}
      </a>
    `;
  }

  renderMessageTitle() {
    if (this.message.questId) return this.renderQuestTitle();

    if (this.message.missionId) return this.renderMissionTitle();

    if (this.message.courseId) return this.renderCourseTitle();

    if (this.message.selfDirected && this.message.code != 'feedback') return this.renderSelfDirectedTitle();

    if (this.message.messageTypeId == 4 && this.message.sideQuestId)
      return this.renderSideQuestTitle();

    return html``;
  }

  renderMessageDetails() {
    if (!this.message) {
      return html``;
    } else {
      let illegalChars = /[<>/]/ig;
      const map = {
        '<': '&lt;',
        '>': '&gt;',
      "/": '&#x2F;',
    };
    let messageText = this.message.text
      ? markdownService.convertMarkdownToHtml(this.message.text.replace(illegalChars, (match) => map[match]))
      : '';
    
    return html`
      <div class="message-details">
        ${this.message.title ? html`
          <div class="detail-row">
            <span class="detail-label">Title:</span>
            <span class="detail-value">${this.message.title}</span>
          </div>
        ` : ''}
        
        ${this.message.link ? html`
          <div class="detail-row">
            <span class="detail-label">Link:</span>
            <span class="detail-value">
              <a href="${this.message.link}" target="_blank" rel="noopener noreferrer">
                ${this.message.link}
              </a>
            </span>
          </div>
        ` : ''}
        
        ${this.message.text ? html`
          <div class="detail-row">
            <span class="detail-label">Comment:</span>
            <div class="detail-value comment-text">${messageText}</div>
          </div>
        ` : ''}
      </div>
    `;
    }
  }

  render() {
    return html`
      ${styles}
      <style>
        :host {
          flex-direction: ${this.me ? 'row-reverse' : 'row'};
        }
      </style>
      <e-profile .person="${this.message.createdByUserPrincipleName}"></e-profile>

      <div class="container">
        <span>${this.displayName}</span>
        <time>${this.message.creationDate.toLocaleString()}</time>
        <div>
          ${this.message.typeId}
        </div>

        ${this.renderMessageTitle()}
        ${this.renderMessageDetails()}

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
      if (this.displayName === 'System') return;
      
      userService
        .getActiveDirectoryProfile(this.message.createdByUserPrincipleName)
        .then((profile) => (this.displayName = profile.displayName));
    }
  }

  stateChanged(state) {}
}

window.customElements.define('e-message', Message);
