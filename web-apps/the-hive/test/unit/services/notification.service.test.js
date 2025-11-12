import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { NotificationService } from '../../../src/services/notification.service';
import { NOTIFICATIONS_RECEIVED } from '../../../src/actions/notifications-received.action';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';

describe('Service - Notification Service', () => {
  let notificationService;
  let dispatch_spy;

  before(() => {
    notificationService = new NotificationService();
    notificationService._store = new StoreStub();
    dispatch_spy = sinon.spy(notificationService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  auth_service_stubs.uses_select_hero('test@bbd.co.za');

  it('should initialise correctly.', () => {
    expect(notificationService.config).to.be.ok;
    expect(notificationService.store).to.be.ok;
  });

  describe('checkForNotifications', () => {
    let data = [];

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch notification received action', async () => {
      let hero = 'test@bbd.co.za';
      let action = {
        type: NOTIFICATIONS_RECEIVED,
        notifications: []
      }

      await notificationService.checkForNotifications(hero);

      expect(dispatch_spy.calledWith(action)).to.be.ok;
    });
  });

  describe('resolveQuestNotifications', () => {
    let data = [];

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch navigate action', async () => {
      await notificationService.resolveQuestNotifications(1);

      expect(dispatch_spy.called).to.be.ok;
    });
  });
});
