import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { FeedbackProvidersAssignable } from '../../components/review-feedback-providers-assignable/feedback-providers-assignable.component';
import { ReviewListItem } from '../../review-shared-interfaces';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';
import { ReviewListStateNotifierService } from '../../services/review-list-state-notifier.service';
import { EnvironmentService } from '../../../services/environment.service'

@Component({
    selector: 'app-review-in-progress',
    templateUrl: './review-in-progress.view.html',
    styleUrls: ['../../styles/reviewShared.css'],
    standalone: false
})
export class ReviewInProgressComponent extends FeedbackProvidersAssignable implements OnInit, OnChanges {
  @Input() filterParameters: UpcomingReviewsFilterParameters;
  @Input() buttonsEnabled = true;
  reviewData: MatTableDataSource<ReviewListItem>;
  assignProvidersButtonText = 'Assign feedback providers';
  actionButtonIconName = 'add';
  inProgressActionName = 'FeedbackInProgress';
  inProgressStatusId: number;
  reviewColumns = [
    'displayName', 
    'userPrincipleName', 
    'jobTitle', 
    'unit', 
    'reviewMonth', 
    'type', 
    'controls'
  ];
  assignmentColumns = ['provider', 'dueDate', 'last accessed', 'status', 'controls'];
  cancelButtonText = 'Cancel review';
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

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterParameters']){
      this.setReviewData(this.filterParameters);
    } else {
      // The filterParameters did not change, so no need to update the data
    }
  }

  setReviewData(filterParameters: UpcomingReviewsFilterParameters) {
    this.reviewData = undefined;
    this.reviewStatusService.getReviewStatuses().subscribe((statuses) => {
      this.inProgressStatusId = statuses.find((status) => status.actionName == this.inProgressActionName).statusId;
      this.feedbackService.getReviews(this.inProgressStatusId, filterParameters).subscribe((reviews) => {
        this.reviewData = reviews;
      });
    });
    this.fetchFeedbackAssignments(undefined);
  }
}
