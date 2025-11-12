import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class UserProgressService {
  constructor(private sharedService: SharedService) {}

  userCourseProgress(): Observable<any> {
    return this.sharedService.get(`userCourseProgress`);
  }

  resetUserCourseProgress(upn: string, courseId: number): Observable<any> {
    return this.sharedService.delete(
      `userCourseProgress`, 
      true, 
      { upn, courseId }
    );
  }
}
