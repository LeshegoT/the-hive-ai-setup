import {LitElement, html} from 'lit';
import { inputFields, shared } from '../styles';

const styles = html`
  <style>
    ${shared()} 
    ${inputFields()}
  </style>
`;

class FreeTextInput extends LitElement {
  constructor() {
    super();
    this.disabled = false;
    this.inputValue = undefined;
    this.disableOnBlur = false;
    this.initialValue = '';
  }

  static get properties() {
    return {
      placeHolder: { type: String },
      label: { type: String },
      disabled: { type: Boolean },
      disableOnBlur: { type: Boolean },
      required: { type: Boolean },
      error: { type: String },
      initialValue: { type: String },
      maxLength: {type: Number},
    };
  }

  firstUpdated() {
    if (this.initialValue) {
      this.inputValue = this.initialValue;
      this.handleErrors();
      this.shadowRoot.querySelector('input').value = this.initialValue;
      this.dispatchEvent(new CustomEvent('change', { detail: this.inputValue }));
    }
  }

  handleInputChange(event) {
    this.inputValue = event.target.value;
    this.handleErrors()
    this.dispatchEvent(new CustomEvent('input', { detail: this.inputValue }));
  }

  handleFieldChange(e) {
    if(this.inputValue){
      this.dispatchEvent(new CustomEvent('change', { detail: this.inputValue }));
      if(this.disableOnBlur){
        this.disabled = true;
      } else {
        // input value is undefined so don't disable
      }
    } else {
      // input value is undefined trigger event
    }
  }

  handleErrors() {
    if (!this.inputValue || this.inputValue.trim().length === 0 && this.required) {
      this.error = 'Please enter this field';
    } else if (this.inputValue.length >= this.maxLength) {
      this.error = `Maximum ${this.maxLength} characters allowed.`
    } else {
      this.error = '';
    }
  }

  resetInput() {
    this.initialValue = '';
    this.inputValue = undefined;
    this.shadowRoot.querySelector('input').value = this.initialValue;
    this.dispatchEvent(new CustomEvent('reset'));
  }

  render() {
    return html`
    ${styles}
    <label>${this.label}</label>
    <div class="input-container ${this.error ? 'error-state' : ''}">
      <input 
        type="text" 
        placeholder="${this.placeHolder}"
        ?required="${this.required}"
        .disabled="${this.disabled}"
        @input="${this.handleInputChange}"
        @blur="${this.handleFieldChange}"
        maxlength="${this.maxLength}"
      />
      <span class="material-icons-outlined" @click="${this.resetInput}" title="Cancel">highlight_off</span>
    </div>
    <p class="error-message">${this.error}</p>
    `;
  }
}

customElements.define('e-free-text-input', FreeTextInput);
