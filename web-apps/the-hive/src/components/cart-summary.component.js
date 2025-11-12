import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import cardService from '../services/card.service';
import { bucks } from './svg';
import { material_card, material_button, material_icon_button } from '../styles';

import './stock-card.component';
import { selectBalanceAfterOrder, selectCart, selectCartTotal } from '../selectors/store.selectors';
import storeService from '../services/store.service';

let styles = html`
  <style>
    ${material_card()} ${material_button()} ${material_icon_button()} .title {
      font-size: var(--readable-font-size);
    }

    .subtitle {
      font-size: 0.9em;
    }

    .product-info {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: space-between;
      flex-direction: row-reverse;
    }
    .product-info > img {
      max-width: 20%;
    }
    .product-info > p {
      max-width: 70%;
      font-size: 0.7em;
    }

    .mdc-card {
      padding: 0.5em;
    }

    .small-price {
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .small-price > p {
      padding-left: 0.5em;
    }

    .small-price > svg {
      width: 1.3em;
    }
    .total {
      display: flex;
      align-items: center;
      justify-content: space-around;
    }
    .total > svg {
      width: 1.2em;
      padding-right: 0.25em;
      padding-left: 0.25em;
    }
    h5 {
      margin-top: -1.5em;
      text-align: center;
    }
    .positiveBalance {
      color: green;
    }
    .negativeBalance {
      color: red;
    }
    #confirm-order {
      background-color: var(--app-primary-color);
      color: white;
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
      margin-right: 0px;
    }
    #confirm-order:hover {
      box-shadow: 1px 2px 8px var(--app-dashboard-shadow);
    }
    #clear-cart {
      margin-top: 0.5em;
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
    }
    #clear-cart:hover {
      box-shadow: 1px 2px 8px var(--app-dashboard-shadow);
    }
    .variants-container {
      margin-right: 0.5em;
    }
    .variants-container p {
      margin-top: 0;
      margin-bottom: 0.2em;
    }
    .variants {
      width: 100%;
    }
  </style>
`;

class CartSummary extends StatefulElement {
  render() {
    return html`
      ${styles}
      <section>
        <h4 class="title total">Cart summary ${this.renderCartTotal()}</h4>
        ${this.cards && this.cards.length
          ? this.cards.map((card) => {
              return html`
                <e-stock-card
                  context="summary"
                  hideActions="true"
                  priceInDescription="true"
                  .card="${card}"
                ></e-stock-card>
              `;
            })
          : html`
              <h5>No items in cart</h5>
            `}
        <div class="mdc-card">
          <h4 class="total">Cart total: ${this.renderCartTotal()}</h4>
          ${this.cards && this.cards.length
            ? html`
                <h5 class="${this.balanceAfterOrder < 0 ? 'negativeBalance' : 'positiveBalance'}">
                  Post-order balance: ${this.balanceAfterOrder}
                </h5>
              `
            : html``}
          <button
            id="confirm-order"
            type="button"
            class="mdc-button mdc-card__action mdc-card__action--button"
            @click=${(e) => this.Checkout()}
          >
            Confirm Order
          </button>
          <button
            id="clear-cart"
            type="button"
            class="mdc-button mdc-card__action mdc-card__action--button"
            @click=${(e) => storeService.ClearCart()}
          >
            Clear Cart
          </button>
        </div>
      </section>
    `;
  }

  renderCartTotal() {
    return html`
        <span class="total">
          ${bucks}
          <span>${this.cartTotal}</span>
        </span>
    `;
  }

  Checkout() {
    storeService.UpdatePurchaseState('checkout')
  }

  static get properties() {
    return { cards: Array, cartTotal: Number, balanceAfterOrder: Number };
  }

  firstUpdated() {
    if (!this.cards || !this.cards.length) {
      cardService.fetchCards();
    }
  }

  stateChanged(state) {
    this.cards = selectCart(state);
    this.cartTotal = selectCartTotal(state);
    this.balanceAfterOrder = selectBalanceAfterOrder(state);
  }
}

window.customElements.define('e-cart-summary', CartSummary);
