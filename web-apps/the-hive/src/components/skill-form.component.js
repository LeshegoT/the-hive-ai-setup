import {LitElement, html} from 'lit';
import './list-options.component';
import './search.component';
import './select.component';
import './button.component';
import {NumberInput} from './number-input.component';
import './radio-group.components';
import './notification.component';
import './free-text-input.component';
import './loader.component';
import './checkbox.component';
import { FieldTypeConverter } from '@the-hive/lib-skills-shared';
import { findAttributesForSearchTextException, splitIntoSkillPaths, mergeSkillPaths } from '@the-hive/lib-skills-web';
import { FieldTypeService } from '../services/field-types.service'
import skillsService from '../services/skills.service';
import { shared } from '../styles';
import { fileTypes } from './file-upload.component';
import { PAST_DATE_RANGE ,FULL_DATE_TYPE,MONTH_YEAR_TYPE } from './date-picker.component';
import configService from '../services/config.service';
import { skillsGlobalEventDispatcher } from './user-skills.component';
import { debounce } from '../debounce';
const PROOF_FIELD_NAME = 'proof'
const CURRENT_FIELD_STRING_VALUE = 'current'
const MAXIMUM_ALLOWED_MERGABLE_SKILL_PATHS = 2
const styles = html`
  <style>
    ${shared()} :host {
      border-bottom: var(--small-border-size) solid var(--primary-red-color);
    }
    form {
      display: grid;
      grid-template-columns: 1fr;
      column-gap: var(--large-gap);
      row-gap:var(--medium-gap);
      margin-block: var(--standard-margin);
    }
    form > * {
      grid-column: span 1;
    }
    form > .file-upload,
    form > .radio-group {
      grid-column: span 1;
    }
    .form-heading {
      grid-column: span 1;
      margin-block: var(--standard-margin);
    }

    e-button {
      justify-self: end;
      grid-column: span 1;
    }

    @media (min-width: 600px) {
      form {
        grid-template-columns: repeat(2, 1fr);
      }

      form > .file-upload,
      form > .radio-group {
        grid-column: span 2;
      }

      .form-heading {
        grid-column: span 2;
      }

      e-button {
        grid-column: span 2;
      }
    }
    .container {
      padding: var(--large-padding);
    }
    .control-buttons {
      display: flex;
      justify-content:flex-end;
      gap:var(--medium-grid-gap);
      align-items:center;
    }
    p{
      height:var(--small-margin);
      margin:0;
    }

    a{
      margin-left: auto;
      cursor: pointer
    }

    h1 {
      font-size: var(--font-size-large);
      font-weight: var(--large-font-weight);
      margin: 0;
    }

    header {
      display: flex;
    }

    .bold {
      font-weight: bold;
    }

    .modal{
      display: flex;
      inset: 0;
      justify-content: center;
      align-items: center;
      margin: var(--standard-margin);
      position: fixed;
      z-index: var(--z-index-overlay);
      background-color: var(--shadow-color);
      margin: 0;
    }

    .overlay-box{
      background-color: var(--app-light-text-color);
      padding: var(--large-padding);
      border-radius: var(--small-radius);
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: var(--small-gap);

      & > * {
        padding: var(--small-padding);
      }
      & > h1 {
        font-size: var(--font-size-large);
        font-weight: var(--medium-font-weight)
      }
      & > e-button{
        margin: auto;
      }
      & > span {
        margin: auto;
      }
      & > .material-icons-outlined{
        color: var(--neutral-grey-color);
      }
    }
    .add-new,.add-icon{
      color:var(--primary-red-color);
      font-size:var(--font-size-small);
      font-weight:var(--semi-bold-font-weight);
    }
    .add-new{
      padding-inline:var(--standard-padding)
    }
    .add-icon{
      padding-inline:var(--small-padding)
    }
    .custom-result{
      justify-content:flex-start;
    }
    .attachment-container {
      border: var(--small-border-size) dashed var(--app-tertiary-color);
      display: flex;
      align-items: center;
      padding-inline: var(--large-padding);
      & > a {
        color: var(--primary-red-color);
        cursor: default;
      }
    }
    .file-container{
      display: flex;
      gap: var(--small-grid-gap);
      align-items: center;
      & > a {
        margin: 0;
      }
    }
    label {
      font-size: var(--font-size-medium-small);
      font-weight: var(--regular-font-weight);
    }
    .button-container{
      display: flex;
      margin: auto;
      gap: var(--small-grid-gap);
    }
  </style>
`;

const FieldType = {
  LAST_USED: 'lastUsed',
  DATE_OF_GRADUATION: 'dateOfGraduation',
  EXPERIENCE_RATING:"yearsOfExperienceRating",
  OBTAINED_FROM: 'obtainedFrom',
  PROOF: 'proof',
  ACHIEVED_DATE: 'achievedDate',
  EXPIRY_DATE:'expiryDate'
};
class SkillForm extends LitElement {
  constructor() {
    super();
    this.fieldTypeConverter = new FieldTypeConverter(
      skillsService.mapStandardizedNameToCanonicalName,
      skillsService.mapStaffIdToDisplayName
    );
    this.fieldTypeService = new FieldTypeService();
    this.fieldsmap = undefined;
    this.requiredFields = [];
    this.requiredFieldsOptions = [];
    this.fields = [];
    this.editedFields = [];
    this.newInstitutionName = undefined;
    this.newAttributeName = undefined;;
    this.errors = {};
    this.editableAttribute = undefined;
    this.fieldMap = undefined;
    this.searchForInstitutions = debounce(
      async (searchText, attribute) => {
        this.institutions = await skillsService.getInstitutionsSearchResults(searchText, attribute);
      },
      configService.searchDebounceTimeInMilliseconds
    );
  }

