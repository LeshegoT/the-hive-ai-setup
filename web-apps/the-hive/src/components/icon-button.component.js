import { html, LitElement } from 'lit';
import iconService from '../services/icon.service';

let styles = (selected) => {
  //need regretion testing to make sure this doesn't break anything else
  // let color = selected ? '--app-primary-color' : '--app-light-text-color';
  let color = '--app-light-text-color';

  return html`
    <style>
      :host {
        flex: 1 1 auto;
        display: flex;
        margin: 0.25em 0.5em 0.25em 0;
        padding: 0.5em;
        color: var(${color});
        border: 1px solid var(${color});
        text-align: center;
        border-radius: 0.5em;
        cursor: pointer;
        font-size: 0.8em;
        height: 1.6em;
        max-width: 16em;
      }

      svg {
        display: block;
        flex: 1 1;
        stroke: var(${color});
        fill: var(${color});
        height: 4em;
        width: 4em;
        margin: -1em 0;
      }

      div {
        flex: 1 1 auto;

        display: inline-block;
        /* margin-top: -10em; */
      }
    </style>
  `;
};

class IconButton extends LitElement {
  render() {
    return html`
      ${styles(this.selected)}
      <svg viewbox="0 0 100 100" version="1.0">
        <g>
          ${this.icon_svg}
        </g>
      </svg>
      <div>
        ${this.text}
      </div>
    `;
  }

  static get properties() {
    return {
      icon: String,
      icon_svg: Object,
      text: String,
      selected: Boolean
    };
  }

  firstUpdated() {
    iconService.load(this.icon).then((icon_svg) => (this.icon_svg = icon_svg));
  }
}

window.customElements.define('e-icon-button', IconButton);
