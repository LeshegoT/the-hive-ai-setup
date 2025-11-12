import { html } from 'lit';
import { shared, animations } from '../styles';
import questService from '../services/quest.service';
import { selectQuestId, selectStatusCode } from '../selectors/route-data.selectors';
import { selectQuest } from '../selectors/quest.selectors';

import '../components/submit-message.component';
import { StatefulPage } from './stateful-page-view-element';

let styles = html`
  <style>
    ${shared()} ${animations()} h3 {
      font-size: 1.3em;
      font-weight: lighter;
      margin: 0;
    }

    h4 {
      font-size: 1em;
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
  </style>
`;

class ChangeQuestStatus extends StatefulPage {
  renderCommentBox() {
    let callback;
    let text;
    if (this.status == 'complete') {
      callback = this.completeQuest;
      text = `if you are sure you want to ${this.status} this quest, please provide some feedback and tell us what you have learned:`;
    } else if (this.status == 'abandon') {
      callback = this.abandonQuest;
      text = `if you are sure you want to ${this.status} this quest, please provide a reason:`;
    } else if (this.status == 'pause') {
      callback = this.pauseQuest;
      text = `if you are sure you want to ${this.status} this quest, please provide a reason:`;
    }

    return html`
      <p>
        ${text}
      </p>
      <e-submit-message
        .quest="${this.quest}"
        .callback=${callback}
        showBack="true"
      ></e-submit-message>
    `;
  }

  renderWarning() {
    if (this.status == 'pause')
      return html`
        <p>
          Note: if you pause, and later decide to reactivate your quest, you may not get
          the same guide.
        </p>
      `;

    return html`
      <p>Note: Please talk to your guide before you ${this.status} this quest.</p>
    `;
  }

  render() {
    return html`
      ${styles}

      <section>
        <h2>Are you sure you want to ${this.status} this quest?</h2>
        ${this.renderWarning()}

        <h3>Goal: <b>${this.quest.goal}</b></h3>
        <h4>
          <span
            >Level:<b>${this.quest.questType ? this.quest.questType.name : ''}</b></span
          >
          <span>
            Spec:<b>${this.quest.specialisation ? this.quest.specialisation.name : ''}</b>
          </span>
        </h4>
      </section>

      <section class="fade-in">
        ${this.renderCommentBox()}
      </section>
    `;
  }

  async completeQuest() {
    if (this.activePromise) return;
    this.activePromise = await questService.markQuestComplete(this.quest);
    this.activePromise = null;
  }

  async abandonQuest() {
    if (this.activePromise) return;
    this.activePromise = await questService.markQuestAbandoned(this.quest);
    this.activePromise = null;
  }

  async pauseQuest() {
    if (this.activePromise) return;
    this.activePromise = await questService.markQuestPaused(this.quest);
    this.activePromise = null;
  }

  static get properties() {
    return {
      questId: Number,
      quest: Object,
      status: String
    };
  }

  stateChanged(state) {
    this.questId = selectQuestId(state);
    this.quest = selectQuest(state);
    this.status = selectStatusCode(state);
  }
}

window.customElements.define('e-change-quest-status', ChangeQuestStatus);
