import { Component, input, output, OnInit } from '@angular/core';
import { ContractsService } from '../../services/contracts.service';
import { FeedbackService } from '../../../review/services/feedback.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ContractStaff } from '../../interfaces';
import { SharedModule } from '../../../shared.modules';
import { EnvironmentService } from '../../../services/environment.service';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { calculateEndOfDay } from '../../../shared/date-utils';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';

export interface ContractStaffDialogData {
  contractStaff: ContractStaff;
  feedbackTypes: { id: number; name: string }[];
}

@Component({
    selector: 'app-make-contractors-permanent',
    templateUrl: './make-contractors-permanent.component.html',
    styleUrl: './make-contractors-permanent.component.css',
    imports: [ReactiveFormsModule, SharedModule],
    providers: [provideMaterialDatePickerConfiguration()],
})
export class MakeContractorsPermanentComponent implements OnInit {
  makeContractorsPermanentForm: FormGroup;
  reviewTypes: { feedbackAssignmentTemplateId: number; templateName: string }[] = [];
  snackBarDuration: number;
  data = input.required<ContractStaff>();
  contractStaffTypeChanged =  output<boolean>();
  cancelButtonClicked = output();

  get minimumNextReviewDate() {
    return new Date();
  }

  constructor(
    private feedbackService: FeedbackService,
    private contractsService: ContractsService,
    private snackBar: MatSnackBar,
    private environmentService: EnvironmentService,
  ) {}

  ngOnInit() {
    this.makeContractorsPermanentForm = new FormGroup({
      nextReviewDate: new FormControl<Date>(undefined, Validators.required),
      nextFeedbackTypeId: new FormControl<number>(undefined, Validators.required)
    });
    this.retrieveReviewTypes();
    this.environmentService.getConfig().subscribe((env) => {
      this.snackBarDuration = env.SNACKBAR_DURATION;
    });
  }

  retrieveReviewTypes() {
    this.feedbackService.getFeedbackAssignmentTemplates().subscribe((assignmentTemplates) => {
      this.reviewTypes = assignmentTemplates.filter(
        (assignmentTemplate) => assignmentTemplate.manualFeedbackAssignment
      );
    });
  }

  onNoClick(): void {
    this.cancelButtonClicked.emit();
  }

  getFormErrors(formControl: AbstractControl): string {
    let error;
    if (formControl.hasError('matDatepickerParse')) {
      error = 'Invalid date';
    } else if (formControl.hasError('required')) {
      error = 'Required';
    } else if (formControl.hasError('matDatepickerMin')) {
      error = 'Next review date cannot be in the past';
    } else {
      error = '';
    }
    return error;
  }

  onSubmit(): void {
    if (this.makeContractorsPermanentForm.valid) {
      const { nextReviewDate, nextFeedbackTypeId } = this.makeContractorsPermanentForm.value;
      this.contractsService
        .makeContractorPermanent(this.data().staffId, {
          nextReviewDate: calculateEndOfDay(nextReviewDate),
          nextFeedbackTypeId,
          contractRecommendationId: this.data().contractRecommendationId,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Staff member has been made permanent', 'Close', {
              duration: this.snackBarDuration,
            });
            this.contractStaffTypeChanged.emit(true);
          },
          error: (error) => {
            this.snackBar.open('Error updating staff to permanent', 'Close', {
              duration: this.snackBarDuration,
            });
          },
        });
    } else{
      /*No action taken until the form is correctly completed*/
    }
  }
}
