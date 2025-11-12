import { expect } from '@open-wc/testing';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { GuideService } from '../../../src/services/guide.service';

describe('Service - GuideService', () => {
  let guideService;

  before(() => {
    guideService = new GuideService();
  });

  it('should initialise correctly.', () => {
    expect(guideService.config).to.be.ok;
    expect(guideService.store).to.be.ok;
  });

  describe('cancelGuideRequest', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should cancel a guide request', async () => {
      await guideService.cancelGuideRequest(1);

      expect(fetch_stub.called).to.be.ok;
    });
  });

  describe('createGuideRequest', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should create a guide request', async () => {
      await guideService.createGuideRequest(1);

      expect(fetch_stub.called).to.be.ok;
    });
  });

  describe('acceptGuideRequest', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should accept a guide request', async () => {
      await guideService.acceptGuideRequest(1);

      expect(fetch_stub.called).to.be.ok;
    });
  });

  describe('rejectGuideRequest', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should reject a guide request', async () => {
      await guideService.rejectGuideRequest(1);

      expect(fetch_stub.called).to.be.ok;
    });
  });
});