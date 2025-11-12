import { expect } from '@open-wc/testing';
import { PartsService } from '../../../src/services/parts.service';
import sinon from 'sinon';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { PARTS_RECEIVED } from '../../../src/actions/parts-received.action';
import { CLAIM_PARTS_RECEIVED } from '../../../src/actions/claim-parts-received.action';
import { CLAIM_PARTS_CHOSEN } from '../../../src/actions/claim-parts-chosen.action';

describe('Service - Parts', () => {
  let partsService;
  let dispatch_spy;

  before(() => {
    partsService = new PartsService();
    partsService._store=new StoreStub();
    dispatch_spy = sinon.spy(partsService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(partsService.config).to.be.ok;
    expect(partsService.store).to.be.ok;
  });

  describe('getParts', () => {
    let parts = [];

    before(() => fetch_stub_returns_json(parts));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: PARTS_RECEIVED,
        parts
      };

      await partsService.getParts();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('getClaimParts', () => {
    let claimParts = [];

    before(() => fetch_stub_returns_json(claimParts));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: CLAIM_PARTS_RECEIVED,
        claimParts
      };

      await partsService.getClaimParts();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('chooseParts', () => {
    let data = {parts: []};

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: CLAIM_PARTS_CHOSEN,
        parts: data.parts
      };

      await partsService.chooseParts([{claimPartId: 1, partId: 1}]);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
});