import { html } from 'lit';
import { shared, animations } from '../styles';
import { selectMission, selectQuest } from '../selectors/quest.selectors';
import { selectMessagesForMission } from '../selectors/messages.selectors';
import { selectMissionId } from '../selectors/route-data.selectors';

import '../components/title.component';
import '../components/sub-title.component';
import '../components/message-list.component';
import '../components/submit-message.component';
import '../components/hero-title.component';
import markdownService from '../services/markdown.service';
import { selectHero } from '../selectors/hero.selectors';
import missionsService from '../services/missions.service';
import { StatefulPage } from './stateful-page-view-element';

let styles = html`
  <style>
    ${shared()} ${animations()} :host {
      font-size: 1.1em;
    }

    a {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      display: block;
    }

    e-hero-title {
      padding-top: 1em;
    }
  </style>
`;

class Mission extends StatefulPage {
  renderCompleteFindGuide(){
    if(!this.quest.guideUserPrincipleName)
      return html`
        <section class="fade-in">
          <p>
            This unique mission can only be completed once a Quest Guide has been assigned to you. 
            If in doubt, email the <a href="mailto:atcteam@bbd.co.za">ATC Team</a>
          </p>
        </section>
      `;
    return html`
      <section class="fade-in">
        <p>
          Who is your guide? Have you made contact yet? What did you discuss? Take a moment to reflect...
        </p>
        <e-submit-message .mission="${this.mission}" showBack="true"></e-submit-message>
      </section>
    `;    
  }

  renderCommentBox() {
    if(this.mission.missionTypeId === 8 && this.mission.name === 'Find a quest guide')
      return this.renderCompleteFindGuide();

    return html`
      <section class="fade-in">
        <p>
          and then take a little time to reflect on what you've learned:
        </p>
        <e-submit-message .mission="${this.mission}" showBack="true" rateContent="true"></e-submit-message>
      </section>
    `;
  }

  render() {
    if (!this.mission) return html``;

    return html`
      ${styles}

      <section class="fade-in">
        <e-title .name="${this.mission.name}" .icon="${this.mission.type.icon}"></e-title>

        <p>
          ${this.description}
        </p>

        ${this.mission.link &&
          html`
            <a href="${this.mission.link}" target="_blank">${this.mission.link}</a>
          `}

        <e-message-list .missionId="${this.mission.missionId}"></e-message-list>
      </section>

      ${this.renderCommentBox()}
    `;
  }

  firstUpdated() {
    if (!this.mission) {
      missionsService.getMissionById(this.missionId);
    }
  }

  updated() {
    if (this.mission && !this.description) {
      this.description = markdownService.convertMarkdownToHtml(this.mission.description);
    }
  }

  static get properties() {
    return {
      mission: Object,
      quest: Object,
      messages: Array,
      description: String
    };
  }

  stateChanged(state) {
    this.hero = selectHero(state);
    this.mission = selectMission(state);
    this.messages = selectMessagesForMission(state);
    this.missionId = selectMissionId(state);
    this.quest = selectQuest(state);
  }
}

window.customElements.define('e-mission', Mission);
