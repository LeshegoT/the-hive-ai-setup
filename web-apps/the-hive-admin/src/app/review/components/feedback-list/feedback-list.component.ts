import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService, Review } from '../../../review/services/feedback.service';
import { Assignment, AssignmentStatusProgression} from '../../../shared/interfaces';
import { ActionType, FeedbackRetractDialogComponent } from '../feedback-retract-dialog/feedback-retract-dialog.component';
import { FormControl, Validators} from '@angular/forms';
import { ReviewStatusService } from '../../../review/services/review-status.service';
import { EnvironmentService } from '../../../services/environment.service'
import { nonBbdEmailValidator } from '../../../shared/email-validators';
import { isBBDEmail } from '@the-hive/lib-shared';

import { AuthService } from '../../../services/auth.service';
import { switchMap } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { ReviewListItem } from '../../review-shared-interfaces';
import { Config } from '../../../shared/config';

@Component({
    selector: 'app-feedback-list',
    templateUrl: './feedback-list.component.html',
    styleUrls: ['feedback-list.component.css', '../../styles/reviewShared.css', '../../../shared/shared.css'],
    standalone: false
})
export class FeedbackListComponent implements OnInit, OnChanges {
  @Input() review?: ReviewListItem;
  @Input() assignmentData = new Array<Assignment>();
  @Input() assignmentColumns;
  @Input() currentReviewUPN: string;
  reviewTypes: { id: number; name: string }[] = [];
  feedbackCompletedActionName = 'FeedbackCompleted';
  feedbackCompletedStatusId: number;
  emailFormControls: FormControl<string>[] = [];
  activeUPN: string;
  assignmentAllowedStatusProgressions: AssignmentStatusProgression[] = [];
  snackBarDuration:number;
  config: Config;

