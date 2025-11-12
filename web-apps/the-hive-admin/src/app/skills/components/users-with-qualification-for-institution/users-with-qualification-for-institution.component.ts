import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { SkillsProofDownloadService } from '../../services/skills-proof-download.service';
import { InstitutionForRatification, Qualification, SkillsService, UsersWithSkills } from '../../services/skills.service';

@Component({
    selector: 'app-users-with-qualification-for-institution',
    templateUrl: './users-with-qualification-for-institution.component.html',
    styleUrls: ['./users-with-qualification-for-institution.component.css'],
    imports: [
        CommonModule,
        MatButtonModule,
        MatInputModule,
        MatIconModule,
        MatTableModule,
        MatExpansionModule,
        MatProgressSpinnerModule
    ]
})
export class UsersWithQualificationForInstitutionComponent {
  @Input() qualification: Qualification;
  @Input() institution: InstitutionForRatification;
  usersWithSkills: UsersWithSkills[] | undefined = undefined;
  displayedColumns: Array<keyof UsersWithSkills> =  ['staffId', 'email', 'proof'];
  @Input() snackBarDuration: number;

  constructor(
    private skillsService: SkillsService,
    private snackBar: MatSnackBar,
    private readonly proofDownloadService: SkillsProofDownloadService
  ) {}

  loadUsersWithSkillsDetails() {
    this.skillsService.getUsersWithQualificationForInstitution(this.qualification.qualificationId, this.institution.canonicalName).subscribe((details) => {
      this.usersWithSkills = details;
    });
  }

  downloadProof(staff: UsersWithSkills, fileName: string) {
    this.proofDownloadService.downloadProof(staff.proof, fileName).subscribe({
      next: (message) => {
        this.snackBar.open(message, 'Dismiss', {
          duration: this.snackBarDuration,
        });
      },
      error: (error) => {
        this.snackBar.open(error, 'Dismiss', {
          duration: this.snackBarDuration,
        });
      },
    });
  }

  ratifyQualificationAvailableAtInstitution() {
    const institutions = [
      ...this.qualification.institutions,
      this.institution
    ].map(institution => ({
      ...institution,
      canonicalNameGuid: institution.institutionId.toString()
    }));
    this.skillsService.ratifyAttribute(
      this.qualification.standardizedName,
      this.qualification.canonicalName,
      institutions
    ).subscribe({
        next: () => {
          this.institution.needsRatification = false;
          this.qualification.needsRatification = this.qualification.needsRatification ? false : this.qualification.needsRatification;
        },
        error: (_error) => {
          this.snackBar.open(`${this.qualification.canonicalName} could not be approved`, 'Dismiss', { duration: this.snackBarDuration });
        }
      });
  }
}
