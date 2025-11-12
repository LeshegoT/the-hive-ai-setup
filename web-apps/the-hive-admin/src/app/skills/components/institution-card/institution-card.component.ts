import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { InstitutionForRatification, SkillsService } from '../../services/skills.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnvironmentService } from '../../../services/environment.service';
import { ConnectedQualificationDetailsComponent } from '../connected-qualification-details/connected-qualification-details.component';
import { ConnectedCertificationDetailsComponent } from '../connected-certification-details/connected-certification-details.component';
import { InstitutionType } from '@the-hive/lib-skills-shared';

@Component({
    selector: 'app-institution-card',
    templateUrl: './institution-card.component.html',
    styleUrls: ['./institution-card.component.css'],
    imports: [
        CommonModule,
        MatCardModule,
        MatChipsModule,
        MatButtonModule,
        MatFormField,
        MatSelectModule,
        MatInputModule,
        ReactiveFormsModule,
        MatIconModule,
        ConnectedQualificationDetailsComponent,
        ConnectedCertificationDetailsComponent
    ]
})
export class InstitutionCardComponent implements OnInit {
  @Input() institution: InstitutionForRatification
  @Output() reloadInstitutions = new EventEmitter<void>();
  institutionType: InstitutionType = "Tertiary Education";
  editableInstitutionName: string | undefined;
  institutionNameControl: FormControl;
  newInstitutionName: string | undefined;
  snackBarDuration: number;
  
  constructor(
    private skillService: SkillsService,
    private snackBar: MatSnackBar,
    private environmentService: EnvironmentService
    ) {}

  ngOnInit() {
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this.institutionNameControl = new FormControl(this.institution.canonicalName, [Validators.required]);
  }

  approveInstitution() {
    const qualificationsNeedRatification = this.institution.qualifications.some(
      (qualification) => qualification.needsRatification
    );

    const certificationsNeedRatification = this.institution.certifications.some(
      (certification) => certification.needsRatification
    );

    if (qualificationsNeedRatification || certificationsNeedRatification) {
      this.snackBar.open(`All connected qualifications and certifications must be ratified`, 'Dismiss', { duration: this.snackBarDuration });
    } else {
      this.skillService.updateInstitution(this.institution.standardizedName, false, this.institutionType, this.newInstitutionName)
      .subscribe({
        next: () => {
          this.reloadInstitutions.emit();
        },
        error: (_error) => {
          this.snackBar.open(`${this.institution.canonicalName} could not be approved`, 'Dismiss', { duration: this.snackBarDuration });
        }
      });
    }
  }

  editInstitutionName() {
    this.editableInstitutionName = this.institution.canonicalName;
    this.institutionNameControl.setValue(this.editableInstitutionName);
  }

  saveEdit() {
    if (this.institutionNameControl.valid)  {
      this.institution.canonicalName = this.editableInstitutionName;
      this.newInstitutionName = this.institution.canonicalName;
      this.editableInstitutionName = undefined;
    } else {
      // Error message is shown when the field is empty 
    }
  }

  cancelEdit() {
    this.editableInstitutionName = undefined;
  }
}