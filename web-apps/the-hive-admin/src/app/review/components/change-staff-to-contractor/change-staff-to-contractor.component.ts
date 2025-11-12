import { Component, EventEmitter, input, Input, output, Output, SimpleChanges, OnInit, OnChanges } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { StaffOverviewListItem } from '../../../shared/interfaces';
import { StaffOverviewService } from '../../services/staff-overview.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MaterialModule } from '../../../material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { calculateEndOfDay } from '../../../shared/date-utils';
import { EnvironmentService } from '../../../services/environment.service';
import { ContractsService } from '../../../contracts/services/contracts.service';
import { SharedModule } from '../../../shared.modules';
import { ContractRecommendation } from '@the-hive/lib-reviews-shared';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';

@Component({
    selector: 'app-change-staff-to-contractor',
    imports: [
        MaterialModule,
        MatCardModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatDatepickerModule,
        SharedModule,
    ],
    templateUrl: './change-staff-to-contractor.component.html',
    styleUrl: './change-staff-to-contractor.component.css',
    providers: [provideMaterialDatePickerConfiguration()]
})
export class ChangeStaffToContractorComponent implements OnInit, OnChanges {

  @Input() staff: StaffOverviewListItem;
  contractRecommendation = input<ContractRecommendation>()

  @Output() staffTypeChanged = new EventEmitter<boolean>();
  @Output() cancelButtonClicked = new EventEmitter<boolean>();
  contractRenewed = output();

  contractorForm: FormGroup;
  snackBarDuration: number;
  minimumContractDuration: number;
  minimumEndDateRecommendation: Date | undefined = undefined;
  minimumStartDate: Date | undefined = undefined;
  minimumEndDate: Date | undefined = undefined;

  constructor(
    private snackBar: MatSnackBar,
    public staffOverviewService: StaffOverviewService,
    private environmentService: EnvironmentService,
    private contractsService: ContractsService,
  ) {}
  
  ngOnInit(): void {
    this.fetchEnvironmentConfigurations();

    this.contractorForm = new FormGroup({
      startDate: new FormControl<Date | undefined>(undefined, [Validators.required, this.contractStartDateValidation.bind(this)]),
      endDate: new FormControl<Date | undefined>(this.minimumEndDate, [Validators.required, this.contractEndDateValidation.bind(this)]),
      nextReviewDate: new FormControl<Date | undefined>(undefined, [Validators.required])
    });
    this.calculateMinimumStartDate();

    this.contractorForm.controls['startDate'].valueChanges.subscribe(startDate => {
      this.minimumEndDate = startDate;
      this.minimumEndDateRecommendation = this.calculateMinimumEndDate(startDate);
      this.contractorForm.controls['endDate'].updateValueAndValidity();
    });
  }

  calculateMinimumStartDate() {
    if (this.contractRecommendation()) {
      this.minimumStartDate = new Date(this.contractRecommendation().endsAt);
      this.minimumEndDate = this.minimumStartDate;
      this.minimumStartDate.setDate(this.minimumStartDate.getDate() + 1);
      this.contractorForm.controls['startDate'].setValue(this.minimumStartDate);
      this.minimumEndDateRecommendation = this.calculateMinimumEndDate(this.minimumStartDate);
    } else {
      //Minimum start date only needs to be set for Contractor renewals.
    }
  }

  ngOnChanges(changes: SimpleChanges)  {
    if ((changes['staff'] || changes['contractRecommendation']) && this.contractorForm) {
      this.contractorForm.reset();
      this.calculateMinimumStartDate();
    } else {
      //do nothing, staff or contractRecommendation did not change
    }
  }

  calculateMinimumEndDate(startDate: Date): Date {
    if (!startDate) {
      return undefined;
    } else {
      startDate = new Date(startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + this.minimumContractDuration);
      endDate.setDate(endDate.getDate() -1);

      return endDate;
    }
  }

  changeStaffToContractor() {
    if (this.contractorForm.valid) { 
      const staffId = this.staff.staffId;
      const startsAt = calculateEndOfDay(this.contractorForm.controls['startDate'].value);
      const endsAt = calculateEndOfDay(this.contractorForm.controls['endDate'].value);
      const nextReviewDate = calculateEndOfDay(this.contractorForm.controls['nextReviewDate'].value);
      const staffReviewId = this.staff.nextReview.id; 

      this.staffOverviewService.changeStaffToContractorEmployee(staffId, startsAt, endsAt, staffReviewId, nextReviewDate).subscribe({
        next: (_res) => {
          this.staffTypeChanged.emit(true);
          this.snackBar.open(`Permanent employee '${this.staff.displayName}' successfully changed to contractor employee`, 'Dismiss', { duration: this.snackBarDuration });
        },
        error: (error) => {
          this.snackBar.open(error, 'Dismiss', { duration: this.snackBarDuration });
        }
      });
    } else {
        this.snackBar.open('The form is not valid. Please enter valid start and end date','Dismiss', { duration: this.snackBarDuration });
    }
  }

