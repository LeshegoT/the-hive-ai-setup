import {LitElement, html} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import '../components/event-card.component';
import '../components/events-filter.component';
import '../components/calendar.component.js';
import '../components/create-event-or-update.component.js';
import '../components/create-event-template.component.js';
import '../components/events-not-found.component.js';
import eventsService from '../services/events.service.js';
import { eventsShared } from '../styles';

const CREATE_EVENT_CHILD = "create-event";
const CREATE_TEMPLATE_CHILD = "create-template";
const EVENTS_CHILD = "events";

const styles = html`
  <style>
     ${eventsShared()} .events-container {
      min-height: 100vh;
      background-image: url(../../images/hive-background.svg);
      background-repeat: no-repeat;
      background-size: cover;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background-attachment: fixed;
      container-name: events-container;
      container-type: inline-size;
    }

    .display-card h2 {
      font-size: xx-large;
      margin: 0;
      grid-column: 1;
      grid-row: 1;
    }

    .display-card p {
      margin: 0;
      color: var(--app-tertiary-color);
      grid-column: 1;
      grid-row: 2;
    }

    .filter-container {
      grid-column: 1;
      grid-row: 3;
    }

    .child-container {
      grid-row: 4;
      grid-column: 2;
    }

    .events {
      display: flex;
      flex-direction: row;
      grid-column: 1;
      grid-row: 4;
      flex-wrap: wrap;
      padding: var(--standard-padding);
      gap: var(--large-gap);
    }

    .create-event-or-template-container {
      grid-column: 1;
      grid-row: 4;
      display: flex;
      justify-content: center;
    }

    e-events-not-found {
      grid-column: 1;
      grid-row: 4;
      padding: var(--standard-padding);
      gap: var(--large-gap);
    }

    .display-card {
      background: var(--app-header-background-color);
      padding: 2em 1em;
      margin: var(--page-top-padding) var(--app-form-padding);
      box-shadow: var(--app-form-box-shadow);
      border-radius: var(--app-small-border-radius);
      display: grid;
      grid-template-columns: 2.1fr 0.7fr;
      grid-template-rows: auto 1fr;
      gap: 1rem;
    }

    .red-button {
      justify-self: end;
      align-self: center;
      padding: var(--standard-padding);
      grid-row: 3;
      width: fit-content;
      height: fit-content;
    }

    .filter-container {
      background: var(--app-review-input-border-color);
      border-radius: var(--medium-radius);
    }

    .filter-by {
      display: none;
      border-radius: var(--medium-radius);
      padding: var(--standard-padding);
    }

    .filter-by section {
      display: flex;
    }

    .filter-container.expanded #arrow-dropdown {
      transform: rotate(180deg);
    }

    @container events-container (max-width: 900px) {
      .display-card {
        display: flex;
        flex-direction: column;
      }

      .events {
        justify-content: center;
      }

      e-events-filter {
        display: none;
      }

      .filter-container.expanded e-events-filter {
        display: flex;
      }

      .filter-by {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }

      .filter-container.expanded .filter-by {
        border-bottom: var(--small-border-size) solid var(--light-grey);
      }

      #arrow-dropdown,
      .filter-icon {
        padding-inline: var(--standard-padding);
      }
    }
  </style>
`;

class Events extends LitElement {
  static properties = {
    events: { type: Array },
    filteredEvents: { type: Array },
    categories: { type: Array },
    selectedCategoryId: Number,
    currentChild: String,
    selectedEvent: Object,
    organiser: Object,
  };

  constructor() {
    super();
    this.events = [];
    this.filteredEvents = [];
    this.categories = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadEvents();
    this.loadCategories();
    this.currentChild = EVENTS_CHILD;
    this.getEventOrganiser();
  }

  async loadEvents() {
    this.events = await eventsService.getEvents();
  }

  async loadEventsByCategory(categoryId) {
    this.events = await eventsService.getEventsByCategoryAndStartDate(categoryId);
  }

  async loadCategories() {
    this.categories = await eventsService.getCategories();
  }

  async getEventOrganiser() {
    const result = await eventsService.getEventOrganiser();

    if (result.eventOrganiserId) {
      this.organiser = result;
    } else {
      this.organiser = undefined;
    }
  }

  render() {
    return html`
      ${styles}
      <section class="events-container">
        <section class="display-card">
          <h2>BBD Events</h2>
          <p>Use this online portal to RSVP to Internal events, capture event details, et cetera...</p>
          ${this.renderCurrentChild()} ${this.renderCreateEventButton()} ${this.renderCalendar()}
        </section>
      </section>
    `;
  }

