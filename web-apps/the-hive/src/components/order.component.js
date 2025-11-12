import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { globalLocation } from './svg';
import { material_card, material_button, material_icon_button, shared } from '../styles';

import './stock-card.component';
import { selectBalanceAfterOrder, selectCart, selectCartOld, selectCartTotal, selectPickupLocations } from '../selectors/store.selectors';
import storeService from '../services/store.service';

let styles = html`
  <style>
    ${shared()} ${material_card()} ${material_button()} ${material_icon_button()} .title {
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
    button {
      background: none;
      font-size: large;
      color: white;
      background-color: var(--app-primary-color);
    }
    button:hover {
      color: black;
    }
    .pickup {
      width: 30%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    select {
      height: 2em;
    }
    .error {
      color: red;
      margin: 0;
      text-align: center;
    }
    .location {
      text-align: center;
    }
    section {
      margin-top: 0.25em;
      color: black;
    }
    option {
      color: black;
    }
    .variants {
      width: 100%;
    }
    .variants-container p {
      margin-top: 0;
    }

    @media (max-width: 690px) {
      .pickup {
        width: 100%;
      }
      .orderDetails {
        margin-top: 0.25em;
      }
      .error {
        text-align: center;
      }
    }
  </style>
`;

class Order extends StatefulElement {

  renderPickupLocation() {
    return !this.pickupLocations
      ? html``
      : html`
          <section class="pickup">
            <label for="pickupLocation" class="${!this.pickupLocation ? 'error' : ''}">Pick-up location:</label>

            <select
              name="pickupLocation"
              class="${!this.pickupLocation ? 'error' : ''}"
              @change="${(e) => this.selectPickUpLocation(e.target.value)}"
            >
              <option>-- select --</option>
              ${this.sortLocations(this.pickupLocations).map(
                (l) =>
                  html`
                    <option value=" ${l.locationId}">${l.locationName}</option>
                  `
              )}
            </select>

            <p class="location">
              ${globalLocation} Address:
              <br />
              ${!this.pickupLocation ? html`</p>` : html`${this.pickupLocation.locationAddress}</p>`}
              ${this.canPlaceOrder().result
                ? html``
                : html`
                    <p class="error">${this.canPlaceOrder().reason + ' before you confirm your order'}</p>
                  `}
            </p>

            <hr />
            <button
              type="button"
              ?disabled=${this.canPlaceOrder().result ? false : true}
              title="Place Order"
              @click=${(e) => this.placeOrder()}
            >
              Confirm & Place Order
            </button>
          </section>
        `;
  }

  render() {
    return html`
      ${styles}
      <section class="orderDetails">
        <h3>Order items total: ${this.cartTotal}<hr />
        </h3>
        ${this.balanceAfterOrder<0 ?
          html`<p class="error">You don't have enough b-bucks to order this
          entire cart. Please remove some items.</p>`: ''}
        ${this.cards && this.cards.length ? this.cards.map((card) => {
          return html`
                <e-stock-card context="order" hideActions=true priceInDescription=true .card="${card}"></e-stock-card>
                `;
        }) : html`
          <p><i>No items in cart as yet.</i></p>
          <p><i>head back to the shop to find awesome merch</i></p>
        `}
        <br>
        </section >
      
      ${this.renderPickupLocation()}
    `;
  }

  canPlaceOrder() {
    let canAfford = (this.cartTotal && this.balanceAfterOrder >= 0);
    let result = (this.cards && !!this.cards.length && canAfford && !!this.pickupLocation);
    let reason = !this.cards || !this.cards.length ? `Your cart is empty. Please add some items from the shop` :
      !canAfford ? `You don't have enough b-bucks to order this entire cart. Please remove some items` :
      !this.pickupLocation ? `You have not selected a pick-up location for your order. Please select from the options` :
          `You have enough b-bucks and you have selected a valid pick-up location.`
    
    return { result, reason };
  }
  placeOrder() {
    let orderItems = this.cards.map(c => {
      return { itemId: c.itemId, quantity: c.quantityInCart, variant: c.variant ? c.variant : null }
    })
    if (this.canPlaceOrder().result && !!orderItems.length)
      storeService.PlaceOrder(this.pickupLocation.locationId, orderItems);
  }

  selectPickUpLocation(location) {
    this.pickupLocation = this.pickupLocations.find(l => l.locationId == location);
  }

  static get properties() {
    return {
      cards: Array,
      pickupLocations: Array,
      pickupLocation: Object,
      balanceAfterOrder: Number,
      cartTotal: Number
    };
  }

  firstUpdated() {
    storeService.GetPickupLocations();
  }

  stateChanged(state) {
    this.cards = selectCart(state);
    this.pickupLocations = selectPickupLocations(state);
    this.cartTotal = selectCartTotal(state);
    this.balanceAfterOrder = selectBalanceAfterOrder(state);
  }

  sortLocations(locations) {
    let sortedLocations = locations.sort((a, b) => {
      if (a.locationName < b.locationName) {
        return -1;
      }

      if (a.locationName > b.locationName) {
        return 1;
      }
    });
    
    return sortedLocations;
  }
}

window.customElements.define('e-order', Order);
