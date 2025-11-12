import { html } from 'lit';
import { shared } from '../styles';
import { selectQuestId } from '../selectors/route-data.selectors';
import { selectHeroQuestForFeedback } from '../selectors/hero.selectors';
import notificationService from '../services/notification.service';

import '../components/hero.component';
import '../components/submit-message.component';
import questService from '../services/quest.service';
import { StatefulPage } from './stateful-page-view-element';

let styles = html`
  <style>
    ${shared()}
  </style>
`;

class GuideFeedback extends StatefulPage {
  render() {
    if (!this.quest) return html``;

    return html`
      ${styles}

      <section>
        <e-hero .quest=${this.quest}></e-hero>

        <div>
          This quest has been ${this.quest.status}. Leave some feedback for the hero to
          reflect upon.
        </div>

        <e-submit-message
          showBack="true"
          .toTarget=${this.quest.heroUserPrincipleName}
          .quest="${this.quest}"
          .callback=${this.sendFeedback}
          customCheckLabel="Retract Quest Completion"
          .customCheckCallback=${this.retractCompletion}
        ></e-submit-message>
      </section>
    `;
  }

  async retractCompletion() {
    await questService.retractHeroQuestCompletion(this.quest);
  }
  async sendFeedback() {
    if (this.activePromise) return;
    this.activePromise = await notificationService.resolveQuestNotifications(
      this.quest.questId
    );
    this.activePromise = null;
  }

  static get properties() {
    return {
      questId: Number,
      quest: Object
    };
  }

  stateChanged(state) {
    this.questId = selectQuestId(state);
    this.quest = selectHeroQuestForFeedback(state);
  }
}

window.customElements.define('e-guide-feedback', GuideFeedback);
