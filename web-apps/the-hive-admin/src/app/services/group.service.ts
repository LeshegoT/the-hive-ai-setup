import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  constructor(private sharedService: SharedService) {}

  getAllGroups(): Observable<any> {
    return this.sharedService.get('getAllGroups');
  }

  createGroup(group): Observable<any> {
    return this.sharedService.post('createGroup', group);
  }
  checkRestrictions(group): Observable<any>{
    return this.sharedService.get(`restrictions/${group.groupName}`)
  }
  deleteGroup(group): Observable<any> {
    return this.sharedService.delete(`group/${group.groupName}`);
  }

  getAllGroupsMembers(): Observable<[{ groupName: string; members: string[] }]> {
    return this.sharedService.get('getAllGroupsMembers');
  }

  updateGroup(group): Observable<{ statusText: string }> {
    return this.sharedService.post('updateGroup', group);
  }
  getAllUserPricipleName(): Observable<any>{
    return this.sharedService.get('allBBDUsers');
  }
}
