import {LitElement, html} from 'lit';
import { eventsShared } from '../styles/index.js';
import eventsService from '../services/events.service.js';

const styles = html`
  <style>
    ${eventsShared()}

    form {
      background: var(--app-header-background-color);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--app-form-padding) var(--app-form-padding);
      width: 100%;
      height: fit-content;
      margin: auto;
      box-shadow: var(--app-form-box-shadow);
      border-radius: var(--small-radius);
    }

    form h2 {
      margin: 0;
      width: 100%;
      text-align: center;
    }

    form label {
      width: 100%;
      color: var(--app-assign-feedback-dark-color);
    }

    label:nth-child(2) {
      margin-top: var(--app-form-margin);
    }

    .small-margin {
      margin-bottom: var(--app-form-margin);
    }

    input,
    select {
      width: 100%;
      padding: var(--standard-padding) 0;
      border-left: 1px solid var(--app-review-input-border-color);
      border-top: 1px solid var(--app-review-input-border-color);
      border-right: 1px solid var(--app-review-input-border-color);
    }

    form select option {
      font-size: var(--medium-font-size);
      border-radius: 0px;
    }

    .submit {
      padding: var(--standard-padding);
    }

    .submit-button-container {
      display: flex;
      justify-content: end;
      width: 100%;
    }

    .error {
      color: var(--app-warning-font-color);
    }

    .success {
      color: var(--app-success-font-color);
    }

    .form-header-container {
      width: 100%;
      display: grid;
      grid-template-columns: 1.9fr 0.1fr;
      border-bottom: solid 1px var(--app-review-divider-color);
    }

    .form-header-container img {
      cursor: pointer;
    }
  </style>
`;

class CreateOrUpdateEvent extends LitElement {
  constructor() {
    super();
  }