  static get properties() {
    return {
      searchResults: { type: Array },
      userAttributes: { type: Array },
      requiredFieldsOptions: { type: Array },
      fields: { type: Array },
      selectedAttribute: { type: String },
      selectedAttributeDetails: { type: Object },
      error: { type: String },
      newInstitutionName: { type: String },
      newAttributeName: { type: String },
      file: { type: Object },
      errors: { type: Object },
      willUploadLater: { type: Boolean },
      expiryDateBoxChecked: { type: Boolean },
      editableAttribute: { type: Object },
      institutions: { type: Array },
      message: { type: String },
      type: { type: String },
      editedFields: { type: Array },
      ratingDescriptions: { type: Object },
      searchExceptionss: { type: Array },
      errorSearchText: { type: String },
    };
  }

  cancelEdit() {
    this.editableAttribute = undefined;
    this.dispatchEvent(new CustomEvent('cancel-edit'));
    this.resetAllFields();
  }

  getRatingLabelsForField(fieldName) {
    const lowerCaseFieldName = fieldName.toLowerCase();
    const matchingFieldKey = Object.keys(this.ratingDescriptions).find(
      key => key.toLowerCase() === lowerCaseFieldName
    );
    return matchingFieldKey ? Object.keys(this.ratingDescriptions[matchingFieldKey]) : [];
  }

  getRatingDescriptionsForField(fieldName) {
    const lowerCaseFieldName = fieldName.toLowerCase();
    const matchingFieldKey = Object.keys(this.ratingDescriptions).find(
      key => key.toLowerCase() === lowerCaseFieldName
    );
    return matchingFieldKey
      ? Object.entries(this.ratingDescriptions[matchingFieldKey]).map(([option, descriptions]) => ({
          option,
          descriptions
        }))
      : [];
  }

  async getExperienceLevelsAndDescriptions() {
    this.ratingDescriptions =  await skillsService.getExperienceLevelsAndDescriptions();
    this.requestUpdate();
  }

  async getSearchExceptions() {
    this.searchExceptions = await skillsService.getSearchExceptions();
  }

  async getInstitutionsThatOfferAttribute() {
    let attribute;
    if (this.selectedAttributeDetails) {
      attribute = this.selectedAttributeDetails.standardizedName;
    } else {
      attribute = this.editableAttribute.attribute.standardizedName;
    }
    this.institutions = await skillsService.getInstitutionsThatOfferAttribute(attribute);
  }

  async getAttributeData(event) {
    this.error = undefined;
    this.selectedAttributeDetails = event.detail;
    this.searchResults = undefined;
    this.selectedAttributeDetails = await skillsService.getAttributeData(
      this.selectedAttributeDetails.standardizedName,
    );
    const attributeAlreadyAdded = this.userAttributes.some(
      (userAttribute) => userAttribute.attribute.standardizedName === this.selectedAttributeDetails.standardizedName,
    );
    if (this.selectedAttributeDetails && !attributeAlreadyAdded) {
      await this.getAttributeInfo();
    } else {
      //Do not fetch attribute info since it has been achieved or is not defined.
    }
  }

  async getAttributeInfo() {
    this.requiredFields = this.selectedAttributeDetails.requiredFields.map(field=>field.standardizedName);
    this.attributeType = this.selectedAttributeDetails.attributeType;
    await this.getFieldsMap();
    await this.getInstitutionsThatOfferAttribute();
    this.requestUpdate();
  }

 hasInputErrors() {
    const requiredInputComponents = this.shadowRoot.querySelectorAll('[required]');
    for(const component of requiredInputComponents) {
      component.handleErrors();
    }
    if (this.requiredFieldsOptions.some(field => field.name === FieldType.EXPIRY_DATE)) {
      const expiryDateComponent = this.shadowRoot.querySelector(`.${FieldType.EXPIRY_DATE}`);
      const achievedDateComponent = this.shadowRoot.querySelector(`.${FieldType.ACHIEVED_DATE}`);
      this.checkExpiryDateAfterAchievedDate(expiryDateComponent, achievedDateComponent);
    }
    else {
      // Expiry date component doesn't exist so don't validate
    }
   return Array.from(requiredInputComponents).some((component) => component.error);
  }

  async fetchSearchResults(event) {
    this.errorSearchText = undefined;
    this.searchText = event.detail;
    this.requiredFields = [];
    this.fields = [];
    this.editedFields = [];
    this.newInstitutionName = undefined;
    this.newAttributeName = undefined;
    this.searchResults = undefined;
    this.selectedAttributeDetails = undefined;
    this.attributeType = undefined;
    this.expiryDateBoxChecked = false;
    const matchingSearchTextExceptions = findAttributesForSearchTextException(this.searchExceptions, this.searchText);
    const isSearchTextValidLength = this.searchText.length >= configService.skillMinSearchCharacters;
    if (this.searchText === '' || (!isSearchTextValidLength && matchingSearchTextExceptions.length === 0)) {
      this.searchResults = undefined;
    } else if(this.searchText !== '' && !isSearchTextValidLength && matchingSearchTextExceptions.length > 0){
      this.searchResults = matchingSearchTextExceptions.map((attribute) => {
        return {
        ...attribute,
          name: attribute.canonicalName,
          styledListItems: this.addCustomStylingToAttributeSkillPath(attribute)
        }
      });
    } else {
      try {
        const results = await skillsService.getAttributeSearchResults(this.searchText);
        this.searchResults = results.map((result) => {
          const styledListItems = this.addCustomStylingToAttributeSkillPath(result);
          return {
            ...result,
            name: result.canonicalName,
            styledListItems,
          };
        });
      } catch (_error) {
        this.errorSearchText = this.searchText;
        this.message = 'Failed to get search results. ';
        this.type = 'error';
        this.resetAllFields();
      }
    }
  }

