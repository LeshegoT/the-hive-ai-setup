import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element';
import { shared, animations, hex, link } from '../styles';
import levelUpService from '../services/level-up.service';
import { formatFullDate } from '../services/format.service';
import { selectLevelUp } from '../selectors/level-up.selectors';

import '../components/title.component';
import '../components/course-summary-group.component';
import '../components/level-up-activities.component';
import '../components/level-up-attendees.component';
import markdownService from '../services/markdown.service';

const styles = html`
  <style>
    ${shared()} ${hex()} ${animations()} ${link()} .dates {
      display: flex;
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

    h3 {
      margin: 0 0 2em;
      font-size: 1.4em;
      padding: 0 2em;
      color: var(--app-secondary-color);
    }

    .registration {
      margin: -1.9em 0 3em;
      text-align: right;
    }

    .registration button {
      font-size: 1em;
    }

    .buttons {
      margin-top: 2em;
    }
  </style>
`;

class LevelUpDetails extends StatefulPage {
  renderRegister() {
    if (this.levelUp.endDate < new Date()) {
      return html``;
    }

    if (this.levelUp.registered) {
      return html`<i>Registered</i>`;
    }

    return html`
      <button type="button" @click="${(e) => this.register()}">
        Register
      </button>
    `;
  }

  render() {
    if (!this.levelUp) return html``;

    return html`
      ${styles}
      
      <section class="fade-in">
        <e-title .name="${this.levelUp.name}" .icon="${this.levelUp.icon}"> </e-title>
        <div class="registration">
          ${this.renderRegister()}
        </div>
      
        <p>${this.description}</p>
      
        <div class="dates">
          <div><span>Start Date:</span> ${formatFullDate(this.levelUp.startDate)}</div>
          <div>
            <a class="button" href="/syndicate/${this.levelUp.levelUpId}">LevelUp Syndicates</a>
          </div>
          <div><span>End Date:</span> ${formatFullDate(this.levelUp.endDate)}</div>
        </div>
      </section>
      
      <section class="fade-in">
        <h3>Courses</h3>
        <e-course-summary-group .courses="${this.levelUp.courses}"></e-course-summary-group>
      </section>
      
      <section class="fade-in">
        <e-level-up-activities .levelUpActivities="${this.levelUp.levelUpActivities}"></e-level-up-activities>
      
        <div class="buttons">
          <button type="button" class="back big" @click=${(e)=> this.back()}>Back</button>
        </div>
      </section>
      
      <section class="fade-in">
        <e-level-up-attendees .levelUp=${this.levelUp}></e-level-up-attendees>
      </section>
    `;
  }

  firstUpdated() {
    if (!this.levelUp) {
      levelUpService.getLevelUps();
    }
  }

  updated() {
    if (this.levelUp && !this.description) {
      this.description = markdownService.convertMarkdownToHtml(this.levelUp.description);
    }
  }

  back() {
    window.history.back();
  }

  register() {
    levelUpService.registerForLevelUp(this.levelUp.levelUpId);
  }

  static get properties() {
    return {
      levelUp: Object,
      description: String
    };
  }

  stateChanged(state) {
    this.levelUp = selectLevelUp(state);
  }
}

window.customElements.define('e-level-up-details', LevelUpDetails);
