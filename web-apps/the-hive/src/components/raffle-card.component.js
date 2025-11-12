import { html } from 'lit';
import { bucks } from './svg';
import { StatefulElement } from './stateful-element';
import { material_card, material_button, material_icon_button, shared } from '../styles';
import raffleService from '../services/raffle.service';
import './raffle-spinner.component';
import { raffleReceived } from '../actions/raffle.action';
import { store } from '../store';
import { RAFFLE_VIEW_STATE } from '../services/raffle.service';

import { selectRaffleEntryPrice } from '../selectors/raffle.selectors';

const styles = html`
  <style>
    ${shared()} ${material_card()} ${material_button()} ${material_icon_button()} :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-around;
    }

    .statusDescription {
      font-size: small;
      margin: -1.3em;
      color: var(--app-lighter-text-color);
      border: solid 1px var(--app-lighter-text-color);
      padding: 0.2em 0.4em;
      border-radius: 1.5px;
      max-width: 18em;
    }

    .divider {
      border-bottom: 1px solid var(--app-lighter-text-color);
    }

    .mdc-card {
      height: auto;
      background-repeat: no-repeat;
      background-position: 1em 3em;
      fill: var(--app-tertiary-color);
      font-weight: lighter;
      min-height: 15em;
      box-shadow: 2px 3px 4px var(--app-dashboard-shadow);
    }

    .mdc-card:hover {
      box-shadow: 2px 3px 8px var(--app-dashboard-shadow);
      cursor: pointer;
    }

    .redButton {
      background: var(--app-primary-color);
      color: var(--app-light-text-color);
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
      width: 5em;
      font-size: medium;
    }

    #viewButton {
      width: 16em;
    }

    .redButton:hover {
      color: var(--app-dark-text-color);
    }

    .raffle-info {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 1em;
      justify-content: space-evenly;
    }

    .thumbnail {
      max-width: 40%;
      max-height: 40%;
      margin-left: 5%;
    }
    .no-thumbnail {
      width: 40%;
      height: 40%;
      margin-left: 5%;
    }

    .buy {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1em;
    }

    .buy > p {
      margin-left: 0.5em;
    }

    .title {
      padding: 0.5em;
      text-align: center;
      font-size: x-large;
      font-weight: bold;
    }

    .raffle-details {
      margin-left: 1em;
      text-align: center;
    }

    .quantity {
      width: 50px;
      margin-right: 3%;
      margin-left: 3%;
    }

    .multiply {
      margin-left: 1em;
    }

    @media (max-width: 600px) {
      .raffle-info {
        padding: 0%;
      }

      .statusDescription {
        margin-right: 0.5em;
        max-width: 9em;
      }

      #viewButton {
        width: 8em;
        margin-bottom: 1em;
      }

      #dateInformation {
        max-width: 5em;
        margin-bottom: 0;
      }
    }
  </style>
`;

export default class RaffleCard extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    return html`
      ${styles} ${this.renderMainContent()}
    `;
  }

  renderMainContent() {
    return html`
      <div class="mdc-card">
        <div class="title">${this.raffle.description}</div>
        <div class="divider"></div>
        <div class="raffle-info">
          ${this.renderSpinner()}
          <div class="raffle-details">
            <p>${this.raffle.status.name}</p>
            <p class="statusDescription">${this.raffle.status.description}</p>
            <p id="dateInformation">
              ${this.raffle.spinDate.toLocaleDateString()}
              ${this.raffle.spinDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button id="viewButton" @click="${() => this.viewRaffle(this.raffle)}">View</button>
          </div>
        </div>
        <div class="divider"></div>
        <div class="buy">
          ${bucks}${this.rafflePrice}
          <span class="multiply">x</span>
          <input
            value="1"
            class="quantity"
            type="number"
            min="1"
            max="100"
            id="buyAmount-${this.raffle.raffleId}"
            ?disabled="${this.isRaffleOpen()}"
          />
          <button @click=${this.buy} class="redButton" ?disabled="${this.isRaffleOpen()}">Buy</button>
        </div>
      </div>
    `;
  }

  isRaffleOpen(){
    if(this.raffle.status.name.toLowerCase() !== 'open' && this.raffle.status.name.toLowerCase() !== 'pending'){
      return true;
    }

    return false;
  }

  renderSpinner(){
    return html`
      <e-raffle-spinner
        playMode="true"
        .totalWinningsAvailable="${this.raffle.totalWinningsAvailable}"
        size="small"
      ></e-raffle-spinner>
    `;
  }

  viewRaffle(raffle) {
    store.dispatch(raffleReceived(raffle));
    raffleService.updateRaffleState(RAFFLE_VIEW_STATE);
  }

  async buy() {
    let buyNumberPicker = this.shadowRoot.getElementById(`buyAmount-${this.raffle.raffleId}`);
    let buyAmount = buyNumberPicker.value;

    if(buyAmount > 0 && buyAmount <= 100){
      await raffleService.buyEntry(buyAmount, this.raffle.raffleId);
      buyNumberPicker.value = 1;
      await raffleService.getUserRaffles();
    }
  }

  static get properties() {
    return {
      raffle: Object,
      rafflePrice: Number,
      buyAmount: Number,
    };
  }

  stateChanged(state) {
    this.rafflePrice = selectRaffleEntryPrice(state);
  }
}

window.customElements.define('raffle-card', RaffleCard);