  addCustomStylingToAttributeSkillPath(result) {
    const attributeAlreadyAdded = this.userAttributes.some((userAttribute) => userAttribute.attribute.standardizedName === result.standardizedName);
    const startSkillPath = result.skillPath.at(0);
    const skillPaths = splitIntoSkillPaths(result.skillPath, startSkillPath);
    const mergedSkillPaths = mergeSkillPaths(startSkillPath, skillPaths, MAXIMUM_ALLOWED_MERGABLE_SKILL_PATHS);
    return [
      { name: attributeAlreadyAdded ? "(already added)" : "", class: "primary-color-text" },
      { name: `${mergedSkillPaths}`, class: "grey-color-text"}
    ];
  }

 async handleCertificateExpires(event) {
      this.expiryDateBoxChecked = event.detail;
      if(event.detail){
        this.requiredFields.push(FieldType.EXPIRY_DATE);
      }
      else{
        this.requiredFields = this.requiredFields.filter(field=>field!== FieldType.EXPIRY_DATE);
      }
      await this.getFieldsMap();
  }

  handleUploadLater(event) {
    this.willUploadLater = event.detail;
    this.removeField(PROOF_FIELD_NAME);
    if (this.willUploadLater) {
      this.addField(PROOF_FIELD_NAME,configService.skillsFileDefault);
      this.file = undefined
      delete this.errors[PROOF_FIELD_NAME]
    } else {
      //Upload later not checked, file will be captured with the rest of the fields on the form
    }
  }

  async handleNewAttributeType(event) {
    this.error = undefined;
    this.fields = [];
    this.editedFields = [];
    this.requiredFields = undefined;
    this.institutions = undefined;
    this.newInstitutionName = undefined;
    this.attributeType = event.detail;
    this.searchResults = undefined;
    const attributeData = await skillsService.getTopLevelTagData(event.detail);
    this.requiredFields = attributeData.fields;
    await this.getFieldsMap()
      this.institutions = await skillsService.getInstitutionsByAttributeType(this.attributeType)
      this.requestUpdate()

  }

  async handleNewAttributeName() {
    this.newAttributeName = this.searchText;
    this.selectedAttributeDetails = { canonicalName: this.newAttributeName };
  }

 async addNewAttribute(fields) {
    if (this.newAttributeName && this.attributeType && !this.selectedAttributeDetails?.standardizedName) {
      const attributeType = this.topLevelTags.find((tag) => tag.canonicalName === this.attributeType);
      if (attributeType) {
        const response = await skillsService.addNewAttribute(
          this.newAttributeName,
          attributeType.standardizedName,
          fields,
        );
        if (response.message) {
          throw new Error(response.message || `Failed to add ${this.newAttributeName} to your portfolio`);
        } else {
          this.selectedAttributeDetails = response;
        }
      } else {
        throw new Error( `Failed to add ${this.newAttributeName} to your portfolio`);
      }
    } else {
      //Don't add as new attribute,we assume a new attribute is being added when we have both the name and the type of that new attribute
    }
  }
  showInstitutionInputField(){
    this.institutionSearchText = undefined;
    this.institutions = undefined;
    this.newInstitutionName = '';
  }

  handleNewInstitutionInput(fieldName){
    return (event) => {
      this.removeField(fieldName)
      const institutionName = event.detail;
      const institution = this.institutions.find(institution=>institution.canonicalName === institutionName);
      this.addField(fieldName,institution.standardizedName);
    }
  }

  handleNewInstitution(fieldName,searchText){
    this.removeField(fieldName)
    return async (event) => {
      if(event.detail){
        this.newInstitutionName = searchText || event.detail;
        this.institutions = undefined;
        this.institutionSearchText = undefined;
      } else {
        // don't do anything since nothing was entered
      }
    }
  }

  resetNewInstitution(fieldName) {
    return async () => {
      this.newInstitutionName = undefined;
      this.institutionSearchText = undefined;
      await this.getInstitutionSearchResults()
      this.removeField(fieldName)
    };
  }

  cancelSearching(event) {
    const searchComponent = this.shadowRoot.querySelector('e-search') || undefined;
    if (searchComponent && (event.detail || event.type === 'reset')  && !this.selectedAttributeDetails?.canonicalName) {
      searchComponent.shadowRoot.querySelector('input').value = '';
      searchComponent.hideOptions();
      this.searchResults = undefined;
      searchComponent.searchText = ''
    } else {
      //form is on screen, don't clear the attribute being added
    }
  }

  isValidInstitutionSearch() {
    return !this.institutionSearchText || (this.institutionSearchText.length >= configService.skillMinSearchCharacters && this.institutionSearchText.length <= configService.skillMaxCharacterLimit)
  }

  async getInstitutionSearchResults(searchText = undefined) {
    this.institutionSearchText = searchText;
    this.institutions = undefined;
    
    let attribute;
    if (this.selectedAttributeDetails) {
      attribute = this.selectedAttributeDetails.standardizedName;
    } else {
      attribute = this.editableAttribute.attribute.standardizedName;
    }

    if (!searchText && !this.newInstitutionName) {
      if (this.newAttributeName) {
        this.institutions  = await skillsService.getInstitutionsByAttributeType(this.attributeType);
      } else {
        await this.getInstitutionsThatOfferAttribute();
      }
    } else if(this.newInstitutionName != undefined && this.isValidInstitutionSearch()){
      this.searchForInstitutions.debounced(searchText);
    } else if (this.isValidInstitutionSearch()) {
      this.searchForInstitutions.debounced(searchText, attribute);
    }
  }

