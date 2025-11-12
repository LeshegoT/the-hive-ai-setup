import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { Assignment } from '../../../shared/interfaces';
import { FeedbackProvidersSelectionDialogComponent } from '../feedback-providers-selection-dialog/feedback-providers-selection-dialog.component';
import { ReviewListItem } from '../../review-shared-interfaces';
import { ReviewListStateNotifierService } from '../../services/review-list-state-notifier.service';
import { Config } from '../../../shared/config';
import { EnvironmentService } from '../../../services/environment.service'

export class FeedbackProvidersAssignable {
  protected feedbackAssignments: Assignment[] = [];
  protected currentReviewUPN: string;
  config: Config;

  constructor(
    public feedbackService: FeedbackService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public reviewStatusService: ReviewStatusService,
    public environmentService: EnvironmentService,
    public reviewListStateNotifier: ReviewListStateNotifierService
  ) {
    this.config = this.environmentService.getConfiguratonValues();
  }

  selectFeedbackProviders(review: ReviewListItem, assignButton: HTMLButtonElement) { 
    assignButton.disabled = true;
    let reviewAssignments: Assignment[] = [];
    this.feedbackService.getReviewFeedbackAssignments(review.reviewId).subscribe((assignments) => {
      reviewAssignments = assignments;
      const dialog = this.dialog.open(FeedbackProvidersSelectionDialogComponent, {
        width: '60em',
        data: {
          assignments: reviewAssignments,
          review: review,
        },
      });
      dialog.afterClosed().subscribe((newProviders) => {
        if (newProviders) {
          this.assignFeedbackProviders(newProviders, review, assignButton);
        } else {
          assignButton.disabled = false;
        }
      });
    });
  }
  assignFeedbackProviders(
    newProviders,
    review: ReviewListItem,
    assignButton: HTMLButtonElement
  ) {
    assignButton.disabled = true;
    this.feedbackService.assignNewFeedback(review.reviewId, newProviders).subscribe(
      () => {
        this.reviewListStateNotifier.notifyReviewListStateChange();
        this.fetchFeedbackAssignments(review);
        this.snackBar.open('Successfully added feedback providers', 'Dismiss', { duration:  this.config.SNACKBAR_DURATION });
        assignButton.disabled = false;
        assignButton.hidden = true;
      },
      (err) => {
          this.snackBar.open(err, 'Dismiss', { duration: 10000 });
        assignButton.disabled = false;
      }
    );
  }

  fetchFeedbackAssignments(review: ReviewListItem | undefined) {
    if (review !== undefined) {
      this.feedbackAssignments = undefined;
      this.feedbackService.getReviewFeedbackAssignments(review.reviewId).subscribe(assignments => {
        this.feedbackAssignments = assignments;
        this.currentReviewUPN = review.userPrincipleName;
      });
    } else {
      this.feedbackAssignments = [];
    }
  }
}