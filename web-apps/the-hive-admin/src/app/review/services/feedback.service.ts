import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TemplateInterface } from '../components/table-feedback-template/table-feedback-template.component';
import { SharedService } from '../../services/shared.service';
import { Assignment, AssignmentTemplate, FeedbackAssignmentTemplate, HrComment, ReviewComment, ReviewFeedback, StaffComment, UpcomingReviewComment, VoluntaryFeedback } from '../../shared/interfaces';
import { HrReps, ReviewMeetingMinutes } from '../../shared/interfaces';
import { map, shareReplay } from 'rxjs/operators';
import { StatusReviewsCounts } from '../../shared/types';
import { ReviewListItem } from '../review-shared-interfaces';
import { UpcomingReviewsFilterParameters } from '../upcoming-reviews-filter-parameters';
import { ReviewFilterParameters } from '../review-filter-parameters';
import { NextReview, ReviewAudit } from '@the-hive/lib-reviews-shared';
import { StaffDepartment } from '@the-hive/lib-staff-shared';
import {UNIT_MOVE_REVIEW_TEMPLATE_NAME} from '@the-hive/lib-reviews-shared';
import { RouteAccessService } from '../../services/route-access.service';

export interface Review {
  active: boolean;
  createdBy: string;
  dateCreated: Date;
  currentlyBeingEdited: boolean;
  dueDate: Date;
  feedbackAssignments: Assignment[];
  reviewID: number;
  reviewee: string;
  status: string;
  template: AssignmentTemplate;
  staffId: number;
  displayName: string;
}

export interface Page {
  pageNumber: number;
  pageSize: number;
  resultSetSize: number;
  totalPages: number;
}

export interface PagedResult<T> {
  pageInfo: Page;
  data: T[];
}

export interface ReviewCancellationReason {
  reviewReasonsId: number;
  reason: string
}

export type StatusWithProgressions = [
  string,
  {
    statusId: number;
    description: string;
    allowedToProgressTo: number[];
    startingStatus: boolean;
    cancellationStatus: boolean;
    actionName: string;
  }
];