  handleFieldChange(fieldName) {
    return async (event) => {
      if(event.detail){
        this.removeField(fieldName);
        const expiryDateRequired = this.requiredFieldsOptions.some(field => field.name === FieldType.EXPIRY_DATE);
        if (expiryDateRequired && (fieldName === FieldType.EXPIRY_DATE || fieldName === FieldType.ACHIEVED_DATE)) {
          const expiryDateComponent = this.shadowRoot.querySelector(`.${FieldType.EXPIRY_DATE}`);
          const achievedDateComponent = this.shadowRoot.querySelector(`.${FieldType.ACHIEVED_DATE}`);

          expiryDateComponent.handleErrors();
          achievedDateComponent.handleErrors();

          this.checkExpiryDateAfterAchievedDate(expiryDateComponent, achievedDateComponent);
        }
        else {
          // Expiry date component doesn't exist so don't validate
        }
        if (fieldName== PROOF_FIELD_NAME) {
          this.file = event.detail;
        }else if(fieldName == FieldType.LAST_USED && event.detail == CURRENT_FIELD_STRING_VALUE){
          this.addField(fieldName, event.detail);
        } else {
          const parsedValue = event.type === 'date-updated' ? event.detail : await this.fieldMap[fieldName].parse(event.detail)
          this.addField(fieldName, this.fieldMap[fieldName].toGremlin(parsedValue));
        }
        delete this.errors[fieldName];
      }
      else{
        //No input on the field, there's no value to process
      }
    };
  }

  renderNewInstitutionCustomOption(field){
    if(this.institutionSearchText){
      return html`
       <li
          tabindex="0"
          @click="${this.handleNewInstitution(field,this.institutionSearchText)}"
          class="inline-flex-items custom-result"
          slot="custom-option"
          slot="custom-option"
          data-selectedresult="${this.institutionSearchText}"
        >
        ${this.institutionSearchText}
          <span class="add-new inline-flex-items">
            <a class="material-icons add-icon">add</a>
            Add new
          </span>
        </li>
      `
    }
    else{
      return html``
    }
  }

  getPreviouslyUploadedFile(fieldName){
    if(this.editableAttribute && this.fields.length > 0 ){
      const fileValue = this.fields.find(field=>field.standardizedName === fieldName).value
      if(fileValue === configService.config.SKILL_FILE_DEFAULT){
        return undefined
      }
      else{
        return fileValue
      }
    }
    else{
      //Submitted attribute details are not available so we have no file to read
    }
  }

  setDefaultValueForField(fieldName){
    if(this.editableAttribute){
      return this.editableAttribute.fieldValues[fieldName]
    }
    else{
      //Default value does not need to be set, form will show on screen with empty/clear fields
      //We only set default values when editing  to autofill form with previously entered data
    }
  }

  renderComponent(fieldOption) {
    return  {
      'e-number-input': () => html`
        <div>
          <e-number-input
            required
            step="0.5"
            max="40"
            label=${fieldOption.label}
            min="0.5"
            name="${fieldOption.name}"
            value="${Number(this.setDefaultValueForField(fieldOption.name))}"
            @change="${this.handleFieldChange(fieldOption.name)}"
            placeholder="Input ${fieldOption.label.toLowerCase()}"
            decimals="3">
          </e-number-input>
        </div>
      `
    };
  }

  getComponentToRenderByType(inputType) {
    const numberInputTag = customElements.getName(NumberInput);
    const componentTags = [numberInputTag];
    return componentTags.find((tagName) => {
        const elementClass = customElements.get(tagName);
        return elementClass && new elementClass().htmlInputType === inputType;
    });
}

  lookupFieldLabel(fieldStandardizedName) {
    return this.fieldMap[fieldStandardizedName].fieldLabel;
  }

  renderInstitutionSearchFallbackOption() {
    if(this.isValidInstitutionSearch()){
      return html`<li tabindex="0" @click="${this.showInstitutionInputField}" slot="custom-option">
       ${this.institutions == undefined ? 'Searching...':"Can't find my institution"}
      </li>`;
    }
    else{
      return '';
    }
  }

