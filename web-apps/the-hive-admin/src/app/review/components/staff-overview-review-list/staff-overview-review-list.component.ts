import { Component, computed, Input, OnInit, SimpleChanges, viewChildren, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatColumnDef, MatTableDataSource } from '@angular/material/table';
import { AuthService } from '../../../services/auth.service';
import { ReviewStatus } from '../../../shared/interfaces';
import { ReviewStatusService } from '../../services/review-status.service';
import { StaffOverviewReview } from '../../services/staff-overview.service';
import { HrCommentsDialogComponent } from '../hr-comments-dialog/hr-comments-dialog.component';
import { ReviewMeetingMinutesDialogComponent } from '../review-meeting-minutes-dialog/review-meeting-minutes-dialog.component';
import { ReviewReportDialogComponent } from '../review-report-dialog/review-report-dialog.component';

@Component({
    selector: 'app-staff-overview-review-list',
    templateUrl: './staff-overview-review-list.component.html',
    styleUrls: ['./staff-overview-review-list.component.css', '../../styles/reviewShared.css'],
    standalone: false
})
export class StaffOverviewReviewListComponent implements OnInit, OnChanges {
  reviewTable = new MatTableDataSource<StaffOverviewReview>();
  reviewMatColumnDefinitions = viewChildren(MatColumnDef);
  reviewColumns = computed(() => this.reviewMatColumnDefinitions().map((column) => column.name));
  @Input() reviewData: Array<StaffOverviewReview> = [];

  reviewStatuses: ReviewStatus[];
  activeUPN: string;

  constructor(
    public dialog: MatDialog,
    private reviewStatusService: ReviewStatusService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.fetchReviewStatuses();
    this.setActiveUPN();
  }

  ngOnChanges(_changes: SimpleChanges) {
      this.reviewTable.data = this.reviewData;
  }


  hrNotes(review: StaffOverviewReview) {
    if(this.activeUPN.toLowerCase() !== review.userPrincipleName.toLowerCase()) {
      this.dialog.open(HrCommentsDialogComponent, {
        width: '60em',
        data: {
          staffId: review.staffId,
          userPrincipleName: review.userPrincipleName,
          userDisplayName: review.displayName
        },
      });
    } else {
      this.snackBar.open('You cannot view notes for your own review', 'Dismiss', { duration: 3000 });
    }
  }

  setActiveUPN() {
    this.authService.getUserPrincipleName().subscribe((activeUPN) => {
      this.activeUPN = activeUPN;
    });
  }

  downloadReviewReport(review: StaffOverviewReview) {
    if(this.activeUPN.toLowerCase() !== review.userPrincipleName.toLowerCase()) {
      this.dialog.open(ReviewReportDialogComponent, {
        width: 'var(--mat-dialog-container-width)',
        data: {
          review
        }
      });
    } else {
      this.snackBar.open('You cannot download the report for your own review', 'Dismiss', { duration: 3000 });
    }
  }

  showReviewMeetingMinutes(review: StaffOverviewReview) {
    if(this.activeUPN.toLowerCase() !== review.userPrincipleName.toLowerCase()) {
      this.dialog.open(ReviewMeetingMinutesDialogComponent, {
        width: 'var(--mat-dialog-container-width)',
        data: {
          review,
          reviewStatuses: this.reviewStatuses
        }
      });
    } else {
      this.snackBar.open('You cannot view the minutes for your own review', 'Dismiss', { duration: 3000 });
    }
  }

  setStatusStyle(reviewStatus: string) {
    switch (reviewStatus) {
      case "Feedback Completed":
        return "completed-feedback-status";
      case "Cancelled":
        return "cancelled-feedback-status";
      default:
        return "pending-feedback-status";
    }
  }

  setStatusIcon(reviewStatus: string) {
    switch (reviewStatus) {
      case "Feedback Completed":
        return "check_circle_outline";
      case "Cancelled":
        return 'cancel';
      case "Archived":
        return "archive";
      default:
        return "restore";
    }
  }

  fetchReviewStatuses() {
    this.reviewStatusService.getReviewStatuses().subscribe((statuses) => {
      this.reviewStatuses = statuses;
    });
  }
}
