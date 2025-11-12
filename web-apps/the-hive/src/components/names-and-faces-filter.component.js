import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';
import './review-progress.component';
import './review-card-status.component';
import namesAndFacesService from '../services/names-and-faces.service';

const styles = html`
  <style>
    ${reviewShared()} .card {
      padding: 1em;
      background: var(--app-dashboard-panel);
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
      border-radius: 4px;
    }

    input,
    button {
      border: 1px solid black;
      padding: 0.5em;
    }

    #exportToPdf {
      background: var(--app-success-font-color);
      border-radius: 4px;
      color: white;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      font-size: clamp(0.875rem, 0.85rem + 0.125vw, 1rem);
    }

    #exportToPdf:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    #searchGroup,
    #searchUnit,
    #searchOffice {
      padding: 0.5em;
      width: 95%;
    }

    .dropdownButton {
      position: relative;
    }

    .clearButton {
      position: absolute;
      right: -2px;
      top: 4px;
      width: 1.5em;
      filter: brightness(0%) grayscale(100%);
      cursor: pointer;
      z-index: 1;
    }

    .card > * {
      padding: 0.5em 1em;
      border: 0px solid black;
    }

    #filters {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 2em;
    }

    #employmentDateAndExportContainer {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
      align-items: center;
    }

    #employmentDateAndExportContainer > * {
      margin-right: 2em;
    }

    #searchString {
      grid-column: span 2;
    }

    @media only screen and (max-width: 1100px) {
      #filters {
        grid-template-columns: repeat(5, 1fr);
        gap: 1em;
      }
    }

    @media only screen and (max-width: 900px) {
      #filters {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    @media only screen and (max-width: 700px) {
      #filters {
        grid-template-columns: repeat(2, 1fr);
      }
      #employmentDateAndExportContainer > * {
        margin-top: 1em;
      }
    }

    @media only screen and (max-width: 400px) {
      .redButton {
        font-size: 0.75em;
      }

      input::placeholder {
        font-size: 0.8em;
      }
    }
  </style>
`;
class NamesAndFacesFilter extends StatefulElement {
  constructor() {
    super();
    this.userUnits = [];
    this.userOffices = [];
    this.userGroups = [];
    this.resetSearchObject();
    this.loadData();
  }

  render() {
    return html`
      ${styles}
      <section class="card">
        <section id="filters">
          ${this.renderSearchBar()} 
          ${this.renderSearchGroup(this.userGroups)}
          ${this.renderSearchUnit(this.userUnits)} 
          ${this.renderSearchOffice(this.userOffices)}
          ${this.renderClearAllFilter()}
        </section>
        <section id="employmentDateAndExportContainer">
          ${this.renderEmploymentDateFilter()} 
          ${this.renderExportButton()}
        </section>
      </section>
    `;
  }

  loadData() {
    namesAndFacesService.getAllUnits().then((response) => {
      this.userUnits = response.units.sort((a, b) => {
        return a.unit.localeCompare(b.unit);
      });
    });

    namesAndFacesService.getAllOffices().then((response) => {
      this.userOffices = response.offices;
    });
  }

  loadGroups(searchGroup){
    namesAndFacesService.getBBDGroups(searchGroup).then((response) => {
      this.userGroups = response;
    });
  }

  renderSearchBar() {
    return html`
      <input @input=${(e) => this.updateSearchString(e.target.value)} .value=${this.search.searchString} type="text" id="searchString" placeholder="Search (Requires at least 3 characters)"/>
    `;
  }

  renderSearchUnit(userUnits) {
    return html`
      <section class="dropdownButton">
      <datalist id="units">
        ${userUnits.map((userUnit) => {
          return html`
            <option value=${userUnit.unit}>${userUnit.description}</option>
          `;
        })}
      </datalist>
        <input id="searchUnit" list="units" type="text" placeholder="Search Unit" .value=${this.search.unit}
        @change=${(e) => this.updateSearch(e.target.value, 'unit')} aria-labelledby="my-label-id" />
        <img
          @click=${(e) => this.clearDropdown('unit')}
          src="images/icons/rejected.svg" class="clearButton" 
        />
      </section>
    `;
  }

