import {LitElement, html} from 'lit';
import './rsvp-form.component';
import './calendar.component';
import { variables } from '../styles';
import { formatWeekDayDateTimeLocale, formatDateTimeHoursMinutes} from '../services/format.service';
import eventsService from '../services/events.service';
import { iconPathsAndColor } from '../styles/icons-colors-mapping';
import { navigateComponent } from '../actions/app.action';
import { store } from '../store';

const styles = html`
  <style>
    ${variables()} .event {
      background-color: white;
      box-shadow: var(--app-form-box-shadow);
      border-radius: var(--small-radius);      
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-radius: var(--app-small-border-radius) var(--app-small-border-radius) 0 0;

      & > * {
        padding: var(--standard-padding);
      }

      & header {
        grid-column: span 2;
        display: flex;
        justify-content: space-between;

        & h1 {
          margin: 0;
        }

        & .badge {
          display: inline-block;
          padding: var(--small-padding);
          border-radius: var(--small-radius);
          font-size: small;
          height: fit-content;
        }
      }

      & .event-summary {
        grid-column: span 2;
        display: flex;
        flex-wrap: wrap;
        gap: var(--small-padding);
      }

      & e-rsvp-element {
        margin: 0;
        padding: 0;
        grid-column: span 2;
      }
    }

    .image-container {
      flex: 1;
      min-width: var(--event-card-max-width);
      overflow: hidden;
      border-radius: var(--medium-radius);
      aspect-ratio: 3/1;

      & .image-label {
        display: flex;
        font-size: smaller;
        width: fit-content;
        height: fit-content;
        color: var(--bbd-red-contrast);
        padding: var(--small-padding);
        border-radius: var(--large-radius);
        margin: var(--standard-padding);
       
      }
    }

    .details-container {
      flex: 1;
      flex-basis: max-content;
      background: var(--app-review-input-border-color);
      border-radius: var(--medium-radius);      
      padding: var(--small-padding);

      & * {
        padding-bottom: var(--standard-padding);
      }

      & .label {
        margin: 0;
        padding: 0;
        font-size: x-small;
      }

      & .data-value {
        padding: 0;
        margin-block-end: 0;
        margin-block-start: 0;
        font-weight: bold;
      }
    }

    .description {
      grid-column: span 2;
      padding: 0 var(--standard-padding);
      flex: 1 1 100%;
    }

    .accepted-rsvp {
      background: var(--accepted-color);
    }

    .declined-rsvp {
      background: var(--app-disabled-button-color);
      color: var(--bbd-red-contrast);
    }

    .missed-rsvp,
    .open-rsvp {
      background: var(--app-primary-color);
      border: var(--small-border-size) solid var(--app-primary-color);
      font-size: x-small;
      color: var(--bbd-red-contrast);
    }

    .icon {
      filter: invert(100%);
      padding-right: var(--standard-padding);
    }

    .arrow-back {
      cursor: pointer;
    }
  </style>
`;

class EventSummary extends LitElement {
  static get properties() {
    return {
      eventObject: { type: Object },
      eventStartTime:{type: Date},
      eventEndTime: {type: Date},
    };
  }

  constructor() {
    super();
  }

  connectedCallback(){
    super.connectedCallback();

    if (!this.eventStartTime || !this.eventEndTime) {
      const {startTime, endTime} = this.calculateEventStartAndEndTime(this.eventObject);
      this.eventStartTime = startTime;
      this.eventEndTime = endTime;
    }
  }

  render() {
    return html`
      ${styles}
      <style>
        .image-label {
          background-color: var(${iconPathsAndColor[this.eventObject.eventCategory][1]});
        }

        .description {
          border-left: 5px solid var(${iconPathsAndColor[this.eventObject.eventCategory][1]});
        }

        .image-container {
          background-image: url('${eventsService.getImageDownloadUrl(this.eventObject.imagePath)}');
          background-size: cover;
        }
      </style>
      <section class="event">
        <header>
          <img class="arrow-back" src="../../images/icons/arrow-back.svg" @click="${this.navigateBack}" />
          <h1>${this.eventObject.subject}</h1>
          <span class="badge ${this.getBadgeClass()}">
            <img src="../../images/icons/timer.svg" />
            ${this.calculateDaysLeftToRSVP(this.eventObject.rsvpsCloseAt)}
          </span>
        </header>

        <section class="event-summary">
          <section class="image-container">
            <span class="image-label">
              <img class="icon" src="../../images/icons/${iconPathsAndColor[this.eventObject.eventCategory][0]}" />
              ${this.eventObject.eventCategory}
            </span>
          </section>

          <section class="details-container">
            <section>
              <p class="label">Date</p>
              <p class="data-value">${formatWeekDayDateTimeLocale(new Date(this.eventObject.startDateTime))}</p>
            </section>
            <section>
              <p class="label">Place</p>
              <p class="data-value">${this.eventObject.officeName}</p>
            </section>
            <section>
              <p class="label">Time</p>
              <p class="data-value">
                ${formatDateTimeHoursMinutes(this.eventStartTime)} - ${formatDateTimeHoursMinutes(this.eventEndTime)}
              </p>
            </section>
          </section>

          <p class="description">${this.eventObject.body}</p>
        </section>

        <e-rsvp-element .eventObject=${this.eventObject} @data-changed="${this.handleDataChange}"></e-rsvp-element>
      </section>
    `;
  }

  calculateEventStartAndEndTime(eventObject) {
    if (!eventObject || !eventObject.startDateTime || !eventObject.durationInMinutes) {
      return { startTime: null, endTime: null };
    }
    const startTime = new Date(eventObject.startDateTime);
    const durationInMinutes = eventObject.durationInMinutes;
    const endTime = new Date(startTime.getTime() + durationInMinutes * 60000);
    return { startTime, endTime };
  }

  calculateDaysLeftToRSVP(closingDate) {
    if (this.eventObject.isOpenForRsvp) {
      if (this.eventObject.rsvpAccepted) {
        return 'Accepted';
      } else if (this.eventObject.rsvpAccepted === false) {
        return 'Declined';
      } else {
        const rsvpDueDate = new Date(closingDate);
        const today = new Date();
        const differenceInTime = rsvpDueDate.getTime() - today.getTime();
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
        return `${differenceInDays} days left to RSVP`;
      }
    } else {
      return 'RSVP date missed.';
    }
  }

  handleDataChange() {
    this.dispatchEvent(new CustomEvent('data-changed'));
  }

  getBadgeClass() {
    if (this.eventObject.isOpenForRsvp) {
      if (this.eventObject.rsvpAccepted === true) {
        return 'accepted-rsvp';
      } else if (this.eventObject.rsvpAccepted === false) {
        return 'declined-rsvp';
      } else {
        return 'open-rsvp';
      }
    } else {
      return 'missed-rsvp';
    }
  }

  navigateBack() {
    store.dispatch(navigateComponent('/events'));
  }
}

window.customElements.define('e-event-summary', EventSummary);
