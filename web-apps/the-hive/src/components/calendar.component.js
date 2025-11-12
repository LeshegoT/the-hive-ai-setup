import {LitElement, html} from 'lit';
import { variables } from '../styles';
import eventsService from '../services/events.service.js';
import { formatNumericDate } from '../services/format.service.js';

const styles = html`
  <style>
    ${variables()} .calendar {
      font-family: Arial, sans-serif;
      border: var(--light-grey-border);
      border-radius: var(--small-radius);
      padding: var(--standard-padding);
      font-size: var(--readable-font-size);
    }

    .days-of-week {
      font-weight: bolder;
      text-align: center;
    }

    .header {
      text-align: center;
      padding: 0;
      margin: 0;
      border-bottom: var(--small-border-size) solid;
    }

    select {
      border: none;
    }

    .days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: var(--small-gap);

      & * {
        cursor: pointer;
        text-align: center;
        aspect-ratio: 1/1;
        align-content: center;
        border-radius: 100%;
      }
    }

    .event-dot {
      display: block;
      margin: auto;
      width: 6px;
      height: 6px;
      background-color: var(--app-tertiary-color);
      border-radius: 100%;
    }

    .day-selected {
      border: var(--small-border-size) solid var(--app-info-font-color);
    }

    .current-day {
      background: var(--app-primary-color);
      color: var(--bbd-red-contrast);
    }
  </style>
`;
class CalendarComponent extends LitElement {
  
  static get properties() {
    return {
      currentMonth: { type: Number },
      currentYear: { type: Number },
      currentDay: { type: Date },
      selectedDay: { type: Date },
      companyEventDates: { type: Array },
    };
  }

  constructor() {
    super();
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.currentDay = today;
    this.companyEventDates = [];
    this.listenForFilterChanges = this.listenForFilterChanges.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadEvents();
    document.addEventListener('filter-changed', this.listenForFilterChanges);
  }

  disconnectedCallback() {
    document.removeEventListener('filter-changed', this.listenForFilterChanges);
    super.disconnectedCallback();
  }

  async loadEvents() {
    const dates = await eventsService.getEvents();
    this.companyEventDates = dates.map((event) => formatNumericDate(new Date(event.startDateTime)));
  }

  render() {
    return html`
      ${styles}
      <section class="calendar">
        <h2 class="header">${this.renderCurrentDay()}</h2>
        ${this.renderMonthDropdown()}
        <div class="days">${this.generateDays()}</div>
      </section>
    `;
  }

  renderMonthDropdown() {
    const months = Array(12)
      .fill()
      .map((_, i) => {
        return html`
          <option value=${i}>
            ${new Date(this.currentYear, i).toLocaleDateString('default', { month: 'long' })}
            ${new Date(this.currentYear, i).toLocaleDateString('default', { year: 'numeric' })}
          </option>
        `;
      });

    return html`
      <select class="select" @change=${this.handleMonthChange}>
        ${months}
      </select>
    `;
  }

  handleMonthChange(event) {
    this.currentMonth = parseInt(event.target.value);
    this.requestUpdate();
  }

  getMonthYear() {
    return new Date(this.currentYear, this.currentMonth).toLocaleDateString('default', {
      month: 'long',
      year: 'numeric',
    });
  }

  generateDays() {
    //getting the days of the current month.
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    let daysHtml = [];

    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    daysOfWeek.forEach((dayOfWeek) => {
      //pushing days of the week.
      daysHtml.push(
        html`
          <section class="days-of-week">${dayOfWeek}</section>
        `
      );
    });

    const firstWeekDayOfMonth = new Date(this.currentYear, this.currentMonth, 1).getDay();
    for (let lastMonthDay = 0; lastMonthDay < firstWeekDayOfMonth; lastMonthDay++) {
      //pushing empty days from the last month up to the first day of the week number.
      daysHtml.push(
        html`
          <span class="normal-day"></span>
        `
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      //pushing current month days.
      const date = new Date(this.currentYear, this.currentMonth, day);
      const formattedDate = this.formatDate(date);
      const isCompanyEventDay = this.companyEventDates.includes(formattedDate);

      const getClass = () => {
        if (date.toDateString() === this.currentDay.toDateString()) {
          return 'current-day';
        } else if (this.selectedDay && date.toDateString() === this.selectedDay.toDateString()) {
          return 'day-selected';
        } else if (isCompanyEventDay) {
          return 'event-day';
        } else {
          return 'normal-day';
        }
      };

      if (isCompanyEventDay) {
        daysHtml.push(
          html`
            <section class=${getClass()} @click=${() => this.handleDayClick(date)}>
              ${day}
              <span class="event-dot"></span>
            </section>
          `
        );
      } else {
        daysHtml.push(
          html`
            <section class=${getClass()} @click=${() => this.handleDayClick(date)}>${day}</section>
          `
        );
      }
    }

    return daysHtml;
  }

  renderCurrentDay() {
    return html`
      ${this.currentDay.toLocaleDateString('default', { weekday: 'short' })},
      ${this.currentDay.toLocaleDateString('default', { month: 'short' })} ${this.currentDay.getDate()}
    `;
  }

  handleDayClick(date) {
    this.selectedDay = date;
    this.dispatchEvent(new CustomEvent('date-change', { detail: date }));
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString({
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  }

  listenForFilterChanges() {
    this.selectedDay = undefined;
  }
}

window.customElements.define('e-calendar', CalendarComponent);
