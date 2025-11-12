import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { MissionsService } from '../../../src/services/missions.service';
import { MISSIONS_RECEIVED } from '../../../src/actions/missions-received.action.js';
import { HERO_MISSIONS_RECEIVED } from '../../../src/actions/hero-missions-received.action.js';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';
import quest_service from '../../../src/services/quest.service';

describe('Service - MissionsService', () => {
  let missionsService;
  let dispatch_spy;

  before(() => {
    missionsService = new MissionsService();
    missionsService._store=new StoreStub();
    dispatch_spy = sinon.spy(missionsService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  auth_service_stubs.uses_select_hero('test@bbd.co.za');

  it('should initialise correctly.', () => {
    expect(missionsService.config).to.be.ok;
    expect(missionsService.store).to.be.ok;
  });

  describe('getHeroMissions', () => {
    let missions = [];

    before(() => fetch_stub_returns_json(missions));

    after(() => fetch_stub.reset());

    it('should not dispatch action if hero and logged in user are not the same', async () => {
      let hero = 'test@bbd.co.za';

      await missionsService.getHeroMissions(hero);

      expect(dispatch_spy.called).to.not.be.ok;
    });

    it('should dispatch action if hero and logged in user are not the same', async () => {
      let hero = 'test-2@bbd.co.za';
      let expected_action = {
        type: HERO_MISSIONS_RECEIVED,
        missions
      };

      await missionsService.getHeroMissions(hero);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('completeMission', () => {
    let missions = [];
    let missionId = 1;

    before(() => fetch_stub_returns_json(missions));

    after(() => fetch_stub.reset());

    it('should return the missions by dispatching the correct action.', async () => {
      let expected_action = {
        type: MISSIONS_RECEIVED,
        missions
      };

      await missionsService.completeMission(missionId);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('updateGuideMissionDescription', () => {
    let get_guides_spec_stub;

    before(
      () =>
        (get_guides_spec_stub = sinon.stub(quest_service, 'getGuidesBySpecialisation'))
    );

    afterEach(() => get_guides_spec_stub.reset());

    it('should get the guides for the specialisation and add them to the mission description', async () => {
      let guides = [{ userPrincipleName: 'test@bbd.co.za' }];
      get_guides_spec_stub.returns(Promise.resolve(guides));

      let mission = { description: '' };
      let specialisations = [{specialisationId: 1, name: 'Spec 1'}, {specialisationId: 2, name: 'Spec 2'}];
      let specialisationId = 1;

      await missionsService.updateGuideMissionDescription(mission, specialisations, specialisationId);

      expect(mission.description).to.equal(`<br><br> Available guides for your chosen specialisation (<b>Spec 1</b>): <br><e-hero-title hero="test@bbd.co.za"></e-hero-title>`)
    });

    it('should add that there are no guides to the mission description', async () => {
      let guides = [];
      get_guides_spec_stub.returns(Promise.resolve(guides));

      let mission = { description: '' };
      let specialisations = [{specialisationId: 1, name: 'Spec 1'}, {specialisationId: 2, name: 'Spec 2'}];
      let specialisationId = 1;

      await missionsService.updateGuideMissionDescription(mission, specialisations, specialisationId);

      expect(mission.description).to.equal(`<br><br> There are no guides available yet for your chosen specialisation (<b>Spec 1</b>)`)
    });
  });

  describe('getMissionById', () => {
    let missions = [];

    before(() => fetch_stub_returns_json(missions));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: HERO_MISSIONS_RECEIVED,
        missions
      };

      await missionsService.getMissionById(1);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
});
