import {LitElement, html} from 'lit';
import { animations, shared } from '../styles';
import '../components/info-block-hover';
import { fileTypes } from '../components/file-upload.component';
import '../components/collapsible.component';
import '../components/review-survey-progress-stepper.component';
import '../components/button.component';
import '../components/checkbox.component';
import '../components/pill.component';
import '../components/app-card.component';
import '../components/list-options.component';
import '../components/select.component';
import '../components/search.component';
import '../components/radio-group.components';
import '../components/date-picker.component';
import '../components/free-text-input.component';
import SkillsService from '../services/skills.service';
import {
  FULL_DATE_TYPE,
  FUTURE_DATE_RANGE,
  MONTH_YEAR_TYPE,
  PAST_DATE_RANGE,
  YEAR_TYPE,
} from '../components/date-picker.component';

const styles = html`
  <style>
    ${shared()} ${animations()} .components {
      display: flex;
      flex-wrap: wrap;
      border-radius: var(--app-small-border-radius);
      gap: var(--large-gap);
      margin-block:var(--standard-margin)
    }
    .options h4{
      margin:0;
    }
    e-file-upload {
      flex-grow: 1;
    }
 
  </style>
`;
class AppComponents extends LitElement {
  constructor() {
    super();
    this.stepperSections = [
      { name: 'Personal details' },
      { name: 'Ability' },
      { name: 'Aptitude & Approach' },
      { name: 'Discussion points' },
      { name: 'Review' },
    ];
    this.pills = {
      sizes: ['small', 'large'],
      colors: ['primary', 'secondary', 'neutral', 'white'],
    };
    this.buttons = {
      sizes:  ['small', 'medium', 'large'],
      colors: ['primary', 'secondary', 'tertiary'],
    };
    this.searchData = ['HTML&CSS','Advanced C# Concepts','Design','Java','Javascript','Node.JS','UX Design Systems'];
    this.selectedOptions = [];
    this.options  = ['Option 1','Option 2','Option 3','Option 4','Option 5','Option 6']
    this.cardsData = [
      {
        id: 1,
        name: 'Java',
        details: { lastUsed: 'November 2023', yearsOfExperience: '2 years', level: 'Beginner' },
        status: 'pending proof',
      },
      {
        id: 2,
        name: 'Bsc Computer Science',
        details: { graduationDate: 'November 2024', institution: 'University of Pretoria ' },
        status: 'pending proof',
      },
      {
        id: 3,
        name: 'AWS Solutions Architect',
        details: { dateAchieved: 'November 2023', expiryDate: 'November 2026' },
        status: '',
      },
      {
        id: 4,
        name: 'Bsc Computer Science',
        details: { graduationDate: 'November 2023', institution: 'University Of Pretoria' },
        status: 'pending approval',
      },
      {
        id: 5,
        name: 'Java',
        details: { lastUsed: 'November 2023', yearsOfExperience: '2 years' },
        status: 'pending proof',
      },
    ];
  }
  static get properties() {
    return {
      stepperSections: {type: Array },
      selectedOption: { type: String },
      selectedOptions: { type: Boolean },
      addingNewCourse: { type: Array },
      searchResults: { type: Array },
      searchData: { type: Array },
    };
  }

  fetchSearchResults(event) {
    const searchText = event.detail.trim().toLowerCase();
    if (searchText === '') {
      this.searchResults = undefined;
    } else {
      this.searchResults = this.searchData.filter((word) => word.toLowerCase().includes(searchText));
    }
  }

  deleteCard(id) {
    this.cardsData = this.cardsData.filter(card => card.id !== id);
    this.requestUpdate();
  }

  renderCards() {
    return this.cardsData.map((card) => {
      return html`
        <e-card-component cardTitle="${card.name}" .contents="${card.details}">
          <div slot="footer-left">
            ${card.status
              ? html`
                  <e-pill size="small" color="primary">${card.status}</e-pill>
                `
              : ''}
          </div>
          <div slot="footer-right">
            <span class="material-symbols-outlined">edit</span>
            <span class="material-symbols-outlined" @click="${() => this.deleteCard(card.id)}">delete</span>
          </div>
        </e-card-component>
      `;
    });
  }

