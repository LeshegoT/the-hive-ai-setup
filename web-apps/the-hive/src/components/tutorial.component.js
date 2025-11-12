import { html, LitElement } from 'lit';
import { shared, animations, form } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { cog, gift } from './svg';

import './quest-missions.component';
import authService from '../services/auth.service';

import {
  selectEditingQuest,
  selectEditingQuestMissions,
  selectQuestEditorErrors
} from '../selectors/quest-editor.selectors';

import { selectSpecialisations } from '../selectors/reference-data.selectors';
import questService from '../services/quest.service';
import questEditingService from '../services/quest-editor.service';
import { resetEditingQuest } from '../actions/reset-editing-quest.action';
import missionsService from '../services/missions.service';

let styles = html`
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
      background: var(--app-section-even-color);
      margin-top: 0;
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
    }

    .robots {
      display: flex;
    }

    .robots > div {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      text-align: center;
      font-size: 1.5em;
      font-weight: lighter;
      min-height: 8em;
    }

    .robots div span {
      display: block;
      flex: 1 1 auto;
      background-repeat: no-repeat;
    }

    .two {
      background-size: 125%;
      background-position-y: -0.9em;
    }

    .three {
      background-size: 175%;
      background-position-y: -3.2em;
      background-position-x: -2em;
    }

    span {
      display: inline-block;
    }

    .cog,
    .gift {
      width: 1em;
      height: 1em;
      fill: var(--app-tertiary-color);
    }

    .parts-container {
      display: flex;
      flex-direction: column;
      width: inherit;
      margin: 2em auto;
    }

    .parts-container div {
      background-repeat: no-repeat;
    }

    .parts {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      width: inherit;
      min-height: 8em;
    }

    .parts > div {
      display: flex;
      flex-direction: row;
      flex: 1 1 auto;
    }

    .part {
      border: 1px solid var(--app-tertiary-color);
      margin: 0.2em;
      background-size: 4em;
      flex: 1 1 auto;
    }

    .part.right {
      background-position: 10% 70%;
    }

    .part.left {
      background-position: -2em -2em;
    }

    .part.selected {
      border-color: var(--app-primary-color);
    }
    .parts-container .avatar {
      width: 15em;
      height: 12em;
      background-position: -1em -6em;
      background-size: 15em;
      margin: 1em auto;
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
      margin: 2em 5em;
    }

    a {    
      color: var(--app-tertiary-color);
      font-style: italic;
    }
    
    @media (min-width: 460px) {
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

      .parts-container {
        flex-direction: row;
        width: 46em;
        height: 11em;
        margin: 2em auto;
      }

      .parts-container .avatar {
        height: 15em;
        margin: 0 2em;
      }

      .parts {
        width: 30em;
        flex-direction: row; /*No idea why this is working, it should work with column! - Gery, 9 July*/
      }

      .part {
        width: 5em;
        height: 5em;
        background-size: 6em;
      }

      .robots > div {
        min-height: 13em;
      }

      .robots > div .one {
        background-size: 7em;
        background-position: 2em 2em;
      }

      .robots > div .two {
        background-size: 10em;
        background-position: 1em -1.6em;
      }

      .robots > div .three {
        background-size: 17em;
        background-position: -2em -5em;
      }
    }
  </style>
`;

class Tutorial extends connect(store)(LitElement) {
  shouldShow(step) {
    let direction = 1;
    let slide_in, slide_out;

    if (this.direction === 'next') {
      slide_in = 'slide-in-right';
      slide_out = 'slide-out-left';
      direction = 1;
    } else if (this.direction === 'back') {
      slide_in = 'slide-in-left';
      slide_out = 'slide-out-right';
      direction = -1;
    }

    if (this.step === step) {
      // current step
      return slide_in;
    }

    return 'hide';
  }

  renderBackButton() {
    return html`
      <button type="button" @click="${(e) => this.back()}">Back</button>
    `;
  }

  renderNextButton() {
    return html`
      <button type="button" @click="${(e) => this.next()}">Next</button>
    `;
  }

