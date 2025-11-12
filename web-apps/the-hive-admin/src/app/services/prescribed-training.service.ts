import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class PrescribedTrainingService {
  constructor(private sharedService: SharedService) {}

  getAllCourses(): Observable<any> {
    return this.sharedService.get('courses');
  }

  getUsersAssignedToCourse(courseId): Observable<any> {
    return this.sharedService.get(`assignedCourses/${courseId}`);
  }

  getUsersNotAssignedToCourse(courseId): Observable<any> {
    return this.sharedService.get(`notAssignedToCourses/${courseId}`);
  }

  saveNewUsers(upns, courseId, dueDate): Observable<any> {
    return this.sharedService.post('prescribeCoursesToUsers', { upns, courseId, dueDate });
  }

  saveNewMailingListUsers(addresses, courseId, dueDate): Observable<any> {
    return this.sharedService.post('prescribeCoursesToMailingListUsers', { addresses, courseId, dueDate });
  }

  removePrescribedCourse(upn, courseId): Observable<any> {
    return this.sharedService.post('removePrescribed', { upn, courseId });
  }
}
