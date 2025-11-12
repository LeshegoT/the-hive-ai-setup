import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import configService  from '../../../src/services/config.service';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';

describe('Service - Config', () => {
  it('should initialise correctly.', () => {
    expect(configService.config).to.be.ok;
    expect(configService.loaded).to.be.false;
  });

  let STUB_CONFIG = {
    PRODUCTION: false,
    DEBUG: true,
    BASE_SERVER_URL: "http://localhost:3001",
    API_URL: "/api/",
    CLIENT_ID: "dfa326b1-08e8-4fc0-9848-76b33fc37be5",
    AUTHORITY_BASE: "https://login.microsoftonline.com/",
    TENANT_ID:'618cf474-d12a-4a66-956c-3f3d594bb715',
    REDIRECT_URI: "http://localhost:3000",
    MSGRAPHAPI: "https://graph.microsoft.com/beta/",
    SCOPES: [
      "User.Read",
      "User.Read.All"
    ],
  };

  describe('Load config', () => {
    before(() => fetch_stub_returns_json(STUB_CONFIG));
    after(() => fetch_stub.reset());
    it('Should load config', async () => {
      await configService.loadConfig()
        .then(conf => {
          expect(conf).to.be.ok
          expect(conf.DEBUG).to.be.true;
          expect(conf.API_URL).to.equal(STUB_CONFIG.BASE_SERVER_URL + STUB_CONFIG.API_URL);
        });
      expect(configService.loaded).to.be.false;
    });
  });

  describe('Initialize config', () => {
    before(() => fetch_stub_returns_json(STUB_CONFIG));
    after(() => fetch_stub.reset());
    it('Should initialize config and execute the callbacks exactly once', async () => {
      let callback = sinon.spy();
      configService.registerCallback(callback, 'Sinon Spy Before Load')
      await configService.initializeConfig();
      expect(configService.loaded).to.be.true;
      expect(callback.callCount).to.equal(1);
      expect(callback.calledWith({
        ...STUB_CONFIG,
        API_URL: STUB_CONFIG.BASE_SERVER_URL + STUB_CONFIG.API_URL,
      })).to.be.ok
    });
    it('should immediately call new callbacks if already loaded', async()=>{
      expect(configService.loaded).to.be.true;
      await configService.initializeConfig();
      let callback = sinon.spy();
      configService.registerCallback(callback, 'Sinon Spy After Load')
      expect(callback.callCount).to.equal(1);
      expect(callback.calledWith({
        ...STUB_CONFIG,
        API_URL: STUB_CONFIG.BASE_SERVER_URL + STUB_CONFIG.API_URL,
      })).to.be.ok;
    });
  });
});
