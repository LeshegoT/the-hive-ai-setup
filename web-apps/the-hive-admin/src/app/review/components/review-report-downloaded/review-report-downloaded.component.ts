import { Component, Input, SimpleChanges, viewChild, OnChanges} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { ReviewListItem } from '../../review-shared-interfaces';
import { ReviewListComponent } from '../review-list/review-list.component';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';
import { EnvironmentService } from '../../../services/environment.service';
import {UNIT_MOVE_REVIEW_TEMPLATE_NAME} from '@the-hive/lib-reviews-shared';

@Component({
    selector: 'app-review-report-downloaded',
    templateUrl: './review-report-downloaded.component.html',
    styleUrls: [],
    standalone: false
})
export class ReviewReportDownloadedComponent implements OnChanges {
  @Input() filterParameters: UpcomingReviewsFilterParameters;
  @Input() buttonsEnabled = true;
  @Input() reviewData: Array<ReviewListItem> = [];
  reviewColumns = [
    'displayName', 
    'userPrincipleName', 
    'jobTitle', 
    'unit', 
    'reviewMonth', 
    'type', 
    'controls'
  ];

  actionButtonIconName = 'checkmark';
  reportDownloadedActionName = 'ReportDownloaded';
  reportDownloadedStatusId: number;
  execFeedbackRequestedActionName = 'ExecFeedbackRequested';
  execFeedbackRequestedStatusId: number;
  archivedStatusId: number
  reviewListComponent =  viewChild.required<ReviewListComponent>('reviewList');

  constructor(
    public feedbackService: FeedbackService,
    public reviewStatusService: ReviewStatusService,
    private environmentService: EnvironmentService,
    private snackBar: MatSnackBar,
  ) {}

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
      this.reportDownloadedStatusId = statuses.find(
        (status) => status.actionName == this.reportDownloadedActionName
      ).statusId;

      this.execFeedbackRequestedStatusId = statuses.find(
        (status) => status.actionName == this.execFeedbackRequestedActionName
      ).statusId;

      this.archivedStatusId = statuses.find((status) => status.actionName === 'Archived').statusId;

      this.feedbackService.getReviews(this.reportDownloadedStatusId, filterParameters).subscribe((reviews) => {
        this.reviewData = reviews;
      });
    });
  }

  markAsRequested(review: ReviewListItem, actionButton: HTMLButtonElement) {
    actionButton.disabled = true;
    const reviewId = review.reviewId;

    if (review.templateName === UNIT_MOVE_REVIEW_TEMPLATE_NAME) {
      this.feedbackService.progressToNextStatus(reviewId, this.archivedStatusId).subscribe(() => {
        this.snackBar.open('Successfully changed the review status', 'Dismiss', { duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION });
      });
    } else {
      this.feedbackService.progressToNextStatus(reviewId, this.execFeedbackRequestedStatusId).subscribe(() => {
        this.snackBar.open('Successfully changed the review status', 'Dismiss', { duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION });
      });
    }
  }

  actionButtonText(review: ReviewListItem) {
    if (review.templateName === UNIT_MOVE_REVIEW_TEMPLATE_NAME) {
      return 'Complete review';
    } else {
      return 'Summary sent to STRATCO';
    }
  }

}