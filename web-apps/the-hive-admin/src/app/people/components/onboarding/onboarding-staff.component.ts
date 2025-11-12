import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompanyEntity, Office, Unit } from '@the-hive/lib-shared';
import { ActiveStaffType, activeStaffTypes, OnboardingStaffWithContractDates, Staff, StaffUpdateFields } from '@the-hive/lib-staff-shared';
import moment, { Moment } from 'moment';
import { BehaviorSubject, catchError, concat, concatMap, debounceTime, distinctUntilChanged, filter, forkJoin, map, merge, Observable, of, shareReplay, startWith, Subscription, switchMap } from 'rxjs';
import { ErrorCardComponent } from '../../../components/error-card/error-card.component';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { EnvironmentService } from '../../../services/environment.service';
import { TableService } from '../../../services/table.service';
import { AddGraphApiStaffMemberComponent } from '../add-graph-api-staff-member/add-graph-api-staff-member.component';
import { OnboardingStaffService } from './onboarding-staff.service';

type OnboardingStaffTableColumn = 'staff' | 'employmentDate' | 'office' | 'unit' | 'staffType' | 'editMode';

type FetchOnboardingStaffResult =
  | { status: 'loading' }
  | { status: 'success'; onboardingStaff: OnboardingStaffWithContractDates[] }
  | { status: 'error'; errorMessage: string };

type UpdateOnboardingStaffResult =
  | { status: 'loading' }
  | { status: 'success', onboarded: boolean, formGroup: StaffOnboardingFormGroup }
  | { status: 'error'; errorMessage: string };

type BasicStaffDetailsFormControls = {
  department: FormControl<string>;
  manager: FormControl<string>;
  officeId: FormControl<number>;
  companyEntityId: FormControl<number>;
  employmentDate: FormControl<Moment>;
  staffType: FormControl<ActiveStaffType>;
}

type PermanentStaffFormControls = {
  probationaryReviewDate: FormControl<Moment>;
}

type ContractStaffFormControls = {
  contractStartDate: FormControl<Moment>;
  contractEndDate: FormControl<Moment>;
  contractReviewDate: FormControl<Moment>;
}

type OnboardingFormControlGroups = {
  basicStaffDetails: FormGroup<BasicStaffDetailsFormControls>;
  permanentStaffDetails: FormGroup<PermanentStaffFormControls>;
  contractStaffDetails: FormGroup<ContractStaffFormControls>;
}

type StaffOnboardingFormGroup = FormGroup<OnboardingFormControlGroups>;