  renderButtons() {
    return html`
      ${this.buttons.sizes.map(
        (size) => html`
          <div class="components">
            ${this.buttons.colors.map(
              (color) => html`
                <e-button size="${size}" color="${color}" leftIconName="check" rightIconName="check">Button</e-button>
              `
            )}
            <e-button size="${size}" disabled leftIconName="check" rightIconName="check">Button</e-button>
          </div>
        `
      )}
    `;
  }

  renderPills() {
    return html`
      ${this.pills.sizes.map(
        (size) => html`
          <div class="components">
            ${this.pills.colors.map(
              (color) => html`
                <e-pill size="${size}" color="${color}">Pill title</e-pill>
              `
            )}
          </div>
        `
      )}
    `;
  }

  handleSelectedOption(event) {
    this.selectedOption = event.detail;
  }

  handleSelectedOptions(event) {
    if (!this.selectedOptions.includes(event.detail)) {
      this.selectedOptions = [...this.selectedOptions, event.detail];
    } else {
      //option already selected, don't add
    }
  }

  removeSelectedOption(indexToRemove) {
    this.selectedOptions = this.selectedOptions.filter((_, index) => index !== indexToRemove);
  }

  renderSelectedOptions() {
    return html`
      <div class="options">
        <h4>Selected Options:</h4>
        ${this.selectedOptions.map((option, index) => html`
          <e-pill size="small" color="neutral">
            <span>${option}</span>
            <span
              @click="${() => this.removeSelectedOption(index)}"
              class="material-symbols-outlined"
              title="Remove option"
            >
              close
            </span>
          </e-pill>
        `)}
      </div>
    `;
  }

  renderSelectedOption() {
    return html`
       <div class="options">
        <h4>Selected Option:</h4>
        ${this.selectedOption
          ? html`
              <e-pill size="small" color="neutral">${this.selectedOption}</e-pill>
            `
          : html``}
      </div>
    `;
  }

  handleFile(event){
    this.file = event.detail;

  }
  addNewCourse(){
    this.addingNewCourse = true;
  }

  async uploadFile() {
    let formData = new FormData();
    formData.append('file', this.file);
    const response = await SkillsService.uploadUserFile(formData);
  }

