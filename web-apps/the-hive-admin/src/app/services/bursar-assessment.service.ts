import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root',
})
export class BursarAssessmentService {
  constructor(private sharedService: SharedService) {}

  createNewBursarAssessment(bursarData: { name: string; email: string; dueDate: Date }): Observable<any> {
    return this.sharedService.post(`bursarAssessment`, bursarData);
  }

  getBursarAssessments(currentPage: number, currentPageSize: number, searchText: string): Observable<any> {
    return this.sharedService.get(`bursarAssessment/?page=${currentPage}&size=${currentPageSize}&search=${searchText}`);
  }

  getAssessmentStates(): Observable<any> {
    return this.sharedService.get(`bursarAssessmentStatus`);
  }

  updateBursarAssessmentDeadline(assessmentData: { id: number; dueDate: Date }): Observable<any> {
    return this.sharedService.patch(`assignment/${assessmentData.id}`, assessmentData);
  }

  cancelBursarAssessment(assessmentId: number): Observable<any> {
    return this.sharedService.delete(`bursarAssessment/${assessmentId}`);
  }
}
