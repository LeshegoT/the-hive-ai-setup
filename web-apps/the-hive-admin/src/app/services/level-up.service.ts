import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root',
})
export class LevelUpService {
  constructor(private sharedService: SharedService) {}

  getAllLevelUps(): Observable<any> {
    return this.sharedService.get('allLevelUps');
  }

  getLevelUp(levelUpId): Observable<any> {
    return this.sharedService.get(`levelUp/${levelUpId}`);
  }

  getLevelUpActivity(activityId): Observable<any> {
    return this.sharedService.get(`levelUpActivity/${activityId}`);
  }

  getLevelUpActivityAttendees(activityId): Observable<any> {
    return this.sharedService.get(`levelUpActivityAttendees/${activityId}`);
  }

  getLevelUpActivityAttendeesSheet(activityId): Observable<any> {
    return this.sharedService.get(`levelUpActivityAttendeesSheet/${activityId}`);
  }
  getConsolidatedLevelUpAttendanceSheet(levelUpId): Observable<any> {
    return this.sharedService.get(`levelUpConsolidatedAttendance/${levelUpId}`);
  }

  getLevelUpFacilitators(levelUpId): Observable<any> {
    return this.sharedService.get(`levelUp/${levelUpId}/facilitators`);
  }

  getUserDetails(upn): Observable<any> {
    return this.sharedService.get(`user/${upn}/details`);
  }

  updateGitLink(ideaId, gitLink): Observable<any> {
    return this.sharedService.patch(`syndicate/idea/${ideaId}`, gitLink);
  }

  nudgeTeamFeedback(teamData): Observable<any> {
    return this.sharedService.post('assignment/syndicate/', teamData);
  }

  saveFacilitators(upns, levelUpId): Observable<any> {
    return this.sharedService.post(`levelUp/${levelUpId}/facilitators`, { upns });
  }

  removeFacilitator(upn, levelUpId): Observable<any> {
    return this.sharedService.delete(`levelUp/${levelUpId}/facilitator/${upn}`);
  }

  getLevelUpLinkTypes(): Observable<any> {
    return this.sharedService.get('levelUpActivityLinkTypes');
  }

  createActivityLink(activityLink): Observable<any> {
    return this.sharedService.post('createLevelUpActivityLink', activityLink);
  }

  addAttendees(upns, activityId) {
    return this.sharedService.post('addAttendees', { upns, activityId });
  }

  getLevelUpIcons(): Observable<any> {
    return this.sharedService.get('getLevelUpIcons');
  }

  updateLevelUp(levelUp): Observable<any> {
    return this.sharedService.post(`updateLevelUp`, { levelUp: levelUp });
  }

  createLevelUp(levelUp): Observable<any> {
    return this.sharedService.post('createLevelUp', levelUp);
  }

  deleteLevelUp(levelUpId): Observable<any> {
    return this.sharedService.delete(`deleteLevelUp/${levelUpId}`);
  }

  createNewLevelUpInstance(levelUp): Observable<any> {
    return this.sharedService.post('createNewLevelUpInstance', levelUp);
  }

  getLevelUpActivityTypes(): Observable<any> {
    return this.sharedService.get('allLevelUpActivityTypes');
  }

  getLevelUpActivityTypeIcons(): Observable<any> {
    return this.sharedService.get('getLevelUpActivityTypeIcons');
  }

  createLevelUpActivityType(activityType): Observable<any> {
    return this.sharedService.post('createLevelUpActivityType', activityType);
  }

  updateLevelUpActivityType(activityType): Observable<any> {
    return this.sharedService.post('updateLevelUpActivityType', { levelUpActivityType: activityType });
  }

  deleteLevelUpActivityType(activityTypeId): Observable<any> {
    return this.sharedService.delete(`deleteLevelUpActivityType/${activityTypeId}`);
  }

  getActiveLevelUpActivityTypes(): Observable<[{ levelUpActivityTypeId: number }]> {
    return this.sharedService.get('getActiveLevelUpActivityTypes');
  }

  getSyndicateFormationStages(): Observable<any> {
    return this.sharedService.get(`formationStages`);
  }

  getSyndicateFormationIdeas(syndicateFormationId): Observable<any> {
    return this.sharedService.get(`syndicateFormationIdeas/${syndicateFormationId}`);
  }

  updateFormation(formationDetails): Observable<any> {
    return this.sharedService.post('updateSyndicateFormation', formationDetails);
  }
  removeIdea(idea): Observable<any> {
    const request = {
      ideaId: idea.syndicateIdeaId,
      formationId: idea.syndicateFormationId,
    };
    return this.sharedService.post('removeIdea', request);
  }
  addNewFormationIdea(idea): Observable<any> {
    return this.sharedService.post('submitIdea', idea);
  }
  formSyndicates(formationId, levelUpId): Observable<any> {
    return this.sharedService.post('newSyndicates', { levelUpId });
  }
  saveSyndicates(teams, formationId): Observable<any> {
    return this.sharedService.put('syndicates', { formationId, teams });
  }

  getSyndicates(levelUpId): Observable<any> {
    return this.sharedService.get(`syndicates/${levelUpId}`);
  }

  getSyndicateFormationCSV(levelUpId): Observable<any> {
    return this.sharedService.get(`syndicates/report/${levelUpId}`);
  }

  getGradsInPreviousGroupsTogether(levelUpId): Observable<any>{
    return this.sharedService.get(`syndicates/${levelUpId}/members`);
  }
  getGradFormerTeam(member,ideaId): Observable<any>{
    return this.sharedService.get(`repeatedSyndicateMembers/${ideaId}/${member}`);
  }
}
