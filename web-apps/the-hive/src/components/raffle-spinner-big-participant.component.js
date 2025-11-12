import { html, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import raffleService from '../services/raffle.service';
import { store } from '../store';

let styles = html`
  <style>
    #container {
      width: 100%;
      height: 30em;
      -webkit-perspective: 800;
      -webkit-perspective-origin: 50% 225px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      margin-top: 2em;
    }
    #stage {
      width: 30em;
      height: 100%;
      -webkit-transition: -webkit-transform 2s;
      -webkit-transform-style: preserve-3d;
      overflow: hidden;
      rotate: -90deg;
    }

    #shape {
      position: relative;
      top: 160px;
      margin: 0 auto;
      height: 200px;
      width: 5vw;
      -webkit-transform-style: preserve-3d;
      transition: all 200ms ease-out;
    }

    .plane {
      position: absolute;
      height: 11em;
      width: 11em;
      border: 1px solid white;
      -webkit-border-radius: 8px;
      -webkit-box-sizing: border-box;
      text-align: center;
      color: black;
      -webkit-transition: -webkit-transform 2s, opacity 2s;
      -webkit-backface-visibility: hidden;
      font-size: small;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .plane:nth-child(5n - 4) {
      background-color: #d6d2d2;
    }

    .plane:nth-child(5n - 3) {
      background-color: #f2e3e3;
    }

    .plane:nth-child(5n - 2) {
      background-color: #f4bcbc;
    }

    .plane:nth-child(5n - 1) {
      background-color: #f48484;
    }

    .plane:nth-child(5n) {
      background-color: #ff5e5e;
    }

    .participantName {
      rotate: 90deg;
    }

    #shape.backfaces .plane {
      -webkit-backface-visibility: visible;
    }

    #arrow {
      width: 0;
      height: 0;
      rotate: -90deg;
      margin-top: -3em;
      margin-left: 12em;
      z-index: 1;
      filter: drop-shadow(-4px 3px 3px rgba(0, 0, 0, 0.5));
      border-top: 0.5em solid transparent;
      border-bottom: 0.5em solid transparent;
      border-right: 1.5em solid #001f30;
    }
  </style>
`;

class RaffleSpinnerBigParticipant extends connect(store)(LitElement) {
  constructor() {
    super();
  }

  render() {
    return html`
      ${styles}
      <div id="container">
        <div id="stage" @click="${() => this.spin()}">
          <div id="shape" class="ring backfaces">${this.renderWedges()}</div>
          <div id="arrow"></div>
        </div>
      </div>
    `;
  }

  renderWedges(){
    let wedgeDegrees = 360 / this.wedgeCount ;
    let zDistance = this.wedgeCount * 11 / (2 * Math.PI) 

    
    return html`
      ${this.participants.map(
        (participant, index) => html`
          <div class="plane backfaces" id="${index}-wedge" style="-webkit-transform: rotateY(${wedgeDegrees*index}deg) translateZ(${zDistance}em);">
            <label class="participantName">${participant}</label>
          </div>
        `
      )}
    `;
  }

  async spin() {
    let container = this.shadowRoot.getElementById('shape');
    
    let wedgeDegrees = 360 / this.wedgeCount ;
    let randomSpinCount = Math.ceil(Math.random() * 4);
    let degreesToSpin = randomSpinCount * 360 - this.winningIndex * wedgeDegrees;

    container.style.transition = `all 8s ease-out`;
    container.style.transform = `rotateY(${degreesToSpin}deg)`;
    
    
    setTimeout(() =>{
        let winningWedge = this.shadowRoot.getElementById(`${this.winningIndex}-wedge`);
        winningWedge.style.border = 'solid 1px #001f30';
    }, 8000)

    await raffleService.getRaffle(this.raffleId);
  }

  static get properties() {
    return {
      wedgeCount: Number,
      totalWinningsAvailable: Number,
      participants: [],
      playMode: Boolean,
      winningIndex: Number,
      size: String,
      raffleId: Number,
    };
  }

  firstUpdated() {}
}

window.customElements.define('e-raffle-spinner-big-participant', RaffleSpinnerBigParticipant);
