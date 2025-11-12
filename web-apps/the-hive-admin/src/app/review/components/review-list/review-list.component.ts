import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { calculateFeedbackDeadline } from '@the-hive/lib-reviews-shared';
import { Moment } from 'moment';
import { Observable } from 'rxjs';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { AuthService } from '../../../services/auth.service';
import { EnvironmentService } from '../../../services/environment.service';
import { ReviewStatus } from '../../../shared/interfaces';
import { TextInputDialogComponent } from '../../../text-input-dialog/text-input-dialog.component';
import { ReviewListItem } from '../../review-shared-interfaces';
import { ReviewListStateNotifierService } from '../../services/review-list-state-notifier.service';
import { HrCommentsDialogComponent } from '../hr-comments-dialog/hr-comments-dialog.component';
import { ReasonsDialogComponent } from '../reasons-dialog/reasons-dialog.component';
import { ReviewAndContractHoldDetailsDialogComponent } from '../review-and-contract-hold-details-dialog/review-and-contract-hold-details-dialog.component';
import { ReviewAndContractRecommendationDeleteDialogComponent } from '../review-and-contract-recommendation-delete-dialog/review-and-contract-recommendation-delete-dialog.component';
import { ReviewAuditTableDialogComponent, ReviewAuditTableDialogData } from '../review-audit-table-dialog/review-audit-table-dialog.component';
import { ReviewMeetingMinutesDialogComponent } from '../review-meeting-minutes-dialog/review-meeting-minutes-dialog.component';
import { ReviewReportDialogComponent } from '../review-report-dialog/review-report-dialog.component';
import { ReviewStealDialogComponent } from '../review-steal-dialog/review-steal-dialog.component';

@Component({
    selector: 'app-review-list',
    templateUrl: './review-list.component.html',
    styleUrls: ['../../../../styles.css', './review-list.component.css', '../../styles/reviewShared.css'],
    standalone: false,
    providers: [provideMaterialDatePickerConfiguration()],
})
export class ReviewListComponent implements OnInit, OnChanges {
  reviewTable = new MatTableDataSource<ReviewListItem>();
  @Input() actionButtonText: string | ((review: ReviewListItem) => string);
  @Input() actionButtonIconName: string;
  @Input() displayNudgeButton = false;
  @Input() cancelButtonText: string;
  @Input() showHrNotesButton: boolean;
  @Input() showHoldButton: boolean;
  @Input() isOnUpcomingReviews = false;
  @Input() showDownloadReportButton: boolean;
  @Input() buttonsEnabled = true;
  @Input() showReviewMeetingMinutesButton = false;
  @Input() showMarkAsPendingDeleteButton = false;
  @Output() actionButton: EventEmitter<{ review: ReviewListItem; actionButton: HTMLElement; cancelButton: HTMLElement }> = new EventEmitter();
  @Output() holdButton: EventEmitter<{ review: ReviewListItem; holdButton: HTMLElement }> = new EventEmitter();
  @Output() selectedRow: EventEmitter<{ review: ReviewListItem }> = new EventEmitter();
  @Input() reviewColumns;
  @Input() isRowSelectable = false;
  reviewTypes: { id: number; name: string }[] = [];
  @Input() reviewData: Array<ReviewListItem> = [];
  @ViewChild('reviewTableSort') reviewTableSort = new MatSort();
  @Input() showArchiveButton = false;
  @Input() showBackToInProgressButton = false;
  @Input() showBackToExecFeedbackRequestedButton = false;
  @Input() showBackToExecFeedbackReceivedButton = false;
  @Input() showMoveToFeedbackCompletedButton = false;
  @Output() reloadReviewData? = new EventEmitter();
  hrNotesButtonsDisabled = false;
  actionButtonsDisabled = false;
  deleteButtonsDisabled = false;
  snackBarDuration: number;

  minNextReviewDate = new Date();
  confirmNextReviewDateFormControls: Map<number, FormControl<Moment>> = new Map();

