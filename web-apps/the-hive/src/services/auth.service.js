import { BaseService } from './base.service';
import { loggedIn, loggedOut } from '../actions/auth.action';
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'
import { TimeUtils } from '@azure/msal-common';

const loginInProgressKey = "loginInProgress";

export class AuthService extends BaseService{
  constructor() {
    super();
    this.msalInstance = undefined;
  }

  initialise(config) {
    let msalConfig = {
      auth: {
        clientId: config.CLIENT_ID,
        authority: `${config.AUTHORITY_BASE}${config.TENANT_ID}`,
        redirectUri: config.REDIRECT_URI
      },
      cache: {
        cacheLocation: 'localStorage'
      }
    };
    if (window.appInsights) {
      this.appInsights=window.appInsights;
    }
    this.msalInstance = new PublicClientApplication(msalConfig);
    // Register Callbacks for Redirect flow
    this.msalInstance.handleRedirectPromise()
      .then(this.authRedirect.bind(this))
      .catch(this.authRedirectError);
    try {
      const account = this.checkAccounts();
      if(account){
        // We already have accounts, no new login required a this time
        this.store.dispatch(loggedIn(account));
      } else {
        // we don't have accounts yet ... so we probably need to log in
        this.attemptLogin();
      }
    } catch (err) {
      if(this.appInsights) {
        this.appInsights.trackException({ exception: new Error(err) });
      }
      this.attemptLogin();
    }
  }

  clearCachedLogin(){
    localStorage.clear();
    // the location.reload() method cannot be stubbed and karma does not like page reploads
    // clearCachecLogin cannot be tested.
    window.location.reload();
  }

  logOut(){
    this.msalInstance.logoutRedirect();
  }

  loginInProgress(){
    let loginTime = localStorage.getItem(loginInProgressKey);
    if(loginTime){
      let timeSince = new Date() - Date.parse(loginTime);
      if(timeSince>30*1000){
        // login timestamp is more than 30 seconds old, last login obviously didn't work
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  attemptLogin(){
    if (!this.loginInProgress()){
      localStorage.setItem(loginInProgressKey, new Date().toISOString());
      this.store.dispatch(loggedOut());
      this.msalInstance.loginRedirect();
    } else {
      console.info("Login already in progress");
    }
  }

  authRedirect(response) {
      if(response){
        localStorage.removeItem(loginInProgressKey);
        try {
          const account = this.checkAccounts();
          this.store.dispatch(loggedIn(account));
        } catch (err) {
          console.error(err);
          if(this.appInsights) {
            this.appInsights.trackException({ exception: new Error(error) });
          }
        }
      } else {
        console.info("Auth response was empty, ignoring");
      }
  }

  authRedirectError(error){
    console.error("Auth redirect failure", error);
    if(this.appInsights) {
      this.appInsights.trackException({ exception: new Error(error) });
    }
    localStorage.removeItem(loginInProgressKey);
  }

   checkAccounts(){
    const currentAccounts = this.msalInstance.getAllAccounts();
    const accountForTenant = currentAccounts.find( account => account.tenantId===this._configService.config.TENANT_ID );
    if (!accountForTenant) {
      console.warn(`No account for tenant ${this._configService.config.TENANT_ID}`);
      return undefined;
    } else {
      if(TimeUtils.isTokenExpired(accountForTenant.idTokenClaims.exp,0)){
        console.warn("Current token is expired, automatically logging in again");
        throw new Error("Current token is expired, automatically logging in again");
      }
      this.msalInstance.setActiveAccount(accountForTenant);
      return accountForTenant;
    }
  }
  getUserPrincipleName() {
    try{
      const account = this.msalInstance.getActiveAccount();
      if (account) {
        return account.idTokenClaims.preferred_username.toLowerCase();
      } else {
        console.warn("We cannot get loggedin UPN yet");
        if(this.appInsights) {
          this.appInsights.trackEvent({ name: "Attempt to get user principal name before login" });
        }
      }
    } catch (err){
      console.error(err);
    }
  }

  async getHeaders(tokenFieldName, additional={}, adjustContentType=true){
    const account = this.msalInstance.getActiveAccount();

    if (account) {
      let request = {
        scopes: this.config.scopes,
        forceRefresh: this.isTokenExpired(account),
      };

      try {
        let msalToken = await this.msalInstance.acquireTokenSilent(request);
        if (msalToken) {
          if(adjustContentType){
            return {
              ...additional,
              Authorization: `Bearer ${msalToken[tokenFieldName]}`,
              'Content-Type': 'application/json'
            };
          } else {
            return {
              ...additional,
              Authorization: `Bearer ${msalToken[tokenFieldName]}`,
            };
          }
        } else {
          throw new Error("Could not aquire token");
        }
      } catch (error) {
        if(this.appInsights) {
          appInsights.trackException({ exception: error });
        }
        if (error instanceof InteractionRequiredAuthError) {
          console.warn("Logged in, but could not retrieve a token");
          if (this.appInsights) {
            this.appInsights.trackEvent({name: "Logged in, but could not retrieve a token" });
          }
          this.msalInstance.acquireTokenRedirect(request);
        } else {
          console.error(error);
          if (this.appInsights) {
            this.appInsights.trackException({ exception: error });
          }
        }
      }
    } else {
      throw new Error("Account not yet set");
    }
  }

  async getAccessTokenHeader() {
    return this.getHeaders("accessToken");
  }

  async getIdTokenHeaders(additional = {}) {
    return this.getHeaders("idToken", additional);
  }

  async getIdTokenHeadersForFileUpload(additional = {}, adjustContentType=true) {
    const headers = await this.getHeaders("idToken", additional, adjustContentType);
    if(adjustContentType){
      return {
        ...headers,
        'Content-Type': 'application/octet-stream'
      }
    } else {
      return {
        ...headers
      }
    }
  }

  expiredToken(){
     const currentAccounts = this.msalInstance.getAllAccounts();
     const accountForTenant = currentAccounts.find( account => account.tenantId===this._configService.config.TENANT_ID );
     if (!accountForTenant) {
       return undefined;
     } else {
        this.isTokenExpired(accountForTenant);
     }
  }

  isTokenExpired(account) {
    if (TimeUtils.isTokenExpired(account.idTokenClaims.exp, 0)) {
      return true;
    } else {
      return false;
    }
  }
}

export default new AuthService();
