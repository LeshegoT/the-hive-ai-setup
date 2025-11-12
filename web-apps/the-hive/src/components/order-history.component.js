import { html } from 'lit';
import { until } from 'lit/directives/until.js';
import { StatefulElement } from './stateful-element';
import { bucks } from './svg';
import { material_card, material_button, material_icon_button, shared, link } from '../styles';

import './stock-card.component';
import './static-image.component';
import './profile.component';

import { selectOrderHistory } from '../selectors/store.selectors';

import storeService from '../services/store.service';
import userService from '../services/user.service';
import { formatFullDate, formatDateTimeLocale } from '../services/format.service';

let styles = html`
  <style>
    ${shared()} ${link} ${material_card()} ${material_button()} ${material_icon_button()}
    
    .collapsible {
      cursor: pointer;
      width: 100%;
      border: none;
      text-align: left;
      outline: none;
      font-size: 15px;
      border-radius: 0;
    }

    .active,
    .collapsible:hover {
      background-color: #555;
    }

    .content {
      display: none;
      overflow: hidden;
    }

    .title {
      font-size: var(--readable-font-size);
    }

    .subtitle {
      font-size: 0.9em;
    }

    .product-info{
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: space-between;
      flex-direction: row-reverse;
    }
    .product-info > img{
      max-width: 20%;
    }

    .mdc-card{
      padding: 0.5em;
    }

    .error{
      color: red;
      margin: 0;
    }

    section{
      padding:0.5em;
      margin:0;
    }

    h4,
    h5{
      margin:0;
    }

    .static-image{
      width: 5em;
      border: solid 1px black;
      margin-left: 0.5em;
    }
    section > * {
      margin: 0
    }

    .order-history{
      display:flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .ordered-items{
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      width: 30%;
    }
    .order-status-new{
      color: #bb8913;
    }
    .order-status-in-progress{
      color: #136fbb;
    }
    .order-status-ready{
      color: #006d00;
    }
    .order-status-cancelled{
      color: #c50000be;
    }

    .raffle-status-Closed {
      color: #006d00;
    }

    .raffle-status-Completed {
      color: #006d00;
    }

    .raffle-status-Open {
      color: #136fbb;
    }

    .recipient{
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 30%;
    }
    .orderTotalCancelled{
      text-decoration: line-through;
      text-decoration-color: red
    }

    @media (max-width: 690px) {
      p{
        font-size: 1em;
      }
      h3{
        text-align: center;
      }
      .order-history{
        display:flex;
        flex-direction: column;
      }
      .ordered-items{
        justify-content: center;
        max-width: 100%;
      }
      .static-image{
        margin-left: 0.25em;
      }
      .recipient{
        width:auto;
      }
      .order-info > p{
        text-align: center;
        font-size: 0.9em;
        margin: auto;
      }
      svg{
        height: 1em;
        width: auto;
      }
      .recipient > p {
        margin: 0;
      }
    }
  </style>
`;

class OrderHistory extends StatefulElement {
  renderOrder(o) {
    return html`
      <section class="mdc-card order-history">
        <div class="order-info">
          <p>
            <label>Order placed on:</label> ${formatFullDate(new Date(o.transactionDate))} (${this.calculateTotalItems(o.orderItems)} items)
          </p>
          <p>
            Order status :
            <i class="order-status-${o.statusCode}">${!!o.statusShortDescription ? o.statusShortDescription : o.statusCode}</i>
          </p>
          <p>Order total: ${bucks} <span class="${o.statusCode === 'cancelled' ? 'orderTotalCancelled' : ''}">${o.orderTotal} </span></p>
          ${ o.statusCode === 'new'? html`<button  @click=${(e) => this.cancelOrder(o.orderId) }> Cancel Order</button >` : html``}  

        </div>
        <div class="ordered-items">
          ${o.orderItems.map(
            (i) => html`
              <e-static-image .url="${i.thumbnail}"></e-static-image>
            `
          )}
        </div>
      </section>
    `;
  }
  renderProfile(profile){    
    return html `
      <e-profile .person="${profile.userPrincipalName}"></e-profile>
      <p class"recipient-details">${profile.displayName}</p>
      <a class"recipient-details" href="mailto:${profile.userPrincipalName}">${profile.userPrincipalName}</a>
    `
  }

  renderTransfer(t) {
    return html`
      <section class="mdc-card order-history">
        <div class="order-info">
          <p>
            <label>Bucks transferred on:</label>
            ${formatDateTimeLocale(new Date(t.transactionDate))}
          </p>
          <p>
            Transfer status:
            <i class="order-status-${t.code}">${!!t.shortDescription ? t.shortDescription : t.code}</i>
          </p>
          <p>Transfer amount: ${bucks} ${t.amount}</p>
        </div>
        <div class="recipient">
          <hr />
          ${until(
            userService.getActiveDirectoryProfile(t.awardedTo).then((r) => this.renderProfile(r)),
            html`
              Loading profile...
            `
          )}
        </div>
      </section>
    `;
  }

  renderRaffle(raffle) {
    return html`
      <section class="mdc-card order-history">
        <div class="order-info">
          <p>
            <label>Raffle entries for:</label>
            ${raffle.description} (${raffle.entries} items)
          </p>
          <p>
            <label>Raffle date:</label>
            ${formatDateTimeLocale(new Date(raffle.transactionDate))}
          </p>
          <p>
            Raffle status:
            <i class="raffle-status-${raffle.status}">
              ${!!raffle.statusDescription ? raffle.statusDescription : raffle.status}
            </i>
          </p>
          <p>Entries amount: ${bucks} ${raffle.amount}</p>
        </div>
        <div class="ordered-items">
          <e-static-image url="raffle.png"></e-static-image>
        </div>
      </section>
    `;
  }

  render() {
    return html`
      ${styles}
      <section>
        <h3>Transaction history</h3>
        <hr />
        ${this.orderHistory
          ? this.orderHistory.map((yearTransactions) => this.renderYearSection(yearTransactions))
          : html``}
      </section>
    `;
  }

  renderYearSection(yearTransactions) {
    return html`
      <button
        type="button"
        @click=${() => this.collapseSection(`${yearTransactions.year}`)}
        class="collapsible"
        id="collapsible-${yearTransactions.year}"
      >
        → ${yearTransactions.year}
      </button>
      <div class="content" id="content-${yearTransactions.year}">
        ${yearTransactions.transactions.map((o) =>{
          switch (o.type) {
            case 'order':
              return this.renderOrder(o);
            case 'transfer':
              return this.renderTransfer(o);
            case 'raffle':
              return this.renderRaffle(o);
          }
        } )}
      </div>
    `;

  }

  collapseSection(year){
    let content = this.shadowRoot.getElementById(`content-${year}`);
    let collapse = this.shadowRoot.getElementById(`collapsible-${year}`);

     if (content.style.display === 'block') {
       content.style.display = 'none';
       collapse.innerHTML = `→ ${year}`;
     } else {
       content.style.display = 'block';
        collapse.innerHTML = `↓ ${year}`;
     }
  }

  calculateTotalItems(items) {
    return items.reduce((accumulator, item) => accumulator + item.quantity, 0);
  }

  cancelOrder(orderId) { 
    storeService.CancelOrder(orderId);
  }

  static get properties() {
    return {
      orderHistory: Array
    };
  }

  firstUpdated() {
    storeService.GetOrderHistory();
  }

  stateChanged(state) {
    this.orderHistory = selectOrderHistory(state);
  }
}

window.customElements.define('e-order-history', OrderHistory);
