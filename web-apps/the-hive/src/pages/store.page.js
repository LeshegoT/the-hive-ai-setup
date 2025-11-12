import { html } from 'lit';
import { shared, form } from '../styles';
import { StatefulPage } from './stateful-page-view-element';

import storeService from '../services/store.service';
import rewardsService from '../services/rewards.service';
import navigationService from '../services/navigation.service';
import userService from '../services/user.service';

import { selectPurchaseState, selectSpendBalance, selectStock,selectCartTotal } from '../selectors/store.selectors';
import { selectGuid } from '../selectors/route-data.selectors';

import '../components/title.component';
import '../components/cart-summary.component';
import '../components/stock-list.component';
import '../components/order.component';
import '../components/order-history.component';
import '../components/raffle.component';
import { bucks } from '../components/svg';
import { material_card, material_button, material_icon_button } from '../styles';
import {
  STORE_SHOP_STATE,
  STORE_HOME_STATE,
  STORE_CHECKOUT_STATE,
  STORE_HISTORY_STATE,
  STORE_RAFFLE_STATE,
} from '../services/store.service';
import '../components/loader.component';
import announcementService from '../services/announcement.service';

let styles = html`
  <style>
    ${shared()} ${form()}${material_card()} ${material_button()} ${material_icon_button()} .details {
      display: flex;
      margin: 1em 0;
      justify-content: space-evenly;
    }

    .loader {
      display: flex;
      flex-direction: row;
      justify-content: center;
      width: 100%;
    }

    .mdc-button:not(:disabled) {
      background-color: var(--app-primary-color);
      background: var(--app-primary-color);
      color: white;
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
      margin-right: 0px;
    }
    .mdc-button:hover {
      box-shadow: 1px 2px 8px var(--app-dashboard-shadow);
    }

    .detail-box {
      display: inline-flex;
      padding: 0.5em 0;
    }

    .selectRounded {
      border-radius: 25px;
      padding: 5px;
    }

    .main-store {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .history {
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    .summary {
      min-width: 25%;
      max-width: 30%;
    }
    e-order {
      display: flex;
    }
    .store-heading {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      flex-wrap: wrap;
    }
    select {
      height: 2em;
    }

    .cart-highlight {
      display: none;
    }

    e-order-history {
      width: 70%;
    }
    .page-change {
      color: black;
    }

    .bucks-transfer{
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .transfer-title{
      margin:0;
    }

    .transfer-field{
      margin: 0.5em;
    }

    hr{
      margin: 1em;
    }

    input{
      border: 1px solid #333;
      box-sizing: border-box;
      text-align: center;
    }
    input:invalid,
    input:focus:invalid {
      border: 1px dashed red;
    }
    input:focus:valid {
      border: 2px solid black;
    }

    .active-page {
      background: linear-gradient(to bottom, #0a1027 5%, #293237 100%);
      color: white;
      text-shadow: none;
    }

    .no-stock{
      text-align: center;
      font-size: xxx-large;
    }

    @media (max-width: 700px) {
      .cart-highlight {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .highlight-buttons{
        display: flex;
        flex-direction: column;
      }
      .highlight-buttons > button{
        margin-top: 1em;
      }

      e-stock-list,
      .main-store {
        display: inline-block;
      }
      e-order {
        flex-direction: column-reverse;
      }
      .spend-details {
        width: 100%;
      }
      h3 {
        text-align: center;
      }
      h3,
      h4 {
        margin: 0.5em;
      }

      .store {
        margin: 0;
      }

      section {
        padding: 0;
        margin: 0;
      }
      e-order-history {
        width: 100%;
      }
      .title {
        margin-top: 4em;
      }

      .claimCode {
        max-width: 95%;
      }

      .heading-buttons {
        margin-bottom: 2em;
      }

      .summary {
        min-width: 50%;
        max-width: 100%;
      }
    }

    @media (max-width: 500px) {
      .claimCode {
        min-width: 95%;
      }

      .spend-details button {
        min-width: 95%;
      }
    }
  </style>
`;

class Store extends StatefulPage {

  renderMainContent() {
    switch (this.purchaseState) {
      case STORE_CHECKOUT_STATE:
        return html`
          <e-order></e-order>
        `;
      case STORE_HISTORY_STATE:
        return html`
          <e-order-history></e-order-history>
        `;
      case STORE_RAFFLE_STATE:
        return html`
          <e-raffle></e-raffle>
        `;
      default:
        return html`
          ${this.renderStock()}
          <div class="summary">
            <div id="transfer" class="bucks-transfer">${this.renderTransferBucks()}</div>
            <e-cart-summary></e-cart-summary>
          </div>
        `;
    }
  }
  sortOptions() {
    return [
      { code: 'itemName-asc', text: 'name ascending (A-Z)' },
      { code: 'itemName-des', text: 'name descending (Z-A)' },
      { code: 'price-asc', text: 'price (low to high)' },
      { code: 'price-des', text: 'price (high to low)' }
    ]
  }


