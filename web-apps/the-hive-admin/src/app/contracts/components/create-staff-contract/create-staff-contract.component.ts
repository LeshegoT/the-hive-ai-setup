import { Component, input, output, SimpleChanges, OnInit, OnChanges } from '@angular/core';
import { ContractStaff } from '../../interfaces';
import { ReactiveFormsModule, FormsModule, FormGroup, AbstractControl, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MaterialModule } from '../../../material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnvironmentService } from '../../../services/environment.service';
import { ContractsService } from '../../services/contracts.service';
import { Config } from '../../../shared/config';
import { calculateEndOfDay } from '../../../shared/date-utils';
import { SharedModule } from '../../../shared.modules';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { ContractRecommendation } from '@the-hive/lib-reviews-shared';
import { nonOverlappingDateRangesValidator } from '../../../shared/date-time-validators';

@Component({
    selector: 'app-create-staff-contract',
    imports: [
        MaterialModule,
        MatCardModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        SharedModule,
    ],
    templateUrl: './create-staff-contract.component.html',
    styleUrl: './create-staff-contract.component.css',
    providers: [provideMaterialDatePickerConfiguration()]
})
export class CreateStaffContractComponent implements OnInit, OnChanges {
  staff = input<ContractStaff>();
  contracts = input<ContractRecommendation[]>();
  contractCreated = output<boolean>();

  environmentConfiguration: Config;

  contractForm: FormGroup<{
    startDate: FormControl<Date>,
    endDate: FormControl<Date>,
    reviewDate: FormControl<Date>
  }>;

  minimumEndDate: Date | undefined = undefined;

  constructor(
    private snackBar: MatSnackBar,
    private environmentService: EnvironmentService,
    private contractsService: ContractsService,
  ) {}
  
  ngOnInit(): void {
    this.fetchEnvironmentConfigurations();

    this.contractForm = new FormGroup({
      startDate: new FormControl<Date | undefined>(undefined, Validators.required),
      endDate: new FormControl<Date | undefined>(undefined, [Validators.required, this.contractEndDateValidation.bind(this)]),
      reviewDate: new FormControl<Date | undefined>(undefined, [Validators.required])
    });

    this.contractForm.controls['startDate'].valueChanges.subscribe(startDate => {
      this.minimumEndDate = this.calculateMinimumEndDate(startDate);
      this.contractForm.controls['endDate'].updateValueAndValidity();
    });

    this.contractForm.controls['endDate'].valueChanges.subscribe(endDate => {
      if(this.contractForm.controls['reviewDate'].value) {
        // Review date already set, no need to suggest a review date
      } else {
        this.contractForm.controls['reviewDate'].setValue(endDate);
      }
    });

    this.contractForm.addValidators([nonOverlappingDateRangesValidator(
      this.contractForm.controls.startDate,
      this.contractForm.controls.endDate,
      this.contracts().map(contract => ({ startDate: contract.startsAt, endDate: contract.endsAt }))
    )])
  }


  ngOnChanges(changes: SimpleChanges)  {
    if ((changes['staff'] || changes['contractRecommendation']) && this.contractForm) {
      this.resetContractForm();
    } else {
      //do nothing, staff or contractRecommendation did not change
    }
  }

  calculateMinimumEndDate(startDate: Date): Date {
    if (!startDate) {
      return undefined;
    } else {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + this.environmentConfiguration.MINIMUM_CONTRACT_DURATION);
      endDate.setDate(endDate.getDate()-1);
      return endDate;
    }
  }

  getFormErrors(formControl: AbstractControl): string {
    let error;
    if (formControl.hasError('matDatepickerParse')) {
      error = 'Invalid date';
    } else if (formControl.hasError('required')) {
      error = 'Required';
    } else if (formControl.hasError('endDateBeforeStartDate')) {
      error = formControl.errors['endDateBeforeStartDate'];
    } else if (formControl.hasError('endDurationError')) {
      error = formControl.errors['endDurationError'];
    } else if (formControl.hasError('overlap')) {
      error = 'The contract you are trying to create overlaps with an existing contract';
    } else {
      error = '';
    }
    return error;
  }

  getContractDurationWarning(): string | undefined {
    let warning: string;
    
    const contractStartDate = this.contractForm.controls['startDate'].value;
    const contractEndDate = this.contractForm.controls['endDate'].value;
    const minimumContractEndDate = this.calculateMinimumEndDate(contractStartDate);

    if (contractEndDate && (contractEndDate < minimumContractEndDate)) {
      warning = `Please note that the contract you are about to create will last for less than ${this.environmentConfiguration.MINIMUM_CONTRACT_DURATION} months.`
    } else {
      // The contract end date is greater than the minimum required duration.
    }
    return warning;
  }

  fetchEnvironmentConfigurations(): void {
    this.environmentService.getConfig().subscribe((config) => {
      this.environmentConfiguration = config;
    });
  }


  contractEndDateValidation(control: AbstractControl): ValidationErrors {
    const startDate = this.contractForm?.get('startDate')?.value;
    const endDate = control.value;

    if (endDate < startDate) {
      return { endDateBeforeStartDate: 'Contract review due date cannot be before the start date' };
    } else {
      return undefined;
    }
  }

  createContract(): void {
    const staffId = this.staff().staffId;
    const contractStartDate = calculateEndOfDay(this.contractForm.controls['startDate'].value);
    const contractEndDate = calculateEndOfDay(this.contractForm.controls['endDate'].value);
    const contractReviewDate = calculateEndOfDay(this.contractForm.controls['reviewDate'].value);

    this.contractsService.createContract(staffId, contractStartDate, contractEndDate, contractReviewDate).subscribe({
      next: () => {
        this.contractCreated.emit(true);
        this.resetContractForm();
        this.snackBar.open(`The contract for employee '${this.staff().displayName}' has been successfully created.`, 'Dismiss', { duration: this.environmentConfiguration.SNACKBAR_DURATION });
      },
      error: (error) => {
        this.snackBar.open(error, 'Dismiss', { duration: this.environmentConfiguration.SNACKBAR_DURATION });
      }
    })
  }

  resetContractForm() {
    this.contractForm.reset();
    this.contractForm.controls['startDate'].setErrors(undefined);
    this.contractForm.controls['endDate'].setErrors(undefined);
    this.contractForm.controls['reviewDate'].setErrors(undefined);
  }
}
