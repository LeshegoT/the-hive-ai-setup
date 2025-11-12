import { Injectable, Injector } from '@angular/core';
import { PublicClientApplication, InteractionRequiredAuthError, Configuration, AccountInfo, RedirectRequest, SilentRequest } from '@azure/msal-browser'
import { HttpHeaders } from '@angular/common/http';
import { EnvironmentService } from './environment.service';
import { Config } from '../shared/config';
import { firstValueFrom, from, iif, Observable, of, ReplaySubject, Subscription } from 'rxjs';
import { map, mergeMap, switchMap, take }  from 'rxjs/operators';
import { BaseService } from './base.service';
import { AuthenticationResult, TimeUtils } from '@azure/msal-common';

const loginInProgressKey = "loginInProgress";
const thirtySecondsInMillis = 30*1000;

@Injectable()
export class AuthService {
  user$: ReplaySubject<AccountInfo | undefined> = new ReplaySubject(1);
  app: PublicClientApplication;
  environment: Config;
  envSub: Subscription;

  constructor(private readonly environmentService: EnvironmentService) {
    this.envSub = environmentService.getConfig().subscribe((env) => {
      this.environment = env;
      const config: Configuration = {
        auth: {
          clientId: this.environment.CLIENT_ID,
          authority: `${this.environment.AUTHORITY_BASE}${this.environment.TENANT_ID}`,
          redirectUri: this.environment.ADMIN_REDIRECT_URI,
        },
        cache: {
          cacheLocation: 'localStorage',
        },
      };

      this.app = new PublicClientApplication(config);
      this.app
        .handleRedirectPromise()
        .then(this.tokenReceivedCallback)
        .catch(this.tokenRedirectError);

      this.readTokenFromStorage();
    });
  }

  private async readTokenFromStorage() {
    const activeAccount = this.checkAccounts();
    if (activeAccount) {
      this.log(this.environment, 'MSAL has a user');
    } else {
      this.log(this.environment, 'MSAL has no user, reconnecting');
      this.reconnect();
    }
  }

  checkAccounts() {
    const currentAccounts = this.app.getAllAccounts();
    const accountForTenant = currentAccounts.find( account => account.tenantId===this.environmentService.getConfiguratonValues().TENANT_ID);
    if (!accountForTenant) {
      return undefined;
    } else {
      if (this.isTokenExpired(accountForTenant)) {
        this.log(
          this.environment,
          'Current token is expired, automatically logging in again'
        );
        return undefined;
      } else {
        this.app.setActiveAccount(accountForTenant);
        this.log(this.environment, 'Setting account', { account: accountForTenant });
        this.user$.next(accountForTenant);
        return accountForTenant;
      }
    }
  }

  private loginInProgress(): boolean {
    const loginTime = localStorage.getItem(loginInProgressKey);
    if(loginTime){
      const timeSince = Date.now() - Date.parse(loginTime);
      return timeSince < thirtySecondsInMillis;
    } else {
      return false;
    }
  }

  private setLoginInProgress() {
    localStorage.setItem(loginInProgressKey, new Date().toISOString());
  }

  private clearLoginInProgress() {
    localStorage.removeItem(loginInProgressKey);
  }

  private reconnect() {
    this.log(this.environment, 'Re-authenticating scheduled.');
    if (this.loginInProgress()) {
      this.log(this.environment, "We're already attempting a reconnect");
    } else {
      this.environmentService.getConfig().subscribe((env) => {
        this.log(
          env,
          'Re-authenticating the user, because the idToken has expired.'
        );

        const request: RedirectRequest = {
          scopes: env.SCOPES,
        };

        this.log(env, 'Redirecting for login!');
        this.setLoginInProgress();
        this.app.loginRedirect(request);
      });
    }
  }

  private readonly tokenReceivedCallback = (response?: AuthenticationResult) => {
    this.clearLoginInProgress();
    if(response) {
      this.checkAccounts();
    } else {
      this.log(this.environment, "Auth callback response was empty, ignoring.");
    }
  };

  private readonly tokenRedirectError = (error: unknown) => {
    this.clearLoginInProgress();
    this.log(this.environment, "Auth redirect error", error);
  }

  private async getAccountInfoSilent() {
    try {
      await this.app
        .acquireTokenSilent({
          scopes: this.environment.SCOPES,
        });

      return this.checkAccounts();
    } catch(error) {
      if (error instanceof InteractionRequiredAuthError) {
        this.reconnect();
      } else {
        this.log(this.environment,"Strange error when attempting silent refresh", error);
        throw error;
      }

      return undefined;
    }
  }

  private getAccount(): Observable<AccountInfo> {
    if(this.app) {
      const account = this.checkAccounts();
      if(account) {
        return of(account);
      } else {
        return this.user$.pipe(
          take(1),
          switchMap(() => from(this.getAccountInfoSilent()))
        );
      }
    } else {
      return this.environmentService.getConfig().pipe(
        switchMap(() => this.getAccount())
      )
    }
  }

  getUser(): Observable<string> {
    return this.getAccount().pipe(map((account) => account.idTokenClaims['name']));
  }

  getUserPrincipleName(): Observable<string> {
    return this.getAccount().pipe(
      map((account) => account.idTokenClaims['preferred_username']?.toLowerCase())
    );
  }

  private _getTokenHeader(environment: Config, tokenType: 'idToken' | 'accessToken') {
    const request: SilentRequest = {
      scopes: environment.SCOPES,
      forceRefresh: this.isTokenExpired(this.app.getActiveAccount())
    };

    return firstValueFrom(this.user$).then(() => this.app.acquireTokenSilent(request))
      .then((response) => ({ Authorization: `Bearer ${response[tokenType]}` }))
      .catch((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          return this.app.acquireTokenPopup(request).then((tokenResponse) => ({
              Authorization: `Bearer ${tokenResponse[tokenType]}`,
            })
          );
        } else {
          this.log(environment,"Weird error happened when getting access token");
          throw error;
        }
      });
  }

  async getAccessTokenHeader(): Promise<void | { Authorization: string }> {
    if (!this.environment) {
      return this.environmentService
        .getConfig()
        .asObservable()
        .toPromise()
        .then((env) => this._getTokenHeader(env, 'accessToken'));
    } else {
      return this._getTokenHeader(this.environment, 'accessToken');
    }
  }

  getHeaders(): Observable<HttpHeaders> {
    return from(this._getTokenHeader(this.environment, 'idToken')).pipe(
      map(
        (tokenHeader) =>
          new HttpHeaders({
            'Content-Type': 'application/json',
            ...tokenHeader
          })
      )
    );
  }

  getFetchHeaders(): Observable<Headers>{
     return from(this._getTokenHeader(this.environment, 'idToken')).pipe(
       map(
         (tokenHeader) =>
           new Headers({
             'Content-Type': 'application/json',
             ...tokenHeader
           })
       )
     );
  }

  private log(env: Config|undefined, message:string,  ...args: any[]){
    if(!env && this.environment){
      env=this.environment
    }
    if(env && env.DEBUG){
      console.debug(message, ...args);
    }
  }

  isTokenExpired(account: AccountInfo) {
    return TimeUtils.isTokenExpired(account.idTokenClaims.exp.toString(), 0);
  }

  loggedInUserHasAdditonalInfoRights(): Observable<boolean> {
    return this.getUserPrincipleName().pipe(
      map(upn => this.environmentService.getConfiguratonValues().ADDITIONAL_INFO_USERS.includes(upn))
    );
  }
}
