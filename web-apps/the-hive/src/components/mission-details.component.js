import { html, LitElement } from 'lit';
import { hex, link } from '../styles';
import { selectHero } from '../selectors/hero.selectors';
import { store } from '../store';
import { connect } from 'pwa-helpers/connect-mixin';
import { selectMapMission } from '../selectors/map.selectors';

import './hex-name.component';

let styles = html`
  <style>
    ${link()}

    .mission-link:hover {
      color: var(--app-primary-color);
    }
  </style>
`;

class MissionDetails extends connect(store)(LitElement) {
  linkForMission() {

    if(this.mission.type.code === 'conversation')
      return html`
        <p>
          View your discussion below the map
        </p>
      `;

    if(this.mission.type.code === 'self-directed')
      return html`
        <p>
          View your self-directed missions below the map
        </p>
      `;

    let link = '';
    if(this.mission.type.sideQuestMission && this.mission.sideQuestId){
      link = `/side-quest/${this.mission.sideQuestId}`;
    }

    switch (this.mission.type.code) {
      case 'course':
        link = this.mission.course &&
          this.mission.course.completedSections !== this.mission.course.totalSections
          ? `/course/${this.mission.course.code}/section/${this.mission.course.nextSectionCode}`
          : `/course/${this.mission.course.code}`;
        break;
      case 'level-up':
        link = `/level-up/${this.mission.levelUpId}`;
        break;
      case 'video':
      case 'article':
      default:
        link = `/hero/${btoa(this.hero)}/mission/${this.mission.missionId}`;
        break;
    }

    return html`
      <a class="mission-link" href=${link}>
        Go to mission
      </a>
    `;
  }

  render() {
    if (!this.mission)
      return;

    return html`
      ${styles} 

      <h4>${this.mission.name}</h4>

      ${this.linkForMission()}
    `;
  }

  static get properties() {
    return {
      mission: Object,
      hero: Object
    };
  }

  stateChanged(state) {
    this.hero = selectHero(state);
    this.mission = selectMapMission(state);
  }
}

window.customElements.define('e-mission-details', MissionDetails);
