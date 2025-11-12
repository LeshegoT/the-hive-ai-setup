import { expect } from '@open-wc/testing';
import { AvatarService } from '../../../src/services/avatar.service';
import sinon from 'sinon';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { USER_AVATAR_RECEIVED } from '../../../src/actions/user-avatar-received.action';

describe('Service - Avatar', () => {
  let avatarService;
  let dispatch_spy;

  before(() => {
    avatarService = new AvatarService();
    avatarService._store=new StoreStub();
    dispatch_spy = sinon.spy(avatarService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(avatarService.config).to.be.ok;
    expect(avatarService.store).to.be.ok;
  });

  describe('updateAvatar', () => {
    let avatar = {};
    let parts = [];

    before(() => fetch_stub_returns_json({avatar, parts}));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: USER_AVATAR_RECEIVED,
        avatar,
        parts
      };

      await avatarService.updateAvatar({}, []);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
});