@Component({
    selector: 'app-onboarding-staff',
    templateUrl: './onboarding-staff.component.html',
    styleUrls: ['./onboarding-staff.component.css'],
    imports: [
      CommonModule,
      MatPaginatorModule,
      MatSortModule,
      MatTableModule,
      MatButtonModule,
      MatIcon,
      MatInputModule,
      MatFormFieldModule,
      MatSelectModule,
      MatAutocompleteModule,
      ReactiveFormsModule,
      MatTooltipModule,
    AddGraphApiStaffMemberComponent,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    ErrorCardComponent
  ],
  providers: [
    provideMaterialDatePickerConfiguration()
  ]
})
export class OnboardingStaffComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly dataSubscriptions: Subscription = new Subscription();

  // Table configuration
  protected readonly onboardingStaffDataSource: MatTableDataSource<OnboardingStaffWithContractDates> = new MatTableDataSource<OnboardingStaffWithContractDates>();
  @ViewChild(MatPaginator) protected readonly paginator: MatPaginator;
  @ViewChild(MatSort) protected readonly reportSort: MatSort;
  protected readonly staffColumns: OnboardingStaffTableColumn[] = [
    'staff',
    'employmentDate',
    'office',
    'unit',
    'staffType',
    'editMode'
  ];

  // Triggers
  protected readonly updateOnboardingStaff$ = new BehaviorSubject<{ upn: string, staffUpdateFields: StaffUpdateFields, setStaffMemberAsActive: boolean, formGroup: StaffOnboardingFormGroup }>(undefined);
  protected readonly refreshOnboardingStaff$ = new BehaviorSubject<void>(undefined);

  // Results
  protected readonly resetUpdateOnboardingStaffResult$ = new BehaviorSubject<void>(undefined);
  protected updateOnboardingStaffResult$: Observable<UpdateOnboardingStaffResult>;
  protected onboardingStaff$: Observable<FetchOnboardingStaffResult>;

  // Data
  protected selectedStaffUPN$: BehaviorSubject<string> = new BehaviorSubject(undefined);
  protected onboardingForms: { [key: string]: StaffOnboardingFormGroup } = {};
  protected filteredUnits: Unit[];
  protected filteredReviewers: Staff[];

  // Constants
  protected readonly staffTypes: Readonly<ActiveStaffType[]> = activeStaffTypes;
  protected units: Unit[];
  protected offices: Office[];
  protected companyEntities: CompanyEntity[];
  protected reviewers: Staff[];
  protected notSetText = "Not yet set";
  protected defaultMonthsFromEmploymentDateForProbationaryReview: number;

  protected onboardingStaffFormControlRestrictions = {
    basicStaffDetails: {
      employmentDate: {
        minimumDate: moment('1984-01-01'),
        maximumDate: moment().add(1, 'year'),
      }
    },
    permanentStaffDetails: {
      probationaryReviewDate: {
        minimumDate: moment('1984-01-01'),        
      }
    },
    contractStaffDetails: {
      contractStartDate: {
        minimumDate: moment('1984-01-01'),
      },
    }
  }

  constructor(
    private readonly onboardingStaffService: OnboardingStaffService,
    private readonly environmentService: EnvironmentService,
    protected readonly tableService: TableService,
    private readonly snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.defaultMonthsFromEmploymentDateForProbationaryReview = this.environmentService.getConfiguratonValues().MONTHS_FROM_EMPLOYMENT_DATE_FOR_PROBATIONARY_REVIEW;
    this.initialiseOnboardingStaffObservable();
    this.initialiseUpdateOnboardingStaffObservable();
    this.initialiseStaticOrganisationData();
  }

  ngAfterViewInit() {
    this.updatedOnboardingStaffTablePaginatorAndSort();
  }

  private updatedOnboardingStaffTablePaginatorAndSort() {
    this.onboardingStaffDataSource.sort = this.reportSort;
    this.onboardingStaffDataSource.paginator = this.paginator;
  }

  private initialiseOnboardingStaffObservable() {
    this.onboardingStaff$ = this.refreshOnboardingStaff$.pipe(
      switchMap(() => this.onboardingStaffService.getOnboardingStaffWithContractDates().pipe(
        map(onboardingStaff => this.patchStaffTypesForStaffWithNoStaffTypes(onboardingStaff)),
        map((onboardingStaff) => ({ status: 'success' as const, onboardingStaff })),
        catchError((error: string) => of({ status: 'error' as const, errorMessage: error })),
        startWith({ status: 'loading' as const }),
      )),
      shareReplay(1)
    );

    this.dataSubscriptions.add(
      this.onboardingStaff$.subscribe(onboardingStaffResult => {
        if (onboardingStaffResult.status === 'success') {
          this.onboardingStaffDataSource.data = onboardingStaffResult.onboardingStaff;
        } else {
          // Other states are handled in the template
        }
      })
    );
  }

  private patchStaffTypesForStaffWithNoStaffTypes(onboardingStaff: OnboardingStaffWithContractDates[]): OnboardingStaffWithContractDates[] {
    return onboardingStaff.map(staff => {
      if (!staff.staffType) {
        return {
          ...staff,
          staffType: 'Permanent',
          probationaryReviewDate: moment().add(this.defaultMonthsFromEmploymentDateForProbationaryReview, 'months').toDate()
        };
      } else {
        // no need to patch with the default staff type
        return staff;
      }
    });
  }

  private initialiseUpdateOnboardingStaffObservable() {
    this.updateOnboardingStaffResult$ = merge(this.updateOnboardingStaff$, this.resetUpdateOnboardingStaffResult$).pipe(
      concatMap((upnAndUpdateFields) => of(upnAndUpdateFields)), // Updates should be saved in the order they are received to avoid race conditions
      switchMap((upnAndUpdateFields) => {
        if (upnAndUpdateFields) {
          const saveStaffDetails$ = this.onboardingStaffService.saveStaffDetails(upnAndUpdateFields.upn, upnAndUpdateFields.staffUpdateFields);
          const updateStaffStatus$ = this.onboardingStaffService.updateStaffStatus(upnAndUpdateFields.upn, 'active');

          // We need to concatenate the requests because the updateStaffStatus request depends on the saveStaffDetails request to be completed first
          const concatenatedRequest$ = upnAndUpdateFields.setStaffMemberAsActive ? concat(saveStaffDetails$, updateStaffStatus$) : saveStaffDetails$;

          return concatenatedRequest$.pipe(
            map(() => ({ status: 'success' as const, onboarded: upnAndUpdateFields.setStaffMemberAsActive, formGroup: upnAndUpdateFields.formGroup })),
            catchError((error: string) => of({ status: 'error' as const, errorMessage: error })),
            startWith({ status: 'loading' as const }),
          )
        } else {
          return of(undefined);
        }
      }),
      shareReplay(1)
    );

    this.dataSubscriptions.add(this.updateOnboardingStaffResult$.subscribe(updateOnboardingStaffResult => {
      if (updateOnboardingStaffResult?.status === 'success') {
        this.resetFormStateToUntouched(updateOnboardingStaffResult.formGroup);

        if (updateOnboardingStaffResult.onboarded) {
          this.selectedStaffUPN$.next(undefined);
          this.snackBar.open('Staff member onboarded successfully', 'Close', {
            duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION,
          });
          this.getOnboardingStaff();
        } else {
          // The result is from an auto save, so we don't yet show the "successful onboarding" message
        }
      } else {
        // Other states are handled in the template
      }
    }));
  }

  private initialiseStaticOrganisationData() {
    this.dataSubscriptions.add(
      forkJoin([
        this.onboardingStaffService.getCompanyEntities(),
        this.onboardingStaffService.getOffices(),
        this.onboardingStaffService.getUnits(),
        this.onboardingStaffService.getStaffByStaffFilter({ staffStatuses: ['active'] }),

      ]).subscribe(([companyEntities, offices, units, reviewers]) => {
        this.companyEntities = companyEntities;
        this.offices = offices;
        this.units = units;
        this.filteredUnits = units;
        this.reviewers = reviewers;
        this.filteredReviewers = reviewers;
      })
    );
  }

  public getOnboardingStaff() {
    this.refreshOnboardingStaff$.next();
  }

  protected cancelUpdate() {
    this.selectedStaffUPN$.next(undefined);
    this.resetUpdateOnboardingStaffResult();
    this.getOnboardingStaff();
  }

  protected resetUpdateOnboardingStaffResult() {
    this.resetUpdateOnboardingStaffResult$.next();
  }

  protected openEditStaffDetailsForm(onboardingStaffMember: OnboardingStaffWithContractDates) {
    this.onboardingForms[onboardingStaffMember.upn] = this.createOnboardingFormGroupForStaffMember(onboardingStaffMember);
    this.selectedStaffUPN$.next(onboardingStaffMember.upn);
  }

  protected onboardStaffMember(row: OnboardingStaffWithContractDates) {
    this.executeWithOnboardingFormValidation(this.onboardingForms[row.upn], () => {
      if (this.onboardingForms[row.upn].valid) {
        this.updateOnboardingStaff(this.onboardingForms[row.upn], row, true);
      } else {
        this.snackBar.open('Please ensure all fields are correctly filled in', 'Close', {
          duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION,
        });
      }
    });
  }

  private updateOnboardingStaff(staffOnboardingFormGroup: StaffOnboardingFormGroup, onboardingStaffMember: OnboardingStaffWithContractDates, setStaffMemberAsActive: boolean) {
    const forceUseDefaults = setStaffMemberAsActive; // We want to force the use of defaults (if no value was provided) when setting the staff member as active
    const staffUpdateFields = this.mapFormValuesToStaffUpdateFieldsIfTouched(staffOnboardingFormGroup, forceUseDefaults);
    if (Object.values(staffUpdateFields).some(value => value !== undefined)) {
      this.updateOnboardingStaff$.next({ upn: this.selectedStaffUPN$.value, staffUpdateFields, setStaffMemberAsActive, formGroup: staffOnboardingFormGroup });
    } else {
      // if the values are all undefined, avoid making an unnecessary request to the server
    }
  }

  protected executeWithOnboardingFormValidation(staffOnboardingFormGroup: StaffOnboardingFormGroup, callback: () => void) {
    staffOnboardingFormGroup.setValidators([this.onboardingAllowedFormValidator()]);
    staffOnboardingFormGroup.updateValueAndValidity();

    callback();

    staffOnboardingFormGroup.setErrors(staffOnboardingFormGroup.errors);
    staffOnboardingFormGroup.clearValidators();
  }

  private createOnboardingFormGroupForStaffMember(onboardingStaffMember: OnboardingStaffWithContractDates): StaffOnboardingFormGroup {

    const basicStaffDetails = new FormGroup<BasicStaffDetailsFormControls>({
      department: new FormControl<string>(onboardingStaffMember.department, [this.valueIsAllowedValidator(this.units.map(unit => unit.unit))]),
      manager: new FormControl<string>(onboardingStaffMember.manager, [this.valueIsAllowedValidator(this.reviewers.map(reviewer => reviewer.upn))]),
      officeId: new FormControl<number>(onboardingStaffMember.officeId),
      companyEntityId: new FormControl<number>(onboardingStaffMember.companyEntityId),
      employmentDate: new FormControl<Moment>(
        onboardingStaffMember.employmentDate ? moment(onboardingStaffMember.employmentDate) : undefined, [
          this.minimumDateValidator(this.onboardingStaffFormControlRestrictions.basicStaffDetails.employmentDate.minimumDate), 
          this.maximumDateValidator(this.onboardingStaffFormControlRestrictions.basicStaffDetails.employmentDate.maximumDate)
        ]
      ),
      staffType: new FormControl<ActiveStaffType>(onboardingStaffMember.staffType ?? "Permanent")
    });

    const permanentStaffDetails = new FormGroup<PermanentStaffFormControls>({
      probationaryReviewDate: new FormControl<Moment>(
        onboardingStaffMember.staffType === "Permanent" && onboardingStaffMember.probationaryReviewDate ? moment(onboardingStaffMember.probationaryReviewDate) : undefined,
        onboardingStaffMember.staffType === "Permanent" ? [
          Validators.required, 
          this.minimumDateValidator(this.onboardingStaffFormControlRestrictions.permanentStaffDetails.probationaryReviewDate.minimumDate),
        ] : []
      )
    });

    const contractStaffDetails = new FormGroup<ContractStaffFormControls>({
      contractStartDate: new FormControl<Moment>(
        onboardingStaffMember.staffType === "Contract" && onboardingStaffMember.contractStartDate ? moment(onboardingStaffMember.contractStartDate) : undefined,
        onboardingStaffMember.staffType === "Contract" ? [
          Validators.required, 
          this.minimumDateValidator(this.onboardingStaffFormControlRestrictions.contractStaffDetails.contractStartDate.minimumDate),
        ] : []
      ),
      contractEndDate: new FormControl<Moment>(
        onboardingStaffMember.staffType === "Contract" && onboardingStaffMember.contractEndDate ? moment(onboardingStaffMember.contractEndDate) : undefined,
        onboardingStaffMember.staffType === "Contract" ? [Validators.required] : []
      ),
      contractReviewDate: new FormControl<Moment>(
        onboardingStaffMember.staffType === "Contract" && onboardingStaffMember.contractReviewDate ? moment(onboardingStaffMember.contractReviewDate) : undefined,
        onboardingStaffMember.staffType === "Contract" ? [Validators.required] : []
      )
    });

    const form = new FormGroup<OnboardingFormControlGroups>({
      basicStaffDetails: basicStaffDetails,
      permanentStaffDetails: permanentStaffDetails,
      contractStaffDetails: contractStaffDetails
    });

    this.setUpAutoSaveSubscription(form, onboardingStaffMember);
    this.setUpAutoCompleteSubscriptions(form);
    this.setUpStaffTypeSubscriptions(form);

    return form;
  }

  private setUpAutoSaveSubscription(form: StaffOnboardingFormGroup, onboardingStaffMember: OnboardingStaffWithContractDates) {
    this.dataSubscriptions.add(
      form.valueChanges.pipe(
        debounceTime(this.environmentService.getConfiguratonValues().FEEDBACK_FORM_DEBOUNCE_THRESHOLD_IN_MILLISECONDS),
        startWith(form.value),
        distinctUntilChanged((prev, curr) => !this.onboardingFormHasChanged([prev, curr])),
        filter(() => form.valid),
      ).subscribe(() => this.updateOnboardingStaff(form, onboardingStaffMember, false))
    );
  }

  private onboardingFormHasChanged(formChanges: [Partial<StaffOnboardingFormGroup['value']>, Partial<StaffOnboardingFormGroup['value']>]): boolean {
    const [previousForm, currentForm] = formChanges;

    const changedFields = Object.keys(previousForm).filter(group =>
      Object.entries(previousForm[group as keyof StaffOnboardingFormGroup['value']])
        .some(([fieldName, previousValue]) =>
          moment.isMoment(previousValue) ?
            previousValue.isSame(currentForm[group][fieldName])
            : previousValue !== currentForm[group][fieldName])
    );

    return changedFields.length > 0;
  }

  private setUpAutoCompleteSubscriptions(form: StaffOnboardingFormGroup) {
    this.dataSubscriptions.add(form.controls.basicStaffDetails.controls.department.valueChanges.subscribe(value => {
      const query = (value || '').toLowerCase();
      this.filteredUnits = this.units.filter(unit => unit.unit.toLowerCase().includes(query));
    }));

    this.dataSubscriptions.add(form.controls.basicStaffDetails.controls.manager.valueChanges.subscribe(value => {
      const query = (value || '').toLowerCase();
      this.filteredReviewers = this.reviewers.filter(reviewer => reviewer.upn.toLowerCase().includes(query));
    }));
  }

  private setUpStaffTypeSubscriptions(form: StaffOnboardingFormGroup) {
    this.dataSubscriptions.add(form.controls.basicStaffDetails.controls.staffType.valueChanges.subscribe(value => {
      this.updateDateFieldValidatorsBasedOnStaffType(form, value);
    }));
  }

  private resetFormStateToUntouched(form: StaffOnboardingFormGroup) {
    form.markAsUntouched();
    form.markAsPristine();
    Object.values(form.controls).forEach(control => {
      control.markAsUntouched();
      control.markAsPristine();
    });
  }

  private updateDateFieldValidatorsBasedOnStaffType(form: StaffOnboardingFormGroup, staffType: ActiveStaffType): void {
    const controls = {
      probationary: form.controls.permanentStaffDetails.controls.probationaryReviewDate,
      contractStart: form.controls.contractStaffDetails.controls.contractStartDate,
      contractEnd: form.controls.contractStaffDetails.controls.contractEndDate,
      contractReview: form.controls.contractStaffDetails.controls.contractReviewDate
    };

    Object.values(controls).forEach(control => control.clearValidators());

    // Set validators based on staff type
    if (staffType === 'Permanent') {
      controls.probationary.setValidators([Validators.required]);

      // Set default value for probationary review date if not already set
      if (!controls.probationary.value) {
        controls.probationary.setValue(moment().add(this.defaultMonthsFromEmploymentDateForProbationaryReview, 'months'));
      }
    } else if (staffType === 'Contract') {
      controls.contractStart.setValidators([Validators.required]);
      controls.contractEnd.setValidators([Validators.required]);
      controls.contractReview.setValidators([Validators.required]);
    }

    // Update validity for all controls
    Object.values(controls).forEach(control => control.updateValueAndValidity());

    // Mark appropriate controls as touched
    if (staffType === 'Permanent') {
      controls.probationary.markAsTouched();
    } else if (staffType === 'Contract') {
      controls.contractStart.markAsTouched();
      controls.contractEnd.markAsTouched();
      controls.contractReview.markAsTouched();
    } else {
      // No staff type selected - mark all as untouched
      Object.values(controls).forEach(control => control.markAsUntouched());
    }
  }

  private onboardingAllowedFormValidator(): ValidatorFn {
    return (staffOnboardingFormGroup: StaffOnboardingFormGroup): ValidationErrors => {
      const requiredFields: (keyof OnboardingFormControlGroups)[] = [
        'basicStaffDetails',
        ...(staffOnboardingFormGroup.controls.basicStaffDetails.controls.staffType.value === 'Permanent' ? ['permanentStaffDetails'] as const : []),
        ...(staffOnboardingFormGroup.controls.basicStaffDetails.controls.staffType.value === 'Contract' ? ['contractStaffDetails'] as const : [])
      ];

      const missingFields = this.getMissingRequiredFields(staffOnboardingFormGroup, requiredFields);
      const invalidFields = this.getInvalidFields(staffOnboardingFormGroup, requiredFields);

      const errors: ValidationErrors = {
        ...(missingFields.length ? { requiredFieldsMissing: missingFields } : undefined),
        ...(invalidFields.length ? { invalidFields: invalidFields } : undefined)
      };

      return Object.keys(errors).length ? errors : undefined;
    };
  }

  private getMissingRequiredFields(staffOnboardingForm: StaffOnboardingFormGroup, requiredFields: (keyof OnboardingFormControlGroups)[]): string[] {
    return requiredFields
      .flatMap(formGroup => Object.entries(staffOnboardingForm.controls[formGroup].controls))
      .filter(([, control]) => !control.value)
      .map(([controlName,]) => controlName);
  }

  private getInvalidFields(staffOnboardingForm: StaffOnboardingFormGroup, requiredFields: (keyof OnboardingFormControlGroups)[]): string[] {
    return requiredFields
      .flatMap(formGroup => Object.entries(staffOnboardingForm.controls[formGroup].controls))
      .filter(([, control]) => Object.keys(control.errors ?? {}).length > 0)
      .map(([controlName,]) => controlName);
  }

  private mapFormValuesToStaffUpdateFieldsIfTouched(staffOnboardingForm: StaffOnboardingFormGroup, forceUseDefaults = false): StaffUpdateFields {
    const formGroups: Record<keyof OnboardingFormControlGroups, FormGroup> = {
      permanentStaffDetails: staffOnboardingForm.controls.permanentStaffDetails,
      contractStaffDetails: staffOnboardingForm.controls.contractStaffDetails,
      basicStaffDetails: staffOnboardingForm.controls.basicStaffDetails,
    };

    return Object.entries(formGroups).reduce((acc, [, formGroup]) => {
      return Object.entries(formGroup.controls).reduce((acc, [fieldName, control]) => {
        const isTouched = control.touched;
        const isDate = moment.isMoment(control.value);
        const value = isDate ? control.value.toDate() : control.value;

        return {
          ...acc,
          [fieldName]: isTouched || (!isTouched && forceUseDefaults) ? value : undefined
        };
      }, acc);
    }, {});
  }

  protected generateSupportEmailForFetchingOnboardingStaffMembers(errorMessage: string) {
    const subject = encodeURIComponent(`Error fetching onboarding staff members`);
    const body = encodeURIComponent(`Hi, \n\nI was trying to fetch onboarding staff members, but it failed with the following error: ${errorMessage}. \n\nPlease can you assist? \n\nKind regards,`);
    return `mailto:reviews-support@bbd.co.za?subject=${subject}&body=${body}`;
  }

  private valueIsAllowedValidator<T extends string>(allowedValues: T[]): ValidatorFn {
    return (control: AbstractControl<T>): ValidationErrors => {
      const isAllowed = control.value?.toLowerCase() && allowedValues.map(value => value.toLowerCase()).includes(control.value.toLowerCase());
      return isAllowed ? undefined : { invalidSelection: { value: control.value } };
    };
  }

  private minimumDateValidator(minimumDate: Moment): ValidatorFn {
    return (control: AbstractControl<Moment>): ValidationErrors => {
      return control.value && control.value.isBefore(minimumDate) ? { minimumDate: { value: control.value } } : undefined;
    };
  }

  private maximumDateValidator(maximumDate: Moment): ValidatorFn {
    return (control: AbstractControl<Moment>): ValidationErrors => {
      return control.value && control.value.isAfter(maximumDate) ? { maximumDate: { value: control.value } } : undefined;
    };
  }

  ngOnDestroy() {
    this.dataSubscriptions.unsubscribe();
  }
}
