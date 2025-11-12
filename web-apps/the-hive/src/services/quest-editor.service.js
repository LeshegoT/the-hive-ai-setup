import { get } from './shared';
import authService from './auth.service';
import { editingMissionsUpdated } from '../actions/editing-missions-updated.action';
import { editingQuestUpdated } from '../actions/editing-quest-updated.action';
import { questEditorErrorsFound } from '../actions/quest-editor-errors-found.action';
import { navigateComponent } from '../actions/app.action.js';
import { BaseService } from './base.service';

export class QuestEditorService extends BaseService{
  constructor() {
    super();

    this.validators = [
      {
        name: 'months',
        min: 3,
        max: 12
      },
      {
        name: 'sideQuest',
        invalid: 0
      }
    ];
  }

  async getEditingQuest(questId) {
    let upn = authService.getUserPrincipleName();

    let response = await get(this.buildApiUrl(`quest?questId=${questId}&upn=${upn}`));
    let data = await response.json();
    let { quest, missions } = data;

    if (quest) {
      quest.startDate = new Date(quest.startDate);
      quest.endDate = new Date(quest.endDate);
      missions = missions.map(mission => {
        let dateCompleted = mission.dateCompleted ? new Date(mission.dateCompleted) : mission.dateCompleted;
        return {
          ...mission,
          dateCompleted
        };
      });

      this.store.dispatch(editingQuestUpdated(quest));
      this.store.dispatch(editingMissionsUpdated(missions));
    } else {
      this.store.dispatch(navigateComponent('/permission'));
    }
  }

  updateEditingQuest(quest) {
    this.store.dispatch(editingQuestUpdated(quest));
  }

  updateEditingMissions(missions) {
    this.store.dispatch(editingMissionsUpdated(missions));
  }

  updateQuestErrors(errors) {
    this.store.dispatch(questEditorErrorsFound(errors));
  }

  updateMissionsSortOrder(allMissions, missionToUpdate, newSortOrder) {
    let oldSortOrder = missionToUpdate.sortOrder;
    let otherMission = allMissions.find((m) => m.sortOrder === newSortOrder);

    let changedMissions = allMissions.map((m) => {
      let sortOrder = m.sortOrder;
      if (m.missionId === missionToUpdate.missionId) {
        sortOrder = newSortOrder;
      } else if (m.missionId === otherMission.missionId) {
        sortOrder = oldSortOrder;
      }

      return {
        ...m,
        sortOrder
      };
    });

    let missions = changedMissions.sort(this.compareMissions);
    this.store.dispatch(editingMissionsUpdated(missions));
  }

  saveMissionSortOrder(missions) {
    let newMissions = missions.sort(this.compareMissions);
    this.store.dispatch(editingMissionsUpdated(newMissions));
  }

  markMissionForDeletion(allMissions, missionToDelete) {
    let deletedSortOrder = missionToDelete.sortOrder;
    let missions = allMissions.map((m) => {
      if (m.missionId === missionToDelete.missionId) {
        return {
          ...missionToDelete,
          sortOrder: -1,
        };
      }
      let sortOrder = m.sortOrder;
      if (m.sortOrder > deletedSortOrder) {
        sortOrder = sortOrder - 1;
      }

      return { ...m, sortOrder };
    });
    missions = missions.sort(this.compareMissions);
    this.store.dispatch(editingMissionsUpdated(missions));
    return missions;
  }

  compareMissions(missionA, missionB) {
    return missionA.sortOrder - missionB.sortOrder;
  }

  createNewMission(allMissions, newMission) {
    let sortOrder = 1;
    let missionId = -1;
    if (allMissions.length) {
      sortOrder = this.getNewSortOrder(allMissions);
      missionId = this.getNewMissionId(allMissions);
    }

    let missions = [...allMissions, { ...newMission, sortOrder, missionId }];
    this.store.dispatch(editingMissionsUpdated(missions));
  }

  validCourseMission(allMissions, newMission) {
    return !allMissions.filter((c) => c.courseId === newMission.courseId && !c.deleted)
      .length;
  }

  getNewSortOrder(missions) {
    let sortOrders = missions.map((m) => m.sortOrder);
    return Math.max(...sortOrders) + 1;
  }

  getNewMissionId(missions) {
    let missionId = -1;
    let missionIds = missions.map((m) => m.missionId);
    let minMissionId = Math.min(...missionIds);
    if (minMissionId < 0) {
      missionId = minMissionId - 1;
    }

    return missionId;
  }

  updateMission(allMissions, updatedMission) {
    let missions = allMissions.map((m) => {
      if (m.missionId === updatedMission.missionId) {
        return updatedMission;
      }

      return m;
    });

    this.store.dispatch(editingMissionsUpdated(missions));
  }

  validateField(changedField, errorList) {
    let validator = this.validators.find((v) => v.name === changedField.name);
    if (!changedField.value) {
      errorList.push(changedField.name);
    } else if (validator) {
      if (
        (validator.min && validator.min > changedField.value) ||
        (validator.max && validator.max < changedField.value)
      ) {
        errorList.push(changedField.name);
      } else if (changedField.value == validator.invalid) {
        errorList.push(changedField.name);
      } else {
        this.removeError(errorList, changedField.name);
      }
    } else {
      this.removeError(errorList, changedField.name);
    }
  };

  removeError(errorList, changedFieldName) {
    let indexOfError = errorList.indexOf(changedFieldName);
    if (indexOfError >= 0) {
      errorList.splice(indexOfError, 1);
    }
  };
}

export default new QuestEditorService();
