import { Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FeedbackService } from '../../../review/services/feedback.service';
import {FeedbackRetractionReasonsService} from '../../../review/services/feedback-retraction-reasons.service';
import { MatButton } from '@angular/material/button';
export type ActionType = 'delete' | 'retract';


@Component({
    selector: 'app-feedback-retract-dialog',
    templateUrl: './feedback-retract-dialog.component.html',
    styleUrls: ['./feedback-retract-dialog.component.css'],
    standalone: false
})
export class FeedbackRetractDialogComponent implements OnInit {
  email = new UntypedFormControl('', [Validators.required, Validators.email]);
  formattedDate : string;
  reasons : object;
  selectedReasonId : number;
  isFeedbackCompleted: boolean;
  confirmationEmail : string;
  actionHandlers = {
    delete: {
      action: 'Deleting',
      process: 'Deletion',
    },
    retract: {
      action: 'Retracting',
      process: 'Retraction',
    },
  };

  @ViewChild('deleteButton') deleteButton!: MatButton;
  

  constructor(
    public dialogRef: MatDialogRef<FeedbackRetractDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public feedbackService: FeedbackService,
    public retractionReasonsService: FeedbackRetractionReasonsService,
  ) {}

  ngOnInit() {
    this.dialogRef.disableClose = true;
    this.formattedDate = new Date(this.data.assignmentToUpdate.dueBy).toLocaleDateString();
    this.isFeedbackCompleted = this.data.assignmentToUpdate.status === 'Completed';
    this.retractionReasonsService.getRetractedReasons().subscribe(reasons => {
      this.reasons = reasons;
    })
    this.selectedReasonId = 1;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDelete() {
    if (this.confirmationEmail?.toLowerCase() === this.data.assignmentToUpdate.reviewer.toLowerCase()) {
      this.deleteButton.disabled = true;
      this.data.handler(this.data.assignmentToUpdate, this.selectedReasonId);
    } else {
      this.email.markAsTouched();
      this.email.setErrors({ nomatch: true });
    }
  }

  getErrorMessage() {
    if (this.email.hasError('required') || this.email.hasError('email') || this.email.hasError('nomatch')) {
      return 'Invalid reviewer email provided';
    }

    return '';
  }
}
