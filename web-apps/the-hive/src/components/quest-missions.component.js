import { html, LitElement } from 'lit';
import { shared, form, hex, link } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import {
  selectEditingQuestMissions,
  selectQuestEditorErrors,
  selectMissionToUpdate
} from '../selectors/quest-editor.selectors';
import questEditingService from '../services/quest-editor.service';
import { up, down, clear, cog, box } from './svg';
import { questMissionToUpdateUpdated } from '../actions/quest-mission-to-update-updated.action';

import './hex-name.component';
import './quest-missions-editor.component';

let styles = html`
  <style>
    ${shared()} ${form()} ${hex()} ${link()} .button {
      flex: 0 1 auto;
      margin-top: 0.6em;
      width: 2em;
      height: 2em;
    }

    .hex-group {
      display: block;
    }

    .hex-group > div > span {
      flex: 1 1 auto;
    }

    .hex-group > div {
      display: flex;
      cursor: grab;
    }

    .hex-group > div > .button svg {
      fill: var(--app-tertiary-color);
      cursor: pointer;
      transform: scale(1.3) translateX(0.2em) translateY(0.2em);
    }

    .hex-group > div > .button:hover svg {
      fill: var(--app-primary-color);
    }

    .hide {
      visibility: hidden;
    }

    .editor {
      margin: 0 0 4em 6em;
    }
  </style>
`;

class QuestMissions extends connect(store)(LitElement) {
  renderEditor(mission) {
    if (mission !== this.missionToUpdate) return html``;

    return html`
      <e-quest-missions-editor
        class="editor"
        .mission="${mission}"
      ></e-quest-missions-editor>
    `;
  }

  renderMission(mission, index) {
    if (mission.deleted) return html``;
    const icon = mission.course ? mission.course.icon : mission.type.icon;
    const complete = mission.dateCompleted ? '(Done)' : '';

    const hideTop = (index) => (index === 0 ? 'hide' : '');
    const hideBottom = (index) => (index === this.missions.length - 1 ? 'hide' : '');

    let done = mission.dateCompleted ? 'done' : '';

    let content = html`
      <e-hex-name
        .icon="${icon}"
        .name="${mission.name} ${complete}"
        .index="${index + 1}"
      ></e-hex-name>
    `;

    if (mission.required)
      return html`
        <div id="drag${mission.missionId}" class="hex-group">
          <span class="${done}">${content}</span>
        </div>
      `;

    return html`
      <div id="drag${mission.missionId}" class="hex-group" data-id='${mission.missionId}'>
        <div
          @mousedown=${(e) => {
            this.draggedMission = mission;
          }}
          @touchstart=${(e) => {
            this.draggedMission = mission;
          }}
        >
          <span class="${done}" @click="${(e) => this.showEditor(mission)}">
            ${content}
          </span>
          <div
            class="button"
            class="button ${hideTop(index)}"
            @click="${(e) => this.moveUp(mission)}"
          >
            ${up}
          </div>
          <div
            class="button ${hideBottom(index)}"
            @click="${(e) => this.moveDown(mission)}"
          >
            ${down}
          </div>
          ${this.renderDeleteMission(mission)}
        </div>
        ${this.renderEditor(mission)}
      </div>
    `;
  }

  renderDeleteMission(mission){
    if (mission.missionTypeId === 8 && mission.name === 'Find a quest guide') 
      return html`
        <div class="button"></div>
      `;
      
    return html`
      <div class="button" @click="${(e) => this.deleteMission(mission)}">
        ${clear}
      </div>
    `
  }

  renderAdd() {
    return !this.missionToUpdate.missionId
      ? html`
          <h3>Add Mission</h3>
          <e-quest-missions-editor></e-quest-missions-editor>
        `
      : html``;
  }

  hasError() {
    return this.errors.indexOf('missions') >= 0
      ? html`
          <div class="error">There must be at least one mission in every quest!</div>
        `
      : html``;
  }

