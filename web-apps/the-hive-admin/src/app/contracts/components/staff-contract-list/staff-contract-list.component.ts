import { Component, computed, effect, input, viewChildren, OnInit } from '@angular/core';
import { MatColumnDef, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ContractStaff } from '../../interfaces';
import { ContractsService } from '../../services/contracts.service';
import { ContractRecommendation } from '@the-hive/lib-reviews-shared';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnvironmentService } from '../../../services/environment.service';
import { calculateEndOfDay } from '../../../shared/date-utils';
import { CreateStaffContractComponent } from '../create-staff-contract/create-staff-contract.component';
import { SharedModule } from '../../../shared.modules';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { nonOverlappingDateRangesValidator } from '../../../shared/date-time-validators';

@Component({
    selector: 'app-staff-contract-list',
    imports: [
        MatTableModule,
        DatePipe,
        MatIconModule,
        MatTooltipModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        CreateStaffContractComponent,
        CommonModule,
        MatDatepickerModule,
        MatInputModule,
        SharedModule,
    ],
    templateUrl: './staff-contract-list.component.html',
    styleUrl: './staff-contract-list.component.css',
    providers: [provideMaterialDatePickerConfiguration()]
})
export class StaffContractListComponent implements OnInit {
  staff = input<ContractStaff>();
  contractTable = viewChildren(MatColumnDef);
  rowCurrentlyBeingEdited: ContractRecommendation;

  contractTableDataSource: MatTableDataSource<ContractRecommendation>;
  columnsToShow = computed(() => this.contractTable().map((column) => column.name));
  snackBarDuration: number;

  editContractDatesForm: FormGroup<{
    newStartDate: FormControl<Date>;
    newEndDate: FormControl<Date>;
    nextReviewDate: FormControl<Date>;
  }> = new FormGroup({
    newStartDate: new FormControl<Date>(undefined, [Validators.required, this.contractStartDateValidation.bind(this)]),
    newEndDate: new FormControl<Date>(undefined, [Validators.required, this.contractNonStartDateValidation('end date').bind(this)]),
    nextReviewDate: new FormControl<Date>(undefined, [Validators.required, this.contractNonStartDateValidation('review due date').bind(this)])
  })

  editContractDatesNonOverlappingDatesValidator: ValidatorFn;

  constructor(
    private contractsService: ContractsService,
    private snackBar: MatSnackBar,
    private environmentService: EnvironmentService,
  ) {
    effect(() => {
      this.fetchStaffContracts();
    });
  }

  ngOnInit() {
    this.environmentService.loadConfig()
      .then(configs => {
        this.snackBarDuration = configs.SNACKBAR_DURATION;
    })
  }

  fetchStaffContracts() {
    this.contractsService.getStaffContracts(this.staff().upn).subscribe({
      next: (contracts: ContractRecommendation[]) => {
        this.contractTableDataSource = new MatTableDataSource<ContractRecommendation>(contracts);
      }
    })
  }

  getFormErrors(formControl: AbstractControl): string {
    let error;
    if (formControl.hasError('matDatepickerParse')) {
      error = 'Please use the correct date format';
    } else if (formControl.hasError('noNonStartDate')) {
      error = formControl.errors['noNonStartDate'];
    } else if (formControl.hasError('noStartDate')) {
      error = formControl.errors['noStartDate'];
    } else if (formControl.hasError('nonStartDateBeforeStartDate')) {
      error = formControl.errors['nonStartDateBeforeStartDate'];
    } else if (formControl.hasError('startDateAfterEndDate')) {
        error = formControl.errors['startDateAfterEndDate'];
    } else if (formControl.hasError('overlap')) {
      error = "The new contract dates you have selected overlap with an existing contract";
    } else {
      error = '';
    }
    return error;
  }

  contractNonStartDateValidation(fieldName: string): (control: AbstractControl) => ValidationErrors {
    return (control: AbstractControl) => {
      const startDate = new Date(this.editContractDatesForm?.get('newStartDate')?.value)
      const date = new Date(control.value);
  
      if (!control.value) {
        return { noNonStartDate: `Contract ${fieldName} must be provided` };
      } else if (date <= startDate) {
        return { nonStartDateBeforeStartDate: `Contract ${fieldName} must be after start date` };
      } else {
        return undefined;
      }
    }
  }

  contractStartDateValidation(control: AbstractControl): ValidationErrors {
    const endDate = new Date(this.editContractDatesForm?.get('newEndDate')?.value)
    const startDate = new Date(control.value);
    if (!control.value) {
      return { noStartDate: 'Start date must be provided' };
    } else if (startDate >= endDate) {
      return { startDateAfterEndDate: 'Start date must be before end date' };
    } else {
      return undefined;
    }
  }

  editContract(selectedRow: ContractRecommendation) {
    this.rowCurrentlyBeingEdited = selectedRow;
    this.editContractDatesForm.patchValue({
      newStartDate: selectedRow.startsAt,
      newEndDate: selectedRow.endsAt,
      nextReviewDate: selectedRow.nextReviewDate,
    });

    this.updateNonOverlappingDatesValidator(this.contractTableDataSource.data.filter(contract => contract.contractId !== selectedRow.contractId));
  }

  updateNonOverlappingDatesValidator(otherContracts: ContractRecommendation[]) {
    // the AbstractControl.removeValidators function compares functions by reference which is why we store
    // the function in this class so that we have a reference to work with when trying to remove the validator.
    // We need to remove the validator in the first place to ensure that we do not consider the current row being edited
    // as a date range to compare against (or otherwise it will always be an overlapping date)
    this.editContractDatesForm.removeValidators(this.editContractDatesNonOverlappingDatesValidator)

    this.editContractDatesNonOverlappingDatesValidator = nonOverlappingDateRangesValidator(
      this.editContractDatesForm.controls.newStartDate,
      this.editContractDatesForm.controls.newEndDate,
      otherContracts.map(contract => ({ startDate: contract.startsAt, endDate: contract.endsAt }))
    );

    this.editContractDatesForm.addValidators(this.editContractDatesNonOverlappingDatesValidator);

    this.editContractDatesForm.updateValueAndValidity();
  }

  cancelUpdateDate() {
    this.rowCurrentlyBeingEdited = undefined;
  }

  saveUpdatedDates() {
    if (this.editContractDatesForm.valid && this.rowCurrentlyBeingEdited) {
      const contractId = this.rowCurrentlyBeingEdited.contractId;

      const startsAt = calculateEndOfDay(this.editContractDatesForm.get('newStartDate').value);
      const endsAt = calculateEndOfDay(this.editContractDatesForm.get('newEndDate').value);
      const nextReviewDate = calculateEndOfDay(this.editContractDatesForm.get('nextReviewDate').value);

      this.contractsService.updateContractDates(contractId, startsAt, endsAt, nextReviewDate).subscribe({
        next: () => {
          this.rowCurrentlyBeingEdited = undefined;
          this.snackBar.open('Successfully updated the contract dates', 'Dismiss', { duration: this.snackBarDuration });
          this.fetchStaffContracts();
        },
        error: (error) => {
          this.snackBar.open(error, 'Dismiss', { duration: this.snackBarDuration });
        }
      });
    }
  }
}
