import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';
import { Guide, NewGuideRequest } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class GuidesService {
  constructor(private sharedService: SharedService) {}

  getGuidesForSpecialisation(specialisationId: number): Observable<any> {
    return this.sharedService.get(`guides?specialisationId=${specialisationId}`);
  }

  getAllGuides(): Observable<any> {
    return this.sharedService.get('allGuides');
  }

  getGuidesHeroes(guide: string): Observable<any> {
    return this.sharedService.get(`guidesHeroes?guide=${guide}`);
  }

  getGuideDetails(guide: string): Observable<any> {
    return this.sharedService.get(`guideDetails?guide=${guide}`);
  }

  confirmGuideDelete(upn: string): Observable<any> {
    return this.sharedService.post('confirmGuideDelete', { upn });
  }

  getNewGuideRequests(): Observable<any> {
    return this.sharedService.get('new-guide-request/');
  }

  updateNewGuideRequests(newGuideRequest: NewGuideRequest): Observable<any> {
    return this.sharedService.patch(`new-guide-request/${newGuideRequest.newGuideRequestsId}/`, newGuideRequest);
  }

  getRequestStatusTypes(): Observable<any> {
    return this.sharedService.get('request-status-type/');
  }

  updateGuide(guide: Guide): Observable<any> {
    return this.sharedService.patch(`guide/${guide.userPrincipleName}`, guide);
  }
}
