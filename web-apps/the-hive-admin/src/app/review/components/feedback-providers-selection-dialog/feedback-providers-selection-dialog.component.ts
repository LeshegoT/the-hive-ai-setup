import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Assignment } from '../../../shared/interfaces';
import { StaffFilterComponent } from '../../../components/staff-filter/staff-filter.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewListItem } from '../../review-shared-interfaces';
import { EnvironmentService } from '../../../services/environment.service';
import { Config } from '../../../shared/config';
import { nonBbdEmailValidator } from '../../../shared/email-validators';
import { FormControl, Validators } from '@angular/forms';
import { Observable, of, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffOverviewService } from '../../services/staff-overview.service';
import { catchError } from 'rxjs/operators';
import { isBBDEmail } from '@the-hive/lib-shared';
import { DatePipe } from '@angular/common';

export interface CurrentAssignments extends Assignment {
  nudged: boolean;
  edited: boolean;
}
@Component({
    selector: 'app-feedback-providers-selection-dialog',
    templateUrl: './feedback-providers-selection-dialog.component.html',
    styleUrls: ['./feedback-providers-selection-dialog.component.css', '../../../shared/shared.css'],
    standalone: false,
    providers: [DatePipe]
})
export class FeedbackProvidersSelectionDialogComponent implements OnInit {
  @ViewChild(StaffFilterComponent) staffFilterComponent;
  assignmentData = new MatTableDataSource();
  assignmentColumns = ['reviewer', 'deadline', 'status', 'remove','info'];
  review: ReviewListItem;
  pendingAssignmentStatusName = 'Pending Assignment';
  assignments: Array<Assignment>;
  config: Config;
  emailFormControls: FormControl<string>[] = [];
  managerDisplayName$: Observable<string>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<FeedbackProvidersSelectionDialogComponent>,
    public feedbackService: FeedbackService,
    private snackBar: MatSnackBar,
    private environmentService: EnvironmentService,
    private staffOverviewService: StaffOverviewService,
    private datePipe: DatePipe,
  ) {
    this.review = data.review;
    this.assignments = data.assignments;
  }

  ngOnInit() {
    this.config = this.environmentService.getConfiguratonValues();
    this.dialogRef.disableClose = true;
    for (const assignment of this.assignments) {
      this.assignmentData.data.push({
        reviewer: assignment.reviewer,
        createdAt: assignment.createdAt,
        dueBy: assignment.dueBy,
        status: assignment.status,
        edited: false,
        clientEmail: assignment.clientEmail || "",
        displayName: assignment.displayName
      });
    }
     this.emailFormControls = this.assignmentData.data.map(
    () => new FormControl<string>("", [Validators.email,
      nonBbdEmailValidator(this.environmentService.getConfiguratonValues().BBD_DOMAINS)
    ])
  );

    this.feedbackService.getFeedbackAssignmentTemplates().subscribe((assignmentTemplates) => {
      const assignmentTemplate = assignmentTemplates.filter(assignment => assignment.templateName == this.review.templateName)[0];
      if(assignmentTemplate && assignmentTemplate.requiresSelfReview && !this.review.exclusiveToReviewer) {
        this.addSelfReview();
      } else {
        //assume self review is not required to be added
      }
    });

    this.assignmentData._updateChangeSubscription();
    this.managerDisplayName$ = this.staffOverviewService.getStaffOnRecord(this.review.manager).pipe(
      map((person) => (person?.displayName ? person.displayName : this.review.manager)),
      catchError(() => of(this.review.manager))
    );

  }

  addSelfReview(){
    this.feedbackService.getDeletedFeedbackAssignments(this.review.reviewId).subscribe(
      (deletedAssignments) => {
        const selfReviewDeleted = deletedAssignments.some(deletedAssignment => deletedAssignment.reviewer == this.review.userPrincipleName);
        if(!this.assignments.some(assignment => assignment.reviewer === this.review.userPrincipleName) && !selfReviewDeleted){
          this.assignmentData.data = [
            ...this.assignmentData.data,
            {
              reviewer: this.review.userPrincipleName,
              dueBy: this.review.feedbackDate,
              currentlyBeingEdited: false,
              status: this.pendingAssignmentStatusName,
              edited: true,
              displayName: this.review.displayName,
            },
          ]
          this.emailFormControls.push(
            new FormControl<string>("", [
              Validators.email,
              nonBbdEmailValidator(this.environmentService.getConfiguratonValues().BBD_DOMAINS),
            ]),
          )
        } else {
          // self review already exists for this review
        }
      },
      (error) => {
        this.snackBar.open(`Could not retrieve feedback assignment data due to connection error: ${error}`, 'Dismiss', {
           duration: this.config.SNACKBAR_DURATION });
      }
    );
  }

  selectStaff() {
    const revieweeUserPrincipleName = this.staffFilterComponent.selectedUserPrinciple.userPrincipleName;
    const revieweeDisplayName = this.staffFilterComponent.selectedUserPrinciple.displayName;
    this.addFeedbackProviderToCreationList(revieweeUserPrincipleName,revieweeDisplayName);
  }

  addFeedbackProviderToCreationList(reviewer: string,reviewerDisplayName: string) {

    if (this.review.exclusiveToReviewer && (reviewer !== this.review.manager)) {
      this.snackBar.open('Only reviewer may be assigned', 'Dismiss', {
        duration: this.config.SNACKBAR_DURATION,
      });
    } else if (!this.assignmentData.data.some((assignment: Assignment) => assignment.reviewer == reviewer)) {
      this.assignmentData.data.push({
        reviewer: reviewer,
        dueBy: this.review.feedbackDate,
        status: this.pendingAssignmentStatusName,
        edited: true,
        displayName: reviewerDisplayName,
      });
            this.emailFormControls.push(
        new FormControl<string>("", [
          Validators.email,
          nonBbdEmailValidator(this.environmentService.getConfiguratonValues().BBD_DOMAINS),
        ]),
      )
      this.assignmentData._updateChangeSubscription();
    }else {
      this.snackBar.open('Reviewer already assigned', 'Dismiss', {
        duration: this.config.SNACKBAR_DURATION,
      });
    }
  }

  removeReviewerFromCreationList(selectedAssignment: CurrentAssignments) {
    const indexToRemove = this.assignmentData.data.indexOf(selectedAssignment);
    if (indexToRemove !== -1) {
      this.assignmentData.data.splice(indexToRemove, 1);
      this.emailFormControls.splice(indexToRemove, 1)
    }
    this.assignmentData._updateChangeSubscription();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  saveReviewCreation() {
    if (
      !this.assignmentData.data ||
      this.assignmentData.data.length == 0
    ) {
      this.snackBar.open('Please assign reviewers with valid due dates before the Review deadline', 'Dismiss', {
        duration: this.config.SNACKBAR_DURATION,
      });
    } else {
      const newAssignments = [];
      this.assignmentData.data.map((assignment: any, index: number) => {
        if (assignment.edited)
          newAssignments.push({
            reviewer: assignment.reviewer,
            dueBy: assignment.dueBy,
            clientEmail: this.emailFormControls[index].value,
            displayName: assignment.displayName,
          });
      });
      const newProviders = {
        about: this.review.userPrincipleName,
        assignedTo: newAssignments,
        dueBy: this.review.feedbackDate,
        feedbackAssignmentTemplateId: this.review.typeId,
        reviewId: this.review.reviewId,
      };
      this.dialogRef.close(newProviders);
    }
  }

  updateClientEmail(assignment: any, index: number) {
    assignment.clientEmail = this.emailFormControls[index].value
    assignment.edited = true;
    this.snackBar.open('Successfully added the e-mail address', 'Dismiss',{
      duration: this.config.SNACKBAR_DURATION,
    });
  }

  feedbackProviderAdded() {
    return this.assignmentData.data.length > 0 && this.assignmentData.data.some(
      (feedbackAssignment: {status: string}) => feedbackAssignment.status === "Pending Assignment");
  }

  addReviewerToCreationList() {
    firstValueFrom(this.managerDisplayName$).then(displayName => {
    this.addFeedbackProviderToCreationList(this.review.manager, displayName);
  });
  }

  isBBDEmail(email: string): boolean {
    return isBBDEmail(email, this.environmentService.getConfiguratonValues().BBD_DOMAINS);
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'MMM d, y');
  }



}
