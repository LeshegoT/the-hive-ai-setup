import { html } from 'lit';
import { subtract, add, trash, bucks } from './svg';
import iconService from '../services/icon.service';
import storeService from '../services/store.service';
import { selectCanItemBeAdded } from '../selectors/store.selectors';
import { StatefulElement } from './stateful-element';


export default class StockCard extends StatefulElement {
  /* The Shadow DOM is disabled for the card component, so that we don't import the 
  same set of material styles for every single card. - Mike Geyser, 03 Dec 2019 + Lucky Nkosi 29 June 2021 */
  createRenderRoot() {
    return this;
  }
  
  subtractItem() {
    storeService.SubtractFromCart(this.card.itemId);
  }
  addItem() {
    storeService.AddToCart(this.card.itemId, this.selectedVariant);
  }

  renderCanBePurchased() {
    let alreadyInCart = this.card.quantityInCart >= 1;
    if(this.card.canBePurchased) {
      if(this.checkAvailability()) {
        return html`<small>No items left</small>`;
      }

      return html`
        <button
          type="button"
          class="mdc-icon-button material-icons mdc-card__action mdc-card__action--icon--unbounded"
          title="${alreadyInCart ? 'Add another' : 'Add to cart'}"
          data-mdc-ripple-is-unbounded="true"
          @click=${(e) => this.addItem()}
        >
          ${add}
        </button>
      `;
    } 

    return html`<small>Low balance</small>`;
  }

  checkAvailability() {
    if(this.card.quantityAvailable - this.card.quantityInCart < 1 && this.card.quantityAvailable != null){
      return true;
    }else if(this.selectedVariant?.stockItemId === this.card.itemId){
      if (this.selectedVariant.variantQuantityAvailable <= this.card.quantityInCart && this.selectedVariant.variantQuantityAvailable != null) {
        return true;
      } else return false;
    }else{
      return false;
    }
  }

  renderCartButtons() {
    if (this.displayOnly) return ``;
    
    let alreadyInCart = (this.card.quantityInCart >= 1);
    return html`
      <div class="mdc-card__actions ${alreadyInCart ? 'interactive' : 'notInteractive'}">
        ${alreadyInCart
          ? html`
              <button
                type="button"
                class="mdc-icon-button material-icons mdc-card__action mdc-card__action--icon--unbounded"
                title="${this.card.quantityInCart > 1 ? 'Subtract 1 from cart' : 'Remove from cart'}"
                data-mdc-ripple-is-unbounded="true"
                @click=${(e) => this.subtractItem()}
              >
                ${this.card.quantityInCart > 1 ? subtract : trash}
              </button>
            `
          : html``}
        ${this.renderCanBePurchased()}
      </div>
    `;

  }

  renderVariantOptions(variants) {
    if(this.context === 'summary') return html``;
    return html`
      <div class="variants-container">
        <p>Pick an option</p>
        <select @change=${(e) => this.selectVariant(e)} class="variants">
          ${variants.map(
            (variant) => html`
              <option ?selected=${this.checkVariantSelected(variant.variantName)}>${variant.variantName}</option>
            `
          )}
        </select>
      </div>
    `;
  }

  render() {
    if(!this.thumbnail) return html``;

    return html`
      <div class="mdc-card">
        ${this.hideActions
          ? html``
          : html`
              ${this.renderCartButtons()}
              <div class="divider">
                <div class="icon">
                  <p>${this.card.quantityInCart}</p>
                </div>
              </div>
            `}
        <div class="product-info">
          <img class=${this.thumbnail ? 'thumbnail' : 'no-thumbnail'} src="${this.thumbnail}" />
          <p class="item-name">
            ${this.card.itemName}
            ${!this.priceInDescription
              ? html``
              : html`
                  <span class="small-price">
                    ${bucks}
                    <p>${this.card.price} x ${this.card.quantityInCart}</p>
                    ${this.renderCartButtons()}
                  </span>
                `}
          </p>
          ${this.card.variants.length ? this.renderVariantOptions(this.card.variants) : html``}
        </div>
        <div class="divider"></div>
        ${this.priceInDescription
          ? html``
          : html`
              <div class="price">
                ${bucks}
                <p>${this.card.price}</p>
              </div>
            `}
      </div>
    `;
  }

  selectVariant(e) {
    this.selectedVariant = this.card.variants.find((variant) => variant.variantName === e.target.value);
    if(storeService.cart.some((item) => item.itemId === this.card.itemId)) {
      storeService.UpdateItemVariant(this.card.itemId, this.selectedVariant);
    }
  }

  static get properties() {
    return {
      card: Object,
      thumbnail: Object,
      quantityInCart: Number,
      hideActions: Boolean,
      priceInDescription: Boolean,
      displayOnly: Boolean,
      selectedVariant: Object,
      context: String
    };
  }

  updated(changedProps) {
    if (changedProps.has('card')) {
      iconService.loadStaticImage(this.card.thumbnail).then((pic) => {
        this.thumbnail = pic;
      });
    }
  }

  stateChanged(state) {
    this.canBePurchased = selectCanItemBeAdded(state, this.card.price);
  }

  firstUpdated() {
    if(this.card.variants && this.card.variants.length > 0) {
      this.selectedVariant = this.card.variants[0];
    }
  }

  checkVariantSelected(name) {
    if(this.context === 'list') {
      if (this.selectedVariant && this.selectedVariant.variantName === name) {
        return true;
      }
      return false;
    }

    let cart = storeService.cart;
    let item = cart.find((i) => i.itemId === this.card.itemId);
    if(item.variant.variantName === name) {
      return true;
    }
    return false
  }
}

window.customElements.define('e-stock-card', StockCard);