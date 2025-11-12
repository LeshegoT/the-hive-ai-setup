import {LitElement, html} from 'lit';
import './select.component';
import './list-options.component';
import './checkbox.component';
import { shared, inputFields } from '../styles';
import configService from '../services/config.service';
 
const styles = html`
  <style>
    ${shared()} ${inputFields()} :host {
      position: relative;
      --scrollbar-width: 0.3125em;
      --list-max-height: 12em;
    }
    ul {
      background: var(--app-light-text-color);
      list-style-type: none;
      margin: 0;
      padding: 0;
      border-radius: var(--small-radius);
      max-height: var(--list-max-height);
      overflow-y: auto;
      box-shadow: var(--shadow);
      top: 100%;
      position: absolute;
      width: 100%;
      z-index:var(--z-index-lists);
    }
    ::-webkit-scrollbar {
      width: var(--scrollbar-width);
    }
    ::-webkit-scrollbar-thumb {
      background: grey;
      border-radius: var(--small-radius);
    }
    li {
      padding: var(--standard-padding);
      font-size: var(--font-size-medium-small);
      font-weight: var(--light-font-weight);
    }
    li:hover {
      background: var(--neutral-light-grey-color);
      cursor: pointer;
    }
    li[selected] {
      background: var(--neutral-light-grey-color);
    }
 
    .list-heading {
      text-align: center;
      color: var(--app-primary-color);
      font-size: var(--font-size-medium-small);
      font-weight: var(--medium-font-weight);
      position: sticky;
      top: 0;
      background: var(--app-light-text-color);
      border-bottom: var(--small-border-size) solid #929cab;
      padding-inline: var(--large-padding);
    }
    .date {
      padding-inline: var(--standard-padding);
    }
  </style>
`;
export const PAST_DATE_RANGE = 'past';
export const FUTURE_DATE_RANGE = 'future';
export const FULL_DATE_TYPE = 'date';
export const MONTH_YEAR_TYPE = 'month';
export const YEAR_TYPE = 'year';
export const CANADIAN_DATE_LOCALE = 'en-CA'; // Used for formatting dates in YYYY-MM-DD format
class DatePicker extends LitElement {
  static properties = {
    selectedDate: { type: Date },
    activeList: { type: String },
    selected: { type: String },
    type: { type: String },
    dateRange: { type: String },
    value: { type: String },
    key: { type: String },
    error: { type: String },
    yearCutOff: { type: Number },
    name: { type: String },
    label: { type: String },
    required: { type: Boolean },
    valueSetManually: { type: Boolean },
    disabled: { type: Boolean },
    checkBoxName: { type: String },
    checkBoxDescription: { type: String },
    checkBox: { type: Boolean }
  };
  constructor() {
    super();
    this.activeList = '';
    this.value = '';
    this.disabled = false;
    this.checkBox = false;
    this.yearCutOff = configService.config.DEFAULT_YEAR_CUT_OFF,
    this.selectedDate = new Date();
  }
 
  firstUpdated() {
  document.addEventListener('click', (event) => this.handleOutsideClick(event));
  this.shadowRoot.querySelector('ul').addEventListener('click', (event) => {
    event.stopPropagation();
   })
  }
 
  updated() {
    this.scrollToSelected();
  }
 
  get placeholder() {
    if (this.type === MONTH_YEAR_TYPE) return 'YYYY-MM';
    else if (this.type === YEAR_TYPE) return 'YYYY';
    else return 'YYYY-MM-DD';
  }
 
  handleOutsideClick(event) {
  const path = event.composedPath();
  if (!path.includes(this.shadowRoot.querySelector('.date'))) {
    const list = this.shadowRoot.querySelector('ul');
    list.classList.add('hidden');
  } else {
    // Click event was on the component, already being handled
  }
}
 
  get monthNames() {
    const totalMonths = 12;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const months = Array.from({ length: totalMonths }, (_, monthIndex) => {
      const date = new Date(currentYear, monthIndex);
      return date.toLocaleString(undefined, { month: 'long' });
    });
    this.allMonths = months;
    if (this.dateRange === FUTURE_DATE_RANGE && this.selectedDate.getFullYear() === currentYear) {
      this.selectedDate.setMonth(currentMonth);
      return months.slice(currentMonth);
    } else if (this.dateRange === PAST_DATE_RANGE && this.selectedDate.getFullYear() === currentYear) {
      return months.filter((_, index) => index <= currentMonth);
    } else {
      return months;
    }
  }

