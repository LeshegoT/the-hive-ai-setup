import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllStaffComponent, AllStaffComponentAction } from '../../people/components/all-staff/all-staff.component';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { People } from '../stats-line-graph/stats-line-graph.component';
import { StaffProfileComponent } from '../staff-profile/staff-profile.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideMaterialDatePickerConfiguration } from '../../pipes/date-format.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { SharedModule } from "../../shared.modules";
import { Person } from '../../shared/interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnvironmentService } from '../../services/environment.service';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UnitCorrectionFormComponent } from '../../people/components/staff-member-update-forms/unit-correction-form/unit-correction-form.component';
import { ErrorCardComponent } from '../error-card/error-card.component';
import { JobTitleCorrectionFormComponent } from '../../people/components/staff-member-update-forms/job-title-correction-form/job-title-correction-form.component';
import { OfficeCorrectionFormComponent } from '../../people/components/staff-member-update-forms/office-correction-form/office-correction-form.component';
import { CompanyEntity } from '@the-hive/lib-shared';
import { CompanyEntityCorrectionFormComponent } from '../../people/components/staff-member-update-forms/company-entity-correction-form/company-entity-correction-form.component';

type StaffMemberCorrection = { jobTitle?: string; office?: string; companyEntity?: CompanyEntity };

export type StaffMemberCorrectionResult =
  | { status: 'pending' }
  | { status: 'success', corrections?: StaffMemberCorrection }
  | { status: 'error'; errorMessage: string; correctionType: 'unit' | 'job title' | 'office' | 'company entity' };

@Component({
  selector: 'app-unit-corrections-page',
  imports: [
    CommonModule,
    AllStaffComponent,
    StaffProfileComponent,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    SharedModule,
    MatCardModule,
    MatProgressSpinnerModule,
    UnitCorrectionFormComponent,
    ErrorCardComponent,
    JobTitleCorrectionFormComponent,
    OfficeCorrectionFormComponent,
    CompanyEntityCorrectionFormComponent
],
  providers: [provideMaterialDatePickerConfiguration()],
  templateUrl: './unit-corrections-page.html',
  styleUrls: ['./unit-corrections-page.css', '../../shared/shared.css'],
})
export class UnitCorrectionsPageComponent {
  staffTableActions: AllStaffComponentAction[] = ['unitCorrections'];
  selectedStaffMember$ = new BehaviorSubject<People>(undefined);
  staffMemberCorrection$ = new BehaviorSubject<StaffMemberCorrectionResult>(undefined);
  staffMemberDetailsFormsReset$ = new Subject<void>();

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly environmentService: EnvironmentService
  ) { }

  handleStaffMemberCorrection(staffMemberCorrection$: Observable<StaffMemberCorrectionResult>) {
    staffMemberCorrection$.subscribe((correctionResult) => {
      this.staffMemberCorrection$.next(correctionResult);

      if (correctionResult.status === 'success') {
        const staffMember = this.selectedStaffMember$.getValue();
        this.snackBar.open(
          `Unit updated successfully for ${staffMember.displayName}!`, 
          'Close', 
          { duration: this.environmentService.getConfiguratonValues().SNACKBAR_DURATION }
        );
        this.refreshUnitCorrectionPageForSelectedStaffMember(correctionResult.corrections);
      } else {
        // Error and loading state handled in template
      }
    });
  }

  closeUnitCorrectionDetails() {
    this.resetUnitCorrectionForm();
    this.selectedStaffMember$.next(undefined);
  }

  resetUnitCorrectionForm() {
    this.staffMemberDetailsFormsReset$.next();
  }

  refreshUnitCorrectionPageForSelectedStaffMember(correction?: StaffMemberCorrection) {
    const staffMember = this.selectedStaffMember$.getValue();
    const staffMemberWithCorrections: People = {
      ...staffMember,
      jobTitle: correction?.jobTitle ?? staffMember.jobTitle,
      office: correction?.office ?? staffMember.office,
      entityDescription: correction?.companyEntity?.description ?? staffMember.entityDescription
    }
    this.resetUnitCorrectionForm();
    this.staffMemberCorrection$.next(undefined);
    this.selectedStaffMember$.next(staffMemberWithCorrections);
  }

  getManagerDisplayName(manager: Person) {
    return manager.displayName;
  }

  generateSupportEmail(errorMessage: string, correctionType: string) {
    const supportEmail = encodeURIComponent(`Error correcting staff member's ${correctionType} on Unit Corrections page`);
    const supportEmailBody = encodeURIComponent(`Hi team,\n\nI'm having an issue with the Unit Corrections page. I'm trying to correct the ${correctionType} for a staff member, but I'm getting the following error:\n\n${errorMessage}\n\nPlease help me fix this.\n\nThanks,\n`);
    return `mailto:reviews-support@bbd.co.za?subject=${supportEmail}&body=${supportEmailBody}`;
  }
}
