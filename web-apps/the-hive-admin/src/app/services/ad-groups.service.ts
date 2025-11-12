import { Injectable } from '@angular/core';
import { map, Observable, shareReplay, switchMap } from 'rxjs';
import { SharedService } from './shared.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ADGroupsService {
  private userGroups$: Observable<string[]>;
  constructor(private readonly sharedService: SharedService, private readonly authService: AuthService) {
    this.userGroups$ = this.authService.getUserPrincipleName().pipe(
      switchMap(upn => this.sharedService.get(`/ad-groups/${encodeURIComponent(upn)}`)),
      shareReplay(1)
    );
    this.userGroups$.subscribe();
  }

  isLoggedInUserMemberOfADGroups(groupNames: string[]): Observable<boolean> {
    return this.userGroups$.pipe(
      map(groups => groupNames.some(groupName => groups.some(group => group.toLowerCase() === groupName.toLowerCase())))
    );
  }

}
