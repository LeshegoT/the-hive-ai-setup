import { CommonModule } from '@angular/common';
import { Component, effect, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompanyEntity } from '@the-hive/lib-shared';
import { Moment } from 'moment';
import { catchError, map, Observable, of, shareReplay, startWith } from 'rxjs';
import { CompanyEntityService } from '../../../../services/company-entities.service';
import { StaffMemberCorrectionResult } from '../../../../components/unit-corrections-page/unit-corrections-page';
import { provideMaterialDatePickerConfiguration } from '../../../../pipes/date-format.pipe';
import { UnitCorrectionsService } from '../../../../services/unit-corrections.service';
import { Person } from '../../../../shared/interfaces';

export type CompanyEntityCorrectionFormControls = {
  companyEntity: FormControl<CompanyEntity | undefined>;
  startDate: FormControl<Moment>;
};

@Component({
  selector: 'app-company-entity-correction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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
  templateUrl: './company-entity-correction-form.component.html',
  styleUrl: '../staff-member-update-forms.shared.css'
})
export class CompanyEntityCorrectionFormComponent implements OnInit {
  selectedStaffMember = input<Person>();
  companyEntityCorrection = output<Observable<StaffMemberCorrectionResult>>();
  companyEntityCorrectionsForm: FormGroup<CompanyEntityCorrectionFormControls>;

  allCompanyEntities$: Observable<CompanyEntity[]>;

  constructor(private readonly unitCorrectionService: UnitCorrectionsService, private readonly companyEntityService: CompanyEntityService) {
    this.companyEntityCorrectionsForm = new FormGroup<CompanyEntityCorrectionFormControls>({
      companyEntity: new FormControl<CompanyEntity>(undefined, { nonNullable: true, validators: [Validators.required] }),
      startDate: new FormControl<Moment>(undefined, { validators: [Validators.required] }),
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
    this.allCompanyEntities$ = this.companyEntityService.getAllCompanyEntities().pipe(shareReplay(1));
  }

  submit(): void {
    if (this.companyEntityCorrectionsForm.valid) {
      const { companyEntity, startDate } = this.companyEntityCorrectionsForm.controls;
      const upn = this.selectedStaffMember()?.userPrincipleName;
      const selectedCompanyEntity = companyEntity.value;

      if (selectedCompanyEntity) {
        const staffCompanyEntityUpdate$ = this.unitCorrectionService
          .updateStaffCompanyEntity(upn, { companyEntityId: selectedCompanyEntity.companyEntityId, effectiveFrom: startDate.value.toDate() })
          .pipe(
            map(() => ({ status: 'success', corrections: { companyEntity: selectedCompanyEntity } } as const)),
            catchError((error: string) => of({ status: 'error', errorMessage: error, correctionType: 'company entity' } as const)),
            startWith({ status: 'pending' } as const),
            shareReplay(1)
          );
        this.companyEntityCorrection.emit(staffCompanyEntityUpdate$);
      } else {
        // no company entity selected, this should not happen due to form validation
      }
    } else {
      this.companyEntityCorrectionsForm.markAllAsTouched();
    }
  }

  private resetForm(): void {
    this.companyEntityCorrectionsForm.reset();
    this.companyEntityCorrectionsForm.controls.companyEntity.setErrors(undefined);
    this.companyEntityCorrectionsForm.controls.startDate.setErrors(undefined);
    this.companyEntityCorrectionsForm.markAsUntouched();
  }
}
