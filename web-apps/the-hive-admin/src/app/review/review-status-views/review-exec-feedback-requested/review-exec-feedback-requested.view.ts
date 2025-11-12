import { Component, Input, SimpleChanges, viewChild, OnChanges} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { ReviewListItem } from '../../review-shared-interfaces';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';

@Component({
    selector: 'app-review-exec-feedback-requested',
    templateUrl: './review-exec-feedback-requested.view.html',
    styleUrls: [],
    standalone: false
})
export class ReviewExecFeedbackRequestedComponent implements OnChanges {
  @Input() filterParameters: UpcomingReviewsFilterParameters;
  @Input() buttonsEnabled = true;
  reviewData: MatTableDataSource<ReviewListItem>;
  reviewColumns = [
    'displayName', 
    'userPrincipleName', 
    'jobTitle', 
    'unit', 
    'reviewMonth', 
    'type', 
    'controls'
  ];

  markAsReceivedButtonText = 'STRATCO feedback received';
  actionButtonIconName = 'checkmark';
  execFeedbackRequestedActionName = 'ExecFeedbackRequested';
  execFeedbackRequestedStatusId: number;
  execFeedbackReceivedActionName = 'ExecFeedbackReceived';
  execFeedbackReceivedStatusId: number;
  reviewListComponent =  viewChild.required<ReviewListComponent>('reviewList');

  constructor(
    public feedbackService: FeedbackService,
    public reviewStatusService: ReviewStatusService,
    private snackBar: MatSnackBar
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
      this.execFeedbackReceivedStatusId = statuses.find(
        (status) => status.actionName == this.execFeedbackReceivedActionName
      ).statusId;

      this.execFeedbackRequestedStatusId = statuses.find(
        (status) => status.actionName == this.execFeedbackRequestedActionName
      ).statusId;
      this.feedbackService.getReviews(this.execFeedbackRequestedStatusId, filterParameters).subscribe((reviews) => {
        this.reviewData = reviews;
      });
    });
  }

  markAsReceived(review: ReviewListItem, actionButton: HTMLButtonElement) {
    actionButton.disabled = true;
    const reviewId = review.reviewId;
    this.feedbackService.progressToNextStatus(reviewId, this.execFeedbackReceivedStatusId).subscribe(
    {
      next: () => {
        this.snackBar.open('Successfully changed the review status', 'Dismiss', { duration: 10000 });
        actionButton.hidden = true;
        this.reviewListComponent().removeReview(review);
      },
      error: (err) => {
        this.snackBar.open(err, 'Dismiss', { duration: 10000 });
        actionButton.disabled = false;
      }
    }
    );
  }

}