  noMissions() {
    return !this.missions.length && this.errors.indexOf('missions') < 0
      ? html`
          <div class="none">No missions yet!</div>
        `
      : html``;
  }

  render() {
    if (!this.missions) return html``;

    const missions = this.missions.filter((m) => !m.deleted);

    return html`
      ${styles} ${this.hasError()} ${this.noMissions()}
      <div id="drag" class="missions">
        ${missions.map((mission, index) => this.renderMission(mission, index))}
      </div>
      ${this.renderAdd()}
    `;
  }

  static get properties() {
    return {
      missions: Array,
      missionToUpdate: Object,
      errors: Array
    };
  }

  moveUp(clickedMission) {
    let newSortOrder = clickedMission.sortOrder - 1;
    questEditingService.updateMissionsSortOrder(this.missions, clickedMission, newSortOrder);
  }

  moveDown(clickedMission) {
    let newSortOrder = clickedMission.sortOrder + 1;
    questEditingService.updateMissionsSortOrder(this.missions, clickedMission, newSortOrder);
  }

  deleteMission(clickedMission) {
    let mission = {
      ...clickedMission,
      deleted: true
    };
    this.missions = questEditingService.markMissionForDeletion(this.missions, mission);

    if (this.sortable) this.sortable.destroy();
    
    let item = this.shadowRoot.getElementById(`drag${mission.missionId}`);
    item.remove();

    let order = this.missions.map((m) => {
      return m.missionId.toString();
    });
    this.setupSortable().sort(order);
  }

  showEditor(mission) {
    store.dispatch(questMissionToUpdateUpdated(mission));

    //clear errors if any exist
    questEditingService.updateQuestErrors([]);
  }

  updated(changedProps) {
    if (changedProps.has('missions')) {
      this.validateMissionCount();

      let order = this.missions.map((m) => {
        return m.missionId.toString();
      });

      if (this.sortable && order) this.sortable.sort(order);
    }
  }

  async firstUpdated() {
    import('sortablejs').then((Sortable) => {
      this.SortableJS = Sortable;
      if (this.sortable) this.sortable.destroy();
      this.setupSortable();
    });
  }

  validateMissionCount() {
    let indexOfError = this.errors.indexOf('missions');
    if (this.missions && this.missions.length && indexOfError >= 0) {
      let errors = [...this.errors];
      errors.splice(indexOfError, 1);
      questEditingService.updateQuestErrors(errors);
    }
  }

  setupSortable () {
    if (!this.SortableJS) return;

    let el = this.shadowRoot.getElementById('drag');
    if (el) {
      this.sortable = this.SortableJS.default.create(el, {
        animation: 300,
        onEnd: (evt) => {
          let sortOrderDiff = evt.newIndex - evt.oldIndex;
          let changedMissions = this.missions.map((m) => {
            let sortOrder = m.sortOrder;
            if (this.draggedMission.missionId === m.missionId) {
              sortOrder = evt.newIndex;
            } else {
              if (Math.sign(sortOrderDiff) == 1 && m.sortOrder > evt.oldIndex && m.sortOrder <= evt.newIndex) {
                sortOrder = m.sortOrder - 1;
              } else if (Math.sign(sortOrderDiff) == -1 && m.sortOrder < evt.oldIndex && m.sortOrder >= evt.newIndex) {
                sortOrder = m.sortOrder + 1;
              }
            }
            return {...m, sortOrder}
          });
          questEditingService.saveMissionSortOrder(changedMissions);
        }
      });
      return this.sortable;
    }
  }

  stateChanged(state) {
    this.missions = selectEditingQuestMissions(state);
    this.errors = selectQuestEditorErrors(state);
    this.missionToUpdate = selectMissionToUpdate(state);

    this.missions = this.missions.filter((m) => !m.deleted);

    let index = 0;
    for (let m of this.missions) {
      m.sortOrder = index;
      index++;
    }
  }
}

window.customElements.define('e-quest-missions', QuestMissions);
