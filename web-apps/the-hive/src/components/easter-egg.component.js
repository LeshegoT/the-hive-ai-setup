import { html, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { gift } from './svg';
import { animations } from '../styles';

import rewardsService from '../services/rewards.service';
import { selectEasterEggCode, selectEasterEggDisplay } from '../selectors/easter-egg.selector';

const styles = html`
  <style>
    ${animations()} .easter-egg {
      position: absolute;
      background-color: rgba(192, 192, 192, 0.5);
      border-radius: 25px;
      width: 10em;
      height: 10em;
      z-index: 7;
      display: flex;
      justify-content: center;
      align-items: center;
      padding-left: 2em;
      animation: 7.5s ease 0s 1 showGift;
      left: 25%;
    }
    .shake > svg {
      stroke: rgba(128, 128, 128, 0.9);
      fill: rgba(128, 128, 128, 0.9);
      width: 80%;
      height: 80%;
    }
    .hidden {
      display: none;
    }
    .open {
      animation: 1s ease 0s 1 openGift;
    }

    @keyframes showGift {
      0% {
        transform: translateY(500%);
      }
      10% {
        transform: translateY(0%);
      }
      99% {
        transform: translateY(0%);
      }
      100% {
        transform: translateY(500%);
      }
    }

    @keyframes openGift {
      0% {
        transform: scale(1);
        opacity: 0.5;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
  </style>
`;

class EasterEgg extends connect(store)(LitElement) {
  constructor() {
    super();
    this.open = false;
  }

  render() {
    if (!this.display && !this.open) return html``;
    return html`
      ${styles}
      <style>
        .easter-egg {
          top: ${this.yPos}%;
        }
        @media (min-width: 600px) {
          .easter-egg {
            left: ${this.xPos}%;
          }
        }
      </style>
      <div class="easter-egg ${this.isOpen()}" @click="${(e) => this.claim()}">
        <span class="shake">${gift}</span>
      </div>
    `;
  }

  isOpen() {
    return this.open ? 'open' : '';
  }

  claim() {
    this.open = true;
    if (this.guid) {
      rewardsService.claimBucks(this.guid, true);
    }
    setTimeout(() => this.open = false, 1000);
  }

  static get properties() {
    return {
      guid: String,
      display: Boolean,
      open: Boolean,
      xPos: Number,
      yPos: Number
    };
  }

  firstUpdated() {
    this.xPos = this.randomPos();
    this.yPos = this.randomPos();
  }

  shouldUpdate(changedProps) {
    if (changedProps.has('display')) {
      if(!this.open) {
        this.xPos = this.randomPos();
        this.yPos = this.randomPos();
      }
      return changedProps.has('display');
    }
    return true;
  }

  stateChanged(state) {
    this.guid = selectEasterEggCode(state);
    this.display = selectEasterEggDisplay(state);
  }

  randomPos(){
    let min = 10;
    let max = 80;
    let val = Math.floor(Math.random() * (max - min + 1) + min);
    return val;
  };
}

window.customElements.define('e-easter-egg', EasterEgg);