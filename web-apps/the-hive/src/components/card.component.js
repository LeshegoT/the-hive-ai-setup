import { html, LitElement } from 'lit';
import { material_card, material_button, material_icon_button } from '../styles';
import { link } from './svg';
import { formatDateTime } from '../services/format.service';
import iconService from '../services/icon.service';
import { shared } from '../styles';

import cardService from '../services/card.service';

const styles = html`
<style>
  button,
  a.button,
  a.button:visited {
    -webkit-box-shadow: inset 0px 1px 0px 0px #ffffff;
    box-shadow: inset 0px 1px 0px 0px #ffffff;
    background: linear-gradient(to bottom, #ededed 5%, #dfdfdf 100%);
    background-color: #ededed;
    border-radius: 6px;
    border: 1px solid #dcdcdc;
    display: inline-block;
    color: #777777; /* font-size: 15px; */ /*
    font-weight: bold; */
    padding: 6px 24px;
    text-decoration: none;
    text-shadow: 0px 1px 0px #ffffff;
    cursor: pointer;
  }
  a.icon-link{
    text-decoration: none;
    color:var(--app-tertiary-color);
    cursor: pointer;
  }
  a.desc-link{
    text-decoration: none;
    color:var(--app-secondary-color);
    cursor: pointer;
  }
  </style>
`;

export default class Card extends LitElement {
  /* The Shadow DOM is disabled for the card component, so that we don't import the
  same set of material styles for every single card. - Mike Geyser, 03 Dec 2019 */
  createRenderRoot() {
    return this;
  }

  renderTitle () {
    return html`${this.card.title}`;
  }

  renderSubtitle () {
    return html`
      <div class="subtitle">
        ${this.card.type.typeName} ${this.card.subtitle && this.card.subtitle.length ? `- ${this.card.subtitle}` : ''}
      </div>
    `;
  }

  renderDate() {
    if (!this.card.date) return html``;
    return html`
      <div class="date">
        ${formatDateTime(this.card.date)}
      </div>
    `;
  }

  executeAction() {
    return;
  }

  renderAction () {
    if (this.card.label) return html`
      <i>${this.card.label}</i>
    `

    if (this.card.actionName) return html`
      ${styles}
      <button type='button' class="mdc-button mdc-card__action mdc-card__action--button" @click=${(e) => this.executeAction()}>
        ${this.card.actionName}
      </button>
    `;
  }

  render() {
    return html`
      <div class="mdc-card">
        <a class="desc-link" href="${this.card.link}">
        <div class="description">
          <div>
            <div class="title">
              ${this.renderTitle()}
            </div>
            ${this.renderSubtitle()}
            ${this.renderDate()}
          </div>
        </div>
          </a>
        <div class="divider">
          <div class="icon">
            <a class="icon-link" href="${this.card.link}">
            <svg viewbox="0 0 95.47 94" version="1.0" class="hex">
              ${this.icon}
            </svg>
          </a>
          </div>
        </div>
        <div class="mdc-card__actions">
          <div class="mdc-card__action-buttons">
            ${this.renderAction()}
          </div>
          <div class="mdc-card__action-icons">
            <a
              href="${this.card.link}"
              class="link mdc-icon-button material-icons mdc-card__action mdc-card__action--icon--unbounded"
              title="Share"
              data-mdc-ripple-is-unbounded="true"
            >
              ${link}
            </a>
          </div>
        </div>
      </div>
    `;
  }

  static get properties() {
    return { card: Object, icon: Object };
  }

  updated(changedProps) {
    if (changedProps.has('card')) {
      iconService.load(this.card.icon).then((icon) => (this.icon = icon));
    }
  }
}

window.customElements.define('e-card', Card);