import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element';
import { shared } from '../styles';
import settingsService from '../services/settings.service';
import vehiclesService from '../services/vehicles.service';
import  '../components/vehicle.component';
import  '../components/loader.component';
import '../components/checkbox.component';

import '@material/web/switch/switch.js';
import '../components/title.component';
import '../components/car-form.component';

let styles = html`
  <style>
    ${shared()}
    
    .main-section{
      display: flex;
      flex-direction: column;
      gap: var(--image-grid-gap);

      & > h1 {
        color: var(--app-primary-color);
        font-size: x-large;
      }

      & > * {
        margin: 0;
      }
    }


    .input-section {
      padding: var(--standard-padding);
      background: var(--app-section-even-color);
    }

    .accordion-container{
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;

      & > div {
        padding: var(--standard-padding);
      }
    }

    .vehicles-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--large-gap)
    }

    .selection-container {
      display: flex;
      flex-wrap: wrap;
      column-gap: var(--large-gap);
      margin-bottom: var(--standard-margin);

      & > div {
        display: flex;
        flex-direction: column;
        flex: 1; 

        & > label {
          text-wrap: nowrap;
          margin-bottom: var(--small-margin);
        }

        & > select {
          padding: var(--standard-padding);
          border: none;
          box-shadow: 0 var(--small-border-size) 0 0 var(--app-review-primary-text-color);
        }
      }
    }

    .preference-check-container {
      display: flex;
      flex-wrap: wrap;
      column-gap: var(--large-gap);
      margin-bottom: var(--standard-margin);

      & > e-checkbox {
        padding: var(--standard-padding);
        border: none;
      }
    }

    .office-toggle-container {
      & > label {
        padding-bottom: var(--small-padding);
      }
      
      & > .button-container {
        display: flex;
        flex-direction: row;
        padding: var(--small-padding) 0;
        column-gap: 0.375rem;

        & > button {
          width: 0;
          flex: 1;
        }
      }
    }

    .switch-container {
      padding: var(--small-padding);
      padding-left: 0;
      
      & > label {
        font-size: var(--font-size-tiny);
      }
    }

    e-loader{
      margin: auto;
    }

    e-car-form {
      display: flex;
      justify-content: center;
      padding: inherit;
    }

    button {      
      padding: var(--small-padding);
      border: none;
      border-radius: var(--app-small-border-radius);
      cursor: pointer;
    }

    #select{
      background: var(--app-primary-color);
      color: var(--bbd-red-contrast);
    }

    #unselect{
      background: var(--bbd-red-contrast);
      border: var(--small-border-size) solid var(--app-primary-color);
      color: var(--app-primary-color);
    }

  </style>
`;

class Settings extends StatefulPage {

  renderPreference(id, userSettingsTypeId, text, value, settingsDataType, options, disabled = false) {
    if (settingsDataType === 'boolean') {
      return html`
        <e-checkbox 
          label=${text} 
          name="${id}"
          ?disabled="${disabled}"
          ?checked="${this.convertToBool(value)}"
          @change="${(e) => this.changeSetting(userSettingsTypeId, e.detail)}"
        ></e-checkbox>
      `;
    } else {
      return html`
        <div>
          <label for="${userSettingsTypeId}">${text}</label>
          <select
            id="${userSettingsTypeId}"
            name="${id}"
            ?disabled="${disabled}"
            @change="${(e) => this.changeSetting(userSettingsTypeId, e.target.value)}"
          >
          <option value="" ?selected="${!value}">Please select a ${text}</option>
            ${options.map(
              (option) => html`
                <option value="${option}" ?selected="${value === option}">${option}</option>
              `
            )}
          </select>
        </div>
      `;
    }
  }

  renderBoolPreference(id, userSettingsTypeId, text, value, disabled = false) {
    return html`
      <e-checkbox 
        label=${text} 
        name="${id}"
        ?disabled="${disabled}"
        ?checked="${this.convertToBool(value)}"
        @change="${(e) => this.changeSetting(userSettingsTypeId, e.detail)}"
      ></e-checkbox>
    `;
  }

  renderPreferences(preferences) {
    if (!preferences) {
      return html`
        <e-loader></e-loader>
      `;
    } else {

      let booleanSettingElements = preferences.filter(obj => (obj.settingsDataType === "boolean")).map((preference) => {
        const { userSettingsTypeId, typeDescription, value, settingsDataType, canUserEdit } = preference;

        return this.renderBoolPreference(
          settingsDataType,
          userSettingsTypeId,
          typeDescription,
          value,
          !canUserEdit
        );

      });

      let nonBooleanSettingElements = preferences.filter(obj => (obj.settingsDataType !== "boolean")).map((preference) => {
        const { userSettingsTypeId, typeDescription, value, settingsDataType, canUserEdit, options } = preference;
        const id = settingsDataType;

        return this.renderPreference(
          id,
          userSettingsTypeId,
          typeDescription,
          value,
          settingsDataType,
          options,
          !canUserEdit
        );

      });

      return html`
        <div class="selection-container">${nonBooleanSettingElements}</div>
        <div class="preference-check-container">${booleanSettingElements}</div>
      `;
    }
  }

  renderCarDetails() {
    if (!this.cars) {
      return html`
        <e-loader></e-loader>
      `;
    } else {
      return this.cars.map(
        (car) => html`
          <e-vehicle-component .vehicle=${car} @update-vehicles="${this.updateVehicles}"></e-vehicle-component>
        `
      );
    }
  }

