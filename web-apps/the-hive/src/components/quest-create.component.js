import { html, LitElement } from 'lit';
import { shared, form } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { selectSpecialisations } from '../selectors/reference-data.selectors.js';
import authService from '../services/auth.service';
import {
  selectQuestEditorErrors,
  selectEditingQuest
} from '../selectors/quest-editor.selectors';
import questEditingService from '../services/quest-editor.service';

let styles = html`
  <style>
    ${shared()} ${form()}
  </style>
`;

class CreateQuest extends connect(store)(LitElement) {
  render() {
    const { specialisations } = this;

    const hasError = (name) => (this.errors.indexOf(name) >= 0 ? 'error' : '');

    return html`
      ${styles}

      <h3>Create <b>Quest</b></h3>
      <form @change="${(e) => this.formValueUpdated(e)}" class="quest">
        <div>
          <label>Hero Email:</label>
          <input
            class="${hasError('heroUserPrincipleName')}"
            name="heroUserPrincipleName"
            type="text"
          />
        </div>
        <div>
          <label>Goal:</label>
          <input class="${hasError('goal')}" name="goal" type="text" />
        </div>
        <div>
          <label>Specialisation:</label>
          <!-- TODO: Refactor this into a dedicated speicialisation component. - Mike, 2019-07-04 -->
          <select name="specialisationId">
            ${specialisations.map(
              (specialisation) =>
                html`
                  <option value="${specialisation.specialisationId}">
                    ${specialisation.name}</option
                  >
                `
            )}
          </select>
        </div>
        <div>
          <label>Goal Duration (months):</label>
          <input class="${hasError('months')}" type="number" name="months" />
        </div>
        <span>Minimum ${this.monthValidator && this.monthValidator.min} months and maximum ${this.monthValidator && this.monthValidator.max} months</span>
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

  static get properties() {
    return {
      specialisations: Array,
      errors: Array,
      monthValidator: Object
    };
  }

  firstUpdated() {
    this.monthValidator = questEditingService.validators.find((v) => v.name === 'months');
  }

  stateChanged(state) {
    this.specialisations = selectSpecialisations(state);
    this.errors = selectQuestEditorErrors(state);
    this.quest = selectEditingQuest(state);

    if (!this.quest.guideUserPrincipleName) {
      this.quest = {
        guideUserPrincipleName: authService.getUserPrincipleName(),
        specialisationId: 0, // Other
        startDate: new Date()
      };
    }
  }
}

window.customElements.define('e-create-quest', CreateQuest);
