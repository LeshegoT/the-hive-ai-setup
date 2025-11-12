import { Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core'
import { map, Observable, shareReplay } from 'rxjs';
import { Person } from '../../../shared/interfaces';
import { SkillsProfile } from '@the-hive/lib-skills-shared';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfilesService } from '../../services/skills-profiles.service';
import { EnvironmentService } from '../../../services/environment.service';
import { AuthService } from '../../../services/auth.service';

interface TableColumn {
    columnName: string;
    headerName: string;
}

interface SkillsProfilesForm {
  skillsProfile: FormControl<string>;
  shortDescription: FormControl<string>;
  new: FormControl<boolean>;
}

@Component({
    selector: 'app-skills-profiles',
    templateUrl: './skills-profiles.component.html',
    styleUrls: ['./skills-profiles.component.css'],
    imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatNativeDateModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
})

export class SkillsProfilesComponent implements OnInit {
    @ViewChild('formGroupDirective') formGroupDirective: NgForm;
    @Input() selectedStaffMember: Person;
    tableColumns: TableColumn[] = [
        { columnName: 'shortDescription', headerName: 'Short Description'},
        { columnName: 'skillsProfile', headerName: 'Skill Profile' }
    ];
    skillsProfiles$: Observable<SkillsProfile[]>;
    minimumInputText: number;
    skillsProfilesForm: FormGroup<SkillsProfilesForm>;
    saveChanges$: Observable<void>;
    selectedRow: SkillsProfile;
    showForm = false;
    isLoggedInUserMemberOfModifyBioInformationUsers$: Observable<boolean>;

    constructor(private formBuilder: FormBuilder, private skillsProfileService: ProfilesService, private environmentService: EnvironmentService, private authService: AuthService) {
        this.minimumInputText = this.environmentService.getConfiguratonValues().SKILL_MIN_SEARCH_CHARACTERS;

        this.skillsProfilesForm = this.formBuilder.group<SkillsProfilesForm>({
              skillsProfile: this.formBuilder.control('', [Validators.required, Validators.minLength(this.minimumInputText)]),
              shortDescription: this.formBuilder.control('', [Validators.required, Validators.minLength(this.minimumInputText)]),
              new: this.formBuilder.control<boolean>(true)
        });
    }

    ngOnInit(): void {
        this.skillsProfiles$ = this.skillsProfileService.getSkillProfiles(this.selectedStaffMember.userPrincipleName)
        .pipe(
              shareReplay(1)
            );
        this.isLoggedInUserMemberOfModifyBioInformationUsers$ = this.authService.getUserPrincipleName().pipe(
          map(upn => this.environmentService.getConfiguratonValues().MODIFY_BIO_INFORMATION_USERS.includes(upn))
        );
    }

    ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedStaffMember']) {
      this.skillsProfiles$ = this.skillsProfileService.getSkillProfiles(this.selectedStaffMember.userPrincipleName).pipe(
        shareReplay(1)
      );
      if (this.skillsProfilesForm) {
        this.resetForm();
      } else {
        // skillsProfilesForm is not defined
      }
    } else {
      //do nothing, selectedStaffMember did not change
    }
  }

    get columnNames() { return this.tableColumns.map(column => column.columnName); }
    get skillsProfile() { return this.skillsProfilesForm.controls.skillsProfile; }
    get shortDescription()  { return this.skillsProfilesForm.controls.shortDescription; }

    saveChanges() {
        if (this.skillsProfilesForm.invalid) {
            this.skillsProfilesForm.markAllAsTouched();
            this.skillsProfilesForm.updateValueAndValidity({ emitEvent: false });
        } else {
            this.saveChanges$ = this.skillsProfilesForm.value.new ? this.skillsProfileService.addSkillProfile( this.skillsProfile.value, this.shortDescription.value, this.selectedStaffMember.userPrincipleName) : this.skillsProfileService.updateSkillProfile(this.mapSkillsProfileForupdate(), this.selectedStaffMember.userPrincipleName)
            this.saveChanges$.subscribe({
                next: () => {
                this.skillsProfiles$ = this.skillsProfileService.getSkillProfiles(this.selectedStaffMember.userPrincipleName).pipe(
                    shareReplay(1)
                );
                this.resetForm();
                this.saveChanges$ = undefined;
                this.closeForm();
                }});
        }
    }

    mapSkillsProfileForAdd(): SkillsProfile {
        return {
            skillsProfile: this.skillsProfile.value,
            shortDescription: this.shortDescription.value,
            skillsProfilesId: 0,
            staffId : 0
        };
    }

    mapSkillsProfileForupdate(): SkillsProfile {
        return {
            skillsProfile: this.skillsProfile.value,
            shortDescription: this.shortDescription.value,
            skillsProfilesId: this.selectedRow.skillsProfilesId,
            staffId : 0
        };
    }

    resetForm() {
        this.formGroupDirective.resetForm();
        this.skillsProfilesForm.patchValue({
            new: true,
        });
    }

    selectRow(row: SkillsProfile) {
        this.selectedRow = row;
        this.showForm = true;
        this.setFormValues(row);
    }

    setFormValues(selectedSkillsProfile: SkillsProfile) {
        if (selectedSkillsProfile && this.skillsProfilesForm) {
            const { skillsProfile, shortDescription } = selectedSkillsProfile;
            this.skillsProfilesForm.setValue({
                skillsProfile: skillsProfile || '',
                shortDescription: shortDescription || '',
                new: false
            });

            this.skillsProfilesForm.markAsTouched();
        } else {
            this.skillsProfilesForm.reset();
            this.skillsProfilesForm.patchValue({
                new: true
            });
        }
    }

    addNewProfile() {
        this.showForm = true;
        this.selectedRow = undefined;
        this.skillsProfilesForm.reset();
        this.skillsProfilesForm.patchValue({
            skillsProfile: '',
            shortDescription: '',
            new: true,
        });
        this.formGroupDirective.resetForm();
    }

    closeForm() {
        this.selectedRow = undefined;
        this.showForm = false;
    }

    revertChanges() {
        if (this.selectedRow) {
            this.setFormValues(this.selectedRow);
        } else {
            this.resetForm();
        }
    }

}
