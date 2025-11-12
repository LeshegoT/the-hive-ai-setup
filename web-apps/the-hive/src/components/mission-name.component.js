import { html, LitElement } from 'lit';
import { hex, link } from '../styles';
import { selectHero } from '../selectors/hero.selectors';
import auth_service from '../services/auth.service';
import { store } from '../store';
import { connect } from 'pwa-helpers/connect-mixin';

import './hex-name.component';

let styles = html`
  <style>
    ${hex()} ${link()}
  </style>
`;

class MissionName extends connect(store)(LitElement) {
  linkForMission() {
    if (this.missionLink) return this.missionLink;
    
    if (this.mission.type.sideQuestMission && this.mission.sideQuestId) {
      return `/side-quest/${this.mission.sideQuestId}`;
    }

    switch (this.mission.type.code) {
      case 'course':
        if(this.mission.course != undefined){
          return this.mission.course &&
                (this.mission.course.completedSections !== this.mission.course.totalSections)
                ? `/course/${this.mission.course.code}/section/${this.mission.course.nextSectionCode}`
                : `/course/${this.mission.course.code}`;
        }
        return `/hero/${btoa(this.hero)}/mission/${this.mission.missionId}`;
      case 'level-up':
        return `/level-up/${this.mission.levelUpId}`;
      case 'video':
      case 'article':
      default:
        return `/hero/${btoa(this.hero)}/mission/${this.mission.missionId}`;
    }
  }

  percentageCompleteFor() {
    if (!this.mission.course || !this.isMe) {
      if (this.mission.dateCompleted) return '(Done)';

      return '';
    }

    if (this.mission.course.totalSections === 0) return `(0%)`;

    let progress = (
      (this.mission.course.completedSections / this.mission.course.totalSections) *
      100
    ).toFixed(0);
    if (progress < 100) {
      return `(${progress}%)`;
    }

    return '(Done)';
  }

  renderMissionName() {
    let icon = this.mission.icon;
    if (!icon)
      icon = this.mission.course != undefined ? this.mission.course.icon : this.mission.type.icon;

    const done = this.mission.dateCompleted || this.mission.deleted || this.percentageCompleteFor() === '(Done)'
      ? 'done'
      : '';
    const deleted = this.mission.deleted ? '(Deleted)' : '';

    const content = html`
      <e-hex-name .icon="${icon}" .name="${this.mission.name} ${this.percentageCompleteFor()} ${deleted}" .size="${this.size}"
        .index="${this.index + 1}" .done="${done}"></e-hex-name>
    `;

    if (this.mission.deleted || (!this.isMe && this.mission.course) || (this.questStatus)) {
      return html`
        <div>
          ${content}
        </div>
      `;
    }

    return html`
      <a href="${this.linkForMission()}">
        ${content}
      </a>
    `;
  }

  render() {
    return html`
      ${styles} ${this.renderMissionName()}
    `;
  }

  static get properties() {
    return {
      mission: Object,
      missionLink: String,
      index: Number,
      size: String,
      hero: String,
      isMe: Boolean,
      questStatus: String
    };
  }

  stateChanged(state) {
    this.hero = selectHero(state);
    let username = auth_service.getUserPrincipleName();

    if (this.hero === username) {
      this.isMe = true;
    }
  }
}

window.customElements.define('e-mission-name', MissionName);
