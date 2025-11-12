import {LitElement, html} from 'lit';
import { eventsShared } from '../styles';
import eventsService from '../services/events.service.js';

import '@material/web/switch/switch.js';
import './pick-or-upload-event-image-file.component.js';

const styles = html`
  <style>
      ${eventsShared()} .form-header-container {
      display: flex;
      justify-content: start;
      border-bottom: solid 1px var(--app-review-divider-color);

      h2 {
        text-align: center;
        flex: 1;
      }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--large-gap);

      label {
        color: var(--app-assign-feedback-dark-color);
      }

      select option {
        font-size: var(--medium-font-size);
      }
    }

    input,
    select, textarea {
      font-family: 'Inter';
      font-weight: var(--regular-font-weight);
      padding: var(--standard-padding) 0;
      border-left: var(--small-border-size) solid var(--app-review-input-border-color);
      border-top: var(--small-border-size) solid var(--app-review-input-border-color);
      border-right: var(--small-border-size) solid var(--app-review-input-border-color);
    }

    .error {
      color: var(--app-warning-font-color);
    }

    .success {
      color: var(--app-success-font-color);
    }

    :host {
      background: var(--app-header-background-color);
      display: flex;
      flex-direction: column;
      padding: var(--app-form-padding);
      box-shadow: var(--app-form-box-shadow);
      border-radius: var(--small-radius);
      gap: var(--large-gap)
    }

    button {
      margin-top: var(--standard-margin);
      padding: var(--standard-padding);
      align-self: flex-end;
    }

  </style>
`;

class CreateEventTemplate extends LitElement {
  constructor() {
    super();
    this.handleImageChange = this.handleImageChange.bind(this);
  }

  async connectedCallback() {
    super.connectedCallback();
    this.offices = await eventsService.getOffices();
    this.categories = await eventsService.getCategories();
    this.isOnline = false;
  }

  render() {
    return html`
      ${styles} ${this.renderForm()}
    `;
  }

  renderForm() {
    return html`
      <form>
        <section class="form-header-container">
          <img src="../../images/icons/arrow-back.svg" @click=${this.onClose} />
          <h2 class="large-heading">Create Template</h2>
        </section>

        <label for="subject" class="medium-label">Subject</label>
          <input placeholder="Enter subject here." type="text" name="subject" .value="${this.subject ?? ''}" @input="${this.handleSubjectChange}" />
        <span class="error">${this.subjectError}</span>

        <label for="body" class="medium-label">Body</label>
          <textarea placeholder="Enter body here." type="text" name="body" .value="${this.body ?? ''}" @input="${this.handleBodyChange}"></textarea>
        <span class="error">${this.bodyError}</span>

        <label for="callToAction" class="medium-label">Call To Action</label>
        <input
          type="text"
          name="callToAction"
          placeholder="Enter call to action here."
          .value="${this.callToAction ?? ''}"
          @input="${this.handleCallToActionChange}"
        />
        <span class="error">${this.callToActionError}</span>

        <label for="office" class="medium-label">Office</label>
        <select name="office" @change="${this.handleOfficeIdChange}">
            <option value=-1 ?selected="${this.officeId === undefined || this.officeId === -1}">
            Select an office
          </option>
          ${this.renderOfficeDropdownOptions()}
        </select>
        <span class="error">${this.officeIdError}</span>

        <label for="category" class="medium-label">Category</label>
        <select name="category" @change="${this.handleCategoryIdChange}">
            <option value=-1 ?selected="${this.categoryId === undefined || this.categoryId === -1}">
            Select a category
          </option>
          ${this.renderCategoryDropdownOptions()}
        </select>
        <span class="error">${this.categoryIdError}</span>

        <section>
          <label for="is-online" class="medium-label">Is Online</label>
          <md-switch
            name="is-online"
            .checked="${this.isOnline ?? false}"
            @change="${this.handleIsOnlineChange}"
          ></md-switch>
        </section>

        <e-pick-or-upload-event-image @image-picked="${this.handleImageChange}"></e-pick-or-upload-event-image>
        
      </form>  
      <span class="error">${this.otherError}</span>      
      <button @click="${this.validateAndSubmitForm}" class="red-button">Create Template</button>

    `;
  }

