import { Component, Input, SimpleChanges, viewChild, OnChanges} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { ReviewListItem } from '../../review-shared-interfaces';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';

@Component({
    selector: 'app-review-process-finalized',
    templateUrl: './review-process-finalized.view.html',
    styleUrls: [],
    standalone: false
})
export class ReviewProcessFinalizedComponent implements OnChanges {
  @Input() filterParameters: UpcomingReviewsFilterParameters;
  @Input() buttonsEnabled = true;
  @Input() reviewData: Array<ReviewListItem> = [];
    reviewColumns = [
    'displayName',
    'userPrincipleName',
    'jobTitle',
    'unit',
    'manager',
    'previousReviewDate',
    'previousReviewType',
    'nextReviewDate',
    'nextReviewType',
    'controls',
  ];

  archiveButtonText = 'Confirm next review details';
  actionButtonIconName = 'checkmark';
  reviewFinalizedActionName = 'ReviewFinalized';
  reviewFinalizedStatusId: number;
  archivedActionName = 'Archived';
  archivedStatusId: number;
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
      this.reviewFinalizedStatusId = statuses.find(
        (status) => status.actionName == this.reviewFinalizedActionName
      ).statusId;

      this.archivedStatusId = statuses.find((status) => status.actionName == this.archivedActionName).statusId;
      this.feedbackService.getReviews(this.reviewFinalizedStatusId, filterParameters).subscribe((reviews) => {
        this.reviewData = reviews;
      });
    });
  }

  archiveAndSetNextReviewDetails(review: ReviewListItem, actionButton: HTMLButtonElement) {
    actionButton.disabled = true;
    this.feedbackService.setNextReviewDetails(review).subscribe(
    {
      next: () => {
        this.snackBar.open('Successfully scheduled the next review', 'Dismiss', { duration: 10000 });
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