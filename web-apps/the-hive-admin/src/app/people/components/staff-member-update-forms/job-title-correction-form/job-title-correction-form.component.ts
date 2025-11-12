import { CommonModule } from '@angular/common';
import { Component, effect, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, map, Observable, of, shareReplay, startWith, switchMap } from 'rxjs';
import { StaffMemberCorrectionResult } from '../../../../components/unit-corrections-page/unit-corrections-page';
import { UnitCorrectionsService } from '../../../../services/unit-corrections.service';
import { Person } from '../../../../shared/interfaces';

export type JobTitleCorrectionFormControls = {
  jobTitle: FormControl<string>;
};

@Component({
  selector: 'app-job-title-correction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic'
      }
    }
  ],
  templateUrl: './job-title-correction-form.component.html',
  styleUrl: '../staff-member-update-forms.shared.css'
})
export class JobTitleCorrectionFormComponent implements OnInit {
  selectedStaffMember = input<Person>();
  jobTitleCorrection = output<Observable<StaffMemberCorrectionResult>>();
  jobTitleCorrectionsForm: FormGroup<JobTitleCorrectionFormControls>;

  allJobTitles$: Observable<string[]>;
  filteredJobTitles$: Observable<string[]>;

  constructor(private readonly unitCorrectionService: UnitCorrectionsService) {
    this.jobTitleCorrectionsForm = new FormGroup<JobTitleCorrectionFormControls>({
      jobTitle: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
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
    this.allJobTitles$ = this.unitCorrectionService.getJobTitles().pipe(shareReplay(1));
    this.filteredJobTitles$ = this.jobTitleCorrectionsForm.controls.jobTitle.valueChanges.pipe(
      startWith(''),
      switchMap(search => this.filterJobTitles(search))
    );
  }

  submit(): void {
    if (this.jobTitleCorrectionsForm.valid) {
      const { jobTitle } = this.jobTitleCorrectionsForm.controls;
      const upn = this.selectedStaffMember()?.userPrincipleName;
      const staffJobTitleUpdate$ = this.unitCorrectionService
        .updateStaffJobTitle(upn, jobTitle.value)
        .pipe(
          map(() => ({ status: 'success', corrections: { jobTitle: jobTitle.value } } as const)),
          catchError((error: string) => of({ status: 'error', errorMessage: error, correctionType: 'job title' } as const)),
          startWith({ status: 'pending' } as const),
          shareReplay(1)
        );
      this.jobTitleCorrection.emit(staffJobTitleUpdate$);
    } else {
      this.jobTitleCorrectionsForm.markAllAsTouched();
    }
  }

  private filterJobTitles(value?: string): Observable<string[]> {
    if (!value) {
      return this.allJobTitles$;
    } else {
      const filterValue = value.toLowerCase();
      return this.allJobTitles$.pipe(
        map(jobTitles => jobTitles.filter(jobTitle =>
          jobTitle.toLowerCase().includes(filterValue)
        ))
      );
    }
  }

  private resetForm(): void {
    this.jobTitleCorrectionsForm.reset();
    this.jobTitleCorrectionsForm.controls.jobTitle.setErrors(undefined);
    this.jobTitleCorrectionsForm.markAsUntouched();
  }
}
