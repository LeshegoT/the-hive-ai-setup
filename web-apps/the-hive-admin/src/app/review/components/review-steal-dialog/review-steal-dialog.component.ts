import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FeedbackService } from '../../../review/services/feedback.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ContractsService } from '../../../contracts/services/contracts.service';
import { EnvironmentService } from '../../../services/environment.service';
import { Config } from '../../../shared/config';
import { calculateEndOfDay } from '../../../shared/date-utils';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';

interface StealDialogData {
  stealType: 'Review' | 'Contract Recommendation',
  selectedReason?: string,
  stealReason?: string,
  reviewId?: number,
  contractRecommendationId?: number,
  activeUPN: string,
  afterSuccess: () => void,
  reviewee: string,
  hrRep: string,
  status: string,
  deadline: Date
}

type TakeDurationOption = 'Take permanently' | 'Take until';

@Component({
    selector: 'app-review-steal-dialog',
    templateUrl: './review-steal-dialog.component.html',
    styleUrls: ['./review-steal-dialog.component.css', '../../../shared/shared.css'],
    standalone: false,
    providers: [provideMaterialDatePickerConfiguration()]
})
export class ReviewStealDialogComponent implements OnInit {
  disableTakeReviewButton = false;
  possibleStealReasons: string[] = [
  "HR rep on leave",
  "Existing HR process in effect",
  "ATC Production Support",
];
  environmentConfigurations: Config;

  minimumTakeDate: Date = new Date();
  takeDurationOptions: TakeDurationOption[] = ['Take permanently', 'Take until'];
  stealForm: FormGroup<{specialReasonFormControl: FormControl, reasonFormControl: FormControl<string>, takeDurationOption: FormControl<TakeDurationOption>, takeDurationDate: FormControl<Date> }>;

  constructor(
    public dialogRef: MatDialogRef<ReviewStealDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StealDialogData,
    public feedbackService: FeedbackService,
    public contractsService: ContractsService,
    private environmentService: EnvironmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.dialogRef.disableClose = true;
    this.environmentConfigurations = this.environmentService.getConfiguratonValues();
    this.initialiseStealForm();
  }

  initialiseStealForm() {
    this.stealForm = new FormGroup({
      specialReasonFormControl: new FormControl<string>(undefined),
      reasonFormControl: new FormControl<string>(undefined, [Validators.required]),
      takeDurationOption: new FormControl<TakeDurationOption>('Take permanently', Validators.required),
      takeDurationDate: new FormControl<Date>(undefined)
    });
  }

  onTakeDurationOptionChange(takeDurationOption: TakeDurationOption) {
    if (takeDurationOption === 'Take until') {
      this.stealForm.controls.takeDurationDate.setValidators([Validators.required, this.minimumTakeUntilDateValidation.bind(this)]);
    } else {
      this.stealForm.controls.takeDurationDate.setValidators([]);
      this.stealForm.controls.takeDurationDate.updateValueAndValidity();
      this.stealForm.controls.takeDurationDate.markAsUntouched();
    }
  }

  minimumTakeUntilDateValidation(control: AbstractControl): ValidationErrors {
    const takeUntilDate: Date = calculateEndOfDay(control.value);

    if (takeUntilDate < this.minimumTakeDate) {
      return { minimumTakeUntilDate: "The 'take until' date cannot be in the past." };
    } else {
      return undefined;
    }
  }

  getFormErrors(formControl: AbstractControl): string | undefined {
    let error: string | undefined;
    if (formControl.hasError('matDatepickerParse')) {
      error = 'Invalid date';
    } else if (formControl.hasError('required')) {
      error = 'Required';
    } else if (formControl.hasError('minimumTakeUntilDate')) {
      error = formControl.errors['minimumTakeUntilDate'];
    } else {
      error = undefined;
    }
    return error;
  }

  getTakeUntilDate(): Date | undefined {
    let endOfDay: Date | undefined;
    if (this.stealForm.controls.takeDurationDate.value) {
      endOfDay = calculateEndOfDay(this.stealForm.controls.takeDurationDate.value);
    } else {
      endOfDay = undefined;
    }
    return endOfDay;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSteal() {
      this.stealForm.markAllAsTouched();
      this.disableTakeReviewButton = true;
      let stealReason: string;
      if(this.possibleStealReasons.includes(this.stealForm.controls.reasonFormControl.value)){
        stealReason = this.stealForm.controls.reasonFormControl.value;
      }else{
        stealReason = this.stealForm.controls.specialReasonFormControl.value;
      }

      if (this.data.stealType === 'Contract Recommendation') {
        this.stealContractRecommendation(stealReason);
      } else {
        this.stealReview(stealReason);
      }
  }


  stealReview(comment: string) {
    if (this.stealForm.valid) {
      const reviewData = { 
        id: this.data.reviewId,
        createdBy: this.data.activeUPN,
        comment: comment,
        temporaryHrRepEndDate: this.getTakeUntilDate()
      };
      this.feedbackService.stealReview(reviewData).subscribe(
        () => {
          this.snackBar.open('Review Taken', 'Dismiss', { duration: 3000 });
          this.dialogRef.close();
          this.data.afterSuccess();
        },
        (err) => {
          this.snackBar.open(err, 'Dismiss', { duration: 3000 });
        }
      );
    } else {
      this.disableTakeReviewButton = false;
    }
  }

  stealContractRecommendation(comment: string) {
    if (this.stealForm.valid) {
      this.contractsService.stealContractRecommendation(
        this.data.contractRecommendationId,
        this.data.activeUPN,
        comment,
        this.getTakeUntilDate()
      ).subscribe({
        next: (_res) => {
          this.snackBar.open('Contract recommendation taken', 'Dismiss', { duration: this.environmentConfigurations.SNACKBAR_DURATION });
          this.dialogRef.close();
          this.data.afterSuccess();
        },
        error: (error) => {
          this.snackBar.open(error, 'Dismiss', { duration: this.environmentConfigurations.SNACKBAR_DURATION });
          this.disableTakeReviewButton = false;
        } 
      })
    } else {
      this.disableTakeReviewButton = false;
    }
  }

  onReasonSelection(value: string) {
    if(value?.toLocaleLowerCase() === 'special case'){
      this.stealForm.controls.specialReasonFormControl.setValidators([Validators.required]);
    }else {
      this.stealForm.controls.specialReasonFormControl.removeValidators([Validators.required]);
      this.stealForm.controls.specialReasonFormControl.markAsUntouched();
    }
  }
}
