import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { SkillsProfile } from '@the-hive/lib-skills-shared';
import { Person } from '../../../shared/interfaces';
import { ProfilesService } from '../../../skills/services/skills-profiles.service';
import { Observable } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

export interface DialogData {
  selectedStaffMember: Person;
  selectedProfile: SkillsProfile;
}

@Component({
    selector: 'profile-dialog',
    templateUrl: 'profile-dialog.component.html',
    styleUrls: ['./profile-dialog.component.css'],
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatButtonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatSelect, 
        AsyncPipe,
        MatOptionModule,
        MatIconModule
    ],
})
export class ProfileDialog implements OnInit   {
    readonly dialogRef = inject(MatDialogRef<ProfileDialog>);
    readonly data = inject<DialogData>(MAT_DIALOG_DATA);
    selectedProfileId: number | undefined = undefined;
    skillsProfiles$: Observable<SkillsProfile[]>;

    constructor(private readonly profilesService: ProfilesService) {
    }

    onCancelClick(): void {
        this.dialogRef.close({ cancelled: true });
    }

    onOkClick(): void {
        this.dialogRef.close({ profileId: this.selectedProfileId });
    }

    onGenerateWithoutProfile(): void {
        this.dialogRef.close({ profileId: undefined });
    }

    ngOnInit(): void {
        this.skillsProfiles$ = this.profilesService.getSkillProfiles(this.data.selectedStaffMember.userPrincipleName);
    }
}