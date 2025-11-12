import { expect } from '@open-wc/testing';
import { POINTS_RECEIVED, POINT_TYPES_RECEIVED  } from '../../../src/actions/points.action';
import { PointsService } from '../../../src/services/points.service';
import { StoreStub } from '../shared/stubs/store.stub';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import sinon from 'sinon';

describe('Service - Points', () => {
  let pointsService;
  let dispatch_spy;

  before(() => {
    pointsService = new PointsService();
    pointsService._store = new StoreStub();
    dispatch_spy = sinon.spy(pointsService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(pointsService.config).to.be.ok;
    expect(pointsService.store).to.be.ok;
  });


  describe('todaysPointsInformation', () => {
    let points = [];

    before(() => fetch_stub_returns_json(points));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: POINTS_RECEIVED,
        points
      };

      await pointsService.todaysPointsInformation();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
  describe('getPointTypes', () => {
    let types = [];

    before(() => fetch_stub_returns_json(types));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: POINT_TYPES_RECEIVED,
        types
      };

      await pointsService.getPointTypes();

      expect(dispatch_spy.calledWith(expected_action)).to.not.be.ok;
    });
  });
});