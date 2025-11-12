import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Moment } from 'moment';
import { Observable, catchError, map, of, shareReplay, startWith, switchMap } from 'rxjs';
import { StaffMemberCorrectionResult } from '../../../../components/unit-corrections-page/unit-corrections-page';
import { provideMaterialDatePickerConfiguration } from '../../../../pipes/date-format.pipe';
import { ReportService } from '../../../../services/report.service';
import { UnitCorrectionsService } from '../../../../services/unit-corrections.service';
import { Person } from '../../../../shared/interfaces';

export type UnitCorrectionFormControls = {
  unit: FormControl<string>;
  startDate: FormControl<Moment>;
  reviewerUpn: FormControl<string>;
};

@Component({
  selector: 'app-unit-correction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  providers: [
    provideMaterialDatePickerConfiguration(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic'
      }
    }
  ],
  templateUrl: './unit-correction-form.component.html',
  styleUrl: '../staff-member-update-forms.shared.css'
})
export class UnitCorrectionFormComponent implements OnInit {
  selectedStaffMember = input<Person>();
  unitCorrection = output<Observable<StaffMemberCorrectionResult>>();

  allUnits$: Observable<string[]>;
  allStaff$: Observable<Person[]>;
  filteredUnits$: Observable<string[]>;
  filteredStaff$: Observable<Person[]>;
  unitCorrectionsForm: FormGroup<UnitCorrectionFormControls>;

  constructor(
    private readonly unitCorrectionService: UnitCorrectionsService,
    private readonly reportService: ReportService
  ) {
    this.unitCorrectionsForm = new FormGroup<UnitCorrectionFormControls>({
      unit: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      startDate: new FormControl<Moment>(undefined, { validators: [Validators.required] }),
      reviewerUpn: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] })
    });

    effect(() => {
      const staff = this.selectedStaffMember();
      if (staff) {
        this.resetForm();
      } else {
        // no selected staff; the form will be destroyed by the parent condition
      }
    });

  }

  ngOnInit(): void {
    this.allUnits$ = this.unitCorrectionService.getUnits().pipe(
      map(units => units.map(unitWithDescription => unitWithDescription.unit).sort((a, b) => a.localeCompare(b))),
      shareReplay(1)
    );

    this.allStaff$ = this.reportService.getAllStaffOnRecord().pipe(
      shareReplay(1)
    );

    this.filteredUnits$ = this.unitCorrectionsForm.controls.unit.valueChanges.pipe(
      startWith(''),
      switchMap(search => this.filterUnits(search))
    );

    this.filteredStaff$ = this.unitCorrectionsForm.controls.reviewerUpn.valueChanges.pipe(
      startWith(''),
      switchMap(search => this.filterManagers(search))
    );

  }

  submit(): void {
    if (this.unitCorrectionsForm.valid) {
      const { unit, reviewerUpn, startDate } = this.unitCorrectionsForm.controls;
      const upn = this.selectedStaffMember()?.userPrincipleName;
      const staffDepartmentUpdate$ = this.unitCorrectionService
        .updateStaffDepartment(upn, unit.value, reviewerUpn.value, startDate.value.toDate())
        .pipe(
          map(() => ({ status: 'success' } as const)),
          catchError((error: string) => of({ status: 'error', errorMessage: error, correctionType: 'unit' } as const)),
          startWith({ status: 'pending' } as const),
          shareReplay(1)
        );
      this.unitCorrection.emit(staffDepartmentUpdate$);
    } else {
      this.unitCorrectionsForm.markAllAsTouched();
    }
  }

  private filterUnits(value?: string): Observable<string[]> {
    const allUnits$ = this.allUnits$;
    if (!allUnits$) {
      return new Observable<string[]>(subscriber => {
        subscriber.next([]);
        subscriber.complete();
      });
    } else {
      if (!value) {
        return allUnits$;
      } else {
        const filterValue = value.toLowerCase();
        return allUnits$.pipe(map(units => units.filter(unit => unit.toLowerCase().includes(filterValue))));
      }
    }
  }

  private filterManagers(value?: string): Observable<Person[]> {
    const allStaff$ = this.allStaff$;
    if (!allStaff$) {
      return new Observable<Person[]>(subscriber => {
        subscriber.next([]);
        subscriber.complete();
      });
    } else {
      if (!value) {
        return allStaff$;
      } else {
        const filterValue = value.toLowerCase();
        return allStaff$.pipe(
          map(managers => managers.filter(manager => manager.displayName.toLowerCase().includes(filterValue) || manager.userPrincipleName.toLowerCase().includes(filterValue)))
        );
      }
    }
  }

  private resetForm(): void {
    this.unitCorrectionsForm.reset();
    this.unitCorrectionsForm.controls.unit.setErrors(undefined);
    this.unitCorrectionsForm.controls.startDate.setErrors(undefined);
    this.unitCorrectionsForm.controls.reviewerUpn.setErrors(undefined);
    this.unitCorrectionsForm.markAsUntouched();
  }
}
