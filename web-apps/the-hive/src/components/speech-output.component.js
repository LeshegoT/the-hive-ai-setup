import { html, LitElement } from 'lit';
import { store } from '../store.js';

let styles = html`
  <style>
    .sound-panel {
      background-color: var(--app-section-even-color);
      border-radius: 25%;
      width: fit-content;
      padding: 0 0.2em;
      display: inline-block;
    }

    #icon-mic {
      width: 1.5em;
      filter: invert(50%);
      cursor: pointer;
      display: inline-block;
      vertical-align: middle;
    }

    #hide {
      display: none;
      width: 0.7em;
      height: 0.7em;
      background-color: var(--app-dashboard-shadow);
      vertical-align: middle;
      margin-right: 0.3em;
      cursor:pointer;
    }

    .PULSE {
      /* Chrome, Safari, Opera */
      -webkit-animation: PULSE 1.25s infinite;

      /* Standard Syntax */
      animation: PULSE 1.25s infinite;
    }

    /* Chrome, Safari, Opera */
    @-webkit-keyframes PULSE {
      0%,
      100% {
        -webkit-filter: invert(49%) sepia(87%) saturate(1573%) hue-rotate(149deg) brightness(98%) contrast(98%);
      }
      50% {
        -webkit-filter: invert(50%);
      }
    }

    /* Standard Syntax */
    @keyframes PULSE {
      0%,
      100% {
        -webkit-filter: invert(49%) sepia(87%) saturate(1573%) hue-rotate(149deg) brightness(98%) contrast(98%);
      }
      50% {
        -webkit-filter: invert(50%);
      }
    }
  </style>
`;

class SpeechOutput extends LitElement {
  render() {
      return html`
        ${styles}
        <div class="sound-panel">
            <img src="static-content/images/logos/how-to.svg" id="icon-mic" @click=${() => this.startSpeech()} />
            <span id="hide" @click=${(event) => this.stopSpeech(event)}></span>
        </div>
      `;
  }

  async startSpeech() {
    let micElement = this.shadowRoot.getElementById('icon-mic');
    let stopElem = this.shadowRoot.getElementById('hide') ;
    if ('speechSynthesis' in window) {
      this.speechSynth.cancel();
      var readText = new SpeechSynthesisUtterance();
      readText.text = this.text;
      this.speechSynth.speak(readText);
      micElement.classList.toggle('PULSE');
      stopElem.style.display = 'inline-block' ;

      readText.onend = () => {
        micElement.classList.toggle('PULSE');
        stopElem.style.display = 'none';
      };

    } else {
      announcementService.createAnnouncement('none', {
        title: 'Error!',
        body: `Sorry, your browser doesn't support the speech synthesis API`,
      });
    }
  }

  stopSpeech(event) {
    this.speechSynth.cancel();
    event.target.style.display = 'none';
    
  }



  static get properties() {
    return {
      text: String,
      speechSynth: Object,
    };
  }

  firstUpdated() {
      this.speechSynth = window.speechSynthesis;
  }
}

window.customElements.define('e-speech-output', SpeechOutput);
