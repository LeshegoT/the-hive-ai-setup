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
import { Certification, InstitutionForRatification, SkillsService, UsersWithSkills } from '../../services/skills.service';

@Component({
    selector: 'app-users-with-certification-for-institution',
    templateUrl: './users-with-certification-for-institution.component.html',
    styleUrls: ['./users-with-certification-for-institution.component.css'],
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
export class UsersWithCertificationForInstitutionComponent {
  @Input() certification: Certification;
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
    this.skillsService.getCertificationConnectedUsersForInstitution(this.certification.certificationId, this.institution.canonicalName).subscribe((details) => {
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

  ratifyCertificationAvailableAtInstitution() {
    const institutions = [
      ...this.certification.institutions,
      this.institution
    ].map(institution => ({
      ...institution,
      canonicalNameGuid: institution.institutionId.toString()
    }));
    this.skillsService.ratifyAttribute(
      this.certification.standardizedName,
      this.certification.canonicalName,
      institutions
    ).subscribe({
        next: () => {
          this.institution.needsRatification = false;
          this.certification.needsRatification = this.certification.needsRatification ? false : this.certification.needsRatification;
        },
        error: (_error) => {
          this.snackBar.open(`${this.certification.canonicalName} could not be approved`, 'Dismiss', { duration: this.snackBarDuration });
        }
      });
  }
}