  sortCatalogue(sortType = '') {
    let words = sortType.split('-')
    let sortField = words[0];
    let sortDirection = words[1];
    if (this.stock && !!sortField && !!sortDirection)
      storeService.SortStock(sortField, sortDirection);
    else
      storeService.SortStock('itemId', 'asc');
  }

  claimBucks() {
    const guidPattern = /(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}/g;
    const inputCodeElement = this.shadowRoot.querySelector('#code');
    const inputCode = inputCodeElement.value ;

    let guidValidationResult = inputCode.match(guidPattern);

    if(guidValidationResult == inputCode){
      this.claimCode(inputCode);
      inputCodeElement.value = '';
    }else{
      announcementService.createAnnouncement('store', {
        title: 'Failed to claim code',
        body: 'Invalid code format provided',
      });
    }
  }
  renderStock(){
    if (this.stock && !!this.stock.length)
      return html`
        <e-stock-list .state="${this.purchaseState}" .cards="${this.stock}"></e-stock-list>
      `;
    
    if (this.stock){
      return html`
        <div>
          <p class="no-stock">No Stock Available.</p>
          <p class="no-stock">The store appears to be closed. View Transaction History for updates on your orders.</p>
        </div>
      `;
    }


    return html`
      <div class="loader">
        <e-loader></e-loader>
      </div>
    `;

  }
  renderClaimBucks() {
    return html`
      <input class="sort claimCode" type="text" id="code" minlength="36" maxlength="36" size="36" placeholder="Enter claim code (including dashes) here">
      <button @click=${(e) => this.claimBucks()}>Claim bucks</button>`
  }
  renderTransferBucks() {
    return html`
      <h4 class="transfer-title">Transfer Bucks</h4>
      <label for="bucks-input">Transfer </label>
      <input
        type="number"
        step="1"
        id="bucks-input"
        name="bucks-input-field"
        placeholder="up to ${this.balance} bucks"
        class="transfer-field"
        @input=${e => this.validateTransfer('amount')}
        @change=${e => this.transferRecipient = e.target.value}
        />

      <label for="user-search-field"> bucks to</label>
      <input
        type="email"
        list="user-search-results"
        id="user-search-field"
        name="user-search-field"
        class="transfer-field"
        placeholder="find a colleague"
        @input=${e => this.searchUsers(e.target.value)}
        @change=${e => this.transferRecipient = e.target.value}
        />

    <datalist id="user-search-results">
          ${!!this.userSearchOptions ? this.userSearchOptions.map(
                (p) =>
                  html`
                    <option value="${p.userPrincipalName}">
                      ${p.displayName} - ${p.city}
                    </option>
                  `
              ): html``}
    </datalist>
    <button
      type"button"
      id="confirm-transfer"
      @click=${e => this.transferBucks()}
      class="mdc-button mdc-card__action mdc-card__action--button"> Confirm Transfer</button>
    `

  }