  renderSearchGroup(userGroups) {
    return html`
      <section class="dropdownButton">
        <input id="searchGroup" list="groups" type="text" placeholder="Search groups" .value=${this.search.group}
        @input=${(e) => this.updateSearchGroup(e.target.value)} aria-labelledby="my-label-id" />
        <datalist id="groups">
          ${userGroups.map((group) => {
            return html`
              <option value=${group.mail}>${group.displayName}</option>
            `;
          })}
        </datalist>
        <img
          @click=${(e) => this.clearDropdown('group')}
          src="images/icons/rejected.svg" class="clearButton" 
        />
      </section>
    `;
  }

  renderSearchOffice(userOffices) {
    return html`
      <section class="dropdownButton">
        <input id="searchOffice" list="offices" type="text" placeholder="Search office" .value=${this.search.office}
        @change=${(e) => this.updateSearch(e.target.value,'office')} aria-labelledby="my-label-id" />
        <datalist id="offices">
          ${userOffices?.map((office) => {
            return html`
              <option>${office}</option>
            `;
          })}
        </datalist>
        <img
          @click=${(e) => this.clearDropdown('office')}
          src="images/icons/rejected.svg" class="clearButton" 
        />
      </section>
    `;
  }

  renderEmploymentDateFilter() {
    return html`
      <span>Employment Date</span>
      <input type="date" .value=${this.search.employmentFrom} id="employmentFrom" @change=${(e) => this.updateSearch(e.target.value,'employmentFrom')} />
      <input type="date" .value=${this.search.employmentTo} id="employmentTo" @change=${(e) => this.updateSearch(e.target.value,'employmentTo')} />
    `;
  }

  renderExportButton(){
    return html`
      <input ?disabled="${this.exportIsDisabled}" type="button" id="exportToPdf" value="Export To PDF" @click=${(e) => this.triggerExport()} />
    `;
  }

  renderClearAllFilter() {
    return html`
      <button class="redButton" @click=${this.clearAllFilter}>Clear All Filters</button>
    `;
  }

  clearDropdown(dropdown){
    this.search[dropdown] = '';
    this.applyFilter();
  }

  resetSearchObject(){
    this.search = {
      searchString: '',
      group: '',
      unit: '',
      office: '',
      employmentFrom: '',
      employmentTo: '',
    };
  }

  clearAllFilter() {
    this.resetSearchObject();
    this.applyFilter();
  }

  updateSearch(value, propertyName){
    this.search[propertyName] = value;
    this.applyFilter();
  }

  updateSearchString(searchString){
    this.search.searchString = searchString;
    if (searchString.length >= 3 || searchString.length === 0) {
      this.applyFilter();
    }
  }

  updateSearchGroup(group){
    this.search.group = group;
    if (group.length >= 3) {
      if (group.includes('@BBDZA.onmicrosoft.com') || group.includes('@bbd.co.za') || group.includes('@bbdsoftware.com')){
        this.applyFilter();
      }else{
        this.loadGroups(group);
      }
    }else if(group.length === 0){
      this.applyFilter();
    }
  }

  applyFilter() {
    this.dispatchEvent(new CustomEvent('filter-changed', { detail: this.search }));
  }

  triggerExport(){
    this.dispatchEvent(new CustomEvent('exportTriggered'));
  }

  static get properties() {
    return {
      userDetail: Object,
      search: Object,
      userUnits: Array,
      userOffices: Array,
      userGroups: Array,
      employmentFrom: Date,
      employmentTo: Date,
      exportIsDisabled: Boolean,
    };
  }
}

window.customElements.define('e-names-and-faces-filter', NamesAndFacesFilter);