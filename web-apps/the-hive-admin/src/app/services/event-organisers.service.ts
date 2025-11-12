import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventOrganiser } from '../shared/interfaces';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root',
})
export class EventOrganiserService {
  constructor(private sharedService: SharedService) {}

  getEventOrganisers(): Observable<EventOrganiser[]> {
    return this.sharedService.get(`events/organisers`);
  }

  addEventOrganiser(upn: string): Observable<EventOrganiser> {
    return this.sharedService.post(`events/organisers`, { upn });
  }

  removeEventOrganiser(eventOrganiserId: number): Observable<void> {
    return this.sharedService.delete(`events/organisers/${eventOrganiserId}`);
  }
}
