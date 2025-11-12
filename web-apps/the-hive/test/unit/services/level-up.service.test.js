import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { LevelUpService } from '../../../src/services/level-up.service';
import { LEVEL_UPS_RECEIVED } from '../../../src/actions/level-ups-received.action';
import { LEVEL_UP_ACTIVITIES_RECEIVED } from '../../../src/actions/level-up-activities-received.action';
import { USER_LEVEL_UPS_RECEIVED } from '../../../src/actions/user-level-ups-received.action';
import { USER_LEVEL_UP_ACTIVITIES_RECEIVED } from '../../../src/actions/user-level-up-activities-received.action.js';
import { LEVEL_UP_USERS_RECEIVED } from '../../../src/actions/level-up-users-received.action';
import { fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';

describe('Service - LevelUpService', () => {
  let levelUpService;
  let dispatch_spy;

  before(() => {
    levelUpService = new LevelUpService();
    levelUpService._store=new StoreStub();
    dispatch_spy = sinon.spy(levelUpService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(levelUpService.config).to.be.ok;
    expect(levelUpService.store).to.be.ok;
  });

  describe('getLevelUps', () => {
    let data = { levelUps: [], levelUpActivities: [], userLevelUps: [], userLevelUpActivities: [] };

    before(() => fetch_stub_returns_json(data));

    it('should return level ups', async () => {
      let expected_actions = [
        {
          type: LEVEL_UPS_RECEIVED,
          levelUps: data.levelUps
        },
        {
          type: LEVEL_UP_ACTIVITIES_RECEIVED,
          levelUpActivities: data.levelUpActivities
        },
        {
          type: USER_LEVEL_UPS_RECEIVED,
          userLevelUps: data.userLevelUps
        },
        {
          type: USER_LEVEL_UP_ACTIVITIES_RECEIVED,
          userLevelUpActivities: data.userLevelUpActivities
        }
      ];

      await levelUpService.getLevelUps();

      expect(dispatch_spy.calledWith(expected_actions[0])).to.be.ok;
      expect(dispatch_spy.calledWith(expected_actions[1])).to.be.ok;
      expect(dispatch_spy.calledWith(expected_actions[2])).to.be.ok;
      expect(dispatch_spy.calledWith(expected_actions[3])).to.be.ok;
    });
  });

  describe('getLevelUpUsers', () => {
    let levelUpUsers = [];

    before(() => fetch_stub_returns_json(levelUpUsers));

    it('should return level up users', async () => {
      let expected_action = {
        type: LEVEL_UP_USERS_RECEIVED,
        levelUpUsers
      };

      await levelUpService.getLevelUpUsers();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('registerForLevelUp', () => {
    let userLevelUps = [];

    before(() => fetch_stub_returns_json(userLevelUps));

    it('should return level ups', async () => {
      let expected_action = {
        type: USER_LEVEL_UPS_RECEIVED,
        userLevelUps
      };

      await levelUpService.registerForLevelUp();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('markActivityAsAttended - returns data', () => {
    let data = [{levelUpActivityId: 1}];

    before(() => fetch_stub_returns_json(data));

    it('should return user level up activities', async () => {
      let expected_action = {
        type: USER_LEVEL_UP_ACTIVITIES_RECEIVED,
        userLevelUpActivities: data
      };

      await levelUpService.markActivityAsAttended();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('markActivityAsAttended - no data', () => {
    let data = [];

    before(() => fetch_stub_returns_json(data));

    it('should return user level up activities', async () => {

      await levelUpService.markActivityAsAttended();

      expect(dispatch_spy.called).to.not.be.ok;
    });
  });
});