export type HistoricalFeedback = {
  reviewee: string;
  assigned: ReviewFeedback[];
  voluntary: VoluntaryFeedback[];
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  constructor(private sharedService: SharedService, private routeAccessService: RouteAccessService) {
    this.statusesWithProgressions$ = this.sharedService.get(`review-statuses`).pipe(
      shareReplay(1)
    );
  }

  private feedbackAssignmentTemplates$: Observable<FeedbackAssignmentTemplate[]>; 
  private peopleOwningReviews$: Observable<string[]>;
  private statusesWithProgressions$: Observable<StatusWithProgressions[]>;

  getStaffReviewHistory(staffUPN: string): Observable<any> {
    return this.sharedService.get(`/staff/${staffUPN}/review-history`);
  }

  getUserFeedback(user: string): Observable<HistoricalFeedback> {
    return this.sharedService.get(`/review/feedback/${user}`);
  }

  getFeedbackAssignmentTemplates(): Observable<any> {
    if(!this.feedbackAssignmentTemplates$){
      this.feedbackAssignmentTemplates$ = this.sharedService.get(`/feedbackAssignmentTemplate`).pipe(
        map((feedbackAssignmentTemplates: FeedbackAssignmentTemplate[]) => {
          if (this.sharedService.environmentService.getConfiguratonValues().UNIT_CHANGE_REVIEWS_ENABLED) {
            return feedbackAssignmentTemplates;
          } else {
            return feedbackAssignmentTemplates.filter(template => template.templateName !== UNIT_MOVE_REVIEW_TEMPLATE_NAME);
          }
        }),
        shareReplay(1)
      );
    }
    return this.feedbackAssignmentTemplates$;
  }

  getBarGraphUserFeedBack(user: string): Observable<any> {
    return this.sharedService.get(`/peer-feedbacks/visual-bar-graph/${user}`);
  }

  getAllAssignedFeedback(currentPage: number, currentPageSize: number, filterParameters: string): Observable<any> {
    return this.sharedService.get(`assignment/?page=${currentPage}&size=${currentPageSize}${filterParameters}`);
  }

  assignNewFeedback(reviewId: number, reviewPrompt): Observable<any> {
    return this.sharedService.post(`reviews/${reviewId}/assignments`, reviewPrompt);
  }

  nudgeAssignedFeedback(id: number): Observable<any> {
    return this.sharedService.post(`assignment/${id}/nudge`, {});
  }

  nudgeManager(reviewId: number): Observable<{message: string}> {
    return this.sharedService.post(`reviews/${reviewId}/nudge-manager`, {});
  }

  getCurrentDayFeedbackAssignmentNudges(feedbackAssignmentId: number): Observable<any> {
    return this.sharedService.get(`assignment/${feedbackAssignmentId}/nudge`)
  }

  createNewFeedbackTemplate(templateData: TemplateInterface): Observable<any> {
    return this.sharedService.post(`feedback/template`, templateData);
  }

  updateFeedbackTemplate(templateData: TemplateInterface): Observable<any> {
    return this.sharedService.put(`feedback/template/${templateData.feedbackAssignmentTemplateId}`, templateData);
  }

  deleteFeedbackAssignment(assignmentId: number,selectedReasonId:number): Observable<undefined> {
    return this.sharedService.delete(`assignment/${assignmentId}?reasonId=${selectedReasonId}`);
  }

  updateFeedbackAssignment(assignmentId: number, dueBy: Date, retractedReasonId?: number): Observable<any> {
    return this.sharedService.put(`assignment/${assignmentId}`, { dueBy: dueBy, retractedReasonId: retractedReasonId });
  }

  getAssignmentAllowedStatusProgressions(): Observable<any> {
    return this.sharedService.get(`allowed-assignment-status-progressions/`);
  }

  getDefaultTemplateVariables(): Observable<any> {
    return this.sharedService.get(`/feedbackAssignmentTemplateVariables`);
  }

  getAllReviews(
    currentPage: number,
    currentPageSize: number,
    filterParameters: ReviewFilterParameters
  ): Observable<PagedResult<Review & {hrRep: string}>> {
    const queryFilterParameters = this.createParameterQuery(filterParameters);
    return this.sharedService.get(`review/v2/?page=${currentPage}&size=${currentPageSize}${queryFilterParameters}`);
  }

  createParameterQuery(filterParameters: ReviewFilterParameters) {
    let filterQuery = '';

    for (const property in filterParameters) {
      if (filterParameters[property] && filterParameters[property] != '') {
        filterQuery += `&${property}=${encodeURIComponent(filterParameters[property])}`;
      }
    }

    return filterQuery;
  }

  getReviewFeedbackAssignments(id: number): Observable<Assignment[]> {
    return this.sharedService.get(`review/v2/${id}/assignments/`);
  }

  getReviewComments(id: number): Observable<HrComment[]> {
    return this.sharedService.get(`review/${id}/comment/`);
  }

  addReviewComment(id: number, data: { comment: string }): Observable<any> {
    return this.sharedService.post(`review/${id}/comment/`, data);
  }

  getReviewMeetingMinutes(reviewId: number): Observable<any> {
    return this.sharedService.get(`review/${reviewId}/meeting-minutes/`);
  }
  
  addOrUpdateReviewMeetingMinutes(reviewMeetingMinuteData: ReviewMeetingMinutes, finaliseReviewMeetingMinutes: boolean): Observable<void> {
    return this.sharedService.patch(`review/${reviewMeetingMinuteData.reviewId}/meeting-minutes/`, { ...reviewMeetingMinuteData, finaliseReviewMeetingMinutes });
  }

  updateReviewDeadline(reviewData: { id: number; dueDate: Date }): Observable<any> {
    return this.sharedService.patch(`review/${reviewData.id}`, reviewData);
  }

  updateStaffReviewDeadline(staffReviewData: { id: number; dueDate: Date; comment: string }): Observable<any> {
    return this.sharedService.patch(`staff-reviews/${staffReviewData.id}`, staffReviewData);
  }

  updateClientEmail(id: number, clientEmail: string): Observable<any> {
    return this.sharedService.patch(`review/v2/${id}/clientEmail`, { email: clientEmail });
  }

  deleteReview(id: number, review: ReviewListItem, comment: string): Observable<any> {
    const nextReviewDetails: NextReview = { staffId: review.staffId, nextReviewDate: review.nextReviewDate, typeId: review.typeId };
    return this.sharedService.delete(`review/${id}/delete`, true, { nextReviewDetails, comment});
  }

  stealReview(reviewSteal: { id: number; createdBy: string; comment: string, temporaryHrRepEndDate?: Date }): Observable<any> {
    return this.sharedService.patch(`review/${reviewSteal.id}`, reviewSteal);
  }

  assignNewReview(reviewPrompt): Observable<any> {
    return this.sharedService.post(`review`, reviewPrompt);
  }

  getReportFeedback(id: number, query: string): Observable<any> {
    return this.sharedService.get(`review/v2/${id}/report/${query}`);
  }

  archiveReview(id: number, archivedFlag: boolean): Observable<any> {
    return this.sharedService.patch(`review/${id}/archive`, { archived: archivedFlag });
  }

  getUserDepartmentHistory(upn: string): Observable<Omit<StaffDepartment, 'staffDepartmentId'>[]> {
    return this.sharedService.get(`user/${encodeURIComponent(upn)}/history/`);
  }

  getReviewsToBeCreated(filterParameters: UpcomingReviewsFilterParameters): Observable<any> {
    const queryFilterParameters = this.formatParameterQueryforUpcomingReviews(filterParameters);
    return this.sharedService.get(`reviews/toBeCreated/?${queryFilterParameters}`);
  }

  formatParameterQueryforUpcomingReviews(filterParameters: UpcomingReviewsFilterParameters) {
    if (!filterParameters.date) {
      filterParameters.date = new Date().toISOString();
    }

    let filterQuery = '';
    for (const property in filterParameters) {
      if (filterParameters[property] && filterParameters[property] != '') {
        filterQuery += `&${property}=${encodeURIComponent(filterParameters[property])}`;
      }
    }

    return filterQuery;
  }

  changeReviewHoldStatus(holdReason: string|null, staffReviewId: number) {
    return this.sharedService.patch(`reviews/${staffReviewId}/hold`, { holdReason });
  }

  getHRRepresentatives(): Observable<HrReps> {
    return this.sharedService.get(`hrRepresentatives`);
  }

  getPeopleOwningReviews(): Observable<string[]> {
    if(!this.peopleOwningReviews$){
      this.peopleOwningReviews$ = this.sharedService.get('people-owning-reviews').pipe(
        shareReplay(1)
      );
      return this.peopleOwningReviews$;
    } else {
      return this.peopleOwningReviews$;
    }
  }

  createUpcomingReviews(body): Observable<any> {
    return this.sharedService.post(`reviews/bulk`, body);
  }

  createSingleUpcomingReview(staffReviewId, body): Observable<any> {
    return this.sharedService.post(`reviews/${staffReviewId}`, body);
  }

  getReviewStatusesWithProgressions(): Observable<any> {
    return this.statusesWithProgressions$;
  }

  getReviews(currentStatusId: number, filterParameters: UpcomingReviewsFilterParameters): Observable<any> {
    const queryFilterParameters = this.formatParameterQueryforUpcomingReviews(filterParameters);
    return this.sharedService.get(`reviews/?statusId=${currentStatusId}${queryFilterParameters}`);
  }

  progressToNextStatus(reviewId: number, newStatusId: number): Observable<any> {
    return this.sharedService.patch(`reviews/${reviewId}/status`, { newStatusId });
  }

  setNextReviewDetails(body: ReviewListItem): Observable<any> {
    return this.sharedService.post(`/staff-reviews/${body.reviewId}`, body);
  }

  updateUpcomingReviewType(requestBody :{staffReviewId : number,nextFeedbackTypeId:number}): Observable<any> {
    return this.sharedService.patch(`/upcoming-review-type`,requestBody);
  }

  getReviewDueDateColour(review: ReviewListItem) {
    const now = new Date();
    const dueDate = new Date(review.dueDate);
    const differenceMonth = (dueDate.getMonth() - now.getMonth()) + (12 * (dueDate.getFullYear() - now.getFullYear()));
    let output: string;
    if (differenceMonth <= 0) {
      output = 'overdueColorIndicator';
    } else if (differenceMonth <= 1) {
      output = 'dueSoonColorIndicator';
    } else {
      output = 'dueLaterColorIndicator';
    }
    return output;
  }
  getFeedbackAssignmentDueDateColour(feedbackAssignment) {
    const now = new Date();
    const dueDate = new Date(feedbackAssignment.dueBy);
    const differenceMonth = (dueDate.getMonth() - now.getMonth()) + (12 * (dueDate.getFullYear() - now.getFullYear()));
    let output: string;

    if (feedbackAssignment.status === 'Completed') {
      output = 'completedColorIndicator';
    } else if (differenceMonth <= 0) {
      output = 'overdueColorIndicator';
    } else if (differenceMonth <= 1) {
      output = 'dueSoonColorIndicator';
    } else {
      output = 'dueLaterColorIndicator';
    }
    return output;
  }
  
  addUpcomingReviewComment(staffReviewId:number,requestBody :{comment:string}): Observable<any> {
    return this.sharedService.post(`/staff-review/${staffReviewId}/comment`,requestBody);
  }

  getUpcomingReviewComments(staffReviewId:number): Observable<HrComment[]> {
    return this.sharedService.get(`/staff-review/${staffReviewId}/comment`);
  }

  getCreatedBy(id: number): Observable<any> {
    return this.sharedService.get(`review/v2/${id}/createdBy/`);
  }

  getDeletedFeedbackAssignments(reviewId: number): Observable<any> {
    return this.sharedService.get(`review/v2/${reviewId}`);
  }

  addStaffMemberComment(staffId:number,requestBody: {comment:string}): Observable<any> {
    return this.sharedService.post(`/staff-member/${staffId}/comments`,requestBody);
  }

  getStaffMemberComments(staffId:number, newest?:boolean): Observable<StaffComment[] | StaffComment> {
    if (newest) {
      return this.sharedService.get(`/staff-member/${staffId}/comments?newest=${newest}`);
    } else {
      return this.sharedService.get(`/staff-member/${staffId}/comments`);
    }
  }

  deleteStaffMemberComment(staffMemberCommentId: number) {
    return this.sharedService.delete(`/staff-member/comments/${staffMemberCommentId}`);
  }

  getAllStaffReviewComments(staffUPN:string): Observable<UpcomingReviewComment[]> {
    return this.sharedService.get(`/staff-reviews/${staffUPN}/comments`);
  }

  getAllReviewsComments(staffUPN:string): Observable<ReviewComment[]> {
    return this.sharedService.get(`/reviews/${staffUPN}/comments`);
  }

  getNumberOfReviewsBasedOnFilter(filterParameters:UpcomingReviewsFilterParameters) : Observable<StatusReviewsCounts> {
    const queryFilterParameters = this.formatParameterQueryforUpcomingReviews(filterParameters);
    return this.sharedService.get(`reviews/count-reviews-by-status/?${queryFilterParameters}`);
  }

  getReviewCancellationReasons(): Observable<ReviewCancellationReason[]> {
    return this.sharedService.get('review-reasons')
  }

  createUnitChangeReview(revieweeUpn: string, reviewDeadline: Date): Observable<any> {
    return this.sharedService.post('/reviews/unit-change', {
      revieweeUpn,
      reviewDeadline
    });
  }

  getReviewAudit(reviewId: number): Observable<ReviewAudit[]> {
    return this.sharedService.get(`reviews/${reviewId}/audit`);
  }

  canViewReviewAudit(reviewId: number): Observable<boolean> {
    return this.routeAccessService.loggedInUserHasAccessToRoute(`/api/reviews/${reviewId}/audit`);
  }
}
