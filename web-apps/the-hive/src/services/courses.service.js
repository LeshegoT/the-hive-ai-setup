import { coursesReceived } from '../actions/courses-received.action';
import { userPrescribedCoursesReceived } from '../actions/user-prescribed-courses-received.action';
import { completedCoursesReceived } from '../actions/completed-courses-received.action';
import { get, post } from './shared';
import authService from './auth.service';
import configService from './config.service';
import { BaseService } from './base.service';
import pointsService from './points.service';
export class CoursesService extends BaseService {
  constructor() {
    super();
  }

  async getCourses() {
    let response = await get(this.buildApiUrl('courses'));
    let courses = await response.json();
    this.store.dispatch(coursesReceived(courses));
  }

  async getPrescribedTraining() {
    let upn = authService.getUserPrincipleName();

    let response = await get(this.buildApiUrl(`userPrescribedCourses?upn=${upn}`));
    let courses = await response.json();
    this.store.dispatch(userPrescribedCoursesReceived(courses));
  }

  async completePrescribedTraining(courseId) {
    let request = {
      courseId,
      upn: authService.getUserPrincipleName(),
    };
    let result = await post(this.buildApiUrl('completePrescribedCourse'), request);
    let response = await result.json();
    if (response.status && response.status == 'completed') {
      pointsService.pointsScored();
    }
    
    return response;
  }

  async getCompletedCourses() {
    let response = await get(this.buildApiUrl(`getCompletedCourses`));
    let result = await response.json();
    this.store.dispatch(completedCoursesReceived(result));
  }

  async updateCompleteDate(courseId) {
    await post(this.buildApiUrl(`course/${courseId}/completion-date`));
  }
  
  async registerUserForCourse(courseId) {
    await post(this.buildApiUrl(`course/${courseId}/registration`));
  }
}

export default new CoursesService();
