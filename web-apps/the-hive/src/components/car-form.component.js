import {LitElement, html} from 'lit';
import vehiclesService from '../services/vehicles.service.js';
import { shared } from '../styles';

const styles = html`
  <style>
    ${shared()} form {
      display: flex;
      flex-direction: column;
      gap: var(--large-gap);
      padding: var(--standard-padding-space);
      min-width: 50%;
      
      & > div {
        justify-content:center;
        display: flex;
        flex-direction: column;

        & > label {
          margin-bottom: var(--small-margin);
        }

        & > input {
          padding: var(--standard-padding);
          font: var(--medium-font-size);
          border: none;
          box-shadow: 0 var(--small-border-size) 0 0 var(--app-review-primary-text-color);
        }
      }
    }

    p {
      margin: 0;
      font-size: var(--medium-font-size);
      color: var(--app-primary-color);
    }

    .add-car {
      margin-left: auto;
    }

    button,
    button:hover {      
      background: var(--app-primary-color);
      padding: var(--standard-padding) var(--large-padding);
      font-size: var(--medium-font-size);
      color: var(--bbd-red-contrast);
      border: none;
      border-radius: var(--app-small-border-radius);
      cursor: pointer;
    }
  </style>
`;

class CarForm extends LitElement {
  render() {
    return html`
      ${styles}

      <form @input="${this.resetCompletionMessage}">
        <div>
          <label>License Plate No:</label>
          <input type="text" .value="${this.licensePlateNumber ?? ''}" @change="${(e) => (this.licensePlateNumber = e.target.value)}" />
          ${this.renderErrorMessage(this.licensePlateNumberError)}
        </div>
        <div>
          <label>Car colour:</label>
          <input type="text" .value="${this.colour ?? ''}" @change="${(e) => (this.colour = e.target.value)}" />
          ${this.renderErrorMessage(this.colourError)}
        </div>
        <div>
          <label>Car Make:</label>
          <input type="text" .value="${this.make ?? ''}" @change="${(e) => (this.make = e.target.value)}" />
          ${this.renderErrorMessage(this.makeError)}
        </div>
        <div>
          <label>Car Model:</label>
          <input type="text" .value="${this.model ?? ''}" @change="${(e) => (this.model = e.target.value)}" />
          ${this.renderErrorMessage(this.modelError)}
        </div>
        <button class="add-car" type="button" @click="${this.saveVehicle}">Add car</button>
        ${this.renderErrorMessage(this.completeFormMessage)}
      </form>
    `;
  }

  hasVehicleChanged() {
    return (
      this.licensePlateNumber !== undefined &&
      this.colour !== undefined &&
      this.make !== undefined &&
      this.model !== undefined
    );
  }

  validateFields() {
    this.licensePlateNumberError = !this.licensePlateNumber && 'License plate number is required.';
    this.colourError = !this.colour && 'Car colour is required.';
    this.makeError = !this.make && 'Car make is required.';
    this.modelError = !this.model && 'Car model is required.';
  }

  async saveVehicle() {
    if (this.hasVehicleChanged()) {
      const newCar = {
        licensePlateNumber: this.licensePlateNumber,
        colour: this.colour,
        make: this.make,
        model: this.model,
      };

      this.completeFormMessage = await vehiclesService.postUserVehicle(newCar);
      this.resetValues();
      this.dispatchEvent(new CustomEvent('update-vehicles'));
    } else {
      this.validateFields();
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this.licensePlateNumber = undefined;
    this.colour = undefined;
    this.make = undefined;
    this.model = undefined;
    this.licensePlateNumberError = undefined;
    this.colourError = undefined;
    this.makeError = undefined;
    this.modelError = undefined;
    this.completeFormMessage = undefined;
  }

  resetValues(){
    this.licensePlateNumber = undefined;
    this.colour = undefined;
    this.make = undefined;
    this.model = undefined;
    this.licensePlateNumberError = undefined;
    this.colourError = undefined;
    this.makeError = undefined;
    this.modelError = undefined;
  }

  resetCompletionMessage(){
    this.completeFormMessage = undefined;
  }

  static get properties() {
    return {
      licensePlateNumber: String,
      colour: String,
      make: String,
      model: String,
      licensePlateNumberError: String,
      colourError: String,
      makeError: String,
      modelError: String,
      completeFormMessage: String,
    };
  }

  renderErrorMessage(message) {
    return message
      ? html`
          <p>${message}</p>
        `
      : html``;
  }
}

window.customElements.define('e-car-form', CarForm);
