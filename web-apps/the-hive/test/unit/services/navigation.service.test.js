import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { NavigationService } from '../../../src/services/navigation.service';
import { StoreStub } from '../shared/stubs/store.stub';

describe('Service - NavigationService', () => {
  let navigationService;
  let dispatch_spy;

  before(() => {
    navigationService = new NavigationService();
    navigationService._store=new StoreStub();
    dispatch_spy = sinon.spy(navigationService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(navigationService.store).to.be.ok;
  });

  it('should dispatch navigate action', async () => {
    let path = 'http://bbd.co.za';

    navigationService.navigate(path);

    expect(dispatch_spy.called).to.be.ok;
  });
});
