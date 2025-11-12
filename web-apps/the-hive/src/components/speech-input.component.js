import { html, LitElement } from 'lit';
import { selectSpeechText } from '../selectors/speech.selectors';
import { speechReceived } from '../actions/speech.action';
import { store } from '../store.js';

let styles = html`
  <style>
    #icon-mic {
      width: 2.5em;
      height: 2.5em;
      cursor: pointer;
      filter: invert(50%);
    }

    #notSupported {
      color: var(--app-dashboard-shadow);
      size: small;
      text-align: right;
    }

    .PULSE {
      /* Chrome, Safari, Opera */
      -webkit-animation: PULSE 1.25s infinite;

      /* Standard Syntax */
      animation: PULSE 1.25s infinite;
    }

    .tooltip {
      position: relative;
      display: inline-block;
    }

    .tooltip .tooltiptext {
      visibility: hidden;
      width: 9em;
      padding: 0.5em;
      background-color: black;
      color: #fff;
      text-align: center;
      border-radius: 6px;

      position: absolute;
      z-index: 1;
      top: -5px;
      right: 105%;
    }

    .tooltip:hover .tooltiptext {
      visibility: visible;
    }

    /* Chrome, Safari, Opera */
    @-webkit-keyframes PULSE {
      0%,
      100% {
        -webkit-filter: invert(11%) sepia(97%) saturate(5505%) hue-rotate(9deg) brightness(88%) contrast(113%);
      }
      50% {
        -webkit-filter: invert(50%);
      }
    }

    /* Standard Syntax */
    @keyframes PULSE {
      0%,
      100% {
        -webkit-filter: invert(11%) sepia(97%) saturate(5505%) hue-rotate(9deg) brightness(88%) contrast(113%);
      }
      50% {
        -webkit-filter: invert(50%);
      }
    }
  </style>
`;

class SpeechInput extends LitElement {
  render() {
      return html`
        ${styles}
        <div class="tooltip">
          <img src="static-content/images/logos/how-to.svg" id="icon-mic" @click=${()=>this.startDictation(this.type)} />
          ${'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
            ? html``
            : html`<span class="tooltiptext">Not supported in current browser</span>`}
        </div>
      `;
  }

  startDictation(focusOnType) {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {

        let micElement = this.shadowRoot.getElementById('icon-mic');

        if (window.hasOwnProperty('webkitSpeechRecognition')) {
          var recognition = new webkitSpeechRecognition();

          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          recognition.start();
          micElement.classList.toggle('PULSE');

          recognition.onresult = function (e) {
            recognition.stop();
            micElement.classList.toggle('PULSE');
            store.dispatch(speechReceived({ text: e.results[0][0].transcript, type: focusOnType }));
          };
          recognition.onerror = function (e) {
            recognition.stop();
          };
        }
    }
  }

  static get properties() {
    return {
      text: String,
      type: String,
    };
  }


}

window.customElements.define('e-speech-input', SpeechInput);
