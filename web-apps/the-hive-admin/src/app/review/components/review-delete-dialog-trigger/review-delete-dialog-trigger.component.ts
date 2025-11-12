import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Review } from '../../services/feedback.service';
import { ReviewAndContractRecommendationDeleteDialogComponent } from '../review-and-contract-recommendation-delete-dialog/review-and-contract-recommendation-delete-dialog.component';

@Component({
    selector: 'app-review-delete-dialog-trigger',
    templateUrl: './review-delete-dialog-trigger.component.html',
    styleUrls: ['./review-delete-dialog-trigger.component.css'],
    standalone: false
})
export class ReviewDeleteDialogTriggerComponent {
  constructor(public dialog: MatDialog) {}
  @Input() review: Review;
  @Output() removeFeedback: EventEmitter<Review> = new EventEmitter();

  openDialog(): void {
    this.dialog.open(ReviewAndContractRecommendationDeleteDialogComponent, {
      width: '60em',
      data: {
        id: this.review.reviewID,
        reviewee: this.review.reviewee,
        status: this.review.status,
        deadline: this.review.dueDate,
        feedbackAssignments: {
          total: this.review.feedbackAssignments.length,
          completed: this.review.feedbackAssignments.filter(
            (assignment) => assignment.status.toLowerCase() === 'completed'
          ).length,
        },
        validateReviewee: '',
        afterSuccess: () => {
          this.removeFeedback.emit(this.review);
        },
      },
    });
  }
}