  DEFAULT_ANNUAL_REVIEW_ID = 1;
  activeDateUpdate: string;
  activeDateComment: string;
  rowCurrentlyBeingEdited?: ReviewListItem;
  typeCurrentlyBeingEdited?: ReviewListItem;
  activeUPN: string;
  reviewStatuses: ReviewStatus[];
  reasons: string[] = ["Employee on Leave", "Employee on Sick Leave", "Existing HR Process in Effect"];
  terminationEnabled = false;
  get feedbackInProgressReviewStatusId() {
    return this.reviewStatuses.find((reviewStatus) => reviewStatus.description === 'Feedback In Progress').statusId;
  }

  get execFeedbackRequestedReviewStatusId() {
    return this.reviewStatuses.find((reviewStatus) => reviewStatus.description === 'Summary sent to STRATCO').statusId;
  }

  get execFeedbackReceivedReviewStatusId() {
    return this.reviewStatuses.find((reviewStatus) => reviewStatus.description === 'STRATCO Feedback Received').statusId;
  }

  get feedbackCompletedReviewStatusId() {
    return this.reviewStatuses.find((reviewStatus) => reviewStatus.description === 'Feedback Completed')?.statusId;
  }

  constructor(
    public feedbackService: FeedbackService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private authService: AuthService,
    public reviewStatusService: ReviewStatusService,
    private env: EnvironmentService,
    public reviewListStateNotifier: ReviewListStateNotifierService
  ) {}

  ngOnInit() {
    this.retrieveReviewType();
    this.setActiveUPN();
    this.loadReviewStatusData();
    this.fetchEnvironmentConfigurations();
  }

  fetchEnvironmentConfigurations(): void {
    this.env.getConfig().subscribe((envConfig) => {
      this.snackBarDuration = envConfig.SNACKBAR_DURATION;
    });
  }

  async ngOnChanges() {
    const config = this.env.getConfiguratonValues();
    if (this.reviewData !== undefined) {
      for (const review of this.reviewData) {
        const reviewDueDate = new Date(review.dueDate);

        if (review.nextReviewDate === undefined) {
          const currentYear = reviewDueDate.getFullYear();

          const nextDueDate = this.removeTimeStamp(reviewDueDate);
          nextDueDate.setFullYear(currentYear + 1);
          review.nextReviewDate = nextDueDate;
        }

        if (review.nextFeedbackTypeId === undefined) {
          review.nextFeedbackTypeId = this.DEFAULT_ANNUAL_REVIEW_ID;
        }

        review.feedbackDate = calculateFeedbackDeadline(new Date(review.dueDate), review.templateName, config.FEEDBACK_DAY_IN_MONTH_DUE);
      }
      this.reviewTable.data = this.reviewData;
      this.configureSorting();
    } else {
      this.reviewTable.data = [];
      // nothing to display
    }
  }

  getReviewName(id: number) {
    return this.reviewTypes.find((type) => type.id == id).name;
  }

  getReviewTemplateId(name  : string) {
    return this.reviewTypes.find((type) => type.name == name).id;
  }

