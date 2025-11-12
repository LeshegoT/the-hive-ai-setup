import { svg, LitElement } from 'lit';
import { hex_path } from './svg';
import iconService from '../services/icon.service';

class Hex extends LitElement {
  render() {
    return svg` 
      <svg viewbox="0 0 50 50" version="1.0" class="hex ${this.highlight? `hex-highlighted`: ``}">
        <defs>
          <style>
            .resize {
              transform: scale(0.52)
            }
          </style>
        </defs>
          ${hex_path}
          <g class="resize">
            ${this.icon_svg}
          </g>
      </svg>
            `;
  }

  static get properties() {
    return {
      icon: String,
      icon_svg: String,
      highlight: Boolean
    };
  }

  createRenderRoot() {
    return this;
  }

  updated(changedProps) {
    if (changedProps.has('icon')) {
      iconService.load(this.icon).then((icon_svg) => (this.icon_svg = icon_svg));
    }
  }
}

window.customElements.define('e-hex', Hex);