  renderStep0() {
    return html`
      <section class="${this.shouldShow(0)}">
        <div class="buttons">
          ${this.renderNextButton()}
        </div>
        <h2>Welcome to</h2>
        <p>
          <img src="images/the-heros-journey.png" alt="The Hero's Journey" />
        </p>
        <p>
          The Hero’s Journey is a gamified continuous learning programme in support of our
          vision to create an inclusive and sustainable culture of learning within BBD.
        </p>
        <p>
          This tutorial will give you just enough info to get you started on your own
          journey.
        </p>
      </section>
    `;
  }

  renderStep1() {
    return html`
      <section class="${this.shouldShow(1)}">
        <div class="buttons">
          ${this.renderNextButton()} ${this.renderBackButton()}
        </div>
        <h2>What you should know</h2>
        <p>
          There are three parts to the Hero’s Journey: Adventures, Level Ups and Side
          Quests, but for now, we want to focus on getting you started. So let’s have a
          quick look at Adventures.
        </p>
        <p>
          Adventures are quests aimed at building your knowledge, based on your customised
          learning path. There are three levels you can achieve, Apprentice, Hero and
          Master, and during each level, you will be represented by Gearz, Plexi or
          Scyther, dependent on your level.
        </p>
        <div class="robots">
          <div>
            <div>Gearz</div>
            <span
              class="one"
              style="background-image: url('images/characters/robot.1.svg')"
            ></span>
          </div>
          <div>
            <div>Plexi</div>
            <span
              class="two"
              style="background-image: url('images/characters/robot.2.svg')"
            ></span>
          </div>
          <div>
            <div>Scyther</div>
            <span
              class="three"
              style="background-image: url('images/characters/robot.3.svg')"
            ></span>
          </div>
        </div>
        <p>
          As you are starting your first-ever journey, you’ll enter as an Apprentice with
          Gearz, but don’t underestimate this bot! There is lots you need to know about
          Gearz.
        </p>
      </section>
    `;
  }

  renderStep2() {
    let box = html`
      <span class="shake">${gift}</span>
    `;

    return html`
      <section class="${this.shouldShow(2)}">
        <div class="buttons">
          ${this.renderNextButton()} ${this.renderBackButton()}
        </div>
        <h2>Your avatar</h2>
        <p>
          Don’t let its size fool you. Gearz is a very capable and absolutely skilled bot.
          Like all bots, Gearz allows you to change its colour depending on your mood…
          simply click on the cog ${cog} and drag the colour picker over the rainbow of
          colours until you find the one that works for you. Gearz will remain this colour
          until you decide to change it.
        </p>
        <p>
          This bot also boasts a variety of specialised weaponry and toys, for example:
          <div class="parts-container">
              <div class="parts">
                <div>
                  <div class="part right" style="background-image: url('images/characters/apprentice/right-arm/sword.svg')"></div>
                  <div class="part right" style="background-image: url('images/characters/apprentice/right-arm/axe.svg')"></div>
                  <div class="part right selected" style="background-image: url('images/characters/apprentice/right-arm/drill.svg')"></div>
                  <div class="part right" style="background-image: url('images/characters/apprentice/right-arm/missile.svg')"></div>
                  <div class="part right" style="background-image: url('images/characters/apprentice/right-arm/slicer.svg')"></div>
                </div>
                <div>
                  <div class="part left" style="background-image: url('images/characters/apprentice/left-arm/club.svg')"></div>
                  <div class="part left selected" style="background-image: url('images/characters/apprentice/left-arm/torch.svg')"></div>
                  <div class="part left" style="background-image: url('images/characters/apprentice/left-arm/shield.svg')"></div>
                  <div class="part left" style="background-image: url('images/characters/apprentice/left-arm/dagger.svg')"></div>
                  <div class="part" style="background-image: url('images/characters/apprentice/accessory/hair.svg')"></div>
                </div>
              </div>
              <div class="avatar" style="background-image: url(images/characters/gearz.svg)">
              </div>
          </div>
        </p>
        <p>
          But these are not for free, you have to earn them. Weapons and toys are unlocked
          as you complete activities and tasks, so look out for the box ${box} as an
          indication that you have unlocked something new. Simply click on the box ${box}
          or cog ${cog} to select any available item from the list to equip Gearz and make
          it your own.
        </p>
      </section>
    `;
  }

