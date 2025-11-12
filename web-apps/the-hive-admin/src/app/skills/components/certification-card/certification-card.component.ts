import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { Certification, SkillsService } from '../../services/skills.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnvironmentService } from '../../../services/environment.service';
import { UsersWithCertificationForInstitutionComponent } from '../users-with-certification-for-institution/users-with-certification-for-institution.component';
import { switchMap } from 'rxjs';

@Component({
    selector: 'app-certification-card',
    templateUrl: './certification-card.component.html',
    styleUrls: ['./certification-card.component.css'],
    imports: [
        CommonModule,
        MatCardModule,
        MatChipsModule,
        MatButtonModule,
        ReactiveFormsModule,
        MatIconModule,
        MatInputModule,
        UsersWithCertificationForInstitutionComponent
    ]
})
export class CertificationCardComponent implements OnInit {
  @Input() certification: Certification
  @Output() reloadCertifications = new EventEmitter<void>();
  certificationNameControl: FormControl | undefined;
  snackBarDuration: number;

  constructor(
    private skillService: SkillsService,
    private snackBar: MatSnackBar,
    private environmentService: EnvironmentService
  ) {}

  ngOnInit() {
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
  }

  ratifyCertification() {
    this.skillService.ratifyAttribute(
      this.certification.standardizedName,
      this.certification.canonicalName,
    ).subscribe({
        next: () => {
          this.reloadCertifications.emit();
        },
        error: (_error) => {
          this.snackBar.open(`${this.certification.canonicalName} could not be approved`, 'Dismiss', { duration: this.snackBarDuration });
        }
      });
  }

  editCertificationName() {
    this.certificationNameControl = new FormControl(this.certification.canonicalName, [Validators.required]);
  }

  saveEdit() {
    if (this.certificationNameControl.valid)  {
      this.certification.canonicalName = this.certificationNameControl.value
      this.certificationNameControl = undefined;
    } else {
      // Error message is shown when the field is empty 
    }
  }

  cancelEdit() {
    this.certificationNameControl = undefined;
  }
}