import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';

const styles = html`
  <style>
    ${reviewShared()} 

    :host{
      margin-bottom: 0.2em;
    }
    
    #progressTotal {
      background-color: #e7eaee;
      border-radius: 2px;
      height: 4px;
      width: 100%;
    }

    #precentageComplete {
      border-radius: 2px;
      height: 4px;
    }

    .info {
      background-color: var(--app-info-font-color);
    }

    .warning {
      background-color: var(--app-warning-font-color);
    }

    .success {
      background-color: var(--app-success-font-color);
    }
  </style>
`;
class GeneralProgressBar extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    return html`
    ${styles}
      <div id="progressTotal">
        <div class="${this.type}" style="width:${this.percentage}%" id="precentageComplete"></div>
      </div>
    `;
  }


  static get properties() {
    return {
      percentage: Number,
      type: String,
    };
  }


}

window.customElements.define('e-general-progress-bar', GeneralProgressBar);