  renderStep3() {
    return html`
      <section class="${this.shouldShow(3)}">
        <div class="buttons">
          ${this.renderNextButton()} ${this.renderBackButton()}
        </div>
        <h2>Keeping track of time</h2>

        <p>
          Like all bots, Gearz has the primary responsibility to keep you updated with how
          much time you have left on your quest. The colour-scaled circle behind each bot
          represents whether you should be worried by how many days you have left.
        </p>
        <p>
          Now that you have been introduced, let’s have a quick look at how to create your
          quest.
        </p>
      </section>
    `;
  }

  hasError(name) {
    return this.errors.indexOf(name) >= 0 ? 'error' : '';
  }

  renderStep4() {
    let { specialisations } = this;

    return html`
      <section class="${this.shouldShow(4)}">
        <div class="buttons">
          <button type="button" @click="${(e) => this.validateNext('goal')}">Next</button>
          ${this.renderBackButton()}
        </div>
        <h2>Your goal</h2>
        <p>
          Before you start, there are some things you need to know… Unfortunately, Gearz
          cannot help you with this, you have to come up with it by yourself. So, the big
          question is…
        </p>
        <p>
          <b>What is the immediate goal you would like to achieve? </b>
          (and no, it cannot be world peace, unless you have a quick fix and if you did,
          you’d probably not be doing this, right?)
        </p>
        <p>
          Your goal should be simple enough so that you can achieve it in a couple of
          months, but complex enough to challenge you while on your learning journey.
        </p>
        <p>
          <em>
            When you consider your current situation, keeping in mind what you have
            learned over the years, the way you are working currently as well as the
            people you work with; what is the next immediate thing you need to master to
            become relevant or remain relevant in your area.
          </em>
        </p>
        <form @change="${(e) => this.updateQuest(e)}" @submit="${(e) => this.submit(e)}">
          <div>
            <label for="goal">My goal is to</label>
            <input type="text" name="goal" class="${this.hasError('goal')}" />
          </div>
          <div>
            <label for="specialisation">
              And if I could associate this goal with a specialisation, it would be
            </label>
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
        </form>
      </section>
    `;
  }

  renderStep5() {
    return html`
      <section class="${this.shouldShow(5)}">
        <div class="buttons">
        <button type="button" @click="${(e) => this.validateNext('months')}">Next</button>
        ${this.renderBackButton()}
        </div>
        <h2>Your timeframe</h2>
        <p>
          The next question you need to answer is:
          <b>how long will I allow myself to achieve this goal?</b> Does one month work
          for me or should I consider a three month period? Again, the timeframe should be
          short enough to achieve your goal (no more than ${this.monthValidator && this.monthValidator.max} months), but long enough to make sure you master the
          topic (no less than ${this.monthValidator && this.monthValidator.min} months).
        </p>
        <p>
        <form @change="${(e) => this.updateQuest(e)}" @submit="${(e) => this.submit(e)}">
          <em>
            I want to achieve my goal in
          </em>
          <input type="text" name="months" class="short ${this.hasError('months')}" />
          <em>months, starting today.</em>
          </form>
        </p>
      </section>
    `;
  }

  renderStep6() {
    return html`
      <section class="${this.shouldShow(6)}">
        <div class="buttons">
          ${this.renderNextButton()} ${this.renderBackButton()}
        </div>
        <h2>Your quest guide</h2>
        <p>
          Can’t do it by yourself? Don’t stress about that. We want you to succeed, and to
          make sure you have all the help you need, you’ll have a dedicated quest guide.
          Your Quest Guide is someone willing and able to assist you to succeed.
        </p>
        <p>
          At the Apprentice level, your Quest Guide will help structure your goal. They
          will look at your goal, timeline and missions to structure them in a way that
          ensure you have no choice but to succeed. It can also include missions that you
          yourself can’t think of right now.
        </p>
        <p>
          Once your Quest has been created, you will have the option to Request a Guide. 
          It's a good idea to request someone who has mastered the specialisation your
          quest is based on. But before you get to engage with them, maybe there are 
          some missions you know you should complete. We’ve gone and pre-added some 
          missions for you, but it is now your turn… Let’s go ahead and add more 
          missions you think you should complete as part of your quest.
        </p>
      </section>
    `;
  }

