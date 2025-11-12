import { html, LitElement } from 'lit';
import { shared } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import avatarDrawingService from '../services/avatar-drawing.service';
import { svg } from 'lit';

let styles = html`
  <style>
    ${shared()} :host {
    }

    .part:hover {
      filter: grayscale(30%);
      opacity: 0.7;
    }

    .part.active {
      filter: inherit;
      opacity: 1;
    }

    .part.unknown b {
      display: block;
      font-size: 2.5em;
    }

    .part {
      height: 4em;
      width: 4em;
      margin: 0.2em auto;
      border: 1px solid var(--app-tertiary-color);
    }
  </style>
`;

class PartBox extends connect(store)(LitElement) {

  renderPart(){
    let activeStyle = this.part.active || this.forceActiveStyle ? 'active' : '';
    if (this.svgPart)
      return html`      
        <div class="part ${this.part.partType} ${activeStyle}">
          ${this.svgPart}
        </div>
      `;

      let part_name;
    switch (this.part.partType) {
      case 'right':
      case 'left':
        part_name = this.part.partType + ' arm';
        break;

      default:
        part_name = this.part.partType;
        break;
    }

    return html`
      ${styles}

      <div class="part unknown ${activeStyle}">
        <b>?</b>
        ${part_name}
      </div>
    `;
  }

  render() {
    return html `
    ${styles}
    ${this.renderPart()}
    `
  }

  static get properties() {
    return {
      body: Object,
      part: Object,
      svgPart: svg,
      forceActiveStyle: Boolean
    };
  }

  updated(changedProps) {
    if (!this.body || !this.body.level) return;

    if (changedProps.has('body') || changedProps.has('part')) {
      avatarDrawingService
        .getPreviewPart(this.body, this.part)
        .then((part) => (this.svgPart = part));
    }
  }
}

window.customElements.define('e-part-box', PartBox);
