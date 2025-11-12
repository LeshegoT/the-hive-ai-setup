import { html, LitElement } from 'lit';
import { shared } from '../styles';
import { bucks } from './svg';
import { StatefulElement } from './stateful-element';
import { store } from '../store';
import raffleService from '../services/raffle.service';
import { selectActiveRaffle, selectRaffleWinner } from '../selectors/raffle.selectors';
import { RAFFLE_VIEW_STATE } from '../services/raffle.service';
import { raffleWinnerReceived } from '../actions/raffle.action';
import './raffle-spinner.component';
import './raffle-spinner-big-participant.component';
import storeService from '../services/store.service';

const styles = html`
  <style>
    ${shared()} #headingPanel {
      display: flex;
      flex-direction: row;
      justify-content: center;
    }

    #headingPanel > div {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    h1,
    h2 {
      text-align: center;
      margin: 0;
    }

    .redButton {
      background: var(--app-primary-color);
      color: var(--app-light-text-color);
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
      width: 100%;
      font-size: medium;
    }

    .redButton:hover {
      color: var(--app-dark-text-color);
    }

    e-raffle-spinner {
      margin: 1em;
      display: flex;
      flex-direction: row;
      justify-content: center;
    }

    .clearButton {
      margin-top: 0.5em;
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
      width: 15em;
      font-size: medium;
      background: var(--app-header-background-color);
    }
  </style>
`;

class RaffleViewSpin extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    return html`
      ${styles}
      <div id="headingPanel">
        <div>
          <h1>${this.raffle.description}</h1>
          <button class="redButton" id="spinRaffle" @click="${() => this.retrieveWinnerInfo()}">Spin</button>
        </div>
      </div>
       ${this.winner ? this.renderSpinner() : html``}
      <button class="clearButton" type="button" @click=${this.navigateToRaffleView}>View Raffle</button>
    `;
  }

  renderSpinner(){
    if(this.winner.participants.length < 10){
      return html`
        <e-raffle-spinner
          id="spinner"
          .playMode=${false}
          .participants="${this.winner.participants}"
          .winningIndex=${this.winner.winner}
          .wedgeCount=${this.winner.participants.length}
          .size=${'large'}
          raffleId=${this.raffle.raffleId}
        ></e-raffle-spinner>
        <h2>${bucks}${this.winner.total}</h2>
      `;
    }else{
        return html`
          <e-raffle-spinner-big-participant
            id="spinner"
            .playMode=${false}
            .participants="${this.winner.participants}"
            .winningIndex=${this.winner.winner}
            .wedgeCount=${this.winner.participants.length}
            .size=${'large'}
            raffleId=${this.raffle.raffleId}
          ></e-raffle-spinner-big-participant>
          <h2>${bucks}${this.winner.total}</h2>
        `;
    }
  }

  async navigateToRaffleView() {
    await storeService.GetBalance();
    store.dispatch(raffleWinnerReceived(undefined));
    await raffleService.updateRaffleState(RAFFLE_VIEW_STATE);
  }

  async retrieveWinnerInfo() {
    if (!this.winner) {
      this.shadowRoot.getElementById('spinRaffle').disabled = true;
      await raffleService.getRaffleWinner(this.raffle.raffleId);

      this.pendingChildrenRender();
    }
  }

  async pendingChildrenRender(){
    if (this.winner) {
      const child = this.shadowRoot.querySelectorAll('e-raffle-spinner#spinner');
      await Promise.all(Array.from(child).map((c) => c.updateComplete));
      this.onceChildrenAreUpdated();
    }
  }

  onceChildrenAreUpdated() {
    setTimeout(() => {
      const child = this.shadowRoot.getElementById('spinner');
      child.spin();
    }, '500');
  }

  static get properties() {
    return {
      raffle: Object,
      winner: Object,
    };
  }

  firstUpdated() {}

  stateChanged(state) {
    this.raffle = selectActiveRaffle(state);
    this.winner = selectRaffleWinner(state);
  }
}

window.customElements.define('e-raffle-view-spin', RaffleViewSpin);