import { html } from 'lit';
import { shared, animations } from '../styles';
import { StatefulPage } from './stateful-page-view-element';
import { selectLevelUpActivity } from '../selectors/level-up-activity.selectors';
import { formatDateTime } from '../services/format.service';
import { selectLevelUp } from '../selectors/level-up.selectors';
import navigationService from '../services/navigation.service';
import levelUpService from '../services/level-up.service';
import markdownService from '../services/markdown.service';

import '../components/title.component';

const styles = html`
  <style>
    ${shared()} ${animations()} .dates {
      display: flex;
      margin: 2em 0 3em;
      font-size: 1.2em;
      color: var(--app-secondary-color);
    }

    .dates > * {
      flex: 1 1 auto;
    }

    .dates > div > span {
      font-weight: bold;
    }

    .dates > div:last-child {
      text-align: right;
    }
  </style>
`;

class AttendActivity extends StatefulPage {
  render() {
    if (!this.levelUp || !this.activity) return html``;

    return html`
      ${styles}

      <section class="fade-in">
        <e-title
          .name="${this.levelUp.name} - ${this.activity.levelUpActivityType.name}"
          .icon="${this.activity.levelUpActivityType.icon}"
        ></e-title>

        <div class="dates">
          <div>
            <span>Start Date:</span> ${formatDateTime(this.activity.activityDate)}
          </div>
          <div>
            <span>Duration:</span> ${this.activity.durationInMinutes / 60} hour(s)
          </div>
        </div>
      </section>

      <section>
        <p>${this.description}</p>
      </section>
    `;
  }

  static get properties() {
    return {
      activity: Object,
      levelUp: Object,
      description: String
    };
  }

  firstUpdated() {
    if (!this.activity) {
      levelUpService.getLevelUps();
    }
  }

  updated(changedProps) {
    if (this.activity && !this.description) {
      this.description = markdownService.convertMarkdownToHtml(
        this.activity.levelUpActivityType.description
      );
    }

    if (changedProps.has('activity') && this.activity) {
      if (!this.activity.attended) {
        levelUpService.markActivityAsAttended(this.activity.levelUpActivityId);
      }
    }
  }

  stateChanged(state) {
    this.activity = selectLevelUpActivity(state);
    this.levelUp = selectLevelUp(state);

    //this is just to make sure someone is not trying to guess random level up and activity numbers
    //Gery, 2020/01/20
    if (
      this.activity &&
      this.levelUp &&
      this.activity.levelUpId !== this.levelUp.levelUpId
    ) {
      navigationService.navigate('/level-ups');
    }
  }
}

window.customElements.define('e-attend-activity', AttendActivity);