  removeTimeStamp(date: Date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  actionButtonTask(row: ReviewListItem, $event) {
    const actionButton = $event.currentTarget;
    const cancelButton = document.getElementById(`cancelButton${row.reviewId}`);
    this.actionButton.emit({ review: row, actionButton, cancelButton });
  }


  cancelReview(review: ReviewListItem) {
    this.hrNotesButtonsDisabled = true;
    this.actionButtonsDisabled = true;
    this.deleteButtonsDisabled = true;
    const reviewId = review.reviewId;

    this.feedbackService.getReviewFeedbackAssignments(review.reviewId).subscribe(
      (feedbackAssignments) => {
        const dialogReference = this.dialog.open(ReviewAndContractRecommendationDeleteDialogComponent, {
          width: '60em',
          data: {
            review: {
              ...review,
              nextReviewDate: review.dueDate
            },
            id: reviewId,
            reviewee: review.userPrincipleName,
            deadline: review.dueDate,
            title: "Please give a reason for removing this review",
            warningMessage: "Ensure you supply a sufficiently clear reason.",
            showReviewDetails: false,
            status: this.reviewStatuses.find((status) =>
              status.statusId === review.reviewStatusId).description,
            feedbackAssignments: {
              total: feedbackAssignments.length,
              completed: feedbackAssignments.filter(
                (assignment) => assignment.status.toLowerCase() === 'completed'
              ).length,
            },
          },
        });

        dialogReference.afterClosed().subscribe((result) => {
          if (result === 'deleted') {
            this.reviewData = [...this.reviewData.filter((currentReview) => currentReview !== review)];
            this.reviewTable.data = this.reviewData;
            this.reviewListStateNotifier.notifyReviewListStateChange();
          } else {
            //Nothing to update since Review has not been deleted.
          }
          this.hrNotesButtonsDisabled = false;
          this.actionButtonsDisabled = false;
          this.deleteButtonsDisabled = false;
        });
      });
  }

  rowSelectTask(row: ReviewListItem) {
    if (this.isRowSelectable) {
      const selectableRows = document.getElementsByClassName('selectable-row');
      Array.from(selectableRows).forEach((element) => {
        element.classList.remove('selected');
      });
      const selectedRow = document.getElementById(row.reviewId.toString());
      selectedRow.classList.add('selected');
      this.selectedRow.emit({ review: row });
    }
  }

  retrieveReviewType() {
    this.feedbackService.getFeedbackAssignmentTemplates().subscribe((assignmentTemplates) => {
      this.reviewTypes = assignmentTemplates.filter(assignmentTemplate => assignmentTemplate.manualFeedbackAssignment).map((assignmentTemplate) => ({
        id: assignmentTemplate.feedbackAssignmentTemplateId,
        name: assignmentTemplate.templateName,
      }));
    });
  }

  configureSorting() {
    this.reviewTable.sort = this.reviewTableSort;

    this.reviewTable.sortingDataAccessor = (row, column) => {
      switch (column) {
        case 'unit':
          return row.department;
        case 'reviewMonth':
          return new Date(row.dueDate).getTime();
        case 'previousReviewDate':
          return new Date(row.dueDate).getTime();
        case 'previousReviewType':
          return row.templateName;
        case 'nextReviewDate':
          return new Date(row.nextReviewDate).getTime();
        case 'nextReviewType':
          return row.nextFeedbackTypeId;
        case 'reviewDate':
          return new Date(row.nextReviewDate).getTime();
        case 'type':
          return row.templateName;
        default:
          return row[column];
      }
    };

    const reviewTableContainsHoldReason = this.reviewTable.filteredData.find(review => review.holdReason);

    if(reviewTableContainsHoldReason) {
      const sortState: Sort = {active: 'holdReason', direction: 'desc'};
      this.reviewTable.sort.active = sortState.active;
      this.reviewTable.sort.direction = sortState.direction;
      this.reviewTable.sort.sortChange.emit(sortState);
    } else {
      const sortState: Sort = {active: 'reviewDate', direction: 'asc'};
      this.reviewTable.sort.active = sortState.active;
      this.reviewTable.sort.direction = sortState.direction;
      this.reviewTable.sort.sortChange.emit(sortState);
    }
  }

  hrNotes(review: ReviewListItem) {
    if(this.activeUPN.toLowerCase() !== review.userPrincipleName.toLowerCase()) {
      this.dialog.open(HrCommentsDialogComponent, {
        width: '60em',
        data: {
          staffId: review.staffId,
          staffReviewId: review.staffReviewId,
          reviewId: review.reviewId,
          userPrincipleName: review.userPrincipleName,
          userDisplayName: review.displayName
        },
      });
    } else {
      this.snackBar.open('You cannot view notes for your own review', 'Dismiss', { duration: 3000 });
    }
  }

  showReviewMeetingMinutesDialog(review: ReviewListItem, options: { showSaveAndFinaliseButton?: boolean } = {}) {
    if(this.activeUPN.toLowerCase() !== review.userPrincipleName.toLowerCase()) {
      this.dialog.open(ReviewMeetingMinutesDialogComponent, {
        width: '80em',
        disableClose: true,
        data: {
          review,
          options,
          reviewStatuses: this.reviewStatuses
        },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.finaliseReviewMeetingMinutes === true) {
          this.removeReview(review);
        } else {
          // Review was not moved to the next status
        }
      });
    } else {
      this.snackBar.open('You cannot view the minutes for your own review', 'Dismiss', { duration: 3000 });
    }
  }

