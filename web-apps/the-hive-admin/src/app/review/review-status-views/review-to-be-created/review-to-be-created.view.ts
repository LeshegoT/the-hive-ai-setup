import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { FeedbackService } from '../../../review/services/feedback.service';
import { HrRepSelectionDialogComponent } from '../../components/hr-rep-selection-dialog/hr-rep-selection-dialog.component';
import { TextInputDialogComponent } from '../../../text-input-dialog/text-input-dialog.component';
import { UpcomingReviewsFilterParameters } from '../../upcoming-reviews-filter-parameters';

interface UpcomingReview {
  department: string;
  dueDate: Date;
  employmentDate: Date;
  feedbackDate: Date;
  nextFeedbackTypeId: number;
  nextTypeId: number;
  holdReason?: string;
  staffId: number;
  staffLastReviewDate: Date;
  staffReviewId: number;
  templateName: string;
  userPrincipleName: string;
  entityAbbreviation: string;
  placedOnHoldDate?: Date;
}

@Component({
    selector: 'app-review-to-be-created',
    templateUrl: './review-to-be-created.view.html',
    styleUrls: ['../../styles/reviewShared.css'],
    standalone: false
})
export class ReviewToBeCreatedComponent implements OnChanges {
  @Input() filterParameters: UpcomingReviewsFilterParameters;
  @Output() reloadData = new EventEmitter<void>();
  reviewData: MatTableDataSource<UpcomingReview>;
  reviewColumns = [
    'displayName', 
    'userPrincipleName', 
    'jobTitle', 
    'unit', 
    'reviewMonth', 
    'reviewDate', 
    'type', 
    'controls'
  ];
  createReviewsButtonHint = 'Create all reviews with randomized HR Representative';
  createReviewsButtonText = 'Create All';
  createSingleReviewButtonText = 'Create review';
  showHoldButton = true;
  actionButtonIconName = 'add';
  canDateBeEdited = true;

  constructor(public feedbackService: FeedbackService, public dialog: MatDialog, private snackBar: MatSnackBar) {}
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterParameters'] && this.filterParameters.selectedCompanyFilter) {
      this.setReviewData(this.filterParameters);
    } else {
      // The filterParameters did not change, so no need to update the data
    }
  }

  setReviewData(filterParameters) {
    this.reviewData = undefined;
    this.feedbackService.getReviewsToBeCreated(filterParameters).subscribe((reviews) => {
      this.reviewData = reviews;
    });
  }

  
  createSingleReview( review, assignButton) {
    assignButton.disabled = true;
    const id = review.staffReviewId;
    const body = {
      about: review.userPrincipleName,
      assignedTo: [],
      dueBy: review.dueDate,
      feedbackAssignmentTemplateId: review.nextFeedbackTypeId,
    };
    this.feedbackService.createSingleUpcomingReview(id, body).subscribe(
      (hrRep) => {
        this.reloadData.emit();
        this.snackBar.open(
          `Successfully created the review for ${review.userPrincipleName} and assigned ${hrRep} as the HR representative.`,
          'Dismiss',
          { duration: 3000 }
        );
      },
      (err) => {
        this.snackBar.open(err, 'Dismiss', { duration: 10000 });
        assignButton.disabled = false;
      }
    );
  }

  openHRRepDialog(assignButton) {
    assignButton.disabled = true;
    this.feedbackService.getHRRepresentatives().subscribe((reps) => {
      const dialog = this.dialog.open(HrRepSelectionDialogComponent, {
        width: '60em',
        data: {
          indiaReps: { reps: reps.hrIndia, heading: 'India representatives' },
          otherReps: { reps: reps.hrOther, heading: 'All other representatives' },
          actionButtonText: 'Create Reviews',
        },
      });
      dialog.afterClosed().subscribe((repGroups) => {
        if (repGroups) {
          this.assignReviews(repGroups[0], repGroups[1], assignButton);
        } else {
          assignButton.disabled = false;
        }
      });
    });
  }

  assignReviews(indiaReps: Array<string>, otherReps: Array<string>, assignButton) {
    const body = { reviews: this.reviewData, hrOther: otherReps, hrIndia: indiaReps };
    this.feedbackService.createUpcomingReviews(body).subscribe(
      () => {
        this.reloadData.emit();
        this.snackBar.open('Successfully created these reviews.', 'Dismiss', { duration: 3000 });
        assignButton.disabled = false;
      },
      (err) => {
        this.snackBar.open(err, 'Dismiss', { duration: 3000 });
        assignButton.disabled = false;
      }
    );
  }

  holdReview(review: UpcomingReview, holdButton){
    const setHoldReason = async (holdReason?: string)=> {      
      this.feedbackService.changeReviewHoldStatus(holdReason, review.staffReviewId).subscribe(
        () => {
          this.reloadData.emit();
          holdButton.disabled = true;
        },
        (err) => {
          this.snackBar.open(err, 'Dismiss', { duration: 3000 });
        }
      );
    }

    if(review.holdReason) {
      setHoldReason(null);
    } else {
      const dialogRef = this.dialog.open(TextInputDialogComponent, {
        width: '60em',
        data: {
          currentText: review.holdReason ? review.holdReason:"",
          editable: true,
          title: "Please give a reason for putting this review on hold",
          placeholder: "Please type in the reason",
          inputLabel: "Hold Reason",
          warning: "Ensure you supply a sufficiently clear reason.",
        }
      });

      dialogRef.afterClosed().subscribe((result?: string) => {
        if(result) {
          setHoldReason(result);
        } else {
          // Dialog was cancelled, do nothing.
        }
      })
    }

  }
}
