import { html, LitElement } from 'lit';
import { hex, link } from '../styles';
import { formatDate } from '../services/format.service.js';

let styles = html`
  <style>
    ${hex()} ${link()} :host {
      display: block;
    }
  </style>
`;

class SideQuestName extends LitElement {
  render() {
    let indent = this.index % 2 === 0 ? '' : 'odd-name';

    return html`
      ${styles}

      <a class="side-quest-link ${this.size}" href="/side-quest/${this.sideQuest.id}">
        <e-hex .icon="${this.sideQuest.icon}"></e-hex>
        <span class="name ${indent}"><b>${formatDate(this.sideQuest.startDate)}</b>: ${this.sideQuest.name}</span>
      </a>      
    `;
  }

  static get properties() {
    return {
      sideQuest: Object,
      index: Number,
      size: String
    };
  }
}

window.customElements.define('e-side-quest-name', SideQuestName);
