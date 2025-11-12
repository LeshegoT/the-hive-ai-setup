import { html, LitElement } from 'lit';
import { shared, lists, activities } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { checkbox } from './svg';
import { formatDateTime } from '../services/format.service';
import levelUpService from '../services/level-up.service';

import './sub-title.component';

let styles = html`
  <style>
    ${shared()} ${lists()} ${activities()} .activity-group {
      display: flex;
      max-width: inherit;
    }

    .is-now {
      font-size: 18px;
      margin: 0;
    }

    .activity-group:nth-of-type(even) {
      background: var(--app-section-even-color);
    }
    .activity-group:nth-of-type(odd) {
      background: var(--app-section-odd-color);
    }

    @media (max-width: 460px) {
      .activity-group {
        display: inherit;
      }

      .activity-link {
        margin-left: 2em;
      }
    }
  </style>
`;

class LevelUpActivities extends connect(store)(LitElement) {
  isComplete(activity) {
    return activity.attended ? 'completed' : 'incomplete';
  }

  renderIsNow(activity) {
    return activity.isNow
      ? html`<p class="is-now">Now</p>`
      : html``;
  }

  render() {
    return html`
      ${styles}

      <e-sub-title text="Activities" icon="images/logos/discussion.svg"></e-sub-title>

      <ul class="activities">
        ${this.levelUpActivities &&
        this.levelUpActivities.map(
          (activity) => html`
            <li class="activity-group">
              <a href="/activity-type/${activity.levelUpActivityType.code}">
                <svg viewbox="0 0 52 52" class="${this.isComplete(activity)}">${checkbox}</svg>
                <span class="activity">
                  <span class="description">${activity.levelUpActivityType.name}</span>
                  <span class="due-date">${formatDateTime(activity.activityDate)}</span>
                </span>
              </a>
              ${activity.links.map(
                (link) => html`
                  <a class="activity-link" href=${link.link} target="_blank">${link.name}</a>
                `
              )}
              ${this.renderIsNow(activity)}
            </li>
          `
        )}
      </ul>
    `;
  }

  static get properties() {
    return {
      levelUpActivities: Array
    };
  }

  firstUpdated() {
    this.levelUpActivities.forEach(activity => {
      if(activity.isNow && !activity.attended) {
        levelUpService.markActivityAsAttended(activity.levelUpActivityId);
      }
    });
  }
}

window.customElements.define('e-level-up-activities', LevelUpActivities);
