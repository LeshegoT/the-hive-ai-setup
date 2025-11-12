import { expect } from '@open-wc/testing';
import { TracksService } from '../../../src/services/tracks.service';
import sinon from 'sinon';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { TRACKS_RECEIVED } from '../../../src/actions/tracks-received.action';
import { tracks } from '../../../src/reducers/tracks.reducer';

describe('Service - Tracks', () => {
  let tracksService;
  let dispatch_spy;

  before(() => {
    tracksService = new TracksService();
    tracksService._store=new StoreStub();
    dispatch_spy = sinon.spy(tracksService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(tracksService.config).to.be.ok;
    expect(tracksService.store).to.be.ok;
  });

  describe('getTracks', () => {
    let tracks = [];

    before(() => fetch_stub_returns_json(tracks));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: TRACKS_RECEIVED,
        tracks
      };

      await tracksService.getTracks();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
});