  renderOfficeDropdownOptions() {
    return this.offices.map((office) => {
      return html`
        <option
          value="${office.officeId}"
          ?selected="${this.officeId !== undefined && this.officeId === office.officeId}"
        >
          ${office.officeName}
        </option>
      `;
    });
  }

  renderCategoryDropdownOptions() {
    return this.categories.map((eventCategory) => {
      return html`
        <option
          value="${eventCategory.categoryId}"
          ?selected="${this.categoryId !== undefined && this.categoryId === eventCategory.categoryId}"
        >
          ${eventCategory.category}
        </option>
      `;
    });
  }

  handleSubjectChange(event) {
    this.subject = event.target.value;
    this.subjectError = this.subject.length === 0 ? 'Please provide a subject.' : undefined;
    this.otherError = undefined;
  }

  handleBodyChange(event) {
    this.body = event.target.value;
    this.bodyError = this.body.length === 0 ? 'Please provide a body.' : undefined;
    this.otherError = undefined;
  }

  handleCallToActionChange(event) {
    this.callToAction = event.target.value;
    this.callToActionError = this.callToAction.length === 0 ? 'Please provide a call to action.' : undefined;
    this.otherError = undefined;
  }

  handleImageChange(event) {
    this.selectedImage = event.detail;
  }

  handleCategoryIdChange(event) {
    this.categoryId = Number(event.target.value);
    this.categoryIdError = this.categoryId === -1 ? 'Please select a category.' : undefined;
  }

  handleOfficeIdChange(event) {
    this.officeId = Number(event.target.value);
    this.officeIdError = this.officeId === -1 ? 'Please select an office.' : undefined;
  }

  handleIsOnlineChange(event) {
    this.isOnline = event.target.checked;
  }

  async validateAndSubmitForm() {
    const hasInvalidField = [
      this.subject && this.subject.length > 0,
      this.body && this.body.length > 0,
      this.callToAction && this.callToAction.length > 0,
      this.selectedImage,
      this.categoryId && this.categoryId !== -1,
      this.officeId && this.officeId !== -1,
    ].some((isValid) => !isValid);

    if (hasInvalidField) {
      this.otherError = 'Please fill in all fields.';
    } else {
      this.submitForm();
    }
  }

  async submitForm() {
    const response = await eventsService.createTemplate({
      subject: this.subject,
      body: this.body,
      callToAction: this.callToAction,
      imagePath: this.selectedImage.name,
      categoryId: this.categoryId,
      officeId: this.officeId,
      isOnline: this.isOnline,
    });

    if (response.errorMessages) {
      const errorMapping = {
        subject: 'subjectError',
        body: 'bodyError',
        callToAction: 'callToActionError',
        categoryId: 'categoryIdError',
        officeId: 'officeIdError'
      };

      for (const errorMessage of response.errorMessages) {
        const errorField = errorMapping[errorMessage.field] || 'otherError';
        this[errorField] = errorMessage.message;
      }
    } else if (response.message) {
      this.otherError = response.message;
    } else {
      this.onClose();
    }
  }

  onClose() {
    this.dispatchEvent(new CustomEvent('close'));
  }
  static get properties() {
    return {
      subject: String,
      body: String,
      callToAction: String,
      selectedImage: Object,

      categoryId: Number,
      officeId: Number,
      isOnline: Boolean,

      subjectError: String,
      bodyError: String,
      callToActionError: String,
      imageError: String,
      categoryIdError: String,
      officeIdError: String,

      otherError: String,

      offices: Array,
      categories: Array,
    };
  }
}

window.customElements.define('e-create-event-template', CreateEventTemplate);
