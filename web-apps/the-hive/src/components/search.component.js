import {LitElement, html} from 'lit';
import { inputFields, shared } from '../styles';
import './list-options.component';

const styles = html`
  <style>
    ${shared()} 
    ${inputFields()}
    :host {
      font-family: 'Inter';
    }
  </style>
`;

class Search extends LitElement {
  constructor() {
    super();
    this.debouncedInputChange = this.handleSearchText();
    this.searchResults = undefined;
    this.selectedResult = '';
    this.placeholder = 'Search...';
    this.minSearchCharacters = 0;
    this.searchExceptions = [];
    this.predefinedInvalidInputs = [];
  }

  static get properties() {
    return {
      name: { type: String },
      error: { type: String },
      label: { type: String },
      disabled: { type: Boolean },
      searchResults: { type: Array },
      selectedResult: { type: String },
      placeholder: { type: String },
      searchText: { type: String },
      required: { type: Boolean},
      maxSearchCharacters: { type: Number },
      minSearchCharacters: { type: Number },
      searchExceptions: { type: Array },
      predefinedInvalidInputs: { type: Array },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.cancelSelectSearchResult.bind(this));
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.cancelSelectSearchResult.bind(this));
  }

  firstUpdated() {
    document.addEventListener('click', (event) => this.handleOutsideClick(event));
  }

  cancelSelectSearchResult(event) {
    if (event.key === 'Escape') {
      this.dispatchEvent(new CustomEvent('cancel-select'));
    }
    else{
      //Do nothing here, event for doing the opposite(selecting search result) has already been handled
    }
  }

  handleErrors() {
    if(this.required && (!this.searchText && !this.selectedResult)){
      this.error = `Please enter ${this.name || "this field" }`
    }
    else if (this.searchExceptions.length !== 0 && this.searchText.length > 0 && this.searchText.length < 3 && !this.searchExceptions.some((searchException) => searchException.toLowerCase().includes(this.searchText.toLowerCase()))) {
      this.error = 'Minimum of 3 characters';
    }
    else if ((this.searchText && this.searchText.length )> this.maxSearchCharacters) {
      this.error = `Search text too long. Maximum characters allowed: ${this.maxSearchCharacters}`;
    }
    else if (this.searchText && this.predefinedInvalidInputs.some(input=>input.toLowerCase() === this.searchText.toLowerCase())){
      this.error = this.invalidInputError || `Search text cannot be: ${this.predefinedInvalidInputs.join(', ')}`;
    }
    else {
      this.error = '';
    }
  }

  hideOptions() {
    const list = this.shadowRoot.querySelector('e-list-option') || undefined;
    if (list) {
      list.classList.add('hidden');
    } else {
      //already hidden
    }
  }

  handleOutsideClick(event) {
    const path = event.composedPath();
    const clickedOutside = !(path.includes(this.shadowRoot.querySelector('.search')));
    if (clickedOutside) {
      this.dispatchEvent(new CustomEvent('focusout', { detail: clickedOutside }));
    } else {
      // Click was on the search component
    }
  }

  handleSearchText() {
    let timeout;
    return (e) => {
      const value = e.target.value.replace(/\s+/g, ' ');
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if( this.searchText?.trim() !== value.trim()) {
          this.searchText = value;
          this.handleErrors();
          if (!this.error ) {
            this.handleInputChange(value);
          } else {
            //don't emit value if there's an error
          }
        } else{
          // If the value is the same as the current searchText, do not update
        } 
      }, 500);
    };
  }

  handleSelectedResult(event) {
    if (!this.searchResults.includes('No results found')) {
      this.searchText = undefined;
      this.searchResults = undefined;
      this.shadowRoot.querySelector('input').value = this.selectedResult;
      this.dispatchEvent(new CustomEvent('result-selected', { detail: event.detail }));
    }
    else{
      //search result not clickable
    }
  }
 
  handleInputChange(value) {
    this.dispatchEvent(new CustomEvent('onsearch', { detail: value }));
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

  hasSlotContent() {
    const slot = this.shadowRoot.querySelector(`slot[name="custom-option"]`);
    return slot && slot.assignedNodes().length > 0;
  }

  handleSlotChange(event) {
    const slot = event.target;
    const slottedElements = slot.assignedElements();
  
    slottedElements.forEach((element) => {
      element.addEventListener('click', this.handleSlottedItemClick.bind(this));
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          this.handleSlottedItemClick(event);
        } else {
          //Event listeners for mouse click and Enter have already been added for the slotted items
          //Event listener for cancelling have been attached to the component
          //If user presses any other key nothing is done
        }
      });
    });
  }
  
  handleSlottedItemClick(event) {
    this.selectedResult = event.currentTarget.dataset.selectedresult;
    this.searchResults = undefined;
    this.searchText = undefined;
  }

  updated() {
    if (this.searchText && !this.hasSlotContent() && Array.isArray(this.searchResults) && this.searchResults.length === 0) {
      this.searchResults = ['No results found'];
    } else {
      //custom list item will be used to handle no results found
    }
  }

  renderSearchResults() {
    if (this.error) {
      return html``;
    }
    else if (this.searchText &&  this.searchResults == undefined && (this.searchText.length >= this.minSearchCharacters || this.searchExceptions.includes(this.searchText?.toLowerCase()))) {
      return html`
        <e-list-option .options="${['Searching...']}"></e-list-option>
      `;
    } else if (!this.disabled && this.searchResults) {
      return html`
        <e-list-option .options="${this.searchResults}" @selected="${this.handleSelectedResult}">
          <slot name="custom-option" @slotchange="${this.handleSlotChange}"></slot>
        </e-list-option>
      `;
    } else {
      return html``;
    }
  }

  resetInput() {
    this.dispatchEvent(new CustomEvent('reset'));
  }

  render() {  
      return html`
      ${styles}
      <div class="input-fields-container search">
        <label for="${this.name}">${this.label}</label>
        <div class="input-container ${this.error ? 'error-state' : ''}" ?disabled="${this.disabled}">
          <span class="material-symbols-outlined icon">search</span>
          <input
            type="text"
            name="${this.name}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            .value="${this.selectedResult}"
            @input="${this.debouncedInputChange}"
            @keydown="${this.handleKeyDownEvent}"
          />
          <span class="material-icons-outlined clickable-icon" @click="${this.resetInput}" title="Cancel">highlight_off</span>
        </div>
        ${this.error
          ? html`
              <p class="error-message">
                ${this.error}
              </p>
            `
          : html``}
        ${this.renderSearchResults()}
      </div>
    `;
  }
 }
customElements.define('e-search', Search);