  renewContract() {
    if (this.contractorForm.valid) {
      const status = 'Archived';
      const recommendationId = this.contractRecommendation().contractRecommendationId;
      const startDate = calculateEndOfDay(this.contractorForm.controls['startDate'].value);
      const endDate = calculateEndOfDay(this.contractorForm.controls['endDate'].value);
      const nextReviewDate = calculateEndOfDay(this.contractorForm.controls['nextReviewDate'].value);
      this.contractsService.updateContractRecommendation(recommendationId, { status, startDate, endDate, nextReviewDate }).subscribe({
        next: ()=> {
          this.snackBar.open(`Contract for ${this.contractRecommendation().displayName} is successfully renewed`, 'Dismiss', { duration: this.snackBarDuration });
          this.contractRenewed.emit();
        },
        error: (error)=> {
          this.snackBar.open(error, 'Dismiss', { duration: this.snackBarDuration });
        }
      })
    }else {
      this.snackBar.open('The form is not valid. Please enter valid start and end date','Dismiss', { duration: this.snackBarDuration });
    }
  }

  getFormErrors(formControl: AbstractControl): string {
    let error;
    if (formControl.hasError('matDatepickerParse')) {
      error = 'Invalid date';
    } else if (formControl.hasError('required')) {
      error = 'Required';
    } else if (formControl.hasError('startDateBeforeContractEnd')) {
      error = formControl.errors['startDateBeforeContractEnd'];
    } else if (formControl.hasError('endDateBeforeStartDate')) {
      error = formControl.errors['endDateBeforeStartDate'];
    } else {
      error = '';
    }
    return error;
  }

  getContractDurationWarning(): string | undefined {
    let warning: string;
    const minimumContractEndDate = this.calculateMinimumEndDate(this.contractorForm.controls['startDate'].value);

    if(this.contractorForm.controls['endDate'].value && this.contractorForm.valid && (calculateEndOfDay(this.contractorForm.controls['endDate'].value) < calculateEndOfDay(minimumContractEndDate))) {
      warning = `Please note that the contract you are about to create will last for less than ${ this.minimumContractDuration } months.`;
    } else {
      // The contract end date is greater than the minimum required duration.
    }

    return warning;
  }

  onCancelClicked() {
    this.cancelButtonClicked.emit(true);
  }

  fetchEnvironmentConfigurations(): void {
    this.environmentService.getConfig().subscribe((env) => {
      this.snackBarDuration = env.SNACKBAR_DURATION; 
      this.minimumContractDuration = env.MINIMUM_CONTRACT_DURATION; 
    });
  }

  changeStaffTypeOrRenewContract(){
    if(this.staff) {
      this.changeStaffToContractor();
    } else {
      this.renewContract();
    }
  }

  contractEndDateValidation(control: AbstractControl): ValidationErrors {
    const startDate = this.contractorForm?.get('startDate')?.value;
    const endDate = control.value;

    if (!startDate || !endDate) {
      return undefined;
    } else {
      return this.validateContractEndDate(startDate, endDate);
    }
  }
  

  contractStartDateValidation(control: AbstractControl): ValidationErrors {
    const startDate = control.value;
    const contractEndDate = this.contractRecommendation()?.endsAt;

    if (!startDate || !contractEndDate) {
      return undefined;
    } else {
      return this.validateContractStartDate(startDate, contractEndDate);
    }
  };

  validateContractEndDate(startDate: Date, endDate: Date): ValidationErrors {
    if (endDate <= startDate) {
      return { endDateBeforeStartDate: 'Contract review due date cannot be before or on the start date' };
    } else {
      return undefined;
    }
  }
  
  validateContractStartDate(startDate: Date, contractEndDate: Date): ValidationErrors {
    if (new Date(startDate) <= new Date(contractEndDate)) {
      return { startDateBeforeContractEnd: 'Start date cannot be on or before contract end date' };
    } else {
      return undefined;
    }
  }
}
