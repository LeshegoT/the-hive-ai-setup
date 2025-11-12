import { CommonModule } from '@angular/common';
import { Component, effect, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Office } from '@the-hive/lib-shared';
import { catchError, map, Observable, of, shareReplay, startWith } from 'rxjs';
import { OfficeService } from 'web-apps/the-hive-admin/src/app/services/offices-service';
import { StaffMemberCorrectionResult } from '../../../../components/unit-corrections-page/unit-corrections-page';
import { UnitCorrectionsService } from '../../../../services/unit-corrections.service';
import { Person } from '../../../../shared/interfaces';

export type OfficeCorrectionFormControls = {
  office: FormControl<Office | undefined>;
};

@Component({
  selector: 'app-office-correction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatSelectModule
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic'
      }
    }
  ],
  templateUrl: './office-correction-form.component.html',
  styleUrl: '../staff-member-update-forms.shared.css'
})
export class OfficeCorrectionFormComponent implements OnInit {
  selectedStaffMember = input<Person>();
  officeCorrection = output<Observable<StaffMemberCorrectionResult>>();
  officeCorrectionsForm: FormGroup<OfficeCorrectionFormControls>;

  allOffices$: Observable<Office[]>;

  constructor(private readonly unitCorrectionService: UnitCorrectionsService, private readonly officeService: OfficeService) {
    this.officeCorrectionsForm = new FormGroup<OfficeCorrectionFormControls>({
      office: new FormControl<Office>(undefined, { nonNullable: true, validators: [Validators.required] }),
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
    this.allOffices$ = this.officeService.retrieveAllOffices().pipe(shareReplay(1));
  }

  submit(): void {
    if (this.officeCorrectionsForm.valid) {
      const selectedOffice = this.officeCorrectionsForm.controls.office.value;
      const upn = this.selectedStaffMember()?.userPrincipleName;

      const staffOfficeUpdate$ = this.unitCorrectionService.updateStaffOffice(upn, selectedOffice.officeId).pipe(
        map(() => ({ status: 'success', corrections: { office: selectedOffice.officeName } } as const)),
        catchError((error: string) => of({ status: 'error', errorMessage: error, correctionType: 'office' } as const)),
        startWith({ status: 'pending' } as const),
        shareReplay(1)
      );
      this.officeCorrection.emit(staffOfficeUpdate$);
    } else {
      this.officeCorrectionsForm.markAllAsTouched();
    }
  }

  private resetForm(): void {
    this.officeCorrectionsForm.reset();
    this.officeCorrectionsForm.controls.office.setErrors(undefined);
    this.officeCorrectionsForm.markAsUntouched();
  }
}
