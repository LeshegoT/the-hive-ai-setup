import { html } from 'lit';
import { shared, form } from '../styles';
import { store } from '../store';
import questService from '../services/quest.service';
import { navigateComponent } from '../actions/app.action';
import {
  selectEditingQuest,
  selectEditingQuestMissions
} from '../selectors/quest-editor.selectors';
import { selectQuestId } from '../selectors/route-data.selectors';

import '../components/quest-create.component';
import '../components/quest-update.component';
import '../components/quest-missions.component';
import { resetEditingQuest } from '../actions/reset-editing-quest.action';
import { selectIsGuide } from '../selectors/hero.selectors';
import questEditingService from '../services/quest-editor.service';
import authService from '../services/auth.service';
import { StatefulPage } from './stateful-page-view-element';
import announcementService from '../services/announcement.service';
import { infoIcon } from '../components/svg'

let styles = html`
  <style>
    ${shared()} ${form()} h3 {
      padding: 0 1.9em;
      margin: 1.2em 0;
    }

    p {
      margin: 1.5em 0 3em 0;
      font-style: italic;
    }

    svg {
      margin-right: 0.5em;
    }

    section {
      margin-block: 0;
    }
  </style>
`;

class QuestEditor extends StatefulPage {
  render() {
    return html`
      ${styles}
      ${this.questId
        ? html`
            <section>
              <e-quest-update></e-quest-update>
            </section>
          `
        : html`
            <section>
              <e-create-quest></e-create-quest>
            </section>
          `}

      <section>
        <h3>Quest Missions</h3>

        
        <p>
          ${infoIcon}

          Drag and drop the items below to re-arrange the order of your missions.
        </p>

        <e-quest-missions></e-quest-missions>
      </section>

      <section>
        <div class="buttons">
          <button type="button" class="back big" @click="${() => this.back()}">
            Back
          </button>
          <button class="save big" type="button" @click="${() => this.saveQuest()}">
            Save Quest
          </button>
        </div>
      </section>
    `;
  }

  async saveQuest() {
    let errors = this.pageValid();
    if (!errors.length) {
      if (this.questId) {
        const result = await questService.updateQuest(this.quest, this.missions);
        if (result) {
          if (result.quest.heroUserPrincipleName === authService.getUserPrincipleName()) {
            store.dispatch(navigateComponent('/'));
          } else {
            store.dispatch(navigateComponent('/heroes'));
          }
        } else {
          announcementService.createAnnouncement(
            'error', {
              title:'Quest update failed!',
              body:'Please contact ATC for assistance'
            }
          );
        }
      } else {
        questService.createQuest(this.quest, this.missions);
        store.dispatch(navigateComponent('/heroes'));
      }
    }
    questEditingService.updateQuestErrors(errors);
  }

  pageValid() {
    let errors = [];

    questEditingService.validateField(
      { name: 'heroUpn', value: this.quest.heroUserPrincipleName },
      errors
    );

    questEditingService.validateField(
      { name: 'goal', value: this.quest.goal },
      errors
    );

    questEditingService.validateField(
      { name: 'months', value: this.quest.months },
      errors
    );

    let missionsInQuest = this.missions.filter((m) => !m.deleted);
    if (!missionsInQuest.length) {
      errors.push('missions');
    }

    return errors;
  }

  static get properties() {
    return {
      questId: Number,
      missions: Array,
      quest: Object
    };
  }

  firstUpdated() {
    if (this.questId) {
      questEditingService.getEditingQuest(this.questId);
    } else if (!this.isGuide) {
      store.dispatch(navigateComponent('/permission'));
    }
  }

  stateChanged(state) {
    this.questId = selectQuestId(state);
    this.quest = selectEditingQuest(state);
    this.missions = selectEditingQuestMissions(state);
    this.isGuide = selectIsGuide(state);
  }

  back() {
    window.history.back();
  }

  disconnectedCallback() {
    store.dispatch(resetEditingQuest());
  }
}

window.customElements.define('e-quest-editor', QuestEditor);
