import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { map, Observable } from 'rxjs';
import { Person } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private sharedService: SharedService) {}

  getPrescribedCourseProgress(): Observable<any> {
    return this.sharedService.get('/userPrescribedCoursesProgress');
  }

  getAllStaffOnRecord(activeUsersOnly = false): Observable<any> {
    return this.sharedService.get(`allBBDUsers?active=${activeUsersOnly}`).pipe(
      map((users) => users.map((user: Person) => ({
        ...user,
        dateOfBirth: user.dateOfBirth && new Date(user.dateOfBirth)
      })))
    );  
  }

}
