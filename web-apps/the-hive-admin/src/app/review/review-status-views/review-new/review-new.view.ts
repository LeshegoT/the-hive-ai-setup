import { Component, Input, OnChanges, SimpleChanges, viewChild, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';;
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { ReviewListItem } from '../../review-shared-interfaces';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';
import { EnvironmentService } from '../../../services/environment.service';

@Component({
    selector: 'app-review-new',
    templateUrl: './review-new.view.html',
    styleUrls: ['../../styles/reviewShared.css'],
    standalone: false
})
export class ReviewNewComponent implements OnChanges, OnInit {
  @Input() filterParameters: UpcomingReviewsFilterParameters;
  @Input() buttonsEnabled = true;

  componentName = 'ReviewNew';
  snackBarDuration: number;
  reviewData: MatTableDataSource<ReviewListItem>;
  reviewColumns = [
    'displayName', 
    'userPrincipleName', 
    'jobTitle', 
    'manager', 
    'unit', 
    'reviewMonth', 
    'reviewDate', 
    'type', 
    'controls'
  ];
  cancelButtonText = 'Cancel review';
  actionButtonIconName = 'checkmark';
  actionButtonText = (review: ReviewListItem) => review.requiresFeedback ? 'Request feedback providers': 'Finalise salary';
  markAsRequestedActionName = 'ProvidersRequested';
  finaliseSalaryActionName = 'SalaryFinalised';
  markAsRequestedStatusId: number;
  finaliseSalaryStatusId: number;
  reviewListComponent =  viewChild.required<ReviewListComponent>('reviewList');

  constructor(
    public feedbackService: FeedbackService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public reviewStatusService: ReviewStatusService,
    private environmentService: EnvironmentService
  ) {}

  ngOnInit(): void {
    this.fetchEnvironmentConfigurations();
  }

  fetchEnvironmentConfigurations(): void {
    this.environmentService.getConfig().subscribe((env) => {
      this.snackBarDuration = env.SNACKBAR_DURATION;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterParameters']){
      this.setReviewData(this.filterParameters);
    } else {
      // The filterParameters did not change, so no need to update the data
    }
  }

  setReviewData(filterParameters: UpcomingReviewsFilterParameters) {
    this.reviewData = undefined;
    this.reviewStatusService.getStartStatus().subscribe((status) => {
      this.markAsRequestedStatusId = status.allowedToProgressTo.find((status) => status.actionName == this.markAsRequestedActionName).statusId;
      this.finaliseSalaryStatusId = status.allowedToProgressTo.find((status) => status.actionName == this.finaliseSalaryActionName).statusId;
      this.feedbackService.getReviews(status.statusId, filterParameters).subscribe((reviews) => {
        this.reviewData = reviews;
      });
    });
  }

  private moveToNextStatus(review: ReviewListItem, assignButton: HTMLButtonElement, cancelButton: HTMLButtonElement, nextStatus: number) {
    assignButton.disabled = true;
    cancelButton.disabled = true;
    const reviewId = review.reviewId;
    this.feedbackService.progressToNextStatus(reviewId, nextStatus).subscribe(
    {
      next: () => {
        this.snackBar.open('Successfully changed the review status', 'Dismiss', { duration: this.snackBarDuration });
        assignButton.hidden = true;
        cancelButton.hidden = true;
        this.reviewListComponent().removeReview(review);
      },
      error: (err) => {
        this.snackBar.open(err, 'Dismiss', { duration: this.snackBarDuration });
        assignButton.disabled = false;
        cancelButton.disabled = false;
      }
    });
  }

  onNextButtonClicked(review: ReviewListItem, assignButton: HTMLButtonElement, cancelButton: HTMLButtonElement) {
    if(review.requiresFeedback) {
      this.moveToNextStatus(review, assignButton, cancelButton, this.markAsRequestedStatusId);
    } else {
      this.moveToNextStatus(review, assignButton, cancelButton, this.finaliseSalaryStatusId);
    }
  }
}
