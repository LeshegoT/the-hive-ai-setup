import { expect } from '@open-wc/testing';
import { QuestEditorService } from '../../../src/services/quest-editor.service';
import sinon from 'sinon';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { EDITING_QUEST_UPDATED } from '../../../src/actions/editing-quest-updated.action';
import { EDITING_MISSSIONS_UPDATED } from '../../../src/actions/editing-missions-updated.action';
import { QUEST_EDITOR_ERRORS_FOUND } from '../../../src/actions/quest-editor-errors-found.action';

describe('Service - Quest Editor', () => {
  let questEditorService;
  let dispatch_spy;

  before(() => {
    questEditorService = new QuestEditorService();
    questEditorService._store=new StoreStub();
    dispatch_spy = sinon.spy(questEditorService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(questEditorService.store).to.be.ok;
    expect(questEditorService.config).to.be.ok;
  });

  describe('getEditingQuest', () => {
    let data = { quest: {}, missions: [] };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: EDITING_QUEST_UPDATED,
        quest: data.quest
      };

      await questEditorService.getEditingQuest(1);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });

    it('should navigate away if no quest', async () => {
      data = {};
      fetch_stub_returns_json(data);
      await questEditorService.getEditingQuest(1);

      expect(dispatch_spy.called).to.be.ok;
    });
  });

  describe('updateEditingQuest', () => {
    it('should dispatch an action', async () => {
      let expected_action = {
        type: EDITING_QUEST_UPDATED,
        quest: {}
      };

      await questEditorService.updateEditingQuest({});

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('updateEditingMissions', () => {
    it('should dispatch an action', async () => {
      let expected_action = {
        type: EDITING_MISSSIONS_UPDATED,
        missions: []
      };

      await questEditorService.updateEditingMissions([]);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('updateQuestErrors', () => {
    it('should dispatch an action', async () => {
      let expected_action = {
        type: QUEST_EDITOR_ERRORS_FOUND,
        errors: []
      };

      await questEditorService.updateQuestErrors([]);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('updateMissionsSortOrder', () => {
    it('should dispatch an action', async () => {
      let missions = [
        { missionId: 1, sortOrder: 2 },
        { missionId: 2, sortOrder: 1 },
        { missionId: 3, sortOrder: 3 }
      ];
      let newMissions = [
        { missionId: 1, sortOrder: 1 },
        { missionId: 2, sortOrder: 2 },
        { missionId: 3, sortOrder: 3 }
      ];
      let expected_action = {
        type: EDITING_MISSSIONS_UPDATED,
        missions: newMissions
      };

      await questEditorService.updateMissionsSortOrder(
        missions,
        { missionId: 1, sortOrder: 2 },
        1
      );

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('saveMissionSortOrder', () => {
    it('should dispatch an action', async () => {
      let expected_action = {
        type: EDITING_MISSSIONS_UPDATED,
        missions: []
      };

      await questEditorService.saveMissionSortOrder([]);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('markMissionForDeletion', () => {
    it('should dispatch an action', async () => {
      let missions = [
        { missionId: 1, sortOrder: 1 },
        { missionId: 2, sortOrder: 2 },
        { missionId: 3, sortOrder: 3 }
      ];
      let newMissions = [
        { missionId: 2, sortOrder: -1 },
        { missionId: 1, sortOrder: 1 },
        { missionId: 3, sortOrder: 2 }
      ];
      let expected_action = {
        type: EDITING_MISSSIONS_UPDATED,
        missions: newMissions
      };

      await questEditorService.markMissionForDeletion(missions, {
        missionId: 2,
        sortOrder: 2
      });

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('createNewMission', () => {
    it('should dispatch an action', async () => {
      let missions = [
        { missionId: 1, sortOrder: 1 },
        { missionId: 2, sortOrder: 2 }
      ];
      let newMissions = [
        { missionId: 1, sortOrder: 1 },
        { missionId: 2, sortOrder: 2 },
        { missionId: -1, sortOrder: 3 }
      ];
      let expected_action = {
        type: EDITING_MISSSIONS_UPDATED,
        missions: newMissions
      };

      await questEditorService.createNewMission(missions, { missionId: 1, sortOrder: 1 });

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });

    it('should dispatch an action', async () => {
      let missions = [
        { missionId: 1, sortOrder: 1 },
        { missionId: 2, sortOrder: 2 },
        { missionId: -1, sortOrder: 3 }
      ];
      let newMissions = [
        { missionId: 1, sortOrder: 1 },
        { missionId: 2, sortOrder: 2 },
        { missionId: -1, sortOrder: 3 },
        { missionId: -2, sortOrder: 4 }
      ];
      let expected_action = {
        type: EDITING_MISSSIONS_UPDATED,
        missions: newMissions
      };

      await questEditorService.createNewMission(missions, { missionId: 1, sortOrder: 1 });

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });

    it('should dispatch an action', async () => {
      let missions = [];
      let newMissions = [{ missionId: -1, sortOrder: 1 }];
      let expected_action = {
        type: EDITING_MISSSIONS_UPDATED,
        missions: newMissions
      };

      await questEditorService.createNewMission(missions, { missionId: 1, sortOrder: 1 });

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('updateMission', () => {
    it('should dispatch an action', async () => {
      let missions = [
        { missionId: 1, sortOrder: 1, name: 'Mission 1' },
        { missionId: 2, sortOrder: 2, name: 'Mission 2' }
      ];
      let newMissions = [
        { missionId: 1, sortOrder: 1, name: 'New Mission 1' },
        { missionId: 2, sortOrder: 2, name: 'Mission 2' }
      ];
      let expected_action = {
        type: EDITING_MISSSIONS_UPDATED,
        missions: newMissions
      };

      await questEditorService.updateMission(missions, {
        missionId: 1,
        sortOrder: 1,
        name: 'New Mission 1'
      });

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('validCourseMission', () => {
    it('should return only course missions', () => {
      let missions = [
        { missionId: 1, courseId: 1, deleted: 0 },
        { missionId: 2, courseId: 1, deleted: 1 },
        { missionId: 3, courseId: 2, deleted: 0 }
      ];
      let newMission = { courseId: 1 };

      let actual = questEditorService.validCourseMission(missions, newMission);

      expect(actual).to.equal(false);
    });
  });

  describe('validateField', () => {
    it('should add error if no value', () => {
      let changedField = { name: 'name', value: '' };
      let errorList = [];

      questEditorService.validateField(changedField, errorList);

      expect(errorList).to.deep.equal(['name']);
    });

    it('should add error if month is incorrect', () => {
      let changedField = { name: 'months', value: 1 };
      let errorList = [];

      questEditorService.validateField(changedField, errorList);

      expect(errorList).to.deep.equal(['months']);
    });

    it('should add error if month is incorrect', () => {
      let changedField = { name: 'months', value: 15 };
      let errorList = [];

      questEditorService.validateField(changedField, errorList);

      expect(errorList).to.deep.equal(['months']);
    });

    it('should remove error if month is correct', () => {
      let changedField = { name: 'months', value: 10 };
      let errorList = ['months'];

      questEditorService.validateField(changedField, errorList);

      expect(errorList).to.deep.equal([]);
    });

    it('should add error if sideQuest is invalid', () => {
      let changedField = { name: 'sideQuest', value: "0" };
      let errorList = [];

      questEditorService.validateField(changedField, errorList);
      expect(errorList).to.deep.equal(['sideQuest']);
    });

    it('should remove error if value is added', () => {
      let changedField = { name: 'name', value: 'value' };
      let errorList = ['name'];

      questEditorService.validateField(changedField, errorList);

      expect(errorList).to.deep.equal([]);
    });
  });
});