  get days() {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    const days = [];
    const numberOfDaysForCurrentMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= numberOfDaysForCurrentMonth; day++) {
      days.push(day);
    }

    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    if (this.dateRange === FUTURE_DATE_RANGE && year === currentYear && month === currentMonth) {
      return days.filter(day => day >= currentDay);
    } else if (this.dateRange === PAST_DATE_RANGE && year === currentYear && month === currentMonth) {
      return days.filter(day => day <= currentDay);
    } else {
      return days;
    }
  }
 
  get years() {
    const yearsBefore = this.yearCutOff;
    const yearsAfter = this.yearCutOff;
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - yearsBefore;
    const endYear = currentYear + yearsAfter;
 
    let years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
 
    if (this.dateRange === FUTURE_DATE_RANGE) {
      years = years.filter((year) => year >= currentYear);
    } else if (this.dateRange === PAST_DATE_RANGE) {
      years = years.filter((year) => year <= currentYear);
    } else {
      // No need to filter for full date type
    }
 
    return years;
  }
 
  emitValue() {
    this.error = '';
    if (this.valueSetManually) {
      if(this.checkBox){
        this.dispatchEvent(new CustomEvent('checkBox-updated', { detail: 'current'}))
      } else if (!isNaN(this.selectedDate.getTime())) {
        this.dispatchEvent(
          new CustomEvent('date-updated', { detail: this.selectedDate })
        );
      }
    } else if(this.checkBox){
      this.dispatchEvent(new CustomEvent('checkBox-updated', { detail: 'current'}))
    } else if (!isNaN(this.selectedDate.getTime())) {
      this.dispatchEvent(new CustomEvent('date-updated', { detail: this.selectedDate }));
    }
  }
 
  handleMonthChange(month) {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), month);
    this.handleSelectValue();
    this.toggleList('days');
    this.emitValue();
  }

  handleDayChange(day) {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), day);
    this.handleSelectValue();
    this.toggleList('');
    const list = this.shadowRoot.querySelector('ul');
    list.classList.toggle('hidden');
    this.emitValue();
  }
 
  handleYearChange(year) {
    this.selectedDate = new Date(year, this.selectedDate.getMonth(), this.selectedDate.getDate());
    this.handleSelectValue();
    this.toggleList('months');
    this.emitValue();
  }
 
  handleManualInput(event) {
    this.error = '';
    this.value = event.target.value;
    this.valueSetManually = true;
    this.selectedDate = new Date(this.value);
    this.handleErrors();
    if (!this.error) {
      this.emitValue();
    }
  }

  handleSelectValue() {
    if (this.type === FULL_DATE_TYPE) {
      this.value = this.selectedDate.toLocaleDateString(CANADIAN_DATE_LOCALE);
    } else if (this.type === MONTH_YEAR_TYPE) {
      this.value = this.selectedDate.toLocaleDateString(CANADIAN_DATE_LOCALE, { year: 'numeric', month: '2-digit' });
    } else {
      this.value = this.selectedDate.getFullYear().toString();
    }
  }

  handleInputChange() {
    this.emitValue();
    this.handleErrors();
  }
 
  scrollToSelected() {
    const selectedOption = this.shadowRoot.querySelector('li[selected]');
    if (selectedOption) {
      selectedOption.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    }
  }

  openPicker() {
    const list = this.shadowRoot.querySelector('ul');
    list.classList.toggle('hidden');
    this.toggleList('years');
    this.valueSetManually = false;
    if (list.classList.contains('hidden')) {
      this.activeList = '';
    }
    this.scrollToSelected();
  }

  renderDropDownOptions() {
    const options = [];

    if (this.activeList === 'days' && this.type == 'date') {
      options.push(
        ...this.days.map(
          (day) => html`
            <li
              @click="${() => this.handleDayChange(day)}"
              ?selected="${day === this.selectedDate.getDay()}"
            >
              ${day}
            </li>
          `
        )
      );
    } else if (this.activeList === 'months' && this.type != 'year') {
      options.push(
        ...this.monthNames.map(
          (month, index) => html`
            <li
              @click="${() => this.handleMonthChange(index)}"
              ?selected="${this.selectedDate.getMonth() === index}"
            >
              ${month}
            </li>
          `
        )
      );
    } else if (this.activeList === 'years') {
      options.push(
        ...this.years.map(
          (year) => html`
            <li
              @click="${() => this.handleYearChange(year)}"
              ?selected="${year === this.selectedDate.getFullYear()}"
            >
              ${year}
            </li>
          `
        )
      );
    } else {
      // If no active list, return empty options
    }

    return html`
      <ul class="${options.length ? '' : 'hidden'}">
        <li class="list-heading">
          ${this.activeList === 'years' ? 'Year' : this.activeList === 'months' ? 'Month' : 'Day'}
        </li>
        ${options}
      </ul>
    `;
  }

  toggleList(listName) {
    this.activeList = listName;
  }

  handleErrors() {
    const currentDate = new Date();
    this.error = '';
    if (!this.checkBox) {
      if (!this.value && this.required) {
        this.error = `Please enter ${this.name.toLowerCase()}`;
      }  else if (isNaN(this.selectedDate.getDate())) {
        this.error = `Invalid date. Please enter date in format ${this.placeholder}`;
      } else {
        let selectedFormatted;
        if (this.type === FULL_DATE_TYPE) {
          selectedFormatted = this.selectedDate.toLocaleDateString(CANADIAN_DATE_LOCALE);
        } else if (this.type === MONTH_YEAR_TYPE) {
          selectedFormatted = this.selectedDate.toLocaleDateString(CANADIAN_DATE_LOCALE, { year: 'numeric', month: '2-digit' });
        } else {
          selectedFormatted = this.selectedDate.getFullYear().toString();
        }

        if (this.dateRange === FUTURE_DATE_RANGE && this.selectedDate < currentDate) {
          this.error = `${this.name} cannot be a past date`;
        } else if (this.dateRange === PAST_DATE_RANGE && this.selectedDate > currentDate) {
          this.error = `${this.name} cannot be a future date`;
        } else {
          // No need to filter for full date type
        }
      }
    } else {
      // If checkbox is not checked, no error is shown
    }
  }

  handleKeyDown(event) {
    const allowedKeysRegex = /^[0-9-]$/;
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab', 'Enter'];
 
    if (!allowedKeysRegex.test(event.key) && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    } else if (event.key == 'Enter' || event.key == 'Tab') {
      this.toggleList('');
    }
  }
 
  handleCheckBoxChange(event){
    this.checkBox = event.target.checked
    if(this.checkBox){
      this.enableOrDisableInput(true);
      this.value = event.target.name;
    }else{
      this.enableOrDisableInput(false);
      this.value = '';
    }
    this.emitValue();
  }
 
  enableOrDisableInput(disable){
    this.disabled = disable;
  }
 
  render() {
    return html`
      ${styles}
      <label for="${this.name}">${this.label}</label>
      <div class="input-container inline-flex-items date ${this.error ? 'error-state' : ''}"
        ?disabled="${this.disabled}">
        <span class="material-symbols-outlined">calendar_today</span>
        <input
          class="${this.error ? 'error-state' : ''}"
          placeholder="${this.placeholder}"
          type="text"
          id=${this.name}
          @click="${this.openPicker}"
          @change="${this.handleInputChange.bind(this)}"
          @input="${this.handleManualInput}"
          @keydown="${this.handleKeyDown}"
          .value="${this.value || ''}"
          ?required="${this.required}"
          autocomplete="off"
        />
        ${this.activeList
          ? html`
              <span class="material-icons-outlined primary-color-icon">keyboard_arrow_up</span>
            `
          : html`
              <span class="material-icons-outlined">keyboard_arrow_down</span>
            `}
      </div>
      ${this.checkBoxName || this.checkBoxDescription
        ? html`
            <div class="checkbox-container">
              <e-checkbox
                name="${this.checkBoxName}"
                ?checked="${this.checkBox}"
                @change="${this.handleCheckBoxChange}"
                label="${this.checkBoxDescription}"
              >
              </e-checkbox>
            </div>
          `
        : ''}
      ${this.error
        ? html`
            <p class="error-message">${this.error}</p>
          `
        : html``}
      ${this.renderDropDownOptions()}
    `;
  }
}
 
customElements.define('e-date-picker', DatePicker);