  renderRequiredFields(field,fieldOption) {
    const componentToRenderByType= this.getComponentToRenderByType(fieldOption.type.inputType) ||undefined;
    if(fieldOption.rating && field != FieldType.EXPERIENCE_RATING){
      return this.renderRatingComponents(fieldOption)
    }
    else if(componentToRenderByType && field != FieldType.EXPERIENCE_RATING){
      return this.renderComponent(fieldOption)[componentToRenderByType]();
    }
    else{
    switch (field) {
      case FieldType.LAST_USED:
        return html`
          <div>
            <e-date-picker name="${this.lookupFieldLabel(field)}"
              required
              label="${this.lookupFieldLabel(field)}:"
              @date-updated="${this.handleFieldChange(field)}"
              @checkBox-updated="${this.handleFieldChange(field)}"
              type="month"
              .value="${this.editableAttribute?.fieldValues[field]}"
              dateRange="${PAST_DATE_RANGE}"
              ?disabled="${this.editableAttribute?.fieldValues[field] === CURRENT_FIELD_STRING_VALUE}"
              checkBoxName="current"
              checkBoxDescription="Currently used"
              .checkBox="${this.editableAttribute?.fieldValues[field] === CURRENT_FIELD_STRING_VALUE ? true : false}"
              >
            </e-date-picker>
            <p class="error-message">${this.errors[field] || ''}</p>
          </div>
        `;

      case FieldType.ACHIEVED_DATE:
        return html`
          <div>
            <e-date-picker yearCutOff=${configService.config.SKILL_YEAR_CUT_OFF}
              class="${FieldType.ACHIEVED_DATE}"
              name="${this.lookupFieldLabel(field)}"
              required
              label="${this.lookupFieldLabel(field)}:"
              @date-updated="${this.handleFieldChange(field)}"
              type="${MONTH_YEAR_TYPE}"
              .value="${this.editableAttribute?.fieldValues[field]}"
              dateRange="${PAST_DATE_RANGE}"
            >
            </e-date-picker>

            ${this.newAttributeName
              ? html`
                  <e-checkbox name="expires" @change="${this.handleCertificateExpires}" ?checked="${this.expiryDateBoxChecked}" label="Does this certificate expire?">
                  </e-checkbox>
                `
              : html``}
          </div>
        `;
      case FieldType.DATE_OF_GRADUATION:
        return html`
          <e-date-picker label="${this.lookupFieldLabel(field)}:" yearCutOff=${configService.config.SKILL_YEAR_CUT_OFF} name="${this.lookupFieldLabel(field)}" required @date-updated="${this.handleFieldChange(field)}" type="year" .value="${this.editableAttribute?.fieldValues[field]}"  dateRange=${PAST_DATE_RANGE}>
          </e-date-picker>
        `;
      case FieldType.EXPIRY_DATE:
        return html`
          <e-date-picker
            class="${FieldType.EXPIRY_DATE}"
            label="${this.lookupFieldLabel(field)}:"
            name="${this.lookupFieldLabel(field)}"
            required
            @date-updated="${this.handleFieldChange(field)}"
            type="${FULL_DATE_TYPE}"
            .value="${this.editableAttribute?.fieldValues[field]}"
          >
          </e-date-picker>
          `;
      case FieldType.EXPERIENCE_RATING:
        return html`
          <div>
                <e-select
                .options="${this.getRatingLabelsForField(field)}"
                  .selectedResult="${this.editableAttribute?.fieldValues[field] || ''}"
                  @selected="${this.handleFieldChange(field)}"
                  placeholder="Select years experience in this quality"
                  label="Years of experience:"
                  required
                >
                </e-select>
              </div>
        `;
      case "expertiseLevel":
        return html`
          <div class="radio-group">
            <e-radio-group
            label="Select your experience level in this particular quality:"
             required .optionsDescriptions="${this.getRatingDescriptionsForField(field)}"  .checked="${this.editableAttribute?.fieldValues[field]}" .options="${this.getRatingLabelsForField(field)}" @change="${this.handleFieldChange(field)}">
            </e-radio-group>
          </div>
        `;
        case FieldType.OBTAINED_FROM:
          if( this.newInstitutionName !== undefined) {
            return html`
             <e-search
             class="institution-input"
             label="Institution:"
             name="institution"
             required
             @result-selected="${this.handleNewInstitution(field)}"
             @reset=${this.resetNewInstitution(field)}
             maxSearchCharacters="${configService.skillMaxCharacterLimit}"
             minSearchCharacters="${configService.skillMinSearchCharacters}"
             .searchResults="${this.institutions?.map(institution=>institution.canonicalName) || []}"
             .predefinedInvalidInputs="${this.restrictedWordsValues}"
             invalidInputError="${`Error : ${this.institutionSearchText} is not a valid institution name`}"
             searchText="${ this.institutionSearchText || ''}"
             selectedResult = "${this.newInstitutionName}"
             @onsearch="${(event) => this.getInstitutionSearchResults(event.detail)}"
             placeholder="Enter the name of your institution"
      >
       ${this.renderNewInstitutionCustomOption(field)}
      </e-search>
            `;
          } else {
            return html`
              <div>
                <e-select
                class="institution-input"
                .options="${this.institutions?.map(institution=>institution.canonicalName)}"
                  .selectedResult="${this.editableAttribute?.fieldValues[field] || ''}"
                  @selected="${this.handleNewInstitutionInput(field)}"
                  @onsearch="${(event) => this.getInstitutionSearchResults(event.detail)}"
                  minimumSearchCharacters="${configService.skillMinSearchCharacters}"
                  maximumSearchCharacters="${configService.skillMaxCharacterLimit}"
                  placeholder="Search Institution"
                  label="Institution:"
                  mode="search"
                  required
                >
                ${this.renderInstitutionSearchFallbackOption()}
                </e-select>
              </div>
            `;
          }
      case FieldType.PROOF:
            let checked;
            if(this.editableAttribute && this.editableAttribute.fieldValues.proof){
              checked = (this.editableAttribute.fieldValues.proof === configService.config.SKILL_FILE_DEFAULT)
            } else {
              checked = this.willUploadLater || false;
            }
            return html`
            <div class="file-upload">
              <e-file-upload
              .previouslyUploadedFile=${this.getPreviouslyUploadedFile(field)}
              @download-file=${() => this.downloadAttachment(this.fields.find((fieldEntry) => fieldEntry.standardizedName === field).value)}
              @delete-file=${() => this.removeAttachement(field)}
              fileSize = ${configService.maximumFileSize}
              ?canUploadLaterChecked="${checked}"
                .acceptedFiles="${[fileTypes.pdf]}"
                @uploaded="${this.handleFieldChange(field)}"
                name="upload"
                @checked="${this.handleUploadLater}"
                required
                label="Upload proof:"
              >
              </e-file-upload>
              <p class="error-message">${this.errors[field] || ''}</p>
            </div>
          `;
      default:
        return html``;
    }
  }
  }


