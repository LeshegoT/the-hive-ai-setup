import { html } from 'lit';
import iconService from '../services/icon.service';
import { StatefulElement } from './stateful-element';

export default class StaticImage extends StatefulElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <img class="static-image" loading=lazy src='${this.image}' />
    `;
  }

  static get properties() {
    return {
      url: String,
      image: Object
    };
  }

  updated(changedProps) {
    if (changedProps.has('url')) {
      iconService.loadStaticImage(this.url).then((pic) => {
        this.image = pic;
      });
    }
  }
}

window.customElements.define('e-static-image', StaticImage);
