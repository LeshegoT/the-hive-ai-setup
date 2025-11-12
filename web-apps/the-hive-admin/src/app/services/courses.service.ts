import { Injectable, Injector } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  constructor(private sharedService: SharedService) {}

  getAllCourses(): Observable<any> {
    return this.sharedService.get('allCourses');
  }

  getPathToCourses(courseRoute): Observable<any> {
    return this.sharedService.get(`pathToCourses/${courseRoute}`);
  }

  getCoursePrefix(): Observable<any> {
    return this.sharedService.get('coursePrefix');
  }

  createCourse(course): Observable<any> {
    return this.sharedService.post('createCourse', course);
  }

  updateCourse(course): Observable<any> {
    return this.sharedService.post('updateCourse', course);
  }

  checkUserWithCourseMission(courseId: number): Observable<number> {
    return this.sharedService.get(`countCourseMission/${courseId}`);
  }

  checkCourseAssignedToUser(courseId: number): Observable<number> {
    return this.sharedService.get(`course/${courseId}/assigned/count`);
  }
  checkUserRegiteredForCourse(courseId: any):Observable<number> {
    return this.sharedService.get(`course/${courseId}/registered/count`);
  }
  checkCourseContainsMessage(courseId: number): Observable<number> {
    return this.sharedService.get(`/course/${courseId}/message/count`);
  }

  countContentRestrictions(courseId: number): Observable<number> {
    return this.sharedService.get(`course/${courseId}/restrictions/count`);
  }

  deleteCourse(courseId: number): Observable<any> {
    return this.sharedService.delete(`course/${courseId}`);
  }

  getSectionQuestions(sectionId): Observable<any> {
    return this.sharedService.get(`getSectionQuestions/${sectionId}`);
  }
}
