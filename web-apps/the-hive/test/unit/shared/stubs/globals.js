window.process = {
  env: {
    NODE_ENV: 'production'
  }
};

window.CONFIG = {
  MSGRAPHAPI: ''
};

class MsalMock {
  constructor() {
    this.loginInProgress = false;
  }

  handleRedirectCallback(callback) {
    this.internalRedirectCallback = callback;
  }

  loginRedirect() {}

  acquireTokenSilent() {}
}

window.Msal = {
  UserAgentApplication: MsalMock
};

window.URL = {
  createObjectURL: (blob) => Promise.resolve(blob)
};

window.Prism = {
  languages: {
    extend: function() {
      return {
        keyword: '',
        string: '',
        'class-name': '',
        number: '',
        operator: '',
        punctuation: ''
      };
    },
    insertBefore: function() {},
    clike: {
      function: []
    }
  }
};