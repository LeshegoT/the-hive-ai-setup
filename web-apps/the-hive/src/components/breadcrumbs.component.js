import {LitElement, html} from 'lit';
import { shared } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

let styles = html`
  <style>
    ${shared()} :host {
      max-width: var(--app-max-width);
      margin: auto;
      padding: 0 18px;
    }

    ul.breadcrumb {
      display: none;
    }

    @media (min-width: 460px) {
      ul.breadcrumb {
        display: block;
        padding: 0;
        list-style: none;
        margin-block-start: 0.5em;
      }

      ul.breadcrumb li {
        display: inline;
        font-size: 0.8em;
      }

      ul.breadcrumb li a {
        color: var(--app-tertiary-color);
        text-decoration: none;
      }

      ul.breadcrumb li a:hover {
        color: var(--app-primary-color);
        text-decoration: underline;
      }

      ul.breadcrumb li a strong {
        color: var(--app-secondary-color);
        text-decoration: none;
      }
    }
  </style>
`;

class Breadcrumbs extends connect(store)(LitElement) {
  render() {
    return html`
      ${styles}

      <ul class="breadcrumb">
        ${this.breadcrumbTrail.map(
          (crumb) => html`
            <li>
              <a href="${crumb.link}"> <strong>/</strong> ${crumb.page}</a>
            </li>
          `
        )}
      </ul>
    `;
  }

  static get properties() {
    return {
      breadcrumbTrail: { type: Array }
    };
  }

  stateChanged(state) {
    switch (state.app.page) {
      case '':
      case 'home':
        this.depth = 0;
        break;
      case 'log':
      case 'tracks':
      case 'level-ups':
      case 'side-quests':
      case 'heroes':
      case 'leaderboard':
      case 'quest':
      case 'settings':
      case 'about':
        this.depth = 1;
        break;
      case 'level-up-details':
        this.depth = 2;
        break;
      case 'course':
        this.depth = 3;
        break;
      default:
        this.depth = 4;
    }

    if (!this.breadcrumbTrail) this.breadcrumbTrail = [];

    if (
      this.breadcrumbTrail.length &&
      this.breadcrumbTrail[this.breadcrumbTrail.length - 1].depth >= this.depth
    )
      this.breadcrumbTrail = this.breadcrumbTrail.filter(
        (crumb) => crumb.depth < this.depth
      );

    if (
      !this.breadcrumbTrail.length ||
      this.depth > this.breadcrumbTrail[this.breadcrumbTrail.length - 1].depth
    )
      this.breadcrumbTrail.push({
        page: state.app.page,
        depth: this.depth,
        link: window.location.href
      });
  }
}

window.customElements.define('e-breadcrumbs', Breadcrumbs);
