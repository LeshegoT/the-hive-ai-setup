import { expect } from '@open-wc/testing';
import {
  selectEditingQuest,
  selectEditingQuestMissions,
  selectMissionToUpdate,
  selectQuestEditorErrors,
  selectQuestMissions,
} from '../../../src/selectors/quest-editor.selectors';

describe('Selector - Quest-Editor', () => {
  it('should return editing quest', () => {
    let quest = {questId: 1, questTypeId: 1, specialisationId: 1, startDate: '2020-01-01', endDate: '2030-01-01'};
    let questTypes = [{questTypeId: 1}];
    let specialisations = [{specialisationId: 1}];

    let actual = selectEditingQuest.resultFunc(quest, questTypes, specialisations);

    expect(actual).to.deep.equal({...quest, months: 120, questType: questTypes[0], specialisation: specialisations[0]});
  });

  it('should select editor quest missions', () => {
    let state = {
      questEditor: {
        missions: [
          {missionId: 1}
        ]
      }
    }

    let actual = selectQuestMissions(state);

    expect(actual).to.deep.equal(state.questEditor.missions);
  });

  it('should select editing quest missions with info', () => {
    let missions = [{missionId: 1, missionTypeId: 1, courseId: 1}];
    let progress = [{courseId: 1}];
    let missionTypes = [{missionTypeId: 1}];

    let actual = selectEditingQuestMissions.resultFunc(missions, progress, missionTypes);

    expect(actual).to.deep.equal(missions.map(mission => {
      return {...mission, course: progress.find(c => c.courseId === mission.courseId), type: missionTypes.find(t => t.missionTypeId === mission.missionTypeId)};
    }));
  });

  it('should select quest editor errors', () => {
    let state = {
      questEditor: {
        errors: [{errorId: 1}]
      }
    }

    let actual = selectQuestEditorErrors(state);

    expect(actual).to.deep.equal(state.questEditor.errors);
  });

  it('should select mission to update', () => {
    let state = {
      questEditor: {
        missionToUpdate: {missionId: 1}
      }
    }

    let actual = selectMissionToUpdate(state);

    expect(actual).to.deep.equal(state.questEditor.missionToUpdate);
  });
});