  nudgeManager(row: ReviewListItem, $event) {
    const bulkNudgeButton = $event.currentTarget as HTMLButtonElement;
    bulkNudgeButton.disabled = true;
    this.feedbackService.nudgeManager(row.reviewId).subscribe(
      () => {
        this.snackBar.open("Your email is being prepared and will be sent shortly.", 'Dismiss', { duration: this.snackBarDuration });
        bulkNudgeButton.disabled = true;
      },
      (error) => {
        this.snackBar.open(error, 'Dismiss', { duration: this.snackBarDuration });
        bulkNudgeButton.disabled = false;
      }
    );
  }

  showHoldReason(review: ReviewListItem) {
    this.dialog.open(ReviewAndContractHoldDetailsDialogComponent, {
      width:'var(--mat-dialog-container-width)',
      data: {
        holdReasonText: review.holdReason,
        onHoldByText: review.onHoldBy,
        placedOnHoldDate: review.placedOnHoldDate,
        editable: false,
      },

    });
  }

  holdButtonTask(row, $event) {
    const holdButton = $event.currentTarget;
    this.holdButton.emit({ review: row, holdButton });
  }

  archiveButtonTask(row, $event, reasons: string[] = ["Employee on Leave", "Employee on Sick Leave", "Existing HR Process in Effect"]) {
    this.dialog.open(ReasonsDialogComponent, {
      width: '60em',
      data: {
        title: "Please give a reason for archiving this review",
        warningMessage: "Ensure you supply a sufficiently clear reason.",
        possibleReasons: reasons,
        showReviewDetails: false,

        afterSuccess: (comment: string) => {
          const data = {
            id: row.reviewId,
            comment: comment,
          };
          this.feedbackService.addReviewComment(row.reviewId, data).subscribe();
          row.nextReviewDate = row.dueDate;
          row.nextFeedbackTypeId = row.typeId;
          this.archiveReview(row);
        },
      },
    });
  }

  getFormErrors(formControl: AbstractControl): string {
    let error;
    if (formControl.hasError('matDatepickerParse')) {
      error = 'Please use the correct date format';
    } else if (formControl.hasError('required')) {
      error = 'Required';
    } else if (formControl.hasError('matDatepickerMin')) {
      error = 'Review date must be in the future';
    } else if (formControl.errors) {
      error = Object.values(formControl.errors).join(' ');
    } else {
      error = '';
    }
    return error;
  }

  updateNextDate(nextDate: Moment, review: ReviewListItem) {
    if(nextDate.toDate().getTime() < this.minNextReviewDate.getTime()) {
      this.actionButtonsDisabled = true;
    } else {
      review.nextReviewDate = this.removeTimeStamp(nextDate.toDate());
      this.actionButtonsDisabled = false;
    }
  }

  editFeedback(selectedAssignment: ReviewListItem) {
    const dialogRef = this.dialog.open(TextInputDialogComponent, {
      width: '60em',
      data: {
        currentText: "",
        editable: true,
        title: "Please give a reason for changing this date",
        placeholder: "Please type in the reason",
        inputLabel: "Date Change Reason",
        warning: "Ensure you supply a sufficiently clear reason.",
      }
    });

    dialogRef.afterClosed().subscribe((result?: string) => {
      if(result){
        this.rowCurrentlyBeingEdited = selectedAssignment;
          this.activeDateComment = result;
      }
    });
  }

  showReviewTypeOptions(selectedAssignment: ReviewListItem) {
    this.typeCurrentlyBeingEdited = selectedAssignment;
  }

  cancelAssignmentUpdate() {
    this.rowCurrentlyBeingEdited = undefined;
    this.activeDateUpdate = undefined;
    this.activeDateComment = undefined;
  }

  cancelUpdateReviewType() {
    this.typeCurrentlyBeingEdited = undefined;
  }

  currentDateInput(currentDate: string) {
    this.activeDateUpdate = currentDate;
  }

  updateAssignmentDate(selectedReview: ReviewListItem) {
    const newReviewDeadline = this.activeDateUpdate === undefined ? new Date(selectedReview.dueDate) : new Date(Date.parse(this.activeDateUpdate));

    const reviewPatch = {
      id: selectedReview.staffReviewId,
      dueDate: newReviewDeadline,
      comment: this.activeDateComment,
    };
    this.feedbackService.updateStaffReviewDeadline(reviewPatch).subscribe(() => {
      selectedReview.dueDate = newReviewDeadline;
      const reviewDueDate = new Date(selectedReview.dueDate);
      selectedReview.feedbackDate = calculateFeedbackDeadline(reviewDueDate, selectedReview.templateName, this.env.getConfiguratonValues().FEEDBACK_DAY_IN_MONTH_DUE);
      this.snackBar.open('Updated Review Deadline', 'Dismiss', { duration: 3000 });
      this.cancelAssignmentUpdate();
    },
    () => {
      this.snackBar.open(`Unable to update date`, '', { duration: 2000 });
    });
  }