  render() {
    return html`
      ${styles}
      <div class="fade-in">
        <section class="fade-in">
          <e-title class="title" name="Components" icon = 'images/logos/components.svg'></e-title>
        </section>
        <e-collapsible collapsibleHeading="Cards" collapsibleContentsInfo="standard cards stylings">

        <div class="cards-container">
        ${this.renderCards()}
        </div>
        </e-collapsible>

          <e-collapsible collapsibleHeading="Buttons" collapsibleContentsInfo="standard app buttons">
            <div class="components">${this.renderButtons()}</div> 
          </e-collapsible>
        </e-collapsible>
   
        <e-collapsible collapsibleHeading="Forms" collapsibleContentsInfo="standard form styles">
        <e-button size="large" class="hidden" color="primary" @click="${this.uploadFile}"></e-button>


        <div class="components">
          <e-search  disabled label="Search courses"></e-search>
          <e-search name="searchCourses" label="Search courses" .searchResults="${this.searchResults}"  @onsearch="${this.fetchSearchResults}"></e-search>
          ${
            this.addingNewCourse? html`
            <e-free-text-input label="Add new course"></e-free-text-input>
            `:html`
            <e-search name="search" label="Search courses" .searchResults="${this.searchResults}" >
          <li @click=${this.addNewCourse} tabindex="0" slot="custom-option">Add new course </li>
          </e-search>
            `
          }
          </div>
          <div class="components">
          <e-select label="Select Option" .options = "${this.options}" disabled></e-select>
          <e-select label="Select an option" name="options" .options="${this.options}"></e-select>
          </div>
          <div class="components">
          <e-date-picker type="${FULL_DATE_TYPE}" label="Pick or input full date :"></e-date-picker>
          <e-date-picker type="${MONTH_YEAR_TYPE}" label="Pick or input month and year :"></e-date-picker>
          <e-date-picker type="${YEAR_TYPE}" label="Pick or input year :"></e-date-picker>
        </div>

        <div class="components">
          <e-date-picker type="${MONTH_YEAR_TYPE}" dateRange="${PAST_DATE_RANGE}" name="graduation date" label="Pick or input graduation date(past date):"></e-date-picker>
          <e-date-picker type="${MONTH_YEAR_TYPE}" dateRange="${FUTURE_DATE_RANGE}" name="expiry date" label="Pick or input a expiry date(future date):"></e-date-picker>
        </div>
      
        <div class="components">
        <e-date-picker type="${FULL_DATE_TYPE}" checkBoxName="current"
              checkBoxDescription="Currently used"
              .checkBox="${false}" label="Pick or input full date :"></e-date-picker>
          <e-date-picker .value="${"Current"}"
          label="Pick or input full date :"
              disabled="${true}"
              checkBoxName="current"
              checkBoxDescription="Currently used"
              .checkBox="${true}">Pick or input full date :</e-date-picker>
        </div>

        <div class="components">
            <e-file-upload .acceptedFiles="${[fileTypes.pdf]}" @uploaded="${this.handleFile}"></e-file-upload>
            <e-file-upload .previouslyUploadedFile=${{ name: 'file.pdf' }}></e-file-upload>
            <e-file-upload error="Error:Please upload a pdf file"></e-file-upload>
            <e-file-upload .canUploadLater="${false}" .submitFile="${()=>{}}" .file=${{ name: 'file.pdf' }}></e-file-upload>
          </div>

          <div class="components">
          <e-checkbox label="CheckBox Label"></e-checkbox>
          <e-checkbox label="CheckBox Label" checked></e-checkbox>
          </div>

          <e-radio-group name="thisOptions" .options="${['Yes', 'No', 'Maybe']}"></e-radio-group>
          <e-radio-group .options="${['Yes', 'No']}" .optionsDescriptions=${[
      { option: 'Yes', descriptions: ['A description for this option'] },
      { option: 'No', descriptions: ['A description for this option'] },
    ]}></e-radio-group>
        </e-collapsible>

        <e-collapsible collapsibleHeading="Pills" collapsibleContentsInfo="standard app pills">
          ${this.renderPills()}
        </e-collapsible>

        <e-collapsible collapsibleHeading="Lists" collapsibleContentsInfo="standard cards stylings">
          <div class="components">
          <e-list-option @selected="${this.handleSelectedOption}" .options="${['Option 1','Option 2','Option 3']}"></e-list-option>
          ${this.renderSelectedOption()}

          <e-list-option @selected="${this.handleSelectedOptions}" .options="${this.options}"></e-list-option>
          ${this.renderSelectedOptions()}

          </div>
         
        </e-collapsible>

        <e-collapsible collapsibleHeading="Progress" collapsibleContentsInfo="standard form progress and ratings">
          ${this.stepperSections.map(
            (section) => html`
              <e-review-survey-progress-stepper
                .sections=${this.stepperSections}
                .currentSection=${section}
              ></e-review-survey-progress-stepper>
            `
          )}
        </e-collapsible>
        <e-collapsible
          collapsibleHeading="Icons"
          collapsibleContentsInfo="standard way for using icons"
        >
          <span class="material-symbols-outlined">radio_button_unchecked</span>
          <span class="material-icons">radio_button_unchecked</span>

          <span class="material-symbols-outlined">info</span>
          <span class="material-icons">info</span>

          <span class="material-symbols-outlined">fullscreen</span>
          <span class="material-icons">fullscreen</span>

          <span class="material-symbols-outlined">face</span>
          <span class="material-icons">face</span>

          <span class="material-symbols-outlined">search</span>
          <span class="material-icons">search</span>

          <span class="material-symbols-outlined">settings</span>
          <span class="material-icons">settings</span>
         
        </e-collapsible>
      </div>
    `;
  }
}
window.customElements.define('e-app-components', AppComponents);
