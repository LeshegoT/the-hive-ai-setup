import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';
import { SideQuest, SideQuestUser } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class SideQuestService {
  constructor(private sharedService: SharedService) {}

  getSideQuestTypes(): Observable<any> {
    return this.sharedService.get('getSideQuestTypes');
  }

  createSideQuest(sideQuest): Observable<any> {
    return this.sharedService.post('createSideQuest', sideQuest);
  }

  updateSideQuest(sideQuest): Observable<any> {
    return this.sharedService.post('updateSideQuest', { sideQuest: sideQuest });
  }
  countSideQuestMission(sideQuestId: number): Observable<number> {
    return this.sharedService.get(`sidequest/${sideQuestId}/mission/count`);
  }
  deleteSideQuest(sideQuestId): Observable<void> {
    return this.sharedService.delete(`deleteSideQuest/${sideQuestId}`);
  }

  createSideQuestType(sideQuestType): Observable<any> {
    return this.sharedService.post('createSideQuestType', sideQuestType);
  }

  updateSideQuestType(sideQuestType): Observable<any> {
    return this.sharedService.post('updateSideQuestType', { sideQuestType: sideQuestType });
  }

  deleteSideQuestType(sideQuestTypeId): Observable<any> {
    return this.sharedService.delete(`deleteSideQuestType/${sideQuestTypeId}`);
  }

  getSideQuestTypeImages(): Observable<any> {
    return this.sharedService.get('getSideQuestTypeImages');
  }
  getAllSideQuests(): Observable<any> {
    return this.sharedService.get('allSideQuests');
  }

  getActiveSideQuestTypes(): Observable<[{ sideQuestTypeId: number }]> {
    return this.sharedService.get('getActiveSideQuestTypes');
  }

  unfilteredSideQuests():Observable<SideQuest[]> {
    return this.sharedService.get('unfilteredSideQuests');
  }

  getSideQuestUsers(sideQuestTypeId): Observable<SideQuestUser[]> {
    return this.sharedService.get(`side-quest-users/${sideQuestTypeId}`);
  }
}
