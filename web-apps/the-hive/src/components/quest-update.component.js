import { html, LitElement } from 'lit';
import { shared, form } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { formatDate, formatNumericDate } from '../services/format.service.js';
import { selectEditingQuest, selectQuestEditorErrors } from '../selectors/quest-editor.selectors';
import questEditingService from '../services/quest-editor.service';
import authService from '../services/auth.service';

let styles = html`
  <style>
    ${shared()} ${form()}
    h3 {
      margin-bottom: 0;
    }
    h4 {
      font-size: 0.9em;
      font-weight: lighter;
      margin: 0;
      margin-bottom: 2em;
    }

    h4 span {
      margin: 0 2em;
    }

    h4 span b {
      margin: 0 0.25em;
    }

    form > span {
      color: var(--app-tertiary-color);
      font-weight: lighter;
      text-decoration: none;
      font-size: 0.9em;
      display: block;
      text-align: right;
      margin-bottom: 0.6em;
      margin-top: -1em;
    }
  </style>
`;

class QuestUpdate extends connect(store)(LitElement) {
  renderStatusButtons () {
    if (this.quest.heroUserPrincipleName != authService.getUserPrincipleName()) return html``;

    return html`
      <div>
        <div>
          <a href="/quest/${this.quest.questId}/pause">
            <button class="status-button">Pause Quest</button>
          </a>
        </div>
        <div>
          <a href="/quest/${this.quest.questId}/abandon">
            <button class="status-button">Abandon Quest</button>
          </a>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.quest) return html``;

    const hasError = (name) => (this.errors.indexOf(name) >= 0 ? 'error' : '');

    return html`
      ${styles}

      <h3><b>${this.quest.heroUserPrincipleName}</b></h3>
      <h4>
        <span>Start Date:<b>${formatDate(new Date(this.quest.startDate))}</b></span>
        <span>Level:<b>${this.quest.questType ? this.quest.questType.name : ''}</b></span>
        <span>Spec:<b>${this.quest.specialisation ? this.quest.specialisation.name : ''}</b></span>
      </h4>
      <form @change="${(e) => this.formValueUpdated(e)}" class="quest">
        <div>
          <label>Goal:</label> <input class="${hasError('goal')}" name="goal" type="text" .value="${this.quest.goal}" />
        </div>
        <div>
          <label>Goal Duration (months):</label> <input class="${hasError('months')}" type="number" name="months" .value="${this.quest.months}" />
        </div>
        <span>Minimum ${this.monthValidator && this.monthValidator.min} months and maximum ${this.monthValidator && this.monthValidator.max} months</span>
        ${this.renderStatusButtons()}
      </form>
    `;
  }

  formValueUpdated(e) {
    let errors = [...this.errors];
    questEditingService.validateField(e.target, errors);

    let quest = {
      ...this.quest,
      [e.target.name]: e.target.value
    };

    questEditingService.updateEditingQuest(quest);
    questEditingService.updateQuestErrors(errors);
  }

  updateEndDate(quest) {
    let newDate = new Date(quest.startDate);
    newDate.setMonth(newDate.getMonth() + parseInt(quest.months));
    return formatNumericDate(newDate);
  }

  static get properties() {
    return {
      quest: Object,
      monthValidator: Object
    };
  }

  firstUpdated() {
    this.monthValidator = questEditingService.validators.find((v) => v.name === 'months');
  }

  stateChanged(state) {
    this.quest = selectEditingQuest(state);
    this.errors = selectQuestEditorErrors(state);
  }
}

window.customElements.define('e-quest-update', QuestUpdate);