  scrollToId(id){
    const elem = this.shadowRoot.querySelector(`#${id}`);
    elem.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  }
  render() {

    return html`
      ${styles}
      <section class="store">
        <e-title name="Swag Store" icon="images/icons/cart-large.svg"></e-title>

        <div class="store-heading">
          <div class="heading-buttons">
            <button class=${this.purchaseState == STORE_HISTORY_STATE? "page-change active-page": "page-changed"} type="button" @click=${(e) => this.loadPage(STORE_HISTORY_STATE)}>
              Transaction history
            </button>
            <button class=${this.purchaseState == STORE_SHOP_STATE? "page-change active-page": "page-changed"} type="button" @click=${(e) => this.loadPage(STORE_SHOP_STATE)}>Shop</button>
            <button class=${this.purchaseState == STORE_RAFFLE_STATE? "page-change active-page": "page-changed"} type="button" @click=${(e) => this.loadPage(STORE_RAFFLE_STATE)}>Raffle</button>
          </div>
          <div class="spend-details">
            ${this.renderClaimBucks()}
            <h3>Available bucks: ${bucks}${this.balance}</h3>
            ${this.purchaseState !== STORE_SHOP_STATE
              ? html``
              : html`
                  <div class="cart-highlight">
                    <h4>Cart total: ${this.renderCartTotal()}</h4>
                    <div class="highlight-buttons">
                      <button type="button" @click=${(e) => this.scrollToId('transfer')}>Transfer Bucks</button>

                      <button type="button" @click=${(e) => storeService.UpdatePurchaseState(STORE_CHECKOUT_STATE)}>
                        View Cart
                      </button>
                    </div>
                  </div>
                `}
          </div>
        </div>
        <hr />
        ${this.purchaseState !== STORE_SHOP_STATE
          ? html``
          : html`
              ${this.stock && !!this.stock.length
                ? html`
                    <div class="sort">
                      <label for="sortOptions">Sort</label>
                      <select
                        class="selectRounded"
                        name="sortOptions"
                        @change="${(e) => this.sortCatalogue(e.target.value)}"
                      >
                        <option value="itemId-asc">Default</option>
                        ${this.sortOptions().map(
                          (l) =>
                            html`
                              <option value="${l.code}">${l.text}</option>
                            `
                        )}
                      </select>
                    </div>
                  `
                : html``}
            `}
        <div
          class="main-store ${this.purchaseState === STORE_CHECKOUT_STATE
            ? ''
            : this.purchaseState === STORE_HISTORY_STATE
            ? STORE_HISTORY_STATE
            : STORE_HOME_STATE} "
        >
          ${this.renderMainContent()}
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

  loadPage(page) {
    if (this.purchaseState !== page)
      storeService.UpdatePurchaseState(page);
  }

  async searchUsers(searchQuery){
    if(searchQuery.length > 2)
      this.userSearchOptions = (await userService.findUsers(searchQuery)).value
  }

  validateTransfer(field){
    const amountMsg = `Amount must be a whole number between 0 and your balance of ${this.balance}`;
    const recipientMsg = `Please ensure that you've selected a recipient from the options provided`;

    const amountField = this.shadowRoot.querySelector('#bucks-input');
    const recipientField = this.shadowRoot.querySelector('#user-search-field');

    amountField.title = amountMsg;
    recipientField.title = recipientMsg;

    let amount = +amountField.value;
    let recipient = this.userSearchOptions ? this.userSearchOptions.find(u => u.userPrincipalName === recipientField.value) : null;

    //amount validation
    if ((field === 'amount' || !field) && (amount <= 0 || amount > this.balance)) {
      amountField.setCustomValidity(amountMsg);
      amountField.reportValidity();
    } else if (amount>0){
      this.amountFieldTouched = true;
      amountField.setCustomValidity('');
    }

    if ((field === 'recipient' || !field) && (!recipient || !recipient.userPrincipalName) ){
      recipientField.setCustomValidity(recipientMsg);
      recipientField.reportValidity();
    } else if (recipient && !!recipient.userPrincipalName){
      this.recipientFieldTouched = true;
      recipientField.setCustomValidity('');
    }

    return( {
      valid: (amountField.validity.valid && recipientField.validity.valid),
      amount,
      recipient
    });
  }

  transferBucks(){
    let validity = this.validateTransfer();
    if (validity.valid){
      console.log('transfer ' + validity.amount + ' to ', validity.recipient);
      storeService.TransferBucks(validity.amount, validity.recipient.userPrincipalName);
    }

  }

  async claimCode(guid) {
    let response = await rewardsService.claimBucks(guid);
    navigationService.navigate('/store');
  }

  static get properties() {
    return {
      stock: Array,
      title: String,
      purchaseState: String,
      balance: Number,
      guid: String,
      cartTotal: Number,
      userSearchOptions: Array,
      transferRecipient: String,
      amountFieldTouched: Boolean,
      recipientFieldTouched: Boolean
    };
  }

  firstUpdated() {
    this.guidClaimSent = false;
    this.amountFieldTouched = false;
    this.recipientFieldTouched = false;
    storeService.GetStock();
    storeService.GetCart();
    storeService.GetBalance();
    storeService.UpdatePurchaseState(STORE_SHOP_STATE);
  }

  shouldUpdate(changedProps) {
    if(changedProps.has('guid') && this.guid) {
      this.claimCode(this.guid);
    }

    return !changedProps.has('guid');
  }

  stateChanged(state) {
    super.stateChanged(state);
    this.stock = selectStock(state);
    this.purchaseState = selectPurchaseState(state);
    this.balance = selectSpendBalance(state);
    this.guid = selectGuid(state);
    this.cartTotal = selectCartTotal(state);

    if(!this.guid) {
      this.requestUpdate();
    }
  }
}

window.customElements.define('e-store', Store);
