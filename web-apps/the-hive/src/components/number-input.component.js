import {LitElement, html} from 'lit';
import { inputFields, shared } from '../styles';
import './list-options.component';

const styles = html`
  <style>
    ${shared()} ${inputFields()} :host {
      font-family: 'Inter';
    }
  </style>
`;

export class NumberInput extends LitElement {
  constructor() {
    super();
    this.min = 0;
    this.decimals = undefined;
    this.htmlInputType = 'number'
  }

  static get properties() {
    return {
      name: { type: String },
      disabled: { type: Boolean },
      placeholder: { type: String },
      label: { type: String },
      error: { type: String },
      required: { type: Boolean },
      value: { type: Number },
      max: { type: Number },
      min: { type: Number },
      step: { type: Number },
      decimals: { type: Number },
    };
  }

  handleInputChange(event) {
    if (event.target.value) {
      let inputValue = parseFloat(event.target.value);
      if (this.decimals !== undefined) {
        event.target.value = parseFloat(inputValue.toFixed(this.decimals));
      } else {
        event.target.value= inputValue;
      }
    } else {
      // User did not enter any value and there's no default value set, do nothing
    }
    this.handleErrors();
    this.dispatchEvent(new CustomEvent('change', { detail: event.target.value}));
  }

  firstUpdated(){
    if(this.value){
      this.shadowRoot.querySelector('.number').value = this.value;
    }
    else{
      //default value does not need to be set when component is first loaded
    }
  }

  handleErrors() {
    const value = this.shadowRoot.querySelector('.number').value;
    const isInputValid = value && value >= this.min && value <= this.max && value % this.step == 0;
    if (!isInputValid && this.required) {
      this.error = `Please input a value between ${this.min}-${this.max} in ${this.step} increments (${
        this.step
      } or ${this.step * 2} or ${this.step * 3} etc.)`
    } else {
      this.error = '';
    }
    this.requestUpdate();
  }

  handleKeyDown(event) {
    const allowedKeysRegex = /^[0-9.]$/;
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];

    if (allowedKeysRegex.test(event.key) || allowedKeys.includes(event.key)) {
      this.error = '';
      this.requestUpdate();
    } else {
      event.preventDefault();
      if (event.key === ',') {
        this.error = `Please use dots for decimals e.g 0.25`;
      } else {
        this.error = '';
      }
      this.requestUpdate();
    }
  }
  renderInputField() {
    return html`
      <div class="input-container ${this.error ? 'error-state' : ''}">
        <input
          class="number"
          autocomplete="off"
          min="0"
          max="${this.max}"
          id=${this.name}
          step=${this.step}
          type="text"
          .name="${this.name}"
          placeholder="${this.placeholder ? this.placeholder : ''}"
          ?disabled="${this.disabled}"
          ?required="${this.required}"
          @change="${this.handleInputChange}"
          @keydown="${this.handleKeyDown}"
        />
      </div>
    `;
  }

  renderErrorMessage() {
    return html`
      <p class="error-message">${this.error}</p>
    `;
  }

  render() {
    return html`
      ${styles}
      <label for="${this.name}">${this.label}</label>
      ${this.renderInputField()} ${this.renderErrorMessage()}
    `;
  }
}

customElements.define('e-number-input', NumberInput);
