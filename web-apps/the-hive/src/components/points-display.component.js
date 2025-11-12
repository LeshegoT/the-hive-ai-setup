import {LitElement, html} from 'lit';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { selectMultiplier } from '../selectors/multiplier.selector';
import multiplierService from '../services/multiplier.service';
import pointsService from '../services/points.service';
import {
  selectTodaysPoints,
  selectTotalPoints,
  selectHighScore,
  selectAllPoints,
} from '../selectors/points.selectors';

const styles = html`
  <style>
    .point-heading {
      margin: 0.5rem;
      color: var(--app-dashboard-color);
      font-size: 18px;
    }
    .points-display {
      width: 100%;
      height: 100%;
      overflow: hidden;
      animation: 0.5s ease-in 0s 1 scaleHeightToFull;
    }
    .display-card-list {
      list-style: none;
      display: flex;
      flex-direction: row;
      margin-left: 0;
      justify-content: center;
      padding-left: 0;
      height: 70%;
      margin-top: 10px;
    }
    .display-card {
      margin: 0 2% 0 2%;
      width: 28%;
      height: 90%;
    }
    .display-main {
      margin-left: 0.3rem;
      width: 100%;
      height: 100%;
      border-radius: 5px;
      box-shadow: 2px 3px 8px var(--app-dashboard-shadow);
      transition: all 0.2s ease-in-out;
    }
    .display-card:first-child {
      margin-left: 0;
      animation: 2s ease 0s 1 slideCardIn;
    }
    .display-card:nth-child(2) {
      animation: 1.5s ease 0s 1 slideCardIn;
    }
    .display-card:last-child {
      animation: 1s ease 0s 1 slideCardIn;
    }
    .display-main:hover {
      box-shadow: 2px 3px 24px var(--app-dashboard-shadow);
      transform: scale(1.1);
    }
    .display-main:hover .card-decorator {
      background-color: var(--app-primary-color);
    }
    .display-main:hover .card-circle {
      border: 3px solid var(--app-primary-color);
    }
    .card-decorator {
      background-color: var(--app-dashboard-color);
      width: 100%;
      height: 25%;
      border-radius: 5px;
      padding-top: 5px;
      transition: background-color 0.5s ease;
    }
    .card-circle {
      border-radius: 50%;
      height: 120%;
      width: 40%;
      background-color: var(--app-dashboard-panel);
      margin: 0 auto 0 auto;
      border: 3px solid var(--app-dashboard-color);
      transition: border 0.5s ease;
    }
    .card-title {
      margin: auto;
      text-align: center;
      color: var(--app-primary-color);
      font-size: 14px;
    }
    .card-field {
      margin: 0 auto;
      text-align: center;
      color: var(--app-dashboard-color);
      font-size: 18px;
      margin-bottom: 0;
    }
    .card-icon {
      display: block;
      width: 60%;
      margin: 4px auto 0 auto;
    }

    @keyframes scaleHeightToFull {
      0% {
        transform: scaleY(0);
        opacity: 0;
      }
      100% {
        transform: scaleY(1);
        opacity: 1;
      }
    }

    @keyframes slideCardIn {
      0% {
        transform: translateX(-700%);
        opacity: 0;
      }
      25% {
        transform: translateX(-700%);
        opacity: 0;
      }
      50% {
        opacity: 0;
      }
      80% {
        transform: translateX(10%);
        opacity: 1;
      }
      100% {
        transform: translateX(0%);
      }
    }

    @media (min-width: 600px) {
      .point-heading {
        margin: 1rem;
        font-size: 20px;
      }
      .display-main {
        width: 100%;
        height: 100%;
      }
      .display-card-list {
        margin: auto;
      }
      .card-circle {
        height: 40px;
      }
      .points-display {
        height: 100%;
      }
      .display-main:hover {
        box-shadow: 2px 3px 24px var(--app-dashboard-shadow);
        transform: scale(1.2);
      }
      .card-field {
        margin: 0 auto 0;
        font-size: 30px;
      }
      .card-title {
        font-size: 18px;
      }
      .announcement-container {
        width: 30%;
        right: 0.5%;
        bottom: 1%;
      }
    }
  </style>
`;

class PointsDisplay extends connect(store)(LitElement) {
  renderCards() {
    return html`
      ${this.renderScoreCard()} ${this.renderMultiplierCard()} ${this.renderTotalCard()}
    `;
  }

  renderScoreCard() {
    return html`
      <li class="display-card">
        <div class="display-main">
          <img class="card-icon" src="images/icons/new-points-dark.svg" />
          <h2 class="card-field">${this.getPointsToDisplay()}</h2>
          <h3 class="card-title">Points</h3>
        </div>
      </li>
    `;
  }

  renderMultiplierCard() {
    return html`
      <li class="display-card">
        <div class="display-main">
          <img class="card-icon" src="images/icons/multiplier-dark.svg" />
          <h2 class="card-field">x${this.multiplier}</h2>
          <h3 class="card-title">Multiplier</h3>
        </div>
      </li>
    `;
  }

  renderTotalCard() {
    return html`
      <li class="display-card">
        <div class="display-main">
          <img class="card-icon" src="images/icons/total-points-dark.svg" />
          <h2 class="card-field">${this.totalPoints}</h2>
          <h3 class="card-title">Total Points</h3>
        </div>
      </li>
    `;
  }

  renderHighScoreCard() {
    return html`
      <li class="display-card">
        <div class="display-main">
          <img class="card-icon" src="images/icons/high-score-dark.svg" />
          <h2 class="card-field">${this.highScore}</h2>
          <h3 class="card-title">High Score</h3>
        </div>
      </li>
    `;
  }

  render() {
    return html`
      ${styles}
      <section class="points-display">
        <h2 class="point-heading">Nice job! You earned:</h2>
        <ul class="display-card-list">
          ${this.renderCards()}
        </ul>
      </section>
    `;
  }

  getPointsToDisplay() {
    if(this.allPoints){
      return parseInt(this.allPoints[this.allPoints.length - 1].points);
    }
    return 0;
  }

  firstUpdated() {
    pointsService.getPointTypes();
    multiplierService.getMultiplier();
    pointsService.todaysPointsInformation();
  }

  stateChanged(state) {
    this.allPoints = selectAllPoints(state);
    this.multiplier = selectMultiplier(state);
    this.todaysPoints = selectTodaysPoints(state);
    this.totalPoints = selectTotalPoints(state);
    this.highScore = selectHighScore(state);
  }

  static get properties() {
    return {
      allPoints:Object,
      todaysPoints: Number,
      totalPoints: Number,
      multiplier: Number,
      highScore: Number,
    };
  }
}

window.customElements.define('e-points-display', PointsDisplay);