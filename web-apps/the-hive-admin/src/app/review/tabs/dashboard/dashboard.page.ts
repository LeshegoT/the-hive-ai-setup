import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, Observable, of, startWith, switchMap } from 'rxjs';
import { EnvironmentService } from '../../../services/environment.service';
import { ReviewListItem } from '../../review-shared-interfaces';
import { HrReviewDashboardService, SelectedStatusSummaryTableItem } from '../../services/hr-review-dashboard.service';
import { DashboardFilter } from '../../components/dashboard-filter/dashboard-filter.component';
import { ReviewStatus, reviewStatuses } from '@the-hive/lib-reviews-shared';
import { Assignment } from '../../../shared/interfaces';
import { FeedbackService } from '../../services/feedback.service';


@Component({
    selector: 'app-review-dashboard',
    templateUrl: './dashboard.page.html',
    styleUrls: ['./dashboard.page.css'],
    standalone: false
})
export class DashboardComponent implements OnInit {

  @ViewChild('dashboard',{static:true}) view: ElementRef;
  componentClass: string;
  typeSelection: string;
  reviewSelected?: ReviewListItem;
  dashboardFilter: DashboardFilter;
  statuses: ReviewStatus[] = Array.from(reviewStatuses).filter(status => status !== "Upcoming Reviews");
  staffReviewColumns: ReadonlyArray<string> = ['displayName', 'unit', 'reviewMonth', 'manager', 'hrRep', 'updatedDate', 'controls'];
  feedbackAssignmentListColumns: ReadonlyArray<string> = ["Feedback Provider Name", "Nudge Counts", "dueDate", "last accessed", "status"];
  selectedStatusSummaryTableItem$: BehaviorSubject<SelectedStatusSummaryTableItem> = new BehaviorSubject(undefined);
  reviewListItems$: Observable<ReviewListItem[] | undefined>;
  selectedReviewListItem$: BehaviorSubject<ReviewListItem> = new BehaviorSubject(undefined);
  feedbackAssignmentsForSelectedReview$: Observable<Assignment[]>;

  constructor(
    private environmentService: EnvironmentService,
    private hrReviewDashboardService:HrReviewDashboardService,
    private snackBar: MatSnackBar,
    private feedbackService: FeedbackService
  ) { }

  ngOnInit() {
    this.environmentService.getConfig().subscribe((env) => {
      this.componentClass = env && env.ENVIRONMENT_NAME;
    });

    this.reviewListItems$ = this.selectedStatusSummaryTableItem$.pipe(
      switchMap(selectedStatusSummaryTableItem => {
        this.selectedReviewListItem$.next(undefined);
        const isAnyGroupSelected = !!selectedStatusSummaryTableItem?.lateness
          || !!selectedStatusSummaryTableItem?.hrRep
          || !!selectedStatusSummaryTableItem?.status;

        if (isAnyGroupSelected && selectedStatusSummaryTableItem?.selectedItemType === 'numberOfUnchangedReviews') {
          return this.getReviewsWithUnchangedStatusListObservable(selectedStatusSummaryTableItem).pipe(
            startWith(undefined)
          );
        } else if (isAnyGroupSelected && selectedStatusSummaryTableItem?.selectedItemType === 'numberOfReviews') {
          return this.getReviewsListObservable(selectedStatusSummaryTableItem).pipe(
            startWith(undefined)
          );
        } else {
          return of([]);
        }
      }),
      startWith(undefined)
    );

    this.feedbackAssignmentsForSelectedReview$ = this.selectedReviewListItem$.pipe(
      switchMap(reviewListItem => {
        if (reviewListItem) {
          return this.feedbackService.getReviewFeedbackAssignments(reviewListItem.reviewId).pipe(startWith(undefined));
        } else {
          return of(undefined);
        }
      }),
    );
  }

  getReviewsWithUnchangedStatusListObservable(selectedLatenessAndStatus: SelectedStatusSummaryTableItem): Observable<ReviewListItem[]> {
    return this.hrReviewDashboardService.retrieveReviewsWithUnchangedLatenessAndStatus(selectedLatenessAndStatus).pipe(
      catchError(errorMessage => {
        this.snackBar.open(`Failed to fetch list of reviews with unchanged status: ${errorMessage}`, 'dismiss', {
          duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION
        });
        return of([]);
      }),
    );
  }

  getReviewsListObservable(selectedLatenessAndStatus: SelectedStatusSummaryTableItem): Observable<ReviewListItem[]> {
    return this.hrReviewDashboardService.retrieveReviewsForLatenessAndStatus(selectedLatenessAndStatus).pipe(
      catchError(errorMessage => {
        this.snackBar.open(`Failed to fetch list of reviews: ${errorMessage}`, 'dismiss', {
          duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION
        });
        return of([]);
      }),
    );
  }

  setDashboardFilterValue(newFilter: DashboardFilter) {
    this.dashboardFilter = newFilter;
    this.resetSelections();
  }

  setSelectedStatusSummaryTableItem(selectedStatusSummaryTableItem: SelectedStatusSummaryTableItem) {
    this.selectedStatusSummaryTableItem$.next(selectedStatusSummaryTableItem);
  }

  setSelectedReviewListItem(reviewListItem: ReviewListItem) {
    this.selectedReviewListItem$.next(reviewListItem);
  }

  resetSelections() {
    this.selectedStatusSummaryTableItem$.next(undefined);
  }

}
