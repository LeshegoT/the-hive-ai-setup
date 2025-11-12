import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';
import { calculateEndOfDay } from '../shared/date-utils';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  constructor(private sharedService: SharedService) {}
  
  updateStaffDateOfBirth(upn: string, dateOfBirth: Date): Observable<undefined> {
    const endDate = calculateEndOfDay(dateOfBirth);
    return this.sharedService.patch(`staff/${upn}/date-of-birth`, { dateOfBirth: endDate });
  }

  updateStaffResidence(upn: string, residence: string): Observable<void> {
    return this.sharedService.patch(`staff/${upn}/residence`, {residence});
  }

  updateStaffNationality(upn: string, nationality: string): Observable<undefined> {
    return this.sharedService.patch(`staff/${upn}/nationality`, { nationality });
  }

}
