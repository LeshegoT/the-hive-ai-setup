import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';
import reviewLocalSaveService from '../services/review-local-save.service.js';

const styles = html`
  <style>
    ${reviewShared()} .switch {
      position: relative;
      display: inline-block;
      width: 2.7em;
      height: 1.5em;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: white;
      -webkit-transition: 0.4s;
      transition: 0.4s;
      border-radius: 34px;
      border: black 2px solid;
    }

    .slider:before {
      position: absolute;
      content: '';
      width: 45%;
      aspect-ratio: 1/1;
      bottom: 1px;
      left: 2px;
      background-color: black;
      -webkit-transition: 0.4s;
      transition: 0.4s;
      border-radius: 100%;
    }

    input:checked + .slider {
      border-color: var(--app-info-font-color);
    }

    input:focus + .slider {
      box-shadow: 0 0 1px #2196f3;
    }

    input:checked + .slider:before {
      -webkit-transform: translateX(103%);
      -ms-transform: translateX(103%);
      transform: translateX(103%);
      background-color: var(--app-info-font-color);
    }
  </style>
`;
class ReviewAnonymousToggle extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    return html`
      ${styles}
      <label class="switch">
        <input id="anonymousToggle" type="checkbox" />
        <span class="slider round"></span>
      </label>
    `;
  }

  configureEventListeners() {
    const toggle = this.shadowRoot.getElementById('anonymousToggle');
    if (toggle) {
      toggle.checked = this.anonymous;
      toggle.addEventListener('click', async () => {
        this.anonymous = toggle.checked;
        await reviewLocalSaveService.updateReviewAnonymousIndication(this.anonymous, this.assignmentId);
        const parentShadowRoot = this.getRootNode();
        const anonymousInfo = parentShadowRoot.querySelector('#anonymousInfo');
        if (anonymousInfo) {
          anonymousInfo.textContent = this.anonymous
            ? 'While the executives may be able to associate your feedback with your name, you will remain anonymous to the person you are reviewing.'
            : 'The person you are reviewing will be able to associate your feedback with your name.';
        }
      });
    }
  }

  static get properties() {
    return {
      anonymous: Boolean,
      assignmentId: Number,
    };
  }

  firstUpdated() {
    this.configureEventListeners();
  }
}

window.customElements.define('e-review-anonymous-toggle', ReviewAnonymousToggle);
