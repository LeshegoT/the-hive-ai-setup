import { Component, Input, SimpleChanges, viewChild, OnChanges} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { ReviewReportDialogComponent } from '../../components/review-report-dialog/review-report-dialog.component';
import { ReviewListItem } from '../../review-shared-interfaces';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';

@Component({
    selector: 'app-review-completed',
    templateUrl: './review-completed.view.html',
    styleUrls: [],
    standalone: false
})
export class ReviewCompletedComponent implements OnChanges {
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

  downloadReportButtonText = 'Export Report';
  actionButtonIconName = 'save_alt';
  feedbackCompletedActionName = 'FeedbackCompleted';
  feedbackCompletedStatusId: number;
  reportDownloadedActionName = 'ReportDownloaded';
  reportDownloadedStatusId: number;
  reviewListComponent =  viewChild.required<ReviewListComponent>('reviewList');

  constructor(
    public feedbackService: FeedbackService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public reviewStatusService: ReviewStatusService
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
      
      this.feedbackCompletedStatusId = statuses.find(
        (status) => status.actionName == this.feedbackCompletedActionName
      ).statusId;

      this.feedbackService.getReviews(this.feedbackCompletedStatusId, filterParameters).subscribe((reviews) => {
        this.reviewData = reviews;
      });
    });
  }

  downloadReport(review, actionButton) {
    const dialog = this.dialog.open(ReviewReportDialogComponent, {
      width: '60em',
      data: {
        review: review,
      },
    });
    dialog.afterClosed().subscribe((cancelledReportDownload) => {
      if (!cancelledReportDownload) {
        actionButton.disabled = true;
         this.feedbackService.progressToNextStatus(review.reviewId, this.reportDownloadedStatusId).subscribe(
        {
           next: () => {
             actionButton.hidden = true;
             this.snackBar.open('Successfully downloaded the report', 'Dismiss', { duration: 3000 });
             this.reviewListComponent().removeReview(review);
           },
           error: (err) => {
             this.snackBar.open(err, 'Dismiss', { duration: 10000 });
             actionButton.disabled = false;
           }
        });
      }
    });
  }

}
