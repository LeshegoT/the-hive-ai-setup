import {LitElement, html} from 'lit';
import { shared } from '../styles';
import './info-block-hover';

const styles = html`
  <style>
    ${shared()} svg {
      cursor: pointer;
    }
    .info {
      color:var(--primary-red-color);
      cursor:pointer;
      font-weight:var(--regular-font-weight);
      font-size: var(--font-size-large);
    }
    .tooltip e-info-hover {
      visibility: hidden; 
    }
    .tooltip:hover e-info-hover,.tooltip:focus e-info-hover {
      visibility: visible; 
    }
  </style>
`;
class Info extends LitElement {
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
        <span class="material-symbols-outlined info">info</span>
        <e-info-hover infoTitle=${this.infoTitle} infoMessage=${this.infoMessage}>
          <slot name="description"></slot>
        </e-info-hover>
      </div>
    `;
  }
}
window.customElements.define('e-info', Info);
