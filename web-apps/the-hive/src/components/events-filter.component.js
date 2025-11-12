import {LitElement, html} from 'lit';
import eventsService from '../services/events.service.js';

const styles = html`
  <style>
    .filter {
      display: flex;
      flex-wrap: wrap;
      justify-content: start;
      font-size: var(--readable-font-size);
      padding: var(--app-button-padding);
    }

    .filter button {
      display: flex;
      flex-direction: row;
      border-radius: 100px;
      border: none;
      cursor: pointer;
      background-color: transparent;
      padding: var(--app-button-padding);
      align-items: center;
      justify-content: center;

      & img {
        padding-right: var(--app-button-padding);
      }
    }

    button.selected {
      background-color: var(--app-primary-color);
      color: var(--app-light-text-color);

      & img {
        filter: invert(100%);
      }
    }

    .events {
      justify-content: center;
    }
  </style>
`;
class EventsFilter extends LitElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    super.connectedCallback();
    this.eventsCategories = await eventsService.getCategories();
  }

  static get properties() {
    return {
      eventsCategories: Array,
    };
  }

  render() {
    return html`
      ${styles}
        <section class="filter">
          <button class="selected" @click="${this.setFilteringKeyword}" data-value="All Events">All Events</button>
          ${this.eventsCategories?.map((eventCategory) => this.renderFilterButton(eventCategory.category))}
        </section>
    `;
  }

  removeButtonBackground() {
    const elements = this.shadowRoot.querySelectorAll('.selected');
    for (const element of elements) {
      element.classList.remove('selected');
    }
  }

  setFilteringKeyword(event) {
    this.removeButtonBackground();

    let filterKeyword = event.target.dataset.value;
    if (!filterKeyword) {
      filterKeyword = event.target.parentElement.dataset.value;
      event.target.parentElement.classList.add('selected');
    } else {
      event.target.classList.add('selected');
    }
    this.dispatchEvent(new CustomEvent('filter-changed', { detail: filterKeyword }));
  }

  renderFilterButton(eventCategory) {
    const iconPaths = {
      'HR': 'hr.svg',
      'Company Event': 'company-event.svg',
      'Admin': 'admin.svg',
      'Lunch': 'lunch.svg',
      'Carwash': 'carwash.svg',
      'Social Event': 'social-event.svg',
      'Learning Event': 'learning-event.svg',
      'Community Event': 'community-event.svg',
      'Sporting Event': 'sporting-event.svg',
    };
    return html`
      <button @click="${this.setFilteringKeyword}" data-value="${eventCategory}">
        <img src="../../images/icons/${iconPaths[eventCategory]}" alt="${eventCategory} icon" />
        ${eventCategory}
      </button>
    `;
  }
}
window.customElements.define('e-events-filter', EventsFilter);