  renderStep7() {
    return html`
      <section class="${this.shouldShow(7)}">
        <div class="buttons">
          ${this.renderNextButton()} ${this.renderBackButton()}
        </div>
        <h2>Your first missions</h2>
        <e-quest-missions></e-quest-missions>
      </section>
    `;
  }

  renderStep8() {
    return html`
      <section class="${this.shouldShow(8)}">
        <div class="buttons">
          <button type="button" @click="${(e) => this.finish()}">
            Count me in!
          </button>
          ${this.renderBackButton()}
        </div>
        <h2>Your commitment</h2>
        <p>
          You’re almost ready to get started, but before you do, there’s one last thing
          you need to know.
        </p>
        <p>
          The Hero’s journey is designed around you taking ownership for your learning and
          career path. We’re not going to check up on you and report your progress to
          anyone, that’s not the point. We’re empowering you with the responsibility to
          grow your skills.
        </p>
        <p>
          To help you on this journey, we’ve ensured that there are many individuals ready
          and available to assist you as you need it.
        </p>
        <p>
          What we do need from you, is for you to make a sincere commitment to yourself
          and your learning goal. Just don’t forget to have fun along the way!
        </p>
      </section>
    `;
  }

  render() {
    return html`
      ${styles} ${this.renderStep0()} ${this.renderStep1()} ${this.renderStep2()}
      ${this.renderStep3()} ${this.renderStep4()} ${this.renderStep5()}
      ${this.renderStep6()} ${this.renderStep7()} ${this.renderStep8()}
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
      monthValidator: Object
    };
  }

  firstUpdated() {
    this.monthValidator = questEditingService.validators.find((v) => v.name === 'months');

    this.step = 0;

    let heroUpn = authService.getUserPrincipleName();

    let questTypeId = 1; // Apprentice
    let specialisationId = 0; // Other
    let quest = {
      heroUpn,
      questTypeId,
      specialisationId,
      startDate: new Date()
    };

    questEditingService.updateEditingQuest(quest);

    let missionTypeId = 8;

    let missions = [
      {
        missionId: -1,
        missionTypeId,
        name: 'Create quest',
        description: 'Create your first quest!',
        required: true,
        completed: true,
        sortOrder: 1
      },
      {
        missionId: -2,
        missionTypeId,
        name: 'Customise your avatar',
        description:
          'Customise your avatar by changing the colour, and assigning it a part.',
        required: true,
        sortOrder: 2
      },
      {
        missionId: -3,
        missionTypeId,
        name: 'Find a quest guide',
        description: `Use the Request a Guide link on the home page to find a quest guide that can help you with your chosen specialistion. Take some time to read more about the Hero's Journey, and understand what the initiative involves. Don't be afraid to contact ATC if you have any issues`,
        link: 'https://the-hive.bbd.co.za/about',
        required: true,
        sortOrder: 3
      }
    ];

    questEditingService.updateEditingMissions(missions);
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
    this.setDirection('next');
    this.step = this.step + 1;
    this.scrollTop();
  }

  back() {
    if(this.step > 0) {
        this.setDirection('back');
        this.step = this.step - 1;
        this.scrollTop();
    }
  }

  validateNext(fieldToValidate) {
    let errors = [...this.errors];

    questEditingService.validateField(
      { name: fieldToValidate, value: this.quest[fieldToValidate] },
      errors
    );
    questEditingService.updateQuestErrors(errors);

    if (!errors || !errors.length) {
      this.next();
    }
  }
  submit(e) {
    e.preventDefault();
  }
  updateQuest(e) {
    let errors = [...this.errors];
    questEditingService.validateField(e.target, errors);

    let quest = {
      ...this.quest,
      [e.target.name]: e.target.value
    };

    questEditingService.updateEditingQuest(quest);
    questEditingService.updateQuestErrors(errors);
  }

  async finish() {
    let { quest, missions } = this;

    //Add elements for guides onto description
    let mission = missions.find((mission) => mission.missionId === -3);
    await missionsService.updateGuideMissionDescription(
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
  }

  disconnectedCallback() {
    store.dispatch(resetEditingQuest());
  }
}

window.customElements.define('e-tutorial', Tutorial);