  renderEventsSection() {
    return html`
      <section class="filter-container">
        ${this.renderFilterToggler()}
        <e-events-filter @filter-changed="${this.handleFilterChange}"></e-events-filter>
      </section>
      ${this.events.length === 0 ? this.renderEventsNotFound() : this.renderEvents()}
    `;
  }

  renderEventsNotFound() {
    return html`
      <e-events-not-found></e-events-not-found>
    `;
  }

  renderEvents() {
    return html`
      <section class="events">
        ${repeat(
          this.events,
          (event) => event.eventId,
          (event) =>
            html`
              <e-event-card
                .event=${event}
                @edit-event="${this.handleEditEventButton}"
                .organiser=${this.organiser}
              ></e-event-card>
            `
        )}
      </section>
    `;
  }

  renderCurrentChild() {
    if (this.currentChild === CREATE_EVENT_CHILD) {
      return this.renderCreateEvent(this.selectedEvent);
    } else if (this.currentChild === EVENTS_CHILD) {
      return this.renderEventsSection();
    } else {
      return this.renderCreateTemplate();
    }
  }

  renderCalendar() {
    return this.currentChild === CREATE_EVENT_CHILD || this.currentChild === CREATE_TEMPLATE_CHILD
      ? html``
      : html`
          <e-calendar class="child-container" @date-change="${this.filteredEventsByDate}" />
        `;
  }

  async filteredEventsByDate(event) {
    this.events = await eventsService.getEventsByCategoryAndStartDate(this.selectedCategoryId, event.detail);
  }

  renderCreateEvent(event) {
    return html`
      <e-create-or-update-event
        class="create-event-or-template-container"
        @close="${this.handleCreateEventClose}"
        @event-created="${this.handleEventCreated}"
        @create-template="${this.handleOnCreateTemplate}"
        @updated-event="${this.handleEventUpdated}"
        .event=${event}
      />
    `;
  }

  renderCreateTemplate() {
    return html`
      <e-create-event-template class="create-event-or-template-container" @close="${this.handleCreateTemplateClose}" />
    `;
  }

  renderCreateEventButton() {
    if (this.currentChild === EVENTS_CHILD && this.organiser) {
      return html`
        <button @click="${this.handleNewEventButton}" class="red-button">Create Event</button>
      `;
    } else {
      return html``;
    }
  }

  handleCreateEventClose() {
    this.currentChild = EVENTS_CHILD;
    this.selectedEvent = undefined;
  }

  handleCreateTemplateClose() {
    this.currentChild = CREATE_EVENT_CHILD;
  }

  handleEventCreated() {
    this.currentChild = EVENTS_CHILD;
    return this.loadEvents();
  }

  handleNewEventButton() {
    this.currentChild = CREATE_EVENT_CHILD;
  }

  handleOnCreateTemplate() {
    this.currentChild = CREATE_TEMPLATE_CHILD;
  }

  handleFilterChange(e) {
    const selectedEventType = e.detail;
    if (selectedEventType === 'All Events') {
      this.loadEvents();
      this.selectedCategoryId = undefined;
    } else {
      const category = this.categories.find((eventCategory) => eventCategory.category === selectedEventType);
      if (category) {
        this.loadEventsByCategory(category.categoryId);
        this.selectedCategoryId = category.categoryId;
      } else {
        this.events = [];
      }
    }

    this.dispatchEvent(
      new CustomEvent('filter-changed', { bubbles: true, composed: true })
    );
  }

  handleUpdateEventClose() {
    this.currentChild = EVENTS_CHILD;
  }

  handleEditEventButton(onChangeEvent) {
    this.selectedEvent = onChangeEvent.detail;
    this.currentChild = CREATE_EVENT_CHILD;
  }

  handleEventUpdated() {
    this.currentChild = EVENTS_CHILD;
    this.selectedEvent = undefined;
    return this.loadEvents();
  }

  renderFilterToggler() {
    return html`
      <section class="filter-by" @click="${this.expandFilter}">
          <section>
            <img src="../../images/icons/filter.svg" class="filter-icon" />
            <p>Filter By:</p>
          </section>
          <img src="../../images/icons/arrow-dropdown.svg" id="arrow-dropdown" />
      </section>
    `;
  }

  expandFilter() {
    const filterContainer = this.shadowRoot.querySelector('.filter-container');
    filterContainer.classList.toggle('expanded');
  }
}
window.customElements.define('e-events', Events);
