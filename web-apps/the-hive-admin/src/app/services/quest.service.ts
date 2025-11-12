import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class QuestService {
  constructor(private sharedService: SharedService) {}

  allQuests(): Observable<any> {
    return this.sharedService.get('allQuests');
  }

  unassignedQuests(): Observable<any> {
    return this.sharedService.get('unassignedQuests');
  }

  finishedQuests(): Observable<any> {
    return this.sharedService.get('finishedQuests');
  }

  getQuest(questId: number): Observable<any> {
    return this.sharedService.get(`adminQuest?questId=${questId}`);
  }

  assignGuideToQuest(guide, questId) {
    return this.sharedService.post('assignGuide', { questId, guide });
  }

  updateAdminQuestComment(questId, comment) {
    return this.sharedService.post('adminQuestComment', { questId, comment });
  }

  getAllQuestsForHero(upn: string): Observable<any> {
    return this.sharedService.get(`allHeroQuests?upn=${upn}`);
  }

  getQuestMissions(questId): Observable<any> {
    return this.sharedService.get(`questMissions?questId=${questId}`);
  }

  updateQuestEndDate(questId, endDate) {
    return this.sharedService.post('updateQuestEndDate', { questId, endDate });
  }
}
