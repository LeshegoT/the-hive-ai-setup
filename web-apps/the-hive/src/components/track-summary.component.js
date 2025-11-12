import { html, LitElement } from 'lit';
import { shared } from '../styles';

import './course-summary-group.component';

class TrackSummary extends LitElement {
  render() {
    return html`
      <style>
        ${shared()}

        @media (min-width: 460px) {
          e-course-summary-group {
            padding-inline-start: 3em;
          }
        }
      </style>

      <e-course-summary-group .courses="${this.track.courses}"></e-course-summary-group>
    `;
  }

  static get properties() {
    return {
      track: {
        type: Object
      }
    };
  }
}

window.customElements.define('e-track-summary', TrackSummary);
