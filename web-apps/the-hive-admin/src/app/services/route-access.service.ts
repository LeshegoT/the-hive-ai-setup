import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { AdminAccessRoute } from '../components/admin-access/admin-access.component';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class RouteAccessService {
  private accessibleRoutes$: Observable<AdminAccessRoute[]>;

  constructor(private readonly sharedService: SharedService) {
    this.accessibleRoutes$ = this.sharedService.get(`/accessible-routes`).pipe(shareReplay(1));
  }

  loggedInUserHasAccessToRoute(path: string): Observable<boolean> {
    return this.accessibleRoutes$.pipe(
      map((routes) => (
        routes.map((route) => new RegExp(route.routePattern))
          .some((routeRegex: RegExp) => routeRegex.test(path))
      ))
    );
  }
}
