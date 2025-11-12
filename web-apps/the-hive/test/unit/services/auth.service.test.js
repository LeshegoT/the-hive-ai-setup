import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { AuthService } from '../../../src/services/auth.service';
import { STUB_CONFIG } from '../shared/stubs/auth.service.stub';

const loginInProgressKey = "loginInProgress";
describe('Service - AuthService', () => {
  let authService = new AuthService();

  let exp = new Date();
  exp.setHours(exp.getHours() + 1);
  exp = Number(exp) / 1000;

  let rawIdToken = 'SomeTotallyAwesomeIdToken';
  let idToken = {
    rawIdToken,
    decodedIdToken: {
      preferred_username: 'test@bbd.co.za',
      exp
    }
  };
  let response = { idToken };

  let create_local_storage_stub = () =>
    sinon.stub(window.localStorage, 'getItem').returns(JSON.stringify(idToken));

  let create_appInsights_stub = () =>
    window.appInsights = {
      trackEvent: () => { return undefined; },
      trackException: () => { return undefined; },
      clearAuthenticatedUserContext: () => { return undefined; },
      setAuthenticatedUserContext: (userId,appId,cookie) => { return undefined; }
    };

  let stub_msal_no_accounts = (authService) => sinon.stub(authService.msalInstance, 'getAllAccounts').returns([]);
  let stub_msal_one_accounts = (authService) => sinon.stub(authService.msalInstance, 'getAllAccounts').returns([{
    idTokenClaims: {
      exp: Date.now()
    }
  }]);
  let stub_msal_two_accounts = (authService) => sinon.stub(authService.msalInstance, 'getAllAccounts').returns([{},{}]);

  before(() => {
    create_appInsights_stub();
    authService.initialise(STUB_CONFIG);
  });

  after( ()=>{
    delete window.appInsights;
  });

  it('should initialise correctly.', async () => {
    expect(authService.config).to.be.ok;
    expect(authService.store).to.be.ok;
    expect(authService.msalInstance).to.be.ok;
  });

  describe('attempt login when already in progress', ()=>{
    let stubs = [];

    before(() => {
      let stub = sinon.stub(window.localStorage, 'getItem');
      stub.withArgs(loginInProgressKey).returns(new Date().toISOString());
      stubs.push(stub);
    });
    after(() => {
      stubs.forEach(s => s.restore());
    });


    it("should do nothing", () => {
      expect(authService.attemptLogin()).to.not.be.ok;
    });
  });

  describe('getAccessTokenHeader', ()=>{
    before(() => {
      create_appInsights_stub();
    });

    after(() => {
      delete window.appInsights;
    });

    it("should return", async ()=>{
      expect(authService.getAccessTokenHeader()).to.be.ok;
    });
  });

  describe('getIdTokenHeaders', () => {
    before(() => {
      create_appInsights_stub();
    });

    after(() => {
      delete window.appInsights;
    });

    it("should return", async () => {
      expect(authService.getIdTokenHeaders()).to.be.ok;
    });
  });

  describe('getUserPrincipleName', () => {
    let local_storage_stub;

    before(() => (local_storage_stub = create_local_storage_stub()));
    after(() => local_storage_stub.restore());

    it("should return", async () => {
      expect(authService.getUserPrincipleName()).to.be.undefined;
    });
  });

  describe('checkAccounts - no accounts', () => {
    let local_storage_stub;
    let msal_stub;

    before(() => {
      local_storage_stub = create_local_storage_stub();
      msal_stub = stub_msal_no_accounts(authService);
    });
    after(() => {
      local_storage_stub.restore();
      msal_stub.restore();
    });

    it("should be undefined", async () => {
      expect(authService.checkAccounts()).to.be.undefined;
    });
  });

  describe('checkAccounts - one account', () => {
    let local_storage_stub;
    let msal_stub;

    before(() => {
      local_storage_stub = create_local_storage_stub();
      msal_stub = stub_msal_one_accounts(authService);
    });
    after(() => {
      local_storage_stub.restore();
      msal_stub.restore();
    });

    it("should be ok", async () => {
      expect(authService.checkAccounts.bind(authService)).to.be.ok;
    });
  });

  describe('checkAccounts - multiple accounts', () => {
    let local_storage_stub;
    let msal_stub;

    before(() => {
      local_storage_stub = create_local_storage_stub();
      msal_stub = stub_msal_two_accounts(authService);
    });
    after(() => {
      local_storage_stub.restore();
      msal_stub.restore();
    });

    it("should throw", async () => {
     expect(authService.checkAccounts.bind(authService)).to.throw("Multiple accounts detected.");
    });
  });

  describe('login in progress - key not set', ()=>{
    let stubs = [];

    before(() => {
      let stub = sinon.stub(window.localStorage, 'getItem');
      stub.withArgs(loginInProgressKey).returns(null);
      stubs.push(stub);
    });
    after(() => {
      stubs.forEach(s => s.restore());
    });

    it("should return false", ()=>{
      expect(authService.loginInProgress()).to.be.false;
    });
  });

  describe('login in progress - key set long ago' , () => {
    let stubs = [];

    before(() => {
      let stub = sinon.stub(window.localStorage, 'getItem');
      stub.withArgs(loginInProgressKey).returns("2021-12-01T00:00:00.000Z");
      stubs.push(stub);
    });
    after(() => {
      stubs.forEach(s => s.restore());
    });

    it("should return false", () => {
      expect(authService.loginInProgress()).to.be.false;
    });
  });

  describe('login in progress - key set to 31 seconds ago', () => {
    let stubs = [];

    before(() => {
      let stub = sinon.stub(window.localStorage, 'getItem');
      stub.withArgs(loginInProgressKey).returns(new Date(new Date()-(31*1000)).toISOString());
      stubs.push(stub);
    });
    after(() => {
      stubs.forEach(s => s.restore());
    });

    it("should return false", () => {
      expect(authService.loginInProgress()).to.be.false;
    });
  });

  describe('login in progress - key set to 25 seconds ago', () => {
    let stubs = [];

    before(() => {
      let stub = sinon.stub(window.localStorage, 'getItem');
      stub.withArgs(loginInProgressKey).returns(new Date(new Date() - (25 * 1000)).toISOString());
      stubs.push(stub);
    });
    after(() => {
      stubs.forEach(s => s.restore());
    });

    it("should return true", () => {
      expect(authService.loginInProgress()).to.be.true;
    });
  });

  describe('login in progress - key set to now', () => {
    let stubs = [];

    before(() => {
      let stub = sinon.stub(window.localStorage, 'getItem');
      stub.withArgs(loginInProgressKey).returns(new Date().toISOString());
      stubs.push(stub);
    });
    after(() => {
      stubs.forEach(s => s.restore());
    });

    it("should return true", () => {
      expect(authService.loginInProgress()).to.be.true;
    });
  });
});