  static get properties() {
    return {
      event: Object,
      templates: Array,
      templateId: String,
      durationInMinutes: String,
      startDateTime: String,
      startDateTimeError: String,
      rsvpDueDateError: String,
      rsvpDueDate: String,
      durationInMinutesError: String,
      templateIdError: String,
      eventCreateSuccessMessage: String,
      eventCreationErrorMessage: String,
      eventUpdateSuccessMessage: String,
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    this.templates = await eventsService.getTemplates();
  }

  render() {
    return html`
      ${styles}
      <form>
        <section class="form-header-container">
          ${this.renderHeading()}
          <img src="../../images/icons/cancelled.svg" @click=${this.handleClose} />
        </section>

        <label for="templateId" class="medium-label">Event Template</label>
        <select name="templateId" class="small-margin" @change="${(e) => this.handleTemplateIdChange(e)}">
          <option>Select A template</option>
          ${this.renderTemplatesDropdown()}
          <option value="create-template">Create new template</option>
        </select>
        <span class="error">${this.templateIdError}</span>

        <label for="durationInMinutes" class="medium-label">Duration in Minutes</label>
        <input
          type="number"
          name="durationInMinutes"
          class="small-margin"
          @input="${(e) => this.handleDurationInMinutesChange(e)}"
          value=${this.initailDurationTimeValue()}
        />
        <span class="error">${this.durationInMinutesError}</span>

        <label for="startDateTime" class="medium-label">Start Date Time</label>
        <input
          type="datetime-local"
          name="startDateTime"
          class="small-margin"
          @change="${(e) => this.handleStartDateTimeChange(e)}"
          value=${this.initailStartTimeValue()}
        />
        <span class="error">${this.startDateTimeError}</span>

        <label for="rsvpDueDate" class="medium-label">RSVP Due Date Time</label>
        <input
          type="datetime-local"
          name="rsvpDueDate"
          class="small-margin"
          @change="${(e) => this.handleRsvpDateChange(e)}"
          value=${this.initailRsvpTimeValue()}
        />
        <span class="error">${this.rsvpDueDateError}</span>

        <section class="submit-button-container">${this.renderSubmitButton()}</section>

        <span class="success">${this.eventCreateSuccessMessage}</span>
        <span class="error">${this.eventCreationErrorMessage}</span>
        <span class="success">${this.eventUpdateSuccessMessage}</span>
      </form>
    `;
  }

  renderTemplatesDropdown() {
    return this.templates.map((template) => {
      if (this.event) {
        if (template.templateId === this.event.templateId) {
          return html`
            <option selected value=${template.templateId}>${template.subject}</option>
          `;
        } else {
          return html`
            <option value=${template.templateId}>${template.subject}</option>
          `;
        }
      } else {
        return html`
          <option value=${template.templateId}>${template.subject}</option>
        `;
      }
    });
  }

  renderHeading() {
    return this.event
      ? html`
          <h2 class="large-heading">Update Event</h2>
        `
      : html`
          <h2 class="large-heading">Create Event</h2>
        `;
  }

  renderSubmitButton() {
    return this.event
      ? html`
          <button class="red-button submit" @click="${(e) => this.handleSubmit(e)}">Update Event</button>
        `
      : html`
          <button class="red-button submit" @click="${(e) => this.handleSubmit(e)}">Create Event</button>
        `;
  }

  handleClose() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  isValidDate(date) {
    const todayDate = new Date();
    return todayDate > date ? 'Date already passed, please choose a future date or time.' : undefined;
  }

  handleDurationInMinutesChange(e) {
    this.durationInMinutes = parseInt(e.target.value);
    this.durationInMinutesError = undefined;
  }

  handleRsvpDateChange(e) {
    this.rsvpDueDate = new Date(e.target.value);
    this.rsvpDueDateError = this.isValidDate(this.rsvpDueDate);
    const startDateTime = new Date(this.startDateTime || this.event.startDateTime);
    const rsvpDueDate = new Date(this.rsvpDueDate || this.event.rsvpsCloseAt);

    if (startDateTime) {
      if (rsvpDueDate > startDateTime) {
        this.rsvpDueDateError = 'RSVP date cannot be after the start date of the event.';
      } else {
        this.rsvpDueDateError = undefined;
      }
    } else {
      this.rsvpDueDateError = 'Please set the event start date first.';
    }
  }

  handleStartDateTimeChange(e) {
    this.startDateTime = new Date(e.target.value);
    this.startDateTimeError = this.isValidDate(this.startDateTime);
  }

  handleTemplateIdChange(e) {
    if (e.target.value === 'create-template') {
      this.dispatchEvent(new CustomEvent('create-template'));
    } else {
      this.templateId = parseInt(e.target.value);
      this.templateIdError = undefined;
    }
  }

  initailRsvpTimeValue() {
    if (this.event) {
      const date = new Date(this.event.rsvpsCloseAt).toISOString();
      return date.slice(0, 16);
    } else {
      return '';
    }
  }

  initailStartTimeValue() {
    if (this.event) {
      const date = new Date(this.event.startDateTime).toISOString();
      return date.slice(0, 16);
    } else {
      return '';
    }
  }

  initailDurationTimeValue() {
    if (this.event) {
      return this.event.durationInMinutes;
    } else {
      return '';
    }
  }

  validateForm() {
    if (!this.templateId && !this.event) {
      this.templateIdError = 'Please select an event template.';
    } else if (!this.durationInMinutes && !this.event) {
      this.durationInMinutesError = 'Please enter duration.';
    } else if (!this.startDateTime && !this.event) {
      this.startDateTimeError = 'Please select a date.';
    } else if (!this.rsvpDueDate && !this.event) {
      this.rsvpDueDateError = 'Please select a date.';
    }
  }

  get errorFields() {
    const fieldToErrorFields = {
      templateId: 'templateIdError',
      startDateTime: 'startDateTimeError',
      durationInMinutes: 'durationInMinutesError',
      rsvpDueDate: 'rsvpDueDateError',
    };

    return fieldToErrorFields;
  }

  mapErrors(serverResponse) {
    const fieldToErrorFields = this.errorFields;

    serverResponse.errorMessages.forEach((error) => {
      const errorField = fieldToErrorFields[error.field] || 'eventCreationErrorMessage';
      this[errorField] = error.errorMessage;
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.validateForm();
    const fieldToErrorFields = this.errorFields;
    
    const hasValidationErrors = Object.values(fieldToErrorFields)
      .map((errorField) => this[errorField])
      .some((errorFieldValue) => errorFieldValue);

    const event = {
      templateId: this.templateId || this.event.templateId,
      startDateTime: this.startDateTime || this.event.startDateTime,
      durationInMinutes: this.durationInMinutes || this.event.durationInMinutes,
      rsvpsCloseAt: this.rsvpDueDate || this.event.rsvpsCloseAt,
    };

    if (!this.event && !hasValidationErrors) {
      const response = await eventsService.createEvent(event);

      if (response.errorMessages) {
        this.mapErrors(response);
      } else {
        this.eventCreateSuccessMessage = 'Event created successfully.';
        this.dispatchEvent(new CustomEvent('event-created'));
      }
    } else if (this.event && !hasValidationErrors) {
      const response = await eventsService.updateEvent(this.event.eventId, event);
      
      if (response.errorMessages) {
        this.mapErrors(response);
      } else {
        this.eventUpdateSuccessMessage = 'Event updated successfully.';
        this.dispatchEvent(new CustomEvent('updated-event'));
      }
    } else {
      this.eventUpdateErrorMessage = 'Failed to update event, please try again.';
    }
  }
}

window.customElements.define('e-create-or-update-event', CreateOrUpdateEvent);
