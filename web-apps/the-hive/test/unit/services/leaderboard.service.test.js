import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { LeaderboardService } from '../../../src/services/leaderboard.service';
import { LEADERBOARD_RECEIVED } from '../../../src/actions/leaderboard-received.action';
import { LAST_MONTH_POINTS_RECEIVED } from '../../../src/actions/last-month-points-received.action';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';

describe('Service - LeaderboardService', () => {
  let leaderboardService;
  let dispatch_spy;

  before(() => {
    leaderboardService = new LeaderboardService();
    leaderboardService._store=new StoreStub();
    dispatch_spy = sinon.spy(leaderboardService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(leaderboardService.config).to.be.ok;
    expect(leaderboardService.store).to.be.ok;
  });

  describe('fetch_leaderboard', () => {
    let heroes = [];

    before(() => fetch_stub_returns_json(heroes));

    after(() => fetch_stub.reset());

    it('should return the leaderboard by dispatching the correct action.', async () => {
      let expected_action = {
        type: LEADERBOARD_RECEIVED,
        heroes
      };

      await leaderboardService.fetch_leaderboard();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('fetch_public_leaderboard', () => {
    let heroes = [];

    before(() => fetch_stub_returns_json(heroes));

    after(() => fetch_stub.reset());

    it('should return the leaderboard by dispatching the correct action.', async () => {
      let expected_action = {
        type: LEADERBOARD_RECEIVED,
        heroes
      };

      await leaderboardService.fetch_public_leaderboard();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('fetch_last_month_points', () => {
    let points = [{total: 0}];

    before(() => fetch_stub_returns_json(points));

    after(() => fetch_stub.reset());

    it('should dispatch LAST_MONTH_POINTS_RECEIVED action.', async () => {
      let expected_action = {
        type: LAST_MONTH_POINTS_RECEIVED,
        points: points[0]
      };

      await leaderboardService.fetch_last_month_points();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
});
