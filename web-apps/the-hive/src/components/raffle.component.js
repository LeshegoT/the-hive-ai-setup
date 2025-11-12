import { html, LitElement } from 'lit';
import { StatefulElement } from './stateful-element';
import { selectHero } from '../selectors/hero.selectors';
import raffleService from '../services/raffle.service';
import {
  RAFFLE_HOME_STATE,
  RAFFLE_VIEW_STATE,
  RAFFLE_CREATE_STATE,
  RAFFLE_SPIN_STATE,
} from '../services/raffle.service';
import './peer-search.component';
import {
  selectAllParticipatedRaffles,
  selectRaffleState,
} from '../selectors/raffle.selectors';
import './raffle-creation.component';
import './raffle-home.component';
import './raffle-view.component';
import './raffle-view-spin.component';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';

const styles = html`
  <style>
    :host {
      flex: 1 1 auto;
    }
  </style>
`;

class Raffle extends connect(store)(LitElement) {
  constructor() {
    super();
    this.raffleCreation = false;
    this.addParticipants = [];
  }

  render() {
    return html`
      ${styles} ${this.renderMainContent()}
    `;
  }

  renderMainContent() {
    switch (this.raffleState) {
      case RAFFLE_HOME_STATE:
        return html`
          <e-raffle-home></e-raffle-home>
        `;
      case RAFFLE_CREATE_STATE:
        return html`
          <e-raffle-creation></e-raffle-creation>
        `;
      case RAFFLE_VIEW_STATE:
        return html`
          <e-raffle-view></e-raffle-view>
        `;
      case RAFFLE_SPIN_STATE:
        return html`
          <e-raffle-view-spin></e-raffle-view-spin>
        `;
      default:
        return html`
          <e-raffle-home></e-raffle-home>
        `;
    }
  }

  changeRaffleState(newState) {
    raffleService.updateRaffleState(newState);
  }

  static get properties() {
    return {
      raffleState: String,
      raffles: Array,
    };
  }

  async firstUpdated() {
    raffleService.updateRaffleState(RAFFLE_HOME_STATE);
    await raffleService.getRaffleEntryPrice();
    await raffleService.getUserRaffles();
  }

  stateChanged(state) {
    this.addParticipants = this.addParticipants;
    this.hero = selectHero(state);

    this.raffleState = selectRaffleState(state);
    this.raffles = selectAllParticipatedRaffles(state);
  }
}

window.customElements.define('e-raffle', Raffle);