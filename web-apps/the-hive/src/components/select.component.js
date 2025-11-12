import { LitElement, html } from 'lit';
import './list-options.component';
import { shared ,inputFields} from '../styles';
import configService from '../services/config.service';

const styles = html`
  <style>
    ${shared()}
    ${inputFields()}
    .icon {
      color: var(--primary-red-color);
    }
  </style>
`;

class Select extends LitElement {
  constructor() {
    super();
    this.selectedResult = '';
    this.placeholder = 'Select...'
    this.filteredOptions = undefined;
    this.value = '';
  }

  static get properties() {
    return {
      name: { type: String },
      disabled: { type: Boolean },
      label:{type:String},
      options: { type: Array },
      selectedResult: { type: String },
      error: { type: String },
      placeholder: { type: String },
      required: { type: Boolean },
      filteredOptions: { type: Array },
      value: { type: String },
      searchText: { type: String },
      mode : { type: String },
      minimumSearchCharacters: { type: Number },
      maximumSearchCharacters: { type: Number }
    };
  }

  firstUpdated() {
    this.value = this.selectedResult;
    document.addEventListener('click', (event) => this.handleOutsideClick(event));
    const listOptions = this.shadowRoot.querySelector('e-list-option');
    if (listOptions) {
      listOptions.classList.add('hidden');
    }
    else{
      // no e-list-option component was rendered so no need to add the hidden class
    }
}

  updated(changedProperties) {
    if (changedProperties.has('options') && this.options) {
      this.filteredOptions = undefined;
      this.value = this.options.includes(this.selectedResult)? this.selectedResult: this.searchText || '';
    } else {
      //Do nothing
    }
  }

  handleOutsideClick(event) {
    const path = event.composedPath();
    if (!path.includes(this.shadowRoot.querySelector('.select'))) {
      const listOptions = this.shadowRoot.querySelector('e-list-option');
      if (listOptions) {
        listOptions.classList.add('hidden');
      }
      else{
        // no e-list-option component was rendered so no need to add the hidden class
      }
    }
    else{
      // Click was inside the select component; handleSelectedResult will handle the event
    }
  }

  handleErrors() {
    if (!this.selectedResult && this.required) {
      this.error = 'Please select an option';
    } else {
      this.error = '';
    }
  }

  handleInputLengthErrors() {
    if (this.searchText && this.searchText.length < this.minimumSearchCharacters) {
      this.error = `Search text too short. Minimum characters allowed: ${this.minimumSearchCharacters}`;
    } else if ((this.searchText && this.searchText.length )> this.maximumSearchCharacters) {
      this.error = `Search text too long. Maximum characters allowed: ${this.maximumSearchCharacters}`;
    } else {
      this.error = undefined;
    }
  }

  handleSelectedResult(event) {
    this.selectedResult = event.detail;
    this.value = event.detail;
    this.handleErrors();
    this.dispatchEvent(new CustomEvent('selected', { detail: this.value }));
    this.handleOptionsVisibility();
  }

  handleOptionsVisibility() {
    const listOptions = this.shadowRoot.querySelector('e-list-option');
    if (listOptions) {
      listOptions.classList.toggle('hidden');
    }
    else{
      // no e-list-option component was rendered so no need to toggle the visibility
    }
  }

  handleKeyDownEvent(event) {
    const listOptions = this.shadowRoot.querySelector('e-list-option');
    if (listOptions) {
      listOptions.handleKeyDown(event);
    }
    else{
      //list option is not rendered, not key events
    }
  }

  filterOptions(event) {
    const inputValue = event.target.value.toLowerCase();
    const listOptions = this.shadowRoot.querySelector('e-list-option');
    if (listOptions) {
      listOptions.classList.remove('hidden');
    }
    else{
      // no e-list-option component was rendered so no need to remove the hidden class
    }
    if (!inputValue) {
      this.filteredOptions = this.options;
    } else {
      this.filteredOptions = this.options.filter(option =>{
        return option.toLowerCase().includes(inputValue)
      }
      );
    }
  }

  triggerSearch() {
    let timeout;
    return (event) => {
      const listOptions = this.shadowRoot.querySelector('e-list-option');
      if (listOptions) {
        listOptions.classList.remove('hidden');
      }
      else{
        // no e-list-option component was rendered so no need to remove the hidden class
      }
      this.searchText = event.target.value;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.selectedResult = undefined;
        this.searchText = this.searchText.trim();
        this.handleInputLengthErrors();
        this.dispatchEvent(new CustomEvent('onsearch', { detail:this.searchText.trim() }));
      }, configService.config.SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS);
    };
  }


  handleInputChange(event) {
    if (this.mode === 'search') {
      const searchTrigger = this.triggerSearch();
      searchTrigger(event);
    } else {
      this.value = event.target.value;
      this.selectedResult = '';
      this.filterOptions(event);
    }
  }

  renderDropdownOptions() {
    if(!this.options && this.mode === 'search'){
      if (this.error){
        return html``;
      } else {
        return html`<e-list-option .options="${['Searching...']}"></e-list-option>`;
      }
    }
    else {
      return html`
      <e-list-option  @selected="${this.handleSelectedResult}" .options="${this.filteredOptions ?? this.options}" .displayField="${this.displayField}">
      <slot name="custom-option"></slot>
      </e-list-option>
    `;
    }
  }

  render() {
    return html`
      ${styles}
      <div class="input-fields-container">
        <label for="${this.name}">${this.label}</label>
        <div
          class="input-container select ${this.error ? 'error-state' : ''}"
          ?disabled="${this.disabled}"
          @click="${this.handleOptionsVisibility}"
        >
          <input
            id="${this.name}"
            name="${this.name}"
            type="text"
            ?required="${this.required}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            .value="${this.value}"
            @keydown="${this.handleKeyDownEvent}"
            @input="${this.handleInputChange}"
            autocomplete="off"
          />

          <span class="material-symbols-outlined icon">keyboard_arrow_down</span>
        </div>
        ${this.error? html`<p class="error-message">${this.error}</p>`:html``}
       
        ${this.renderDropdownOptions()}
      </div>
    `;
  }
}

customElements.define('e-select', Select);