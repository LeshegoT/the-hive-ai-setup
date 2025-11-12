import { Component, Input, SimpleChanges, viewChild, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { ReviewListItem } from '../../review-shared-interfaces';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';

@Component({
    selector: 'app-review-finalise-salary',
    templateUrl: './review-finalise-salary.view.html',
    styleUrls: [],
    standalone: false
})
export class ReviewFinaliseSalaryComponent implements OnChanges {
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

  markAsFinalizedButtonText = 'Review Finalised';
  actionButtonIconName = 'checkmark';
  finalisedSalaryActionName = 'SalaryFinalised';
  finalisedSalaryStatusId: number;
  reviewFinalizedActionName = 'ReviewFinalized';
  reviewFinalizedStatusId: number;
  reviewListComponent =  viewChild.required<ReviewListComponent>('reviewList');

  constructor(
    public feedbackService: FeedbackService,
    public dialog: MatDialog,
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
      this.reviewFinalizedStatusId = statuses.find(
        (status) => status.actionName == this.reviewFinalizedActionName
      ).statusId;

      this.finalisedSalaryStatusId = statuses.find(
        (status) => status.actionName == this.finalisedSalaryActionName
      ).statusId;
      this.feedbackService.getReviews(this.finalisedSalaryStatusId, filterParameters).subscribe((reviews) => {
        this.reviewData = reviews;
      });
    });
  }

  markAsFinalized(review: ReviewListItem, actionButton: HTMLButtonElement) {
    actionButton.disabled = true;
    const reviewId = review.reviewId;
    this.feedbackService.progressToNextStatus(reviewId, this.reviewFinalizedStatusId).subscribe(
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
