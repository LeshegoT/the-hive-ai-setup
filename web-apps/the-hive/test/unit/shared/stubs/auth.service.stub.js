import sinon from 'sinon';
import auth_service from '../../../../src/services/auth.service';

let getUserPrincipleName = sinon
  .stub(auth_service, 'getUserPrincipleName');

let getAccessTokenHeader = sinon
  .stub(auth_service, 'getAccessTokenHeader')
  .returns(Promise.resolve('fake access token!'));

let getIdTokenHeaders = sinon.stub(auth_service, 'getIdTokenHeaders').returns(Promise.resolve({}));

let getIdTokenHeadersForFileUpload = sinon.stub(auth_service, 'getIdTokenHeadersForFileUpload').returns(Promise.resolve({}));

let uses_select_hero = (hero) => {
  beforeEach(async () => getUserPrincipleName.returns(hero));
  afterEach(async () => getUserPrincipleName.reset());
};

export let auth_service_stubs = {
  getUserPrincipleName,
  getAccessTokenHeader,
  getIdTokenHeaders,
  getIdTokenHeadersForFileUpload,
  uses_select_hero,
};

export let STUB_CONFIG = {
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
