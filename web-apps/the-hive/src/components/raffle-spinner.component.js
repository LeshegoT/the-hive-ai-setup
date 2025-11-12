import { html, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import raffleService from '../services/raffle.service';
import { store } from '../store';

let styles = html`
  <style>
    :host {
      --small-spinner-size: 12em;
      --small-pie-size: 10em;

      --large-spinner-size: 30em;
      --large-pie-size: 28em;
    }

    .small #spinner {
      width: var(--small-spinner-size);
      height: var(--small-spinner-size);
    }

    .large #spinner {
      width: var(--large-spinner-size);
      height: var(--large-spinner-size);
    }

    #spinner {
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    #container {
      transition: 5s;
    }

    .small #pie {
      width: var(--small-pie-size);
      height: var(--small-pie-size);
    }

    .large #pie {
      width: var(--large-pie-size);
      height: var(--large-pie-size);
    }

    #pie {
      position: relative;
      border-radius: 50%;
      overflow: hidden;
      border: 0.4em solid #001f30;
    }

    #pie div {
      outline: none;
      position: absolute;
      cursor: pointer;
      width: 100%;
      height: 100%;
      left: 50%;
      bottom: 50%;
      transform-origin: bottom left;
      transition: all 200ms ease-out;
    }

    .small #pie div::after {
      margin-bottom: -2.5em;
      margin-left: -2em;
    }

    .large #pie div::after {
      margin-bottom: -10.3em;
      margin-left: -4.5em;
    }

    #pie div::after {
      width: 0.3em;
      height: 0.3em;
      transform: skewY(45deg);
      content: '';
      display: inline-block;
      -moz-border-radius: 0.3em;
      -webkit-border-radius: 0.3em;
      border-radius: 7.5px;
      z-index: 3;
    }

    .small #pie div:nth-child(even)::after {
      background-color: #ffffff;
      box-shadow: 13px 11px 9px -2px rgb(125, 216, 231 / 52%);
      -webkit-box-shadow: 13px 11px 9px -2px rgb(125 216 231 / 52%);
      -moz-box-shadow: 13px 11px 9px -2px rgba(125, 216, 231 0.52);
      outline-color: rgb(106 207 226 / 30%);
      outline-style: outset;
    }

    .small #pie div:nth-child(odd)::after {
      background-color: rgb(240, 234, 143);
      box-shadow: 13px 11px 9px -2px rgba(255, 255, 255, 0.52);
      -webkit-box-shadow: 13px 11px 9px -2px rgb(255 255 255 / 52%);
      -moz-box-shadow: 13px 11px 9px -2px rgba(255, 255, 255, 0.52);
      outline-color: rgba(59, 80, 54, 0.3);
      outline-style: outset;
    }

    #pie div:nth-child(5n - 4) {
      background-color: #d6d2d2;
    }

    #pie div:nth-child(5n - 3) {
      background-color: #f2e3e3;
    }

    #pie div:nth-child(5n - 2) {
      background-color: #f4bcbc;
    }

    #pie div:nth-child(5n - 1) {
      background-color: #f48484;
    }

    #pie div:nth-child(5n) {
      background-color: #ff5e5e;
    }

    .large #pie .text {
      left: 4%;
      bottom: 13.5%;
    }

    .large #pie .text-medium-group {
      left: -2%;
      bottom: 13%;
    }

    .large #pie .text-small-group {
      right: 20%;
      top: 50%;
      left: 15%;
      bottom: -60%;
    }

    #pie .text {
      position: absolute;
      bottom: 1em;
      padding: 0px;
      color: #333;
      padding: 0.2em;
      text-align: center;
    }

    #spin {
      border: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
      background: rgb(94, 94, 94);
      background: linear-gradient(90deg, rgba(94, 94, 94, 1) 0%, rgba(201, 201, 201, 1) 100%, rgba(97, 97, 97, 1) 100%);
      text-transform: uppercase;
      font-weight: bold;
      font-size: 20px;
      color: #a2a2a2;
      width: 2em;
      height: 2em;
      font-family: sans-serif;
      border-radius: 50%;
      cursor: pointer;
      letter-spacing: 1px;
      box-shadow: -10px -7px 9px -2px rgba(0, 0, 0, 0.25) inset;
      -webkit-box-shadow: -10px -7px 9px -2px rgba(0, 0, 0, 0.25) inset;
      -moz-box-shadow: -10px -7px 9px -2px rgba(0, 0, 0, 0.25) inset;
    }

    .small #spin {
      outline-offset: 2.89em;
      outline: 2em solid rgb(24 24 24 / 7%);
    }

    .large #spin {
      outline-offset: 9.9em;
      outline: 2em solid rgb(24 24 24 / 7%);
    }

    .arrow-left {
      width: 0;
      height: 0;

      margin-left: -1em;
      z-index: 1;
      filter: drop-shadow(-4px 3px 3px rgba(0, 0, 0, 0.5));
      border-top: 0.5em solid transparent;
      border-bottom: 0.5em solid transparent;
      border-right: 1.5em solid #001f30;
    }

    .wedge-small-text {
      font-size: 0.65em;
    }

    .wedge-medium-text {
      font-size: 0.8em;
    }

    .wedge-large-text {
      font-size: 1em;
    }

    @media (max-width: 550px) {
      .large #spinner {
        width: calc(var(--large-spinner-size) - 4em);
        height: calc(var(--large-spinner-size) - 4em);
      }

      .large #pie {
        width: calc(var(--large-pie-size) - 4em);
        height: calc(var(--large-pie-size) - 4em);
      }
    }

    @media (max-width: 400px) {
      .large #spinner {
        width: calc(var(--large-spinner-size) - 10em);
        height: calc(var(--large-spinner-size) - 10em);
      }

      .large #pie {
        width: calc(var(--large-pie-size) - 10em);
        height: calc(var(--large-pie-size) - 10em);
      }
    }
  </style>
`;

class RaffleSpinner extends connect(store)(LitElement) {
  constructor() {
    super();
    this.participants = [];
  }

  render() {
    if(!this.wedgeCount) {
      this.wedgeCount = 8;
    }
    
    return html`
      ${styles}
      <div id="spinner" class="${this.size}">
        <div id="container">${this.renderWedges()}</div>
        <div class="arrow-left"></div>
      </div>
    `;
  }

  renderWedges() {
    return html`
      <div id="pie">
        <button id="spin" @click="${() => this.spin()}"></button>
        ${this.participants.map((participant, index) => {
          const offset = 80;
          let wedgeDegrees = 360 / this.wedgeCount;
          let rotationDegrees = offset + wedgeDegrees * index;
          let skewY = 360 / this.wedgeCount - 90;
          let textRotation = wedgeDegrees / 2 - 90;

          let fontSize = this.calculateFontSizing(participant);

          return html`
            <div style="transform: rotate(${rotationDegrees}deg) skewY(${skewY}deg);">
              <span style="transform: skewY(${-skewY}deg) rotate(${textRotation}deg)" class=${fontSize}>
                ${participant}
              </span>
            </div>
          `;
        })}
      </div>
    `;
  }

  calculateFontSizing(participant) {
    let fontSize = 'text ';

    if (this.wedgeCount >= 4) {
      fontSize += 'text-medium-group ';
    } else {
      fontSize += 'text-small-group ';
    }

    if (participant.length > 20) {
      fontSize += 'wedge-small-text';
    } else if (participant.length > 10) {
      fontSize += 'wedge-medium-text';
    } else {
      fontSize += 'wedge-large-text';
    }

    return fontSize;
  }

  async spin() {
    let container = this.shadowRoot.getElementById('container');

    if (this.playMode) {
      let number = Math.ceil(Math.random() * 1000);
      container.style.transform = 'rotate(' + number + 'deg)';
      number += Math.ceil(Math.random() * 1000);
    } else {
      let wedgeDegrees = 360 / this.wedgeCount;
      let randomSpinCount = Math.ceil(Math.random() * 10);
      let degreesToSpin = randomSpinCount * 360 - this.winningIndex * wedgeDegrees;
      container.style.transform = 'rotate(' + degreesToSpin + 'deg)';
      await raffleService.getRaffle(this.raffleId);
    }
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

  firstUpdated() {
    if (this.playMode) {
      if (this.totalWinningsAvailable == 0) {
        this.participants = this.participants.concat(Array(this.wedgeCount).fill(''));
      } else {
        this.participants = this.participants.concat(Array(this.wedgeCount).fill(this.totalWinningsAvailable));
      }
    }
  }
}

window.customElements.define('e-raffle-spinner', RaffleSpinner);