  updateReviewType(selectedAssignment: ReviewListItem, event: MatSelectChange) {
    const staffReviewId = Number(selectedAssignment.staffReviewId);
    const templateName = event.value;

    const nextFeedbackTypeId = this.getReviewTemplateId(templateName);
    const requestBody = { staffReviewId, nextFeedbackTypeId };

    this.feedbackService.updateUpcomingReviewType(requestBody).subscribe(
      () => {
        selectedAssignment.nextFeedbackTypeId = nextFeedbackTypeId;
        this.typeCurrentlyBeingEdited = undefined;
        this.snackBar.open('Updated Review Feedback Type', 'Dismiss', { duration: 3000 });
      },
      (error) => {
        this.snackBar.open(`Failed to update review type ${error}`, 'Dismiss', { duration: 3000 });
      }
    );
  }

  stealFeedbackAssignment(selectedAssignment: ReviewListItem) {
    this.feedbackService.getCreatedBy(selectedAssignment["reviewId"]).subscribe(
      (result) => {
        const feedbackStatus = this.reviewStatuses.find((status) =>
          status.statusId === selectedAssignment.reviewStatusId);

        this.dialog.open(ReviewStealDialogComponent, {
          width: '60em',
          data: {
            reviewId: selectedAssignment.reviewId,
            reviewee: selectedAssignment.displayName,
            activeUPN: this.activeUPN,
            deadline: selectedAssignment.dueDate,
            status: feedbackStatus.description,
            hrRep: result[0].createdBy,
            stealType: 'Review',
            afterSuccess: () => {
              this.removeReview(selectedAssignment);
            }
          },
        });
      },
      (error) => {
        this.snackBar.open(`Could not retrieve createdBy: ${error}`, 'Dismiss', { duration: 3000 });
      }
    );
  }

  takeReviewBackToInProgressTask(review: ReviewListItem) {
    this.feedbackService.progressToNextStatus(review.reviewId, this.feedbackInProgressReviewStatusId).subscribe({
      next: () => {
        this.snackBar.open('Successfully moved review to in progress.', 'Dismiss', { duration: 3000 });
        this.removeReview(review);
      },

      error: (err) => {
        this.snackBar.open(err, 'Dismiss', { duration: 4000 })
      }
    });
  }
    takeReviewBackToExecFeedbackRequestedTask(review: ReviewListItem) {
    this.feedbackService.progressToNextStatus(review.reviewId, this.execFeedbackRequestedReviewStatusId).subscribe({
      next: () => {
        this.snackBar.open('Successfully moved review Back to "Summary sent to STRATCO".', 'Dismiss', { duration: this.snackBarDuration });
        this.removeReview(review);
      },

      error: (error) => {
        this.snackBar.open(error, 'Dismiss', { duration: this.snackBarDuration })
      }
    });
  }

  takeReviewBakToExecFeedbackReceivedTask(review: ReviewListItem) {
    this.feedbackService.progressToNextStatus(review.reviewId, this.execFeedbackReceivedReviewStatusId).subscribe({
      next: () => {
        this.snackBar.open('Successfully moved review Back to "STRATCO Feedback Received .', 'Dismiss', { duration: this.snackBarDuration });
        this.removeReview(review);
      },

      error: (error) => {
        this.snackBar.open(error, 'Dismiss', { duration: this.snackBarDuration })
      }
    });
  }

  canReviewBeStolen(selectedAssignment: ReviewListItem) {
    return (this.buttonsEnabled || !selectedAssignment.reviewId || selectedAssignment.userPrincipleName.toLowerCase() === this.activeUPN.toLowerCase() || !this.checkValidReviewStatus(selectedAssignment)) ? false : true;
  }

