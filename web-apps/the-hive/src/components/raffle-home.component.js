import { html } from 'lit';
import { shared} from '../styles';
import { StatefulElement } from './stateful-element';
import raffleService from '../services/raffle.service';
import { selectAllParticipatedRaffles } from '../selectors/raffle.selectors';
import { RAFFLE_CREATE_STATE } from '../services/raffle.service';
import { raffleReceived } from '../actions/raffle.action'; 
import { RaffleCard } from '../components/raffle-card.component';
import { store } from '../store';
import '../components/loader.component';

const styles = html`
  <style>
    ${shared()} .redButton {
      background: var(--app-primary-color);
      color: var(--app-light-text-color);
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
      width: 15em;
      font-size: medium;
    }

    .redButton:hover {
      color: var(--app-dark-text-color);
    }

    raffle-card {
      width: 48%;
      min-width: 17.5em;
      max-width: 37.5em;
      max-height: 25em;
      display: inline-block;
      margin-bottom: 1em;
    }

    .raffleCollection {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-evenly;
    }

    #buttonPanel {
      margin-top: 1em;
      display: flex;
      justify-content: flex-start;
    }

    .loader {
      display: flex;
      flex-direction: row;
      justify-content: center;
      width: 100%;
    }

    @media (max-width: 600px) {
      #buttonPanel {
        justify-content: center;
      }

      raffle-card {
        min-width: 23em;
        max-width: 37.5em;
        max-height: 25em;
        display: inline-block;
      }
    }
  </style>
`;

class RaffleHome extends StatefulElement {
  constructor() {
    super();
  }

  render() {

    if(this.raffles){
          return html`
            ${styles}
            <div class="raffleCollection">
              ${this.raffles.map(
                (raffle) =>
                  html`
                    <raffle-card .raffle=${raffle}></raffle-card>
                  `
              )}
            </div>
            ${this.renderButtonPanel()}
          `;
    }

    return html`
      ${styles}
      <div class="loader">
        <e-loader></e-loader>
      </div>
    `;

  }

  renderButtonPanel() {
    // return html`
    //   <div id="buttonPanel">
    //     <button class="redButton" type="button" @click=${() => raffleService.updateRaffleState(RAFFLE_CREATE_STATE)}>
    //       Create Raffle Group
    //     </button>
    //   </div>
    // `;
  }

  static get properties() {
    return {
      raffles: Array,
    };
  }

  firstUpdated() {
    raffleService.getUserRaffles();
  }

  stateChanged(state) {
    this.raffles = selectAllParticipatedRaffles(state);
  }
}

window.customElements.define('e-raffle-home', RaffleHome);