  async downloadAttachment(filePath) {
    const blob = await skillsService.getAttachment(filePath)
    const filename = 'attachment.pdf';
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a)
}

  removeAttachement(fieldName) {
    const field = this.fields.find(fieldEntry => fieldEntry.standardizedName === fieldName);
    if (field?.value) {
      field.value = configService.skillsFileDefault;
      this.requestUpdate();
    } else {
      //There is no file value to change
    }
  }

  async mapFieldsFromEditableAttribute() {
    await this.getInstitutionsThatOfferAttribute()
    this.requiredFields = this.editableAttribute.attribute.requiredFields.map(field => field.standardizedName);
    await this.getFieldsMap();
    if(!this.editableAttribute){
    const fieldNames = Object.keys(this.editableAttribute.fieldValues);
    await Promise.all(
      fieldNames.map(async (field) => {
        const fieldValue = this.editableAttribute.fieldValues[field];
        const parsedValue = await this.fieldMap[field].parse(fieldValue);
        this.editableAttribute.fieldValues[field] = fieldValue === CURRENT_FIELD_STRING_VALUE ? CURRENT_FIELD_STRING_VALUE : await this.fieldMap[field].toDisplay(parsedValue);
      })
    );
    }
    this.attributeType = this.editableAttribute.attribute.attributeType
    this.fields = Object.keys(this.editableAttribute.fieldValues).map(field => {
      return { standardizedName: field, value: this.editableAttribute.fieldValues[field] };
    });
  }

  resetFeedbackMessages() {
    const notification = this.shadowRoot.querySelector('e-notification');
    if (!notification && (this.message )) {
      this.message = undefined;
      this.errorSearchText = undefined;
    } else {
      //showing notification message
    }
  }

  async updated(changedProperties) {
    this.resetFeedbackMessages();
    if (changedProperties.has('editableAttribute') && this.editableAttribute) {
      this.resetAllFields();
      await this.mapFieldsFromEditableAttribute();
    } else {
      //Do nothing
    }
  }
  renderControlButtons() {
    return this.requiredFields && this.requiredFields.length > 0
      ? html`
          <div class="control-buttons">
            <e-button @click="${this.resetFieldsAndEditableAttribute}" size="large" color="secondary">Cancel</e-button>
            <e-button @click="${this.handleSubmit}" size="large" color="primary">Submit</e-button>
          </div>
        `
      : html``;
  }

  handleFile(event) {
    this.file = event.detail;
  }

  async uploadFile() {
    if (this.file) {
      let formData = new FormData();
      formData.append('file', this.file);
      const response = await skillsService.uploadUserFile(formData);
      this.addField(PROOF_FIELD_NAME,response.filePath);
    } else {
      //nothing, no file to submit
    }
  }

  async addNewInstitution() {
    const institutionName = this.findFieldByFieldName(FieldType.OBTAINED_FROM)?.value || this.newInstitutionName;
    if ((this.newInstitutionName || this.newAttributeName) && institutionName)  {
      this.removeField(FieldType.OBTAINED_FROM);
      const attributeCanonicalNameGuid = this.editableAttribute ? this.editableAttribute.attribute.canonicalNameGuid : this.selectedAttributeDetails.canonicalNameGuid;
      const attributeStandardizedName = this.editableAttribute ? this.editableAttribute.attribute.standardizedName : this.selectedAttributeDetails.standardizedName;
      const attributeCanonicalName = this.editableAttribute ? this.editableAttribute.attribute.canonicalName : this.selectedAttributeDetails.canonicalName;
      const newInstitution = await skillsService.addNewInstitution(institutionName, attributeCanonicalNameGuid, attributeStandardizedName, attributeCanonicalName);
      if(newInstitution.message){
        throw new Error(newInstitution.message);
      } else if(!newInstitution.standardizedName){
        throw new Error('Failed to add institution.');
      } else {
        this.addField(FieldType.OBTAINED_FROM, newInstitution.standardizedName);
      }
    } else {
      //nothing, no new institution to add
    }
  }
  connectedCallback() {
    super.connectedCallback();
    skillsGlobalEventDispatcher.addEventListener('user-attributes-fetched', this.retrieveUserAttributes);
  }

  disconnectedCallback() {
    skillsGlobalEventDispatcher.removeEventListener('user-attributes-fetched',this.retrieveUserAttributes);
    super.disconnectedCallback();
  }

  retrieveUserAttributes  = (event) =>{
    this.userAttributes = event.detail;
  }

  showFailedToLoadError(){
    this.message = `Error : Failed to load form`;
    this.type = 'error';
    this.resetAllFields();
  }

