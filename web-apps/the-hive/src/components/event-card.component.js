import {LitElement, html} from 'lit';
import { formatFullDateTime } from '../services/format.service';
import eventsService from '../services/events.service';
import { iconPathsAndColor } from '../styles/icons-colors-mapping';
import { store } from '../store';
import { navigateComponent } from '../actions/app.action';
import { eventsShared } from '../styles';

const getStyles = (imageUrl) => html`
  <style>
    ${eventsShared()}
    :host {
      position: relative;
      border: var(--grey-border);
      border-radius: var(--medium-radius);
      flex-grow: 1;
      max-width: var(--event-card-max-width);
      height: max-content;
    }

    .chip {
      border-radius: var(--large-radius);
      height: fit-content;
      display: inline-block;
      font-size: x-small;
      padding-right: var(--small-padding);
      padding-left: var(--small-padding);
    }

    .card-body {
      padding: var(--standard-padding);
      display: grid;
      grid-template-rows: 2fr auto 1fr;
    }

    .card-component {
      cursor: pointer;
    }
          
    .rsvp-status {
      border-radius: var(--app-small-border-radius);
      border: none;
      padding: var(--small-padding);
    }

    .card-details {
      padding-left: var(--small-padding);
    }

    .card-details p {
      margin-bottom: 0;
      margin-top: 0;
      color: var(--app-disabled-button-color);
    }

    #badge {
      padding: var(--standard-padding);
      border-radius: 100%;
      display: flex;
      align-self: flex-start;
      align-items: center;
    }

    #image {
      background-image: url('${imageUrl}');
      border-radius: var(--large-radius);
      padding: var(--standard-padding);
      display: flex;
      background-size: cover;
      background-position: center;
    }

    .icon {
      filter: invert(100%);
    }

    .card-body h3 {
      color: var(--app-review-sub-header-text-color);
      display: flex;
    }

    .heading-three-dots-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .three-dots-menu {
      cursor: pointer;
      display: inline-block;
      padding: 0;
    }

    #three-dots:hover {
      background-color: var(--app-dashboard-shadow);
    }

    .menu {
      background-color: var(--bbd-red-contrast);
      border: 1px solid var(--app-dashboard-background);
      display: none;
    }

    .menu.show {
      display: block;
      position: absolute;
    }

    .menu button {
      width: 100%;
      padding: var(--standard-padding);
      border: none;
      background-color: transparent;
      cursor: pointer;
    }

    .menu button:hover {
      background-color: var(--app-primary-color);
      color: var(--bbd-red-contrast);
    }

    .drop-down {
      position: relative;
    }

    .happening-today {
      position: absolute;
      left: calc(2 * (var(--large-padding)));
      top: calc(-1 * (var(--large-radius)));
      background-color: var(--app-info-font-color);
      color: var(--bbd-red-contrast);
      border-radius: var(--small-radius);
      padding-left: var(--small-padding);
      padding-right: var(--small-padding);
    }

    .highlighted {
      border: var(--highlighted-border);
      border-radius: var(--medium-radius);
    }

    .card-body img {
      justify-self: end;
    }

    .accepted-rsvp {
      background: var(--accepted-color);
    }

    .declined-rsvp {
      background: var(--app-disabled-button-color);
      color: var(--bbd-red-contrast);
    }
  </style>
`;
class EventCard extends LitElement {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.getEventRsvp();
  }

  static get properties() {
    return {
      rsvpAccepted: { type: Boolean },
    };
  }

  render() {
    return html`
      ${getStyles(eventsService.getImageDownloadUrl(this.event.imagePath))}
      <style>
        #badge {
          background-color: var(${iconPathsAndColor[this.event.category][1]});
        }

        .card-details {
          border-left: 5px solid var(${iconPathsAndColor[this.event.category][1]});
        }
      </style>
      <section
        class="card-component ${this.isDateToday() ? 'highlighted' : ''}"
        @click="${(_e) => this.handleClick(`/events/${this.event.eventId}`)}">
        <span>${this.displayHappeningToday()}</span>
        <section class="card-body">
          <section id="image">
            <label id="badge">
              <img class="icon" src="../../images/icons/${iconPathsAndColor[this.event.category][0]}" />
            </label>
          </section>
          <section class="heading-three-dots-container">
            <h3>${this.event.subject}</h3>
            ${this.renderThreeDotsMenu()}
          </section>
          <section class="card-details">
            <p>${formatFullDateTime(new Date(this.event.startDateTime))}</p>
            <p>${this.event.officeName}</p>
            <p>${this.event.durationInMinutes} minutes</p>
            ${this.renderRsvpStatus()}
          </section>
        </section>
      </section>
    `;
  }

  renderRsvpDaysLeft() {
    const today = new Date();
    const rsvpDate = new Date(this.event.rsvpsCloseAt);
    const daysLeft = Math.round((rsvpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 1) {
      return 'RSVP date missed';
    }
    return `${daysLeft} days left to RSVP`;
  }

  handleClick(url) {
    store.dispatch(navigateComponent(url));
  }

  renderThreeDotsMenu() {
    if (this.organiser) {
      return html`
        <section class="drop-down">
          <section class="three-dots-menu" @click="${this.toggleMenu}">
            <img id="three-dots" src="../../images/icons/vertical-three-dots.svg" />
          </section>
          <section class="menu">
            <button
              @click="${(e) => {
                this.handleEdit(e, this.event);
              }}"
            >
              Edit
            </button>
          </section>
        </section>
      `;
    } else {
      return html``;
    }
  }

  toggleMenu = (e) => {
    e.stopPropagation();
    const menu = this.shadowRoot.querySelector('.menu');
    menu.classList.toggle('show');
  };

  isDateToday() {
    const today = new Date();
    const eventDate = new Date(this.event.startDateTime);
    return (
      today.getDate() === eventDate.getDate() &&
      today.getMonth() === eventDate.getMonth() &&
      today.getFullYear() === eventDate.getFullYear()
    );
  }

  displayHappeningToday() {
    if (this.isDateToday()) {
      return html`
        <label class="happening-today">Happening Today</label>
      `;
    } else {
      return html``;
    }
  }

  async getEventRsvp() {
    const rsvp = await eventsService.getRsvp(this.event.eventId);
    this.rsvpAccepted = rsvp.accepted;
  }

  renderRsvpStatus() {
    if (this.rsvpAccepted) {
      return html`
        <span class="chip accepted-rsvp">Accepted</span>
      `;
    } else if (this.rsvpAccepted === false) {
      return html`
        <span class="chip declined-rsvp">Declined</span>
      `;
    } else {
      return html`
        <p>${this.renderRsvpDaysLeft()}</p>
      `;
    }
  }

  handleEdit(onClick, event) {
    onClick.stopPropagation();
    this.dispatchEvent(new CustomEvent('edit-event', { detail: event }));
  }
}
window.customElements.define('e-event-card', EventCard);
