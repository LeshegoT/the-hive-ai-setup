import { html, LitElement, css } from 'lit';
import eventsService from '../services/events.service';
import { eventsShared, variables } from '../styles';
import { formatFullLongDate } from '../services/format.service';

const styles = html`
  <style>
    ${variables()} ${eventsShared()} .rsvp-container {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      background-color: var(--app-review-input-border-color);
      padding: var(--standard-padding);
      box-sizing: border-box;
    }

    #rsvp-details {
      display: flex;
      flex: 3;
      flex-basis: content;
      gap: var(--standard-padding);
    }

    .button-container {
      flex: 1;
      flex-basis: content;
      white-space: nowrap;
      gap: var(--small-padding);
    }

    button {
      padding: var(--small-padding) var(--standard-padding);
      font-size: var(--medium-font-size);
      color: var(--bbd-red-contrast);
      border: none;
      border-radius: var(--small-radius);
      cursor: pointer;
      min-width: 50%;
    }

    p {
      margin: 0;
      font-weight: bold;
    }

    #no-button {
      background-color: var(--bbd-red-contrast);
      border: var(--small-border-size) solid var(--app-primary-color);
      color: var(--app-primary-color);
    }

    #no-button:hover {
      background-color: var(--app-review-input-border-color);
    }

    #yes-button {
      background-color: var(--app-primary-color);
    }

    #yes-button:hover {
      background-color: var(--app-darker-warning-font-color);
    }

    #edit-button {
      border: none;
      background: none;
      padding: 0;
      color: var(--app-primary-color);
      text-decoration: underline;
    }

    article .rsvp-deadline-text {
      font-size: x-small;
      font-weight: lighter;
    }
  </style>
`;
class RsvpElement extends LitElement {
  static get properties() {
    return {
      eventObject: { type: Object },
      dietaryPreferences: {},
      editMode: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.editMode = false;
  }

  async updateData(accepted) {
    await eventsService.rsvpForEvent(this.eventObject.eventId, accepted);
    this.editMode = false;
    this.dispatchEvent(new CustomEvent('data-changed'));
  }

  renderSelectContainer(icon, content, buttons) {
    return html`
      <section id="rsvp-details">
        ${icon}
        <article>${content}</article>
      </section>
      <section class="button-container">${buttons}</section>
    `;
  }

  renderCancelledEvent() {
    const content = html`
      <p>You have declined this event.</p>
      <p class="rsvp-deadline-text">
        You can change your details before ${formatFullLongDate(new Date(this.eventObject.rsvpsCloseAt))}
      </p>
    `;
    const buttons = this.renderButtons();
    return this.renderSelectContainer(this.getSvg('event-cancelled'), content, buttons);
  }

  renderReservedEvent() {
    const content = html`
      <p>You have RSVP'd for this event.</p>
      <p class="rsvp-deadline-text">
        Deadline to RSVP is ${formatFullLongDate(new Date(this.eventObject.rsvpsCloseAt))}
      </p>
    `;
    const buttons = this.renderButtons();
    return this.renderSelectContainer(this.getSvg('success'), content, buttons);
  }

  renderButtons() {
    if (typeof this.eventObject.rsvpAccepted === 'boolean' && this.eventObject.isOpenForRsvp && !this.editMode) {
      return html`
        <label for="edit-button">Change of plans?</label>
        <button id="edit-button" class="bouncy-button" @click="${() => this.edit()}">Edit your RSVP</button>
      `;
    } else if (!this.eventObject.isOpenForRsvp) {
      return html`
        <button id="no-button" class="bouncy-button" @click="${() => this.updateData(false)}">Decline Event</button>
      `;
    } else {
      return html`
        <button id="no-button" class="bouncy-button" @click="${() => this.updateData(false)}">No</button>
        <button id="yes-button" class="bouncy-button" @click="${() => this.updateData(true)}">Yes</button>
      `;
    }
  }

  renderEvent() {
    const buttons = this.renderButtons();
    const content = html`
      <p>Will you be attending this event?</p>
      <p class="rsvp-deadline-text">
        Deadline to RSVP is ${formatFullLongDate(new Date(this.eventObject.rsvpsCloseAt))}
      </p>
    `;
    return this.renderSelectContainer(this.getSvg('information'), content, buttons);
  }

  renderMissedEvent() {
    const content = html`
      <p>You have missed the RSVP deadline of this event.</p>
    `;
    const buttons = this.renderButtons();
    return this.renderSelectContainer(this.getSvg('event-cancelled'), content, buttons);
  }

  getSvg(iconName) {
    return html`
      <img class="icon" src="../images/icons/${iconName}.svg" alt="${iconName} icon" height="24" width="24" />
    `;
  }

  getEventComponent() {
    if (this.eventObject.isOpenForRsvp) {
      if (this.eventObject.rsvpAccepted === true) {
        return this.renderReservedEvent();
      } else if (this.eventObject.rsvpAccepted === false) {
        return this.renderCancelledEvent();
      } else {
        return this.renderEvent();
      }
    } else {
      return this.renderMissedEvent();
    }
  }

  edit() {
    this.editMode = true;
  }

  render() {
    return html`
      ${styles}
      <section class="rsvp-container">${this.getEventComponent()}</section>
    `;
  }
}

customElements.define('e-rsvp-element', RsvpElement);
