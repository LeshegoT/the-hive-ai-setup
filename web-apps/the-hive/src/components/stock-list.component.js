import { html } from 'lit';
import { StatefulElement } from './stateful-element';

import { material_card, material_button, material_icon_button } from '../styles';

import './card.component';
import './card-points-summary.component';
import './card-level-up.component';
import './card-assigned-training.component';
import './card-side-quest.component';
import './stock-card.component';
import { selectPurchaseState } from '../selectors/store.selectors';

let styles = html`
  <style>
    ${material_card()} ${material_button()} ${material_icon_button()} :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-around;
    }

    .mdc-card {
      height: auto;
      background-repeat: no-repeat;
      background-position: 1em 3em;
      fill: var(--app-tertiary-color);
      font-weight: lighter;
      margin-bottom: 1em;
      min-height: 15em;
      box-shadow: 2px 3px 4px var(--app-dashboard-shadow);
    }

    .mdc-card:hover {
      box-shadow: 2px 3px 8px var(--app-dashboard-shadow);
    }

    .description {
      min-height: 7em;
      padding: 0.75em;
    }

    .compulsoryTraining .description {
      background-color: var(--app-primary-color);
      color: white;
    }

    .title {
      font-size: var(--readable-font-size);
    }

    .subtitle {
      font-size: 0.9em;
    }

    .date {
      font-size: 0.9em;
    }

    a.link {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    a.link svg {
      display: block;
      margin: auto;
    }

    a.link:hover svg {
      stroke: var(--app-primary-color);
      fill: var(--app-primary-color);
    }

    a.navigate:hover {
      color: var(--app-primary-color);
    }

    .divider {
      border-bottom: 1px solid var(--app-lighter-text-color);
    }

    .divider > .icon {
      width: 3em;
      height: 3em;
      border-radius: 3em;
      background-color: var(--app-lighter-text-color);
      margin: -1.5em auto;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .mdc-card:hover .divider > .icon {
      background-color: var(--app-primary-color);
      box-shadow: 0px 0px 8px var(--app-dashboard-shadow);
    }
    .mdc-card:hover .divider > .icon > p {
      color: white;
    }

    button.mdc-button {
      font-size: 0.8em;
    }

    button.mdc-button:hover {
      color: var(--app-primary-color);
    }

    .product-info {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    .thumbnail {
      max-width: 40%;
      max-height: 40%;
      padding-right: 5%;
    }
    .no-thumbnail {
      width: 140px;
      height: 140px;
    }

    e-stock-card {
      width: 48%;
      min-width: 17.5em;
      max-width: 37.5em;
      max-height: 25em;
    }
    mdc-card__actions {
      display: flex;
      flex-direction: row;
      align-items: center;
      box-sizing: border-box;
      min-height: 52px;
      padding: 8px;
    }
    .interactive {
      justify-content: space-between;
    }

    .interactive:first-child {
      margin-left: 2em;
    }

    .interactive:nth-child(1) {
      margin-right: 2em;
    }

    .notInteractive {
      justify-content: flex-end;
    }

    .notInteractive:first-child {
      margin-right: 2em;
    }

    .price {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .price > p {
      margin-left: 0.5em;
    }

    small {
      line-height: 48px;
    }

    #bucks-svg {
      stroke: var(--app-primary-color);
    }

    .item-name {
      width: 30%;
    }
    .variants-container {
      float: right;
      margin: 0 0.5em 0 0.5em;
      max-width: 20%;
    }
    .variants-container p {
      margin-top: 0;
      margin-bottom: 0.2em;
    }
    .variants {
      width: 100%;
    }

    @media (max-width: 900px) {
      .item-name {
        font-size: 14px;
      }
    }
  </style>
`;

class StockList extends StatefulElement {
  render() {
 
    return html`
      ${styles}
      ${this.cards && this.cards.length
        ? this.getAvailableStock().map((card) => {
            return html`
              <e-stock-card context="list" .card="${card}"></e-stock-card>
            `;
          })
        : html``}
    `;
  }

  static get properties() {
    return { cards: Array, state: String };
  }

  stateChanged(state) {
    this.purchaseState = selectPurchaseState(state);
  }

  getAvailableStock() {
    return this.cards.filter(card => card.quantityAvailable === null || (card.quantityAvailable) > 0);
  }
}

window.customElements.define('e-stock-list', StockList);