  renderAccordionSection(office) {
    return html`
      <div class="office-toggle-container">
        <label>${office}</label>
        <div class="button-container">
          <button id="select" @click="${(e) => this.toggleAll(office, true, e)}">Select all</button>
          <button id="unselect" @click="${(e) => this.toggleAll(office, false, e)}">Unselect all</button>
        </div>
          ${this.eventCategories.map((category) => this.renderSwitch(category,office))}
      </div>
    `;
  }

  renderSwitch(category, office){
    const cell = this.tableData.find((cell) => cell.officeName === office && cell.eventCategory === category);
    const cellId = cell ? `${cell.officeId}-${cell.eventCategoryId}` : '';

    return html`
      <div class="switch-container">
        <md-switch
          id="${cellId}"
          .selected="${cell ? cell.selected : false}"
          @change="${() => this.toggleCell(cell)}"
        ></md-switch>
        <label>${category}</label>
      </div>`
  }

  renderAccordion() {
    if (!this.tableData || this.tableData.length === 0) {
      return html`
        <e-loader></e-loader>
      `;
    } else {
      return this.offices.map((office) => this.renderAccordionSection(office))
    }
  }

  render() {
    return html`
      ${styles}

      <section class="main-section">
        <e-title name="Your Settings" icon="/images/logos/settings.svg"></e-title>
        <section class="input-section">
          <h1>Preferences</h1>
          ${this.renderPreferences(this.preferences)}
        </section>
        <section class="input-section">
          <h1>Invitation Selection</h1>
          <div class="accordion-container">${this.renderAccordion()}</div>
        </section>
        <section class="input-section">
          <h1>Car Details</h1>
          <div class="vehicles-container">${this.renderCarDetails()}</div>
          <e-car-form @update-vehicles="${this.updateVehicles}"></e-car-form>
        </section>
      </section>
    `;
  }

  static get properties() {
    return {
      preferences: Array,
      userPreferences: Array,
      tableData: Array,
      cars: Array
    };
  }

  async updateVehicles(){
    this.cars = await vehiclesService.getUserVehicles();
  }

  changeSetting(id, value) {
    if (value != null) {
      settingsService.savePreference({ settingTypeId: id, value });
    } else {
      //Do not save preference.
    }
  }

  async toggleCell(cell) {
    const invitationPreference = { officeId: cell.officeId, eventCategoryId: cell.eventCategoryId }
    await settingsService.saveInvitationPreference(invitationPreference);
    this.tableData.forEach((tableCell, index) => {
      if (tableCell === cell) {
        this.tableData[index] = { ...tableCell, selected: !tableCell.selected };
      }
    });
  }

  isCellSelected(officeName, eventCategory) {
    return this.userPreferences.invitationPreferences.some(
      (preference) => preference.officeName === officeName && preference.eventCategory === eventCategory
    );
  }

  convertToBool(value) {
    return (value === true || value === "true" || value === "1" || value === 1)
  }

  async toggleAll(office, toggle, event){
    const button = event.target;
    button.disabled = true;
    try {
      const toggledInvitations = this.tableData
        .filter((cell) => cell.officeName === office && cell.selected !== toggle)
        .map((cell) => ({
          officeId: cell.officeId,
          eventCategoryId: cell.eventCategoryId,
        }));
      if (toggledInvitations.length > 0) {
        await settingsService.saveInvitationPreferences(toggledInvitations);
        this.userPreferences = await settingsService.getAllPreferences();
        const allEventCategories = await settingsService.getEventCategories();
        const allOffices = await settingsService.getOffices();
        this.tableData = allOffices.flatMap(off => allEventCategories.map(cat => {
            return {
            officeId: off.officeId, 
            officeName: off.officeName, 
            eventCategoryId: cat.eventCategoryId, 
            eventCategory: cat.eventCategory
          }
        }
        ));
        this.tableData.forEach((cell) => {
          cell.selected = this.isCellSelected(cell.officeName, cell.eventCategory);
        });
      } else {
        //There are no preferences to send
      }
    } finally {
      button.disabled = false;
    }
  }

  async loadOptions(lookupTableName) { 
    let options = [];
    const lookupTableInfo = await settingsService.getLookupTableData(lookupTableName);
    const lookupTableData = lookupTableInfo.lookupTableData;
    if (lookupTableData !== undefined) {
      const valueColumn = lookupTableInfo.tableDescription.find((item) => { return !item.isIdentity}).columnName;
      options = lookupTableData.map((item) => item[valueColumn]);
    }
    return options;
  }

  async connectedCallback() {
    super.connectedCallback();
    const allEventCategories = await settingsService.getEventCategories();
    const allOffices = await settingsService.getOffices();
    this.eventCategories = allEventCategories.map(eventCategory => eventCategory.eventCategory);
    this.offices = allOffices.map(office => office.officeName)
    this.userPreferences = await settingsService.getAllPreferences();
    this.tableData = allOffices.flatMap(off => allEventCategories.map(cat => { 
      return {
        officeId: off.officeId, 
        officeName: off.officeName, 
        eventCategoryId: cat.eventCategoryId, 
        eventCategory: cat.eventCategory
      }
    }));
    this.preferences = await Promise.all(this.userPreferences.preferences.map(
      async preference => {
        let options = []
        if (preference.lookupTableName !== null) {
          options = await this.loadOptions(preference.lookupTableName)
          
        } else if (preference.value !== null) {
          options = [ preference.value ]
        }
        return { 
          ...preference, 
          'options': options
        }
      }
    ));
    for (const cell of this.tableData) {
      cell.selected = this.isCellSelected(cell.officeName, cell.eventCategory);
    }
  }

  async stateChanged() {
    this.cars = await vehiclesService.getUserVehicles();
  }
}

window.customElements.define('e-settings', Settings);
