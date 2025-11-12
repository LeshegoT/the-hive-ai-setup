import { html, LitElement } from 'lit';
import { shared, form } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { formatDateTime, formatDateTimeLocale } from '../services/format.service';

import {
  selectMissionTypes,
  selectSideQuestTypes
} from '../selectors/reference-data.selectors.js';
import {
  selectEditingQuestMissions,
  selectQuestEditorErrors
} from '../selectors/quest-editor.selectors';
import { selectActiveSideQuests } from '../selectors/side-quests.selectors.js';

import sideQuestService from '../services/side-quests.service';
import questEditingService from '../services/quest-editor.service';

import { questMissionToUpdateUpdated } from '../actions/quest-mission-to-update-updated.action';
import { selectTracks } from '../selectors/track.selectors';
import { selectLevelUps } from '../selectors/level-up.selectors';

let styles = html`
  <style>
    ${shared()} ${form()}
  </style>
`;

class QuestMissionsEditor extends connect(store)(LitElement) {
  hasError(name) {
    return this.errors.indexOf(name) >= 0 ? 'error' : '';
  }

  getMissionTypeFromId(id) {
    let missionType = this.missionTypes.find(
      (missionType) => missionType.missionTypeId === id
    );

    return (
      missionType ||
      this.missionTypes.find((missionType) => missionType.missionTypeId === 1)
    );
  }

  getAvailableSideQuestForMission(mission) {
    if (mission.type.code === 'speaking') {
      return this.sideQuests.filter((sideQuest) => {
        return (
          sideQuest.code === 'meetup' ||
          sideQuest.code === 'speaking' ||
          sideQuest.code === 'conference'
        );
      });
    }
    return this.sideQuests.filter((sideQuest) => {
      return sideQuest.code === mission.type.code;
    });
  }

  showSideQuest() {
    let availableSideQuestMissions = this.getAvailableSideQuestForMission(this.mission);
    return html`
      <div>
        <label>Side quest: </label>
        <select
          name="sideQuest"
          class="${this.hasError('sideQuest')}"
          @change="${(e) => this.updateSideQuestType(e)}"
        >
          <option value="0">Select a Side Quest</option>
          ${availableSideQuestMissions.map(
            (sideQuest) =>
              html`
                <option
                  .selected="${sideQuest.id === this.mission.sideQuestId}"
                  value="${sideQuest.id}"
                >
                  ${sideQuest.name} ${sideQuest.startDate ? '-' : ''}
                  ${formatDateTime(sideQuest.startDate)}</option
                >
              `
          )}
        </select>
      </div>
      ${this.sideQuestType < 0
        ? html`
            <div>
              <label>Link: </label>
              <input
                type="input"
                name="sideQuestLink"
                class="${this.hasError('sideQuestLink')}"
                .value="${this.mission.link}"
              />
            </div>
          `
        : html``}
    `;
  }

  showLink() {
    return html`
      <div>
        <label>Link: </label>
        <input type="input" name="link" .value="${this.mission.link}" />
      </div>
    `;
  }

  showCourse() {
    return html`
      <div>
        <label>Course: </label>
        <select name="course" class="${this.hasError('course')}">
          ${this.tracks.map((track) =>
            track.courses.map(
              (course) =>
                html`
                  <option
                    .selected="${course.courseId === this.mission.courseId}"
                    value="${course.courseId}"
                  >
                    ${course.name} - ${track.name}</option
                  >
                `
            )
          )}
        </select>
      </div>
    `;
  }

  showLevelUp() {
    return html`
      <div>
        <label>Level up: </label>
        <select name="levelUp" class="${this.hasError('levelUp')}">
          ${this.levelUps.map(
            (levelUp) =>
              html`
                <option
                  .selected="${levelUp.levelUpId === this.mission.levelUpId}"
                  value="${levelUp.levelUpId}"
                >
                  ${levelUp.name} - ${formatDateTimeLocale(levelUp.startDate)}</option
                >
              `
          )}
        </select>
      </div>
    `;
  }

  renderButtons() {
    return this.mission.missionId
      ? html`
          <button type="button" @click="${() => this.cancel()}">Cancel</button>
          <button type="submit" class="save">Save</button>
        `
      : html`
          <div></div>
          <button type="submit" class="save">Add</button>
        `;
  }

  renderMissionOptions() {
    if (this.mission.type?.sideQuestMission) {
      return this.showSideQuest();
    } else if (this.mission.type?.code == 'level-up') {
      return this.showLevelUp();
    } else if (this.mission.type?.code == 'course') {
      return this.showCourse();
    } else {
      return this.showLink();
    }
  }

