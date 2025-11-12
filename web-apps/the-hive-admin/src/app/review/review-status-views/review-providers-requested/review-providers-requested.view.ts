import { Component, Input, OnDestroy, OnInit, SimpleChanges, viewChild, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { FeedbackProvidersAssignable } from '../../components/review-feedback-providers-assignable/feedback-providers-assignable.component';
import { ReviewListItem } from '../../review-shared-interfaces';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';
import { ReviewListStateNotifierService } from '../../services/review-list-state-notifier.service';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import { Subscription } from 'rxjs';
import { EnvironmentService } from '../../../services/environment.service'

@Component({
    selector: 'app-review-providers-requested',
    templateUrl: './review-providers-requested.view.html',
    styleUrls: [],
    standalone: false
})
export class ReviewProvidersRequestedComponent extends FeedbackProvidersAssignable implements OnInit, OnDestroy, OnChanges {
  @Input() filterParameters: UpcomingReviewsFilterParameters;
  @Input() buttonsEnabled = true;
  reviewListComponent =  viewChild.required<ReviewListComponent>('reviewList');
  reviewListStateSubscription: Subscription;

  componentName = 'ReviewNew';
  reviewData: MatTableDataSource<ReviewListItem>;
  reviewColumns = [
    'displayName', 
    'userPrincipleName', 
    'jobTitle', 
    'unit', 
    'manager', 
    'reviewMonth', 
    'reviewDate', 
    'type', 
    'controls'
  ];

  assignProvidersButtonText = 'Assign feedback providers';
  actionButtonIconName = 'add';
  assignProvidersActionName = 'ProvidersAssigned';
  requestProvidersActionName = 'ProvidersRequested';
  assignProvidersStatusId: number;
  requestProvidersStatusId: number;
  cancelButtonText = 'Cancel review';
  displayNudgeButton = false;

  constructor(
    public override feedbackService: FeedbackService,
    public override dialog: MatDialog,
    public override snackBar: MatSnackBar,
    public override reviewStatusService: ReviewStatusService,
    public override environmentService: EnvironmentService,
    public override reviewListStateNotifier: ReviewListStateNotifierService
  ) {
    super(feedbackService, dialog, snackBar, reviewStatusService, environmentService, reviewListStateNotifier);
  }

  ngOnInit(): void {
    this.reviewListStateSubscription = this.reviewListStateNotifier.onReviewListStateChange().subscribe({
      next: () => this.setReviewData(this.filterParameters)
    });
    this.displayNudgeButton = this.environmentService.getConfiguratonValues().FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterParameters']){
      this.setReviewData(this.filterParameters);
    } else {
      // The filterParameters did not change, so no need to update the data
    }
  }

  ngOnDestroy(): void {
    this.reviewListStateSubscription.unsubscribe();
  }

  setReviewData(filterParameters: UpcomingReviewsFilterParameters) {
    this.reviewData = undefined;
    this.reviewStatusService.getReviewStatuses().subscribe((statuses) => {
      this.assignProvidersStatusId = statuses.find(
        (status) => status.actionName == this.assignProvidersActionName
      ).statusId;
      this.requestProvidersStatusId = statuses.find(
        (status) => status.actionName == this.requestProvidersActionName
      ).statusId;
      this.feedbackService.getReviews(this.requestProvidersStatusId, filterParameters).subscribe((reviews) => {
        this.reviewData = reviews;
      });
    });
  }


}
