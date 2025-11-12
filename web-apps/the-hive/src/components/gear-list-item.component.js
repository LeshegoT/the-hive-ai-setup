import { html } from 'lit';
import { shared, hex, link } from '../styles';
import { StatefulElement } from './stateful-element.js';

import './gear-name.component';

const styles = html`
  <style>
    ${shared()} ${hex()} ${link()} 
    
    .hex-group {
      cursor: pointer;
    }
  </style>
`;

class GearListItem extends StatefulElement {
    
  render() {
    return html`
      ${styles}
      <a class="hex-group">
        <e-gear-name .icon="${this.item.icon}" .name="${this.item.name}" .subName="${this.item.subName}" .displayNumber="${this.item.displayNumber}"></e-gear-name>
      </a>
    `;
  }

  static get properties() {
    return {
      item: Object
    };
  }
}

window.customElements.define('e-gear-list-item', GearListItem);