  render() {
    return html`
      ${styles}

      <form
        @change="${(e) => this.formValueUpdated(e)}"
        @submit="${(e) => this.submit(e)}"
      >
        <div>
          <label>Type: </label>
          <select
            name="missionTypeId"
            .disabled="${this.mission.missionId}"
            @change="${(e) => this.updateMissionType(e)}"
          >
            ${this.missionTypes.map(
              // TODO: Decide on a permanent, configurable way to filter the missionType options.
              (type) =>
                type.code != 'system'
                  ? html`
                      <option
                        .selected="${this.mission?.type?.missionTypeId === type.missionTypeId}"
                        value="${type.missionTypeId}"
                      >
                        ${type.name}</option
                      >
                    `
                  : html``
            )}
          </select>
        </div>
        <div>
          <label>Name: </label>
          <input
            class="${this.hasError('name')}"
            type="input"
            name="name"
            .value="${this.mission?.name || ''}"
            maxlength="100"
          />
        </div>
        <div class="description">
          <label>
            Description:
          </label>
          <textarea
            class="${this.hasError('description')}"
            type="input"
            name="description"
            .value="${this.mission?.description || ''}"
          ></textarea>
          <br />
        </div>
        <a href="https://guides.github.com/features/mastering-markdown/" target="_blank">
          (protip: this field supports markdown)
        </a>
        ${this.renderMissionOptions()}

        <div class="buttons">
          ${this.renderButtons()}
        </div>
      </form>
    `;
  }

  static get properties() {
    return {
      missionTypes: Array,
      levelUps: Array,
      sideQuests: Array,
      mission: Object,
      errors: Array
    };
  }

  updateMissionType(e) {
    this.mission.type = this.getMissionTypeFromId(parseInt(e.target.value));
    this.mission.missionTypeId = this.mission.type.missionTypeId;
  }

  updateSideQuestType(e) {
    this.sideQuestType = e.target.value;
  }

  formValueUpdated(e) {
    let errors = [...this.errors];
    questEditingService.validateField(e.target, errors);
    questEditingService.updateQuestErrors(errors);
  }

  submit(e) {
    e.preventDefault();
    let form = e.target;
    let errors = this.checkForErrors(form);

    if (!errors.length) {
      this.mission = {
        ...this.mission,
        missionTypeId: parseInt(form.missionTypeId.value),
        type: this.getMissionTypeFromId(parseInt(form.missionTypeId.value)),
        name: form.name.value,
        description: form.description.value,
        link: form.link
          ? form.link.value
          : form.sideQuestLink
          ? form.sideQuestLink.value
          : null,
        levelUpId: form.levelUp ? parseInt(form.levelUp.value) : null,
        sideQuestId: form.sideQuest ? parseInt(form.sideQuest.value) : null,
        courseId: form.course ? parseInt(form.course.value) : null
      };

      if (this.mission.missionId) {
        questEditingService.updateMission(this.missions, this.mission);
      } else {
        if (
          this.mission.courseId &&
          !questEditingService.validCourseMission(this.missions, this.mission)
        ) {
          questEditingService.updateQuestErrors(['course']);
          return;
        }

        questEditingService.createNewMission(this.missions, this.mission);
        this.setMissionDefault();
        form.reset();
      }
    }
    store.dispatch(questMissionToUpdateUpdated({}));
    questEditingService.updateQuestErrors(errors);
  }

  setMissionDefault() {
    this.mission = {
      missionTypeId: 1,
      type: this.getMissionTypeFromId(1),
      name: '',
      description: '',
      link: '',
      courseId: 0,
      code: '',
      sideQuestId: 0,
      levelUpId: 0
    };
  }

  checkForErrors(form) {
    let errors = [];
    questEditingService.validateField(form.name, errors);
    questEditingService.validateField(form.description, errors);
    if (form.sideQuest) questEditingService.validateField(form.sideQuest, errors);    

    return errors;
  }

  cancel() {
    store.dispatch(questMissionToUpdateUpdated({}));
  }

  firstUpdated() {
    if (!this.sideQuests.length) {
      sideQuestService.getSideQuests();
    }
  }

  stateChanged(state) {
    this.missionTypes = selectMissionTypes(state);
    this.tracks = selectTracks(state);
    this.missions = selectEditingQuestMissions(state);
    this.errors = selectQuestEditorErrors(state);
    this.sideQuests = selectActiveSideQuests(state) || [];
    this.sideQuestTypes = selectSideQuestTypes(state);
    this.levelUps = selectLevelUps(state);

    if (!this.mission) {
      this.setMissionDefault();
    }

    if (this.sideQuestTypes && this.sideQuestTypes.length) {
      let otherSideQuests = this.sideQuestTypes.map((type, index) => {
        return {
          id: (index + 1) * -1,
          typeId: type.sideQuestTypeId,
          code: type.code,
          name: 'Other ' + type.name
        };
      });
      this.sideQuests = [...this.sideQuests, ...otherSideQuests];
    }
  }
}

window.customElements.define('e-quest-missions-editor', QuestMissionsEditor);