editAttribute() {
  this.editableAttribute = this.userAttributes.find(userAttribute => userAttribute.attribute.canonicalNameGuid === this.selectedAttributeDetails.canonicalNameGuid);
  if(!this.editableAttribute){
    this.showFailedToLoadError()
  }
  else{
    //form will show and user can edit
  }
}

 isSelectedAttributeAlreadyAddedForUser(){
  return this.selectedAttributeDetails?.standardizedName && this.userAttributes?.some(
      (userAttribute) => userAttribute.attribute.standardizedName === this.selectedAttributeDetails.standardizedName,
    );
}

  renderConfirmEdit() {
    const attributeAlreadyAdded = this.isSelectedAttributeAlreadyAddedForUser();
    if(attributeAlreadyAdded  && !this.requiredFields.length > 0){
      return html `
      <div class="modal">
        <div class="container overlay-box">
          <header>
            <h1>Already added</h1>
            <a class="material-icons-outlined icon" @click=${this.cancelEdit}>close</a>
          </header>
          <span>
            <span class="bold">${this.selectedAttributeDetails.canonicalName}</span> has already been added to your portfolio
          </span>
          <span>would you like to:</span>
          ${this.renderEditButtons()}
          </div>
      </div>
    `
    } else {
      return html ``
    }
  }

  async addUserAttribute(){
    this.preventUserFromAddingRestrictedWordAsAttribute(this.newAttributeName);
    try {
      await this.addNewAttribute(this.requiredFields);
      await this.addNewInstitution();
      if(this.selectedAttributeDetails){
        const response = await skillsService.addUserSkill(this.selectedAttributeDetails, this.fields);
        this.handleResponse(response)
      } else{
        //cannot continue to add the attribute for user because something went wrong either when adding new skill or institution
      }
    } catch (error) {
      this.message = error;
      this.type = 'error'
    }
  }

  renderEditButtons() {
    if (this.selectedAttributeDetails?.metaDataTags?.includes('Repeatable')) {
      return html `
        <div class="button-container">
          <e-button @click="${this.getAttributeInfo}" size="large" color="primary">Add new</e-button>
          or
          <e-button @click="${this.editAttribute}" size="large" color="primary">Edit existing</e-button>
        </div>
      `
    } else {
      return html `
        <e-button @click="${this.editAttribute}" size="large" color="primary">Edit existing</e-button>
      `
    }
  }

  async getFieldsMap() {
    if (this.requiredFields && this.requiredFields.length > 0) {
      this.fieldMap = this.fieldTypeConverter.createFieldsMap(this.requiredFields, this.skillsFields, this.jsTypes, this.jsTypeScales);
      const fieldsSortedByFormDisplayOrder = this.sortRequiredFieldsByFormDisplayOrder(this.requiredFields);
      this.requiredFieldsOptions = this.addOptionsToRequiredField(fieldsSortedByFormDisplayOrder);
      this.showErrorIfNoFieldsFound()
    } else {
      //no fields to map through
    }
  }

  removeField(fieldName) {
    if (this.editableAttribute) {
      this.editedFields = this.editedFields.filter(
        (field) => field.standardizedName !== fieldName
      );
    } else {
      this.fields = this.fields.filter((field) => field.standardizedName !== fieldName);
    }
  }

  addField(fieldName, fieldValue) {
    if (this.editableAttribute) {
      this.editedFields.push({standardizedName : fieldName,value: fieldValue});
    } else {
      this.fields.push({standardizedName : fieldName,value:fieldValue});
    }
  }

  findFieldByFieldName(fieldName) {
    if (this.editableAttribute) {
      return this.editedFields.find(field => field.standardizedName === fieldName)
    } else {
      return this.fields.find(field => field.standardizedName === fieldName)
    }
  }

  handleResponse(response) {
    if (!response.success) {
      this.message = response.error;
      this.type = 'error';
    } else {
      skillsGlobalEventDispatcher.dispatchEvent(new CustomEvent('skills-updated'));
      this.message = response.success;
      this.type = 'success';
      this.resetFieldsAndEditableAttribute();
      this.cancelEdit()
    }
  }

  async handleSubmit() {
    if (!this.hasInputErrors()) {
      this.message = '';
      await this.uploadFile()
      if(this.editableAttribute){
        try {
          await this.addNewInstitution();
          const response = await skillsService.updateUserAttribute(this.editableAttribute, this.editedFields);
          this.handleResponse(response);
        } catch (error) {
          this.message = error;
          this.type = 'error'
          return;
        }
      } else {
        await this.addUserAttribute();
      }
    } else {
      //some fields are missing, don't submit
    }
  }

  resetFieldsAndEditableAttribute() {
    this.cancelEdit();
    this.resetAllFields();
  }

  resetAllFields() {
    this.willUploadLater = false;
    this.requiredFields = [];
    this.fields = [];
    this.editedFields = [];
    this.errors = {};
    this.newInstitutionName = undefined;
    this.expiryDateBoxChecked = false;
    this.newAttributeName = '';
    this.institutions = undefined;
    this.file = undefined;
    this.searchResults = '';
    this.attributeType = '';
    this.selectedAttributeDetails = undefined;
    this.institutions = [];
    this.fieldMap = undefined;
    this.searchText = ''
    const searchElement = this.shadowRoot.querySelector('e-search');
    if (searchElement) {
      searchElement.selectedResult = '';
    } else {
      //No value to reset since search component is not on screen, NOTE, this should be handled by search component
    }
  }

  renderEditModal() {
    const topLevelTags = this.topLevelTags;
    const submitting = this.shadowRoot.querySelector('e-loader').message === 'Submitting...'
    if (this.requiredFields.length > 0) {
      return html`
      <header>
        <h1>
            Edit ${topLevelTags.find(topLevelTag => topLevelTag.standardizedName === (this.editableAttribute.attribute.attributeType)).canonicalName}:
            <span class="bold"> ${this.editableAttribute.attribute.canonicalName} </span>
        </h1>
        ${submitting? html`` :
          html`<a class="material-icons-outlined icon" @click=${this.cancelEdit}>close</a>`
         }
      </header>
        ${this.renderForm()}
      `;
    } else {
      return html`
        <e-loader></e-loader>
      `;
    }
  }

  async firstUpdated() {
    await this.getSearchExceptions()
    this.restrictedWordsDetails = await skillsService.getSkillsRestrictedWords();
    this.restrictedWordsValues = this.restrictedWordsDetails.map(restrictedWordDetail=>restrictedWordDetail.restrictedWord);
    this.topLevelTags = await skillsService.getTopLevelTags();
    this.getExperienceLevelsAndDescriptions();
    this.jsTypes = (await this.fieldTypeService.getJSTypes()).types;
    this.jsTypeScales = (await this.fieldTypeService.getJSTypeScale()).fields;
    this.skillsFields = (await this.fieldTypeService.getSkillsFields()).fields;
  }

  handleSelectNewAttribute(event) {
    if (event.key === 'Enter') {
      this.handleNewAttributeName(event);
    } else {
      //nothing,click events are already being handled
    }
  }

 renderFeedbackNotifications() {
  const hasErrorSearchText = !!this.errorSearchText;
  const mailto = hasErrorSearchText
    ? `mailto:skills-support@bbd.co.za?subject=Error searching for '${this.errorSearchText}'&body=Hi,%0D%0A%0D%0AI am getting an error trying to get search results for '${this.errorSearchText}' on my portfolio.`
    : `mailto:skills-support@bbd.co.za`;

  return this.message && this.type ? html`
    <e-notification type="${this.type}">
      ${this.message}${this.type === 'error' ? html`. Please <a href="${mailto}">contact support</a> if the problem persists.` : ''}
    </e-notification>
  ` : html``;
}

  renderForm() {
    let formLoading;
    if (this.newAttributeName) {
      formLoading = this.attributeType && this.requiredFields == undefined;
    } else {
      const attributeDetails = this.selectedAttributeDetails || {};
      formLoading = attributeDetails.canonicalNameGuid && !this.isSelectedAttributeAlreadyAddedForUser() && this.requiredFields.length == 0;
    }
    const loaderMessage = formLoading ? 'Loading form...' : 'Submitting...';
    return html`
      <e-loader
        message="${loaderMessage}"
        style="display: ${this.message === '' || formLoading ? 'block' : 'none'}"
      ></e-loader>
      <div style="display: ${this.message === '' ? 'none' : 'block'}">
        ${this.requiredFields && this.requiredFields.length > 0
          ? html`
              <form>${this.requiredFieldsOptions.map((field) => this.renderRequiredFields(field.name,field))}
            `
          : ''}
        ${this.renderControlButtons()}
      </div>
    `;
  }

  cancelAddingNewAttribute() {
    if (this.requiredFields.length == 0 && this.newAttributeName) {
      this.searchText = this.newAttributeName;
      this.newAttributeName = undefined;
    } else {
      //cancel will be on the form
    }
  }

  renderCancelNewAttributeButton() {
    if (!this.attributeType) {
      return html`
        <div class="control-buttons">
          <e-button @click="${this.cancelAddingNewAttribute}" size="large" color="secondary">Cancel</e-button>
        </div>
      `;
    } else {
      //form is on screen, don't show the cancel button
    }
  }

  renderSearchComponent() {
    if (this.searchExceptions){
    return html`
      <e-search
        ?disabled="${this.message == ''}"
        label="Find items to add to your portfolio:"
        maxSearchCharacters="${configService.skillMaxCharacterLimit}"
        .searchResults="${this.searchResults}"
        @onsearch="${this.fetchSearchResults}"
        @result-selected="${this.getAttributeData}"
        @cancel-select="${this.cancelAddingNewAttribute}"
        selectedResult="${this.selectedAttributeDetails?.canonicalName || this.searchText || ''}"
        @focusout="${this.cancelSearching}"
        minSearchCharacters=${configService.skillMinSearchCharacters}
        @reset="${this.resetAllFields}"
        .searchExceptions=${[...this.searchExceptions.map((searchTextException) => searchTextException.searchTextException.toLowerCase())]}
        placeholder="Input a specific qualification (e.g. BSc), certification (e.g. ECBA), skill (e.g. JavaScript), industry knowledge (e.g. Banking) or quality (e.g. mentorship) to add"
        >
        <li
          tabindex="0"
          @click="${this.handleNewAttributeName}"
          @keydown="${this.handleSelectNewAttribute}"
          class="inline-flex-items custom-result"
          slot="custom-option"
          data-selectedresult="${this.searchText}"
        >
          ${this.searchText}
          <span class="add-new inline-flex-items">
            <a class="material-icons add-icon">add</a>
            Add new
          </span>
        </li>
      </e-search>
    `;
    } else {
      return html``;
    }
  }


  preventUserFromAddingRestrictedWordAsAttribute(attributeName){
    const isRestrictedWord = attributeName && this.restrictedWordsValues.some(tag=>tag.toLowerCase() === attributeName.trim().toLowerCase());
    if(isRestrictedWord){
      this.message = `Error : Cannot add "${attributeName}" as a new ${this.attributeType.toLowerCase()}`
      this.type = 'error';
    }
    else{
      //attribute or institution name is allowed
    }

  }

  renderSelectAttributeType() {
    if (this.newAttributeName) {
      return html`
        <div class="new-attribute-section">
          <form>
            <e-select
              .options="${this.topLevelTags.map(tag=>tag.canonicalName)}"
              @selected="${this.handleNewAttributeType}"
              placeholder="Select type"
              label="What would you classify this as?"
              ?disabled="${this.message == ''}"
            ></e-select>
            ${this.renderCancelNewAttributeButton()}
          </form>
        </div>
      `;
    } else {
      return html``;
    }
  }

  renderRatingComponents(field) {
    const ratingDescriptions = this.getRatingDescriptionsForField(field.name);
      return html`
        <div class="radio-group">
          <e-radio-group
            required
            .optionsDescriptions="${ratingDescriptions}"
            .checked="${this.editableAttribute?.fieldValues[field.name] || ''}"
            .options="${this.getRatingLabelsForField(field.name)}" @change="${this.handleFieldChange(field.name)}"
            label="${field.label}:"
         >
         </e-radio-group>
       </div>
  `;
}

