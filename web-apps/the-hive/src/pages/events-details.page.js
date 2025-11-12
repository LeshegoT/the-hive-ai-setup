import { html, LitElement, css } from 'lit';
import '../components/events-summary.component';
import '../components/calendar.component';
import eventsService from '../services/events.service';
import { variables } from '../styles';

const styles = html`
  <style>
    ${variables()} 
    
    :host {
      font-size: 0.9em;
    }

    section {
      background-image: url(../../images/hive-background.svg);
      background-repeat: no-repeat;
      background-size: cover;
      background-attachment: fixed;
      justify-content: center;

      e-event-summary {
        padding-top: var(--page-top-padding);
        max-width: var(--app-max-width);
        margin: 0 auto;
      }
    }
  </style>
`;

class EventDetails extends LitElement {
  static properties = {
    eventId: { type: Number },
    eventObject: { type: Object },
    routeData: { type: Array },
  };

  constructor() {
    super();
    this.eventObject = {};
  }

  async updated(changedProperties) {
    if (changedProperties.has('eventId')) {
      this.getEventDetails();
    } else {
      //Nothing happens if changes do not have eventId
    }
  }

  render() {
    return html`
      <section>
        ${this.renderContent()}
      </section>
    `;
  }

  renderContent() {
    if (this.eventObject && Object.keys(this.eventObject).length > 1) {
      return this.renderEventDetails();
    } else {
      return html``;
    }
  }

  renderEventDetails() {
    return html`
      ${styles}
      <e-event-summary .eventObject=${this.eventObject} @data-changed="${this.handleDataChange}"></e-event-summary>
    `;
  }

  async getEventDetails() {
    let event = await eventsService.getEventbyId(parseInt(this.eventId));
    let rsvp = await eventsService.getRsvp(this.eventId);
    event.rsvpAccepted = rsvp.accepted;
    this.eventObject = event;
  }

  handleDataChange() {
    this.getEventDetails();
  }
}

customElements.define('e-event-detail', EventDetails);