  constructor(public feedbackService: FeedbackService, private snackBar: MatSnackBar, public dialog: MatDialog, public reviewStatusService: ReviewStatusService,  private authService: AuthService,public environmentService: EnvironmentService,) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.setActiveUPN();
    if(changes['assignmentData']) {
    this.emailFormControls = this.assignmentData.map(() =>
      new FormControl<string>('', [
        Validators.email,
        nonBbdEmailValidator(this.environmentService.getConfiguratonValues().BBD_DOMAINS)
      ])
    );
    this.updateFormControlStatus();
  }
  }

  isBBDEmail(email: string): boolean {
  return isBBDEmail(email, this.environmentService.getConfiguratonValues().BBD_DOMAINS);
}

  ngOnInit() {
    this.retrieveReviewType();
    this.setActiveUPN();
    this.setFeedbackCompletedStatusId();
    this.retrieveAssignmentAllowedStatusProgressions();
    this.config = this.environmentService.getConfiguratonValues();
  }

  retrieveAssignmentAllowedStatusProgressions() {
    this.feedbackService.getAssignmentAllowedStatusProgressions().subscribe(
      (allowedStatusProgressions) => {
        this.assignmentAllowedStatusProgressions = allowedStatusProgressions;
      },
      (err) => {
        this.snackBar.open(err, '', { duration: 1000 });
      }
    )
  }

  setFeedbackCompletedStatusId() {
    this.reviewStatusService.getReviewStatuses().subscribe((statuses) => {
      this.feedbackCompletedStatusId = statuses.find(
        (status) => status.actionName == this.feedbackCompletedActionName
      ).statusId;
    })
  }

  canAssignmentBeDeleted(selectedAssignment: Review){
    const canDeleteAssignment = this.assignmentAllowedStatusProgressions.find((statusProgession) => {
      return statusProgession.fromStatus == selectedAssignment.status && statusProgession.toStatus == 'Deleted';
    }) !== undefined;
    return selectedAssignment.status && canDeleteAssignment;
  }

  getReviewName(id: number) {
    return this.reviewTypes.find((type) => type.id == id).name;
  }

  actionButtonTask(row, $event) {
    const actionButton = $event.currentTarget;
    actionButton.disabled = true;
    this.nudgeFeedback(row, actionButton);
  }

  nudgeFeedback(feedbackAssignment: Assignment, actionButton: HTMLButtonElement) {
    const feedbackAssignmentId = feedbackAssignment.feedbackAssignmentId;
    this.feedbackService.getCurrentDayFeedbackAssignmentNudges(feedbackAssignmentId)
    .pipe(
      switchMap((feedbackAssignmentNudges) => {
        if (feedbackAssignmentNudges.length === 0) {
          return this.feedbackService.nudgeAssignedFeedback(feedbackAssignmentId);
        } else {
          this.snackBar.open(`${feedbackAssignment.displayName} has already been nudged for feedback today`, '',{ duration: 1000 });
          return EMPTY;
        }
      })
    ).subscribe(
      (_res) => {
        this.snackBar.open('Email Reminder Sent', '',{ duration: 1000 });
      },
      (err) => {
        actionButton.disabled = false;
        this.snackBar.open(err, '',{ duration: 1000 });
      }
    );
  }

  retrieveReviewType() {
    this.feedbackService.getFeedbackAssignmentTemplates().subscribe((assignmentTemplates) => {
      this.reviewTypes = assignmentTemplates.map((assignmentTemplate) => ({
        id: assignmentTemplate.feedbackAssignmentTemplateId,
        name: assignmentTemplate.templateName,
      }));
    });
  }

  updateClientEmail(assignment: Assignment) {
    const assignmentId = assignment.feedbackAssignmentId;
    const clientEmail = assignment.clientEmail;
    if (!clientEmail || isBBDEmail(clientEmail, this.environmentService.getConfiguratonValues().BBD_DOMAINS)) {
      throw new Error('BBD email addresses are not allowed for client emails. Please use an external email address.');
    } else {
      this.feedbackService.updateClientEmail(assignmentId, clientEmail).subscribe(() => {
        this.snackBar.open("Client email updated successfully", "Dismiss", { duration:  this.config.SNACKBAR_DURATION });
      });
    }
  }

  deleteFeedbackAssignment = (selectedAssignment: Assignment, selectedReasonId: number) => {
    if (selectedAssignment.reviewer != this.currentReviewUPN) {
      this.feedbackService.deleteFeedbackAssignment(selectedAssignment.feedbackAssignmentId, selectedReasonId).subscribe(
          (_res) => {
            this.removeFeedbackFromDataSource(selectedAssignment);
            this.snackBar.open('Feedback Assignment Deleted', 'Dismiss', { duration: 3000 });
            this.dialog.closeAll();
          },
          (err) => {
            this.snackBar.open(err, 'Dismiss', { duration: 3000 });
          }
        );

      if (this.review !== undefined && this.canMoveReviewToFeedbackCompleted()) {
        this.feedbackService.progressToNextStatus(this.review.reviewId, this.feedbackCompletedStatusId).subscribe(
          () => {
            this.snackBar.open('Successfully changed the review status', 'Dismiss', { duration: 10000 })
          },
          (err) => {
            this.snackBar.open(err, 'Dismiss', { duration: 10000 })
          }
        )
      } else {
        // The review does not progress to the next status.
      }
    }else{
      this.snackBar.open("You can't delete a self Review", 'Dismiss', { duration: 1000 });
    }
  }

  retractFeedbackAssignment = (assignmentToUpdate: Assignment, selectedReasonId: number) => {
    const dueDate = new Date(assignmentToUpdate.dueBy);
    this.feedbackService
      .updateFeedbackAssignment(assignmentToUpdate.feedbackAssignmentId, dueDate, selectedReasonId).subscribe(
      () => {
        this.snackBar.open('Assignment Retracted', 'Dismiss', { duration: 3000 });
        this.dialog.closeAll();
      },
      (err) => {
        this.snackBar.open(err, 'Dismiss', { duration: 3000 });
      }
    );
  };

  removeFeedbackFromDataSource(selectedAssignment: Assignment) {
    this.assignmentData = this.assignmentData.filter(feedbackAssignment => feedbackAssignment !== selectedAssignment);
  }

  setActiveUPN() {
    this.authService.getUserPrincipleName().subscribe((activeUPN) => {
      this.activeUPN = activeUPN;
    });
  }



  canEditFeedbackAssignment() {
    if (this.activeUPN.toLowerCase() !== this.assignmentData[0].hrRep.toLowerCase()) {
      return false;
    }
    else {
      return true;
    }
  }

  updateFormControlStatus(): void {
    for (const control of this.emailFormControls) {
      if (this.canEditFeedbackAssignment()) {
        control.enable();
      } else {
        control.disable();
      }

    }
  }



  canMoveReviewToFeedbackCompleted() {
    const selfAssignment = this.assignmentData.find((assignment) => assignment.reviewer == this.review.userPrincipleName);

    if (selfAssignment.status !== "Completed") {
      return false;
    } else {
      const completedAssignmentCount: number = this.assignmentData.filter((assignment) => assignment.status == "Completed").length;
      const incompleteAssignmentCount: number = this.assignmentData.length - completedAssignmentCount;

      if (completedAssignmentCount <= 1 || incompleteAssignmentCount > 1) {
        return false;
      } else {
        return true;
      }
    }
  }

  handleDeleteFeedbackAssignment(assignmentToDelete: Assignment) {
    this.openRetractDialog(assignmentToDelete, 'delete', this.deleteFeedbackAssignment);
  }

  handleRetractFeedbackAssignment(assignmentToRetract: Assignment) {
    this.openRetractDialog(assignmentToRetract, 'retract', this.retractFeedbackAssignment);
  }

  openRetractDialog(assignmentToUpdate: Assignment, action: ActionType, handler: Function): void {
    this.dialog.open(FeedbackRetractDialogComponent, {
      width: '60em',
      data: {
        action,
        handler,
        assignmentToUpdate,
      },
    });
  }
}
