import { html, LitElement } from 'lit';
import { shared, animations, form } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import authService from '../services/auth.service';
import {
  selectEditingQuest,
  selectEditingQuestMissions,
  selectQuestEditorErrors
} from '../selectors/quest-editor.selectors';
import { selectSpecialisations } from '../selectors/reference-data.selectors';
import { selectPausedQuests } from '../selectors/quest.selectors';
import questService from '../services/quest.service';
import questEditingService from '../services/quest-editor.service';
import { resetEditingQuest } from '../actions/reset-editing-quest.action';
import missionService from '../services/missions.service';
import { formatNumericDate } from '../services/format.service';

import './quest-missions.component';

const styles = html`
  <style>
    ${shared()} ${animations()} ${form()} :host {
      position: relative;
      display: block;
      min-height: 100vh;
    }

    section {
      position: absolute;
      left: 0;
      right: 0;
      background-color: var(--app-section-even-color);
      margin-top: 0;
      max-width:90vw;
    }

    .hide {
      display: none;
    }

    h2 {
      font-size: 1.3em;
      font-weight: lighter;
      margin: 1em 0 0 0;
    }

    p {
      text-align: justify;
    }

    p > img {
      display: block;
      width: 100%;
      max-width: 35em;
      margin: 1em auto;
    }

    .buttons {
      display: flex;
      flex-direction: row-reverse;
    }

    button {
      font-size: 1em;
      z-index: 1;
    }

    .short {
      width: 2em;
    }

    form > div {
      flex-direction: column;
    }

    p > input {
      margin: 0 0.5em;
    }

    e-quest-missions {
      margin: 2em 0;
    }

    a {
      color: var(--app-tertiary-color);
      font-style: italic;
    }

    form > div > p > em {
      color: var(--app-tertiary-color);
    }

    div.avatar-container {
      position: relative;
      width: 15em;
      margin: -4em auto 0;
    }

    .quest {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .quest > .buttons > button {
      margin-top: 1em;
      height: 2em;
    }

    .quest:nth-of-type(even) {
      background: var(--app-section-odd-color);
    }

    .p-center {
      text-align: center;
    }

    @media (min-width: 460px) {
      :host {
        min-height: 80vh;
      }
      section {
        min-height: 25em;
      }
      h2 {
        font-size: 2em;
        margin: 0;
      }

      button {
        font-size: 1.25em;
      }
    }
  </style>
`;

class NewQuest extends connect(store)(LitElement) {
  shouldShow(step) {
    let slide_in, slide_out;

    if (this.direction === 'next') {
      slide_in = 'slide-in-right';
      slide_out = 'slide-out-left';
    } else if (this.direction === 'back') {
      slide_in = 'slide-in-left';
      slide_out = 'slide-out-right';
    }

    if (this.step === step) {
      // current step
      return slide_in;
    } else if (step === this.lastStep) {
      // previous step
      return slide_out;
    }

    return 'hide';
  }

  renderBackButton() {
    return html`
      <button type="button" @click="${() => this.back()}">Back</button>
    `;
  }

  renderNextButton() {
    return html`
      <button type="button" @click="${() => this.next()}">Next</button>
    `;
  }

  hasError(name) {
    return this.errors.indexOf(name) >= 0 ? 'error' : '';
  }

  renderStep0() {
    return html`
      <section class="${this.shouldShow(0)}">
        <div class="buttons">${this.renderNextButton()}</div>
        <h2>Welcome back</h2>
        <p class="p-center">The best thing about learning is that it never stops! Let’s set your next quest 😊</p>
        <div class="avatar-container">
          <e-my-avatar></e-my-avatar>
        </div>
      </section>
    `;
  }

  renderResumeStep () {
    return html`
      <section class="${this.shouldShow(1)}">
        <div class="buttons">${this.renderNextButton()} ${this.renderBackButton()}</div>
        <h2>You have paused quests</h2>
        <p class="p-center">Would you like to resume one of them? If not click next.</p>
        ${this.pausedQuests.map(
          (quest) => html`
            <div class="quest">
              <div class="content">
                <h3><span>${quest.goal}</span></h3>
                <p>started on ${formatNumericDate(quest.startDate)}</p>
              </div>
              <div class="buttons">
                <button type="button" @click=${() => this.resumeQuest(quest.questId)}>Resume</button>
              </div>
            </div>
          `
        )}
      </section>
    `;
  }

