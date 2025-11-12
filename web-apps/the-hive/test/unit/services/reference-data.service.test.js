import { expect } from '@open-wc/testing';
import { ReferenceDataService } from '../../../src/services/reference-data.service';
import sinon from 'sinon';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { REFERENCE_DATA_RECEIVED } from '../../../src/actions/reference-data-received.action';

describe('Service - Reference Data', () => {
  let referenceDataService;
  let dispatch_spy;

  before(() => {
    referenceDataService = new ReferenceDataService();
    referenceDataService._store=new StoreStub();
    dispatch_spy = sinon.spy(referenceDataService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(referenceDataService.config).to.be.ok;
    expect(referenceDataService.store).to.be.ok;
  });

  describe('getReferenceData', () => {
    let referenceData = {
      missionTypes: [],
      questTypes: [],
      specialisations: [],
      levels: [],
      messageTypes: [],
      levelUpActivityTypes: [],
      sideQuestTypes: []
    };

    before(() => fetch_stub_returns_json(referenceData));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: REFERENCE_DATA_RECEIVED,
        referenceData
      };

      await referenceDataService.getReferenceData();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
});