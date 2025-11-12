import { Component,  Input } from '@angular/core';
import { ReviewFeedback, VoluntaryFeedback } from '../../../shared/interfaces';
import { MatDialog } from '@angular/material/dialog';
import { ReviewReportDialogComponent } from '../review-report-dialog/review-report-dialog.component';

@Component({
    selector: 'app-feedback-questions-template-display',
    templateUrl: './feedback-questions-template-display.component.html',
    styleUrls: ['./feedback-questions-template-display.component.css'],
    standalone: false
})
export class FeedbackQuestionsTemplateDisplayComponent {
  @Input() feedback: VoluntaryFeedback | ReviewFeedback;
  tagColumns = ['Author', 'DateCreated', 'Feedback'];
  constructor(private dialog: MatDialog) {}

  getPercentage(rating) {
    const percentage = ((rating.score / rating.total) * 100).toFixed(2);
    return `${percentage}%`;
  }

  getData(){
    return this.feedback['reviewResponses'] ? this.feedback['reviewResponses'] : this.feedback;
  }

  exportFeedbackReport() {
    const review = this.feedback['review'] ? this.feedback['review'] : this.feedback;
    review.userPrincipleName = review.reviewee;
    review.templateName = review.template;
    this.dialog.open(ReviewReportDialogComponent, {
      width: '60em',
      data: {
        review: review,
      },
    });
  }
}
