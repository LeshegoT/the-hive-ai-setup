import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { Certification, InstitutionForRatification, SkillsService, UsersWithSkills } from '../../services/skills.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SkillsProofDownloadService } from '../../services/skills-proof-download.service';

@Component({
    selector: 'app-connected-certification-details',
    templateUrl: './connected-certification-details.component.html',
    styleUrls: ['./connected-certification-details.component.css'],
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatIconModule,
        MatTableModule,
        MatExpansionModule,
        MatProgressSpinnerModule,
        MatChipsModule
    ]
})
export class ConnectedCertificationDetailsComponent {
  @Input() certification: Certification;
  connectedStaff: UsersWithSkills[] | undefined = undefined; 
  displayedColumns: Array<keyof UsersWithSkills> =  ['staffId', 'email', 'proof'];
  @Input() institution: InstitutionForRatification;
  @Input() snackBarDuration: number;

  constructor(
    private skillsService: SkillsService,
    private snackBar: MatSnackBar,
    private proofDownloadService: SkillsProofDownloadService
  ) {}

  loadCertificationUserDetails() {
    this.skillsService.getCertificationConnectedUsersForInstitution(this.certification.certificationId, this.institution.canonicalName).subscribe((details) => {
      this.connectedStaff = details;
    });
  }

  downloadCertificationProof(staff: UsersWithSkills, fileName: string) {
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

  ratifyCertification() { 
    this.skillsService.ratifyAttribute(
      this.certification.standardizedName,
      this.certification.canonicalName,
      [{...this.institution,canonicalNameGuid:this.institution.institutionId.toString()}]
    )
      .subscribe({
        next: () => {
          this.certification.needsRatification = false;
        },
        error: (_error) => {
          this.snackBar.open(`${this.certification.canonicalName} could not be approved`, 'Dismiss', { duration: this.snackBarDuration });
        }
      });
  }
}