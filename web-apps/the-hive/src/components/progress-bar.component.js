import { html, LitElement } from 'lit';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { selectProgressBarState } from '../selectors/progress-bar.selector';
import peerFeedbackService from '../services/peer-feedback.service'


const styles = (moveBar) => html`
  <style>
    :host {
      width: 100%;
    }
    .progressBar {
      width: 100%;
      background-color: var(--app-dashboard-background);
      border-radius: 1em;
    }

    #progressBarInner {
      width: ${moveBar}%;
      height: 1.5em;
      background-color: var(--app-done-color);
      max-width: 100%;
      border-radius: 1em;
    }
  </style>
`;

class ProgressBar extends connect(store)(LitElement) {
 
  constructor() {
    super();
    this.increment = 0;
    this.percentageCompleted = 0;
  }
  
  render() {
    return html`
    ${styles(this.percentageCompleted)}
      <div class="progressBar">
        <div id="progressBarInner"></div>
      </div>
    `;
  }

  moveProgressBar() {
    if (!!this.progressPosition) {
      const incrementPercentage = 100 / this.counter;
      this.percentageCompleted = incrementPercentage * this.progressPosition;
    }
  }

  firstUpdated() {
    this.counterHolder = this.counter;
    peerFeedbackService.updateProgressBar(this.increment)
  }
  
  stateChanged(state) {
    this.progressPosition = selectProgressBarState(state);
    this.moveProgressBar();
  }

  static get properties() {
    return {
      counter: Number,
      counterHolder: Number,
      progressPosition: Number,
      increment: Number,
      percentageCompleted: Number,
    }
  }

}

window.customElements.define('e-progress-bar', ProgressBar);