import { html, LitElement } from 'lit';
import eventsService from '../services/events.service.js';

const styles = html`
  <style>
    :host {
      --border-color: var(--grey-color);
    }

    .event-list-container {
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      border: 1px solid var(--border-color);
      justify-content: center;
      margin: 1rem;
    }

    .list-item {
      flex: 1;
      border: 1px solid var(--border-color);
      background: var(--app-section-odd-color);
    }

    h2,
    h3 {
      margin: 0;
      text-align: center;
      font-size: 1rem;
      color: var(--border-color);
    }

    h2 {
      border-bottom: 1px solid var(--border-color);
    }

    h1 {
      text-align: center;
    }

    section {
      box-shadow: var(--app-form-box-shadow);
    }
  </style>
`;

export class EventList extends LitElement {
  constructor() {
    super();
    this.events = [];
  }

  static get properties() {
    return {
      events: Array,
    };
  }

  render() {
    return html`
      ${styles}
      <h1>List Of Events</h1>
      ${this.renderEvents()}
    `;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.events = await eventsService.getEventsByOrganiser();
  }

  renderEvents() {
    return this.events.map(
      (event) =>
        html`
          <section class="event-list-container">
            <section class="list-item">
              <h2>Event Template ID</h2>
              <h3>${event.templateId}</h3>
            </section>
            <section class="list-item">
              <h2>Start Date and Time</h2>
              <h3>${new Date(event.startDateTime)}</h3>
            </section>
            <section class="list-item">
              <h2>Duration (Minutes)</h2>
              <h3>${event.durationInMinutes}</h3>
            </section>
            <section class="list-item">
              <h2>RSVP Due Date</h2>
              <h3>${new Date(event.rsvpsCloseAt)}</h3>
            </section>
          </section>
        `
    );
  }
}

window.customElements.define('e-event-list', EventList);
