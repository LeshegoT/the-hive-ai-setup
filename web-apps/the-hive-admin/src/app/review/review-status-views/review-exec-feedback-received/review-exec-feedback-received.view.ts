import { Component, Input, SimpleChanges, viewChild, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { ReviewListItem } from '../../review-shared-interfaces';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';

@Component({
    selector: 'app-review-exec-feedback-received',
    templateUrl: './review-exec-feedback-received.view.html',
    styleUrls: [],
    standalone: false
})
export class ReviewExecFeedbackReceivedComponent implements OnChanges {
  @Input() filterParameters: UpcomingReviewsFilterParameters;
  @Input() buttonsEnabled = true;
  @Input() reviewData: Array<ReviewListItem> = [];
  reviewColumns = [
    'displayName', 
    'userPrincipleName', 
    'jobTitle', 
    'unit', 
    'manager', 
    'reviewMonth', 
    'type', 
    'controls'
  ];

  markAsScheduledButtonText = 'Review Meeting Scheduled';
  actionButtonIconName = 'checkmark';
  execFeedbackReceivedActionName = 'ExecFeedbackReceived';
  execFeedbackReceivedStatusId: number;
  meetingScheduledActionName = 'MeetingScheduled';
  meetingScheduledStatusId: number;
  reviewListComponent =  viewChild.required<ReviewListComponent>('reviewList');

  constructor(
    public feedbackService: FeedbackService,
    public reviewStatusService: ReviewStatusService,
    public dialog: MatDialog,
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

      this.meetingScheduledStatusId = statuses.find(
        (status) => status.actionName == this.meetingScheduledActionName
      ).statusId;
      this.feedbackService.getReviews(this.execFeedbackReceivedStatusId, filterParameters).subscribe((reviews) => {
        this.reviewData = reviews;
      });
    });
  }

  markAsScheduled(review: ReviewListItem, actionButton: HTMLButtonElement) {
    actionButton.disabled = true;
    const reviewId = review.reviewId;
    this.feedbackService.progressToNextStatus(reviewId, this.meetingScheduledStatusId).subscribe(
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
    });
  }

}
