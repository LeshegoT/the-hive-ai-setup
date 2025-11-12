import {LitElement, html} from 'lit';
import { variables, eventsShared } from '../styles';
import vehiclesService from '../services/vehicles.service';

const styles = html`
  <style>
    ${variables()}
    ${eventsShared()}
    form {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      flex-direction: column;
      border: var(--medium-border-size) solid var(--light-grey);
      row-gap: var(--app-button-padding);
      background: var(--app-section-even-color);
      padding: var(--small-padding);
      width: fit-content;

      & > section {
        display: flex;
        flex-direction: column;
      }
    }

    label {
      font-size: smaller;
      font-weight: bolder;
    }

    p {
      margin: 0;
      font-size: smaller;
    }

    .error {
      color: var(--app-primary-color);
    }

    .success {
      color: var(--app-done-color);
    }

    input {
      padding: var(--small-padding);
      border: none;
      font-size: var(--medium-font-size);
    }

    input:disabled {
      background-color: transparent;
      pointer-events: none;
    }

  </style>
`;


class Vehicle extends LitElement {
  static properties = {
    vehicle: { type: Object },
    disabled: { type: Boolean },
    licensePlateNumberError: { type: String },
    colourError: { type: String },
    makeError: { type: String },
    modelError: { type: String },
    formSubmissionMessage: { type: String },
    licensePlateNumber: { type: String },
    colour: { type: String },
    make: { type: String },
    model: { type: String },
  };

  constructor() {
    super();
    this.disabled = true;
    this.licensePlateNumber = undefined;
    this.colour = undefined;
    this.make = undefined;
    this.model = undefined;
    this.resetErrorMessages();
  }

  connectedCallback(){
    super.connectedCallback();
    this.setInputValues()
  }

  render() {
    return html`
      ${styles}
      <form>
        <section>
          <label>License Plate No:</label>
          <input
            ?disabled="${this.disabled}"
            type="text"
            name="licensePlate"
            .value="${this.licensePlateNumber}"
            @input="${this.handleVehicleLicensePlateNumberInput}"
          />
          ${this.renderErrorMessage(this.licensePlateNumberError)}
        </section>
        <section>
          <label>Car Colour:</label>
          <input
            ?disabled="${this.disabled}"
            type="text"
            name="color"
            .value="${this.colour}"
            @input="${this.handleVehicleColourInput}"
          />
          ${this.renderErrorMessage(this.colourError)}
        </section>
        <section>
          <label>Car Model:</label>
          <input
            ?disabled="${this.disabled}"
            type="text"
            name="model"
            .value="${this.model}"
            @input="${this.handleVehicleModelInput}"
          />
          ${this.renderErrorMessage(this.modelError)}
        </section>
        <section>
          <label>Car Make:</label>
          <input
            ?disabled="${this.disabled}"
            type="text"
            name="make"
            .value="${this.make}"
            @input="${this.handleVehicleMakeInput}"
          />
          ${this.renderErrorMessage(this.makeError)}
        </section>
        ${this.renderButtons()}
        ${this.renderSubmissionMessage(this.formSubmissionMessage)}
      </form>
    `;
  }

  handleVehicleMakeInput(event) {
    this.make = event.target.value;
    this.makeError = this.make.length === 0 ? 'Car make is required.' : undefined;
  }

  handleVehicleModelInput(event) {
    this.model = event.target.value;
    this.modelError = this.model.length === 0 ? 'Car model is required.' : undefined;
  }

  handleVehicleColourInput(event) {
    this.colour = event.target.value;
    this.colourError = this.colour.length === 0 ? 'Car colour is required.' : undefined;
  }

  handleVehicleLicensePlateNumberInput(event) {
    this.licensePlateNumber = event.target.value;
    this.licensePlateNumberError = this.licensePlateNumber.length === 0 ? 'License plate number is required.' : undefined;
  }

  renderButtons() {
    if (this.disabled) {
      return html`
        <button class="red-button" type="button" @click="${() => this.disabled = !this.disabled}">Edit</button>
      `;
    } else {
      return html`
      <button class="red-button" type="button" @click="${(e) =>this.save(e)}">Save</button>
      <button class="red-lined-button" type="button" @click="${this.cancel}">Cancel</button>
      `;
    }
  }

  renderErrorMessage(message) {
    return message
      ? html`
          <p class="error">${message}</p>
        `
      : html``;
  }
  
  renderSubmissionMessage(message) {
    return message
      ? html`
          <p class="success">${message}</p>
        `
      : html``;
  }

  async save(event){
    const button = event.target;
    button.disabled = true;
    try {
      if (this.isFormReadyToSubmit()) {
        this.resetErrorMessages();
        const result = await vehiclesService.updateUserVehicle({
          vehicleId: this.vehicle.vehicleId,
          licensePlateNumber: this.licensePlateNumber,
          colour: this.colour,
          make: this.make,
          model: this.model,
        });
        this.handleVehicleUpdate(result);
        this.dispatchEvent(new CustomEvent('update-vehicles'));
      } else {
        this.validateFields();
      }
    } finally {
      button.disabled = false;
    }
  }

  cancel() {
    this.resetErrorMessages();
    this.setInputValues()
    this.disabled = true;
  }

  setInputValues(){
    this.licensePlateNumber = this.vehicle.licensePlateNumber;
    this.colour = this.vehicle.colour;
    this.make = this.vehicle.make;
    this.model = this.vehicle.model
  }

  handleVehicleUpdate(result) {
    if (result.errorMessages){
      for (const error of result.errorMessages) {
        const field = `${error.field}Error`
        this[field] = error.message;
      }
    } else {
      this.formSubmissionMessage = result.message;
      this.disabled = true;
    }
  }
  resetErrorMessages() {
    this.licensePlateNumberError = undefined;
    this.colourError = undefined;
    this.makeError = undefined;
    this.modelError = undefined;
    this.formSubmissionMessage = undefined;
  }

  isFormReadyToSubmit() {
    return this.licensePlateNumber && this.colour && this.model && this.make;  
  }

  validateFields() {
    this.licensePlateNumberError = !this.licensePlateNumber && 'License plate number is required.';
    this.colourError = !this.colour && 'Car colour is required.';
    this.makeError = !this.make && 'Car make is required.';
    this.modelError = !this.model && 'Car model is required.';
  }
}

customElements.define('e-vehicle-component', Vehicle);
