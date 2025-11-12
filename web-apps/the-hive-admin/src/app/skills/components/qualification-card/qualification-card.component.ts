import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { Qualification, SkillsService } from '../../services/skills.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnvironmentService } from '../../../services/environment.service';
import { UsersWithQualificationForInstitutionComponent } from '../users-with-qualification-for-institution/users-with-qualification-for-institution.component';
import { switchMap } from 'rxjs';

@Component({
    selector: 'app-qualification-card',
    templateUrl: './qualification-card.component.html',
    styleUrls: ['./qualification-card.component.css'],
    imports: [
        CommonModule,
        MatCardModule,
        MatChipsModule,
        MatButtonModule,
        ReactiveFormsModule,
        MatIconModule,
        MatInputModule,
        UsersWithQualificationForInstitutionComponent
    ]
})
export class QualificationCardComponent implements OnInit {
  @Input() qualification: Qualification
  @Output() reloadQualifications = new EventEmitter<void>();
  qualificationNameControl: FormControl | undefined;
  snackBarDuration: number;

  constructor(
    private skillService: SkillsService,
    private snackBar: MatSnackBar,
    private environmentService: EnvironmentService
  ) {}

  ngOnInit() {
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
  }
 
  ratifyQualification() {
    this.skillService.ratifyAttribute(
      this.qualification.standardizedName,
      this.qualification.canonicalName,
    ).subscribe({
        next: () => {
          this.reloadQualifications.emit();
        },
        error: (_error) => {
          this.snackBar.open(`${this.qualification.canonicalName} could not be ratified`, 'Dismiss', { duration: this.snackBarDuration });
        }
      });
  }

  editQualificationName() {
    this.qualificationNameControl = new FormControl(this.qualification.canonicalName, [Validators.required]);
  }

  saveEdit() {
    if (this.qualificationNameControl.valid)  {
      this.qualification.canonicalName = this.qualificationNameControl.value
      this.qualificationNameControl = undefined;
    } else {
      // Error message is shown when the field is empty 
    }
  }

  cancelEdit() {
    this.qualificationNameControl = undefined;
  }
}