  renderStep1() {
    const { specialisations } = this;

    return html`
      <section class="${this.shouldShow(2)}">
        <div class="buttons">
          <button type="button" @click="${() => this.validateNext()}">Next</button>
          ${this.renderBackButton()}
        </div>
        <h2>Your goal</h2>
        <p class="p-center">What else would you like to learn?</p>
        <form @change="${(e) => this.updateQuest(e)}" @submit="${(e) => this.submit(e)}">
          <div>
            <label for="goal">My goal is to</label>
            <input type="text" name="goal" class="${this.hasError('goal')}" />
          </div>
          <div>
            <label for="specialisation">And if I could associate this goal with a specialisation, it would be</label>
            <select name="specialisationId">
              ${specialisations.map(
                (specialisation) =>
                  html`
                    <option value="${specialisation.specialisationId}">${specialisation.name}</option>
                  `
              )}
            </select>
          </div>
          <div>
            <p>
              <em>I want to achieve my goal in</em>
              <input type="text" name="months" class="short ${this.hasError('months')}" />
              <em>months (minimum 3 and maximum 12).</em>
            </p>
          </div>
        </form>
      </section>
    `;
  }

  renderStep2() {
    return html`
      <section class="${this.shouldShow(3)}">
        <div class="buttons">
          <button type="button" @click="${() => this.finish()}">
            Let's go!
          </button>
          ${this.renderBackButton()}
        </div>
        <h2>Your missions</h2>
        <e-quest-missions></e-quest-missions>
      </section>
    `;
  }

  render() {
    return html`
      ${styles} ${this.renderStep0()} ${this.renderStep1()} ${this.renderStep2()} ${this.renderResumeStep()}
    `;
  }

  static get properties() {
    return {
      step: Number,
      direction: String,
      quest: Object,
      missions: Array,
      specialisations: Object,
      errors: Array,
      monthValidator: Object,
      pausedQuests: Array
    };
  }

  firstUpdated() {
    this.monthValidator = questEditingService.validators.find((v) => v.name === 'months');

    this.step = 0;

    const heroUpn = authService.getUserPrincipleName();

    const specialisationId = 0; // Other
    const quest = {
      heroUpn,
      specialisationId,
      startDate: new Date().toISOString()
    };

    questEditingService.updateEditingQuest(quest);

    const missionTypeId = 8;

    const missions = [
      {
        missionId: -1,
        missionTypeId,
        name: 'Find a quest guide',
        description: `Use the Request a Guide link on the home page to find a quest guide that can help you with your chosen specialistion. Take some time to read more about the Hero's Journey, and understand what the initiative involves. Don't be afraid to contact ATC if you have any issues`,
        link: 'https://the-hive.bbd.co.za/about',
        required: true,
        sortOrder: 3
      }
    ];

    questEditingService.updateEditingMissions(missions);

    if (!this.quests || !this.quests.length) {
      questService.getHeroQuests(heroUpn);
      questService.getOldQuests(heroUpn);
    }
  }

  setDirection(direction) {
    this.direction = direction;
  }

  scrollTop() {
    window.scroll({
      top: 0,
      left: 0
    });
  }

  next() {
    this.lastStep = this.step;
    if (this.step === 0 && !this.pausedQuests.length) this.step = this.step + 1;
    this.setDirection('next');
    this.step = this.step + 1;
    this.scrollTop();
  }

  back() {
    this.lastStep = this.step;
    this.setDirection('back');
    this.step = this.step - 1;
    if (this.lastStep === 2 && !this.pausedQuests.length) this.step = this.step - 1;
    this.scrollTop();
  }

  validateNext() {
    const errors = [...this.errors];

    questEditingService.validateField({ name: 'goal', value: this.quest.goal }, errors);
    questEditingService.validateField({ name: 'months', value: this.quest.months }, errors);

    questEditingService.updateQuestErrors(errors);

    if (!errors || !errors.length) {
      this.next();
    }
  }

  submit(e) {
    e.preventDefault();
  }

  updateQuest(e) {
    const errors = [...this.errors];
    questEditingService.validateField(e.target, errors);

    const quest = {
      ...this.quest,
      [e.target.name]: e.target.value
    };

    questEditingService.updateEditingQuest(quest);
    questEditingService.updateQuestErrors(errors);
  }

  resumeQuest (questId) {
    questService.resumeQuest(questId);
  }

  async finish() {
    const { quest, missions } = this;

    const mission = missions.find((mission) => mission.missionId === -1);
    await missionService.updateGuideMissionDescription(
      mission,
      this.specialisations,
      quest.specialisationId
    );

    questService.createQuest(quest, missions);

    questService.questOptimisticUpdate(quest, missions);
  }

  stateChanged(state) {
    this.quest = selectEditingQuest(state);
    this.missions = selectEditingQuestMissions(state);
    this.specialisations = selectSpecialisations(state);
    this.errors = selectQuestEditorErrors(state);
    this.pausedQuests = selectPausedQuests(state);
  }

  disconnectedCallback() {
    store.dispatch(resetEditingQuest());
  }
}

window.customElements.define('e-new-quest', NewQuest);