  setActiveUPN() {
    this.authService.getUserPrincipleName().subscribe((activeUPN) => {
      this.activeUPN = activeUPN;
    });
  }

  loadReviewStatusData() {
    this.reviewStatusService.getReviewStatuses().subscribe((statuses) => {
      this.reviewStatuses = statuses;
    });
  }

  checkValidReviewStatus(selectedAssignment: ReviewListItem) {
    const forbiddenToTake = ['Confirm Next Review Date', 'Cancelled', 'Archived'];
    if (this.reviewStatuses && selectedAssignment.reviewStatusId) {
      const status = this.reviewStatuses.find((status) => status.statusId === selectedAssignment.reviewStatusId);
      return !forbiddenToTake.includes(status.description);
    } else {
      return false;
    }
  }

  archiveReview(review: ReviewListItem): void {
    this.feedbackService.setNextReviewDetails(review).subscribe({
      next: () => {
        this.reviewData = [...this.reviewData.filter((currentReview) => currentReview !== review)] ;
        this.reviewTable.data = this.reviewData;
        this.snackBar.open('Review has been archived', 'Dismiss', { duration: 10000 });
        this.removeReview(review);
      },
      error: () => {
        this.snackBar.open('Error archiving review: ', 'Dismiss', { duration: 10000 }) ;
      }
    });
  }

  moveReviewToFeedbackCompletedStatus(review: ReviewListItem) {
    this.feedbackService.progressToNextStatus(review.reviewId, this.feedbackCompletedReviewStatusId).subscribe({
      next: () => {
        this.snackBar.open('Successfully moved the review to feedback completed.', 'Dismiss', { duration: 3000 });
        this.removeReview(review);
      },
      error: (err) => {
        this.snackBar.open(err, 'Dismiss', { duration: 3000 });
      }
    });
  }

  removeReview(reviewListItem: ReviewListItem) {
    if(this.reviewData?.length> 0) {
      const reviews: ReviewListItem[] = this.reviewData;
      this.reviewData = reviews.filter((review: ReviewListItem)=> reviewListItem.reviewId != review.reviewId)
      this.reviewTable.data = this.reviewData;
      this.reviewListStateNotifier.notifyReviewListStateChange();
    } else {
      //do nothing
    }

  }

  removeUpcomingReview(review: ReviewListItem) {
    this.reviewData = [...this.reviewData.filter((currentReview) => currentReview !== review)];
    this.reviewTable.data = this.reviewData;
    this.reviewListStateNotifier.notifyReviewListStateChange();
  }

  onStaffMemberMarkedForTermination(review: ReviewListItem): void {
    this.removeUpcomingReview(review);
  }

  downloadReport(review: ReviewListItem) {
    if(this.activeUPN.toLowerCase() !== review.userPrincipleName.toLowerCase()) {
      this.dialog.open(ReviewReportDialogComponent, {
        width: '60em',
        data: {
          review: review,
        },
      });
    } else {
      this.snackBar.open('You cannot download the report for your own review', 'Dismiss', { duration: 3000 });
    }
  }

  makeActionButtonText(review: ReviewListItem) {
    if(typeof this.actionButtonText === 'function') {
      return this.actionButtonText(review);
    } else {
      return this.actionButtonText;
    }
  }

  showReviewAuditDialog(review: ReviewListItem) {
    this.dialog.open<ReviewAuditTableDialogComponent, ReviewAuditTableDialogData>(ReviewAuditTableDialogComponent, {
      width: '95vw',
      maxHeight: '90vh',
      maxWidth: 'none',
      disableClose: false,
      data: {
        reviewId: review.reviewId,
        revieweeDisplayName: review.displayName
      }
    });
  }

  canViewReviewAudit(reviewId: number): Observable<boolean> {
    return this.feedbackService.canViewReviewAudit(reviewId);
  }

  initialiseNextReviewDateFormControl(reviewId: number, nextReviewDate: Moment): FormControl<Moment> {
    if(!this.confirmNextReviewDateFormControls.has(reviewId)) {
      this.confirmNextReviewDateFormControls.set(reviewId, new FormControl<Moment>(nextReviewDate, Validators.required));
    } else {
      // The form already exists, we can proceed to return it
    }
    return this.confirmNextReviewDateFormControls.get(reviewId);
  }
}
