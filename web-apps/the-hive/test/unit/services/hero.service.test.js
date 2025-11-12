import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { HeroService } from '../../../src/services/hero.service';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { HEROES_RECEIVED } from '../../../src/actions/heroes-received.action';

describe('Service - Hero', () => {
  let heroService;
  let dispatch_spy;

  before(() => {
    heroService = new HeroService();
    heroService._store = new StoreStub();
    dispatch_spy = sinon.spy(heroService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  auth_service_stubs.uses_select_hero('test@bbd.co.za');

  it('should initialise correctly.', () => {
    expect(heroService.config).to.be.ok;
    expect(heroService.store).to.be.ok;
  });

  describe('getHeroes', () => {
    let heroes = [{},{}];
    before(() => fetch_stub_returns_json(heroes));

    after(() => fetch_stub.reset());

    it('should get heroes', async () => {
      let expected_action = {
        type: HEROES_RECEIVED,
        heroes
      }

      await heroService.getHeroes();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  })
});