addOptionsToRequiredField(fields) {
  return fields.map((name) => {
    const fieldInfo = this.fieldMap[name];
    if (fieldInfo) {
      return {
        name,
        label: fieldInfo.fieldLabel,
        placeholder: fieldInfo.fieldLabel,
        required: true,
        rating: fieldInfo.rating,
        type: {inputType: fieldInfo.javaScriptType,description: fieldInfo.description,},
      };
    } else {
      return {};
    }
  });
}

showErrorIfNoFieldsFound() {
  const allDataFetched = this.skillsFields.length && this.jsTypeScales.length && this.jsTypes.length
  const allFieldOptionsAdded = this.requiredFieldsOptions.every(
    (obj) => Object.keys(obj).length > 0
  );
  if(!allDataFetched || !allFieldOptionsAdded) {
    this.showFailedToLoadError();
  } else {
    //Options have been added for all fields, form will show on screen
  }
}

  sortRequiredFieldsByFormDisplayOrder(requiredFields) {
    return requiredFields.sort((firstField, secondField) => {
      const firstFieldOrder = this.fieldMap[firstField].portfolioFormDisplayOrder
      const secondFieldOrder = this.fieldMap[secondField].portfolioFormDisplayOrder
      return firstFieldOrder - secondFieldOrder;
    });
  }

  checkExpiryDateAfterAchievedDate(expiryDateComponent, achievedDateComponent) {
    const invalidExpiryDate = !expiryDateComponent.error && !achievedDateComponent.error && new Date(expiryDateComponent.value) <= new Date(achievedDateComponent.value);

    if (invalidExpiryDate) {
      expiryDateComponent.error = 'Expiry date must be ahead of achieved date.';
    }
    else {
      // Don't set an error if there is already an error, or if the expiryDate is actually valid
    }
  }

  render() {
    return html`
      ${styles} ${this.renderFeedbackNotifications()}
      <div class="container">
        ${this.renderConfirmEdit()} ${this.renderSearchComponent()}
        ${this.renderSelectAttributeType()}
        ${this.editableAttribute
          ? html`
              <div class="modal">
                <div class="container overlay-box">${this.renderEditModal()}</div>
              </div>
            `
          : ''}
        ${!this.editableAttribute ? this.renderForm() : ''}
      </div>
    `;
  }
}

customElements.define('e-skill-form', SkillForm);
