import { html, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import multiplierService from '../services/multiplier.service';
import pointsService from '../services/points.service';
import { selectMultiplier } from '../selectors/multiplier.selector';
import {
  selectTodaysPoints,
  selectTotalPoints,
  selectHighScore,
} from '../selectors/points.selectors';

let styles = html`
  <style>
    .score {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      grid-gap: 5px;
      margin-bottom: 10px;
    }
    #todays-score {
      grid-column-start: 1;
      grid-column-end: 2;
      grid-row-start: 1;
      grid-row-end: 2;
    }
    #total-score {
      grid-column-start: 2;
      grid-column-end: 3;
      grid-row-start: 1;
      grid-row-end: 2;
    }
    #multiplier {
      grid-column-start: 1;
      grid-column-end: 2;
      grid-row-start: 2;
      grid-row-end: 3;
    }
    #high-score {
      grid-column-start: 2;
      grid-column-end: 3;
      grid-row-start: 2;
      grid-row-end: 3;
    }
    .score-segment {
      width: 25%;
      height: 200px;
      margin: 0 1rem 0 1rem;
      padding-top: 20px;
    }
    .score-segment:first-child {
      margin-left: 0.5rem;
    }
    .score-value {
      text-align: center;
      color: var(--app-primary-color);
      margin: 0;
      font-size: 20px;
    }
    .score-label {
      text-align: center;
      color: var(--app-dashboard-color);
      margin: 0;
      font-size: 13px;
    }
    .score-image-container {
      display: flex;
      flex-direction: row;
      justify-content: center;
      margin: 0 0 5px 10px;
    }
    .score-image {
      width: 40px;
    }

    @media (min-width: 70rem) {
      .score {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: 1fr;
        height: 200px;
        width: 100%;
      }
      #todays-score {
        grid-column-start: 1;
        grid-column-end: 2;
        grid-row-start: 1;
        grid-row-end: 2;
      }
      #total-score {
        grid-column-start: 2;
        grid-column-end: 3;
        grid-row-start: 1;
        grid-row-end: 2;
      }
      #multiplier {
        grid-column-start: 3;
        grid-column-end: 4;
        grid-row-start: 1;
        grid-row-end: 2;
      }
      #high-score {
        grid-column-start: 4;
        grid-column-end: 5;
        grid-row-start: 1;
        grid-row-end: 2;
      }
      .score-segment {
        margin: 0 2rem 0 2rem;
      }
      .score-label {
        font-size: 20px;
      }
      .score-value {
        font-size: 30px;
      }
      .score-image {
        width: 80px;
      }
    }
  </style>
`;

class ScoreOverview extends connect(store)(LitElement) {
  render() {
    return html`
      ${styles}
      <div class="score">
        <div id="todays-score">
          <div class="score-image-container">
            <img class="score-image" src="images/icons/new-points-dark.svg" />
          </div>
          <h3 class="score-value">${this.todaysPoints}</h3>
          <h4 class="score-label">Today's Score</h4>
        </div>
        <div id="total-score">
          <div class="score-image-container">
            <img class="score-image" src="images/icons/total-points-dark.svg" />
          </div>
          <h3 class="score-value">${this.totalPoints}</h3>
          <h4 class="score-label">Total Score</h4>
        </div>
        <div id="multiplier">
          <div class="score-image-container">
            <img class="score-image" src="images/icons/multiplier-dark.svg" />
          </div>
          <h3 class="score-value">x${this.multiplier}</h3>
          <h4 class="score-label">Multiplier</h4>
        </div>
        <div id="high-score">
          <div class="score-image-container">
            <img class="score-image" src="images/icons/high-score-dark.svg" />
          </div>
          <h3 class="score-value">${this.highScore}</h3>
          <h4 class="score-label">High Score</h4>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      todaysPoints: Number,
      totalPoints: Number,
      multiplier: Number,
      mostRecentPoints: Number,
      highScore: Number
    };
  }

  firstUpdated() {
    multiplierService.getMultiplier();
    pointsService.todaysPointsInformation();
  }

  stateChanged(state) {
    this.multiplier = selectMultiplier(state);
    this.todaysPoints = selectTodaysPoints(state);
    this.totalPoints = selectTotalPoints(state);
    this.highScore = selectHighScore(state);
  }
}

window.customElements.define('e-score-overview', ScoreOverview);