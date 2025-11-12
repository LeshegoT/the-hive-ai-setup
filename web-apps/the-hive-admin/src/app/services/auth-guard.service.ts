import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { of, ReplaySubject,Observable } from 'rxjs';
import { flatMap, mergeMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Route } from '../shared/interfaces';

@Injectable()
export class AuthGuard  {
  accessibleRoutes$: ReplaySubject<Route[]> = new ReplaySubject();
  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
    private _router: Router
  ) {
    this.getAccessibleRoutes();
  }

  getAccessibleRoutes() {
    this.authService.getUser().pipe(
      mergeMap((_user) => this.sharedService.get(`/accessible-routes`))
    ).subscribe((routes) => {
        this.accessibleRoutes$.next(routes);
      });
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.authService.getUser().pipe(
      mergeMap((user) => {
        if (user) {
          return this.checkUser(state.url);
        } else {
          return of(this._router.parseUrl('/401'));
        }
      })
    );
  }

  checkUser(nextRoute: string) {
    return this.accessibleRoutes$.pipe(
      mergeMap((routes) => {
        const foundMatchingRoute = routes.map((route)=> new RegExp(route.routePattern))
              .some((routeRegex: RegExp) => routeRegex.test(nextRoute));
        if (foundMatchingRoute) {
          return of(true);
        } else {
          return of(this._router.parseUrl('/401'));
        }
      })
    );
  }
}
