import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AuthGuard } from '../../services/auth-guard.service';
import { EnvironmentService } from '../../services/environment.service';
import { Route } from '../../shared/interfaces';
@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.css', '../../shared/shared.css'],
    standalone: false
})
export class NavigationComponent implements OnDestroy, OnInit {
  menuRoutes: ReplaySubject<Route[]> = new ReplaySubject();
  environmentName: string;

  constructor(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher, private authGuard: AuthGuard, private environmentService: EnvironmentService) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  mobileQuery: MediaQueryList;

  private _mobileQueryListener: () => void;

  shouldRun = true;

  filterMenuRoutes(route: Route){
    return !!route.routerLink;
  }

  ngOnInit(): void{
    this.authGuard.accessibleRoutes$.subscribe(routes => this.menuRoutes.next(routes.filter(this.filterMenuRoutes)) );
     this.environmentService.getConfig().subscribe((env) => {
      this.environmentName = env && env.ENVIRONMENT_NAME;
      });
  }
  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
}
