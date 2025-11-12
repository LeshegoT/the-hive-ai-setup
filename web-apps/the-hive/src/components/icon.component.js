import { html, LitElement } from 'lit';
import iconService from '../services/icon.service';

let styles = () => {
  let color = '--app-primary-color';

  return html`
    <style>
      svg {
        display: inline;
        flex: 1 1;
        stroke: var(--app-primary-color);
        fill: var(--app-primary-color);
        height: 3em;
        width: 3em;
        margin: -1.1em 0;
      }
    </style>
  `;
};

class Icon extends LitElement {
  render() {
    return html`
      ${styles()}
      <svg viewbox="0 0 100 100" version="1.0">
        <g>
          ${this.icon_svg}
        </g>
      </svg>
    `;
  }

  static get properties() {
    return {
      icon: String,
      icon_svg: Object
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("icon"))
      iconService.load(this.icon).then((icon_svg) => (this.icon_svg = icon_svg));
  }
}

window.customElements.define('e-icon', Icon);
