import { html } from 'lit';
import { PageViewElement } from './page-view-element.js';

// These are the shared styles needed by this element.
import { shared } from '../styles';

class NoPermissionPage extends PageViewElement {
  render() {
    return html`
      <style>
        ${shared()}
      </style>

      <section>
        <h2>Oops! You do not have permission to view this page</h2>
        <p>Head back <a href="/">home</a> and try again?</p>
      </section>
    `;
  }
}

window.customElements.define('e-no-permission', NoPermissionPage);
