import { html, LitElement, supportsAdoptingStyleSheets } from 'lit';
import { shared } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import Gauge from 'svg-gauge';
import {
  selectMissionProgress,
  selectQuestDaysRemaining
} from '../selectors/quest.selectors.js';

let styles = (daysRemaining) => html`
  <style>
    ${shared()} :host {
      position: relative; 
    }

    .gauge-container {
      display: block;
    }
    .gauge-container > .gauge > .dial {
      stroke: #eee;
      stroke-width: 4;
      fill: rgba(0, 0, 0, 0);
    }

    .gauge-container > .gauge > .value {
      stroke: rgb(47, 227, 255);
      stroke-width: 4;
      fill: rgba(0, 0, 0, 0);
    }

    .gauge-container > .gauge > .value-text {
      /* fill: rgb(47, 227, 255); */
      font-weight: bold;
      font-size: 1em;
    }

    div.days {
      position: absolute;
      top: 3em;
      text-align: center;
      width: 100%;
      color: ${daysRemaining === 0 ? 'var(--app-primary-color)' : 'inherit'}
    }

    div.days .value {
      font-size: 3em;
    }

    div.days .label {
      margin-top: -1em;
      color: ${daysRemaining === 0 ? 'var(--app-primary-color)' : 'var(--app-tertiary-color)'}
    }
  </style>
`;

class Dial extends connect(store)(LitElement) {
  updated(updatedProperties) {
    if (updatedProperties.has('progress')) {
      if (!this.gauge) {
        this.gauge = Gauge(this.shadowRoot.getElementById('cpuSpeed'), {
          max: 100,
          // custom label renderer
          label: (_value) => '',
          value: 0,
          // Custom dial colors (Optional)
          color: function(value) {
            if (value < 20) {
              return '#ef4655'; // green
            } else if (value < 40) {
              return '#f7aa38'; // yellow
            } else if (value < 60) {
              return '#fffa50'; // orange
            } else {
              return '#5ee432'; // red
            }
          }
        });
      }

      this.gauge.setValueAnimated(this.progress, 1);
    }
  }
  render() {
    return html`
      ${styles(this.daysRemaining)}

      <div id="cpuSpeed" class="gauge-container">
        <div class="days">
          <div class="value">${this.daysRemaining}</div>
          <div class="label">days left</div>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      progress: Number,
      daysRemaining: Number
    };
  }

  stateChanged(state) {
    this.progress = selectMissionProgress(state);
    this.daysRemaining = selectQuestDaysRemaining(state);
  }
}

window.customElements.define('e-dial', Dial);
