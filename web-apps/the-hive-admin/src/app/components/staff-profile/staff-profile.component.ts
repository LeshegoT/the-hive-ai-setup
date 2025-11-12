import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BadRequestDetail } from '@the-hive/lib-shared';
import { BioTemplate, SkillsProfile, Staff, StaffOnSupply, UserAttribute } from '@the-hive/lib-skills-shared';
import { StaffSpokenLanguage } from '@the-hive/lib-staff-shared';
import { BehaviorSubject, catchError, combineLatest, finalize, map, Observable, of, startWith, Subject } from 'rxjs';
import { SupplyService } from '../../people-planning/services/supply.service';
import { FeedbackService } from '../../review/services/feedback.service';
import { DepartmentManager } from '../../review/tabs/stats-individual-view/stats-individual-view.tab';
import { ADGroupsService } from '../../services/ad-groups.service';
import { AuthService } from '../../services/auth.service';
import { EnvironmentService } from '../../services/environment.service';
import { FileService } from '../../services/file.service';
import { Person } from '../../shared/interfaces';
import { SkillsService } from '../../skills/services/skills.service';
import { MarkStaffMemberForTerminationActionComponent, MarkStaffMemberForTerminationResult } from '../mark-staff-member-for-termination-action/mark-staff-member-for-termination-action.component';
import { ProfileComponent } from "../profile/profile.component";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProfileDialog } from './dialogs/profile-dialog.component';
import { StaffResidenceComponent } from '../staff-residence/staff-residence.component';
import moment from 'moment';
import { MatSelectModule } from '@angular/material/select';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { StaffService } from '../../services/staff.service';
import { DateFormatPipe, provideMaterialDatePickerConfiguration } from '../../pipes/date-format.pipe';

@Component({
  selector: 'app-staff-profile',
  templateUrl: './staff-profile.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
    ProfileComponent,
    MatTooltipModule,
    MarkStaffMemberForTerminationActionComponent,
    MatDialogModule,
    StaffResidenceComponent,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatError,
  ],
  styleUrls: ['./staff-profile.component.css'],
  providers: [DateFormatPipe, provideMaterialDatePickerConfiguration()]
})
export class StaffProfileComponent implements OnChanges, OnInit {
  @Input() selectedStaffMember: Person;
  @Input() includeSkills = false;
  @Input() selectedUPN: Staff['upn'] = undefined;
  @Input() showMarkForTerminationButton: boolean;
  @Output() clearResults = new EventEmitter();
  terminationEnabled = false;
  userDepartmentHistory$: Observable<DepartmentManager[] | BadRequestDetail> = undefined;
  initiallyVisibleDepartmentHistoryLength = 2;
  isGeneratingStaffBio = false;
  isEditingResidence = false;
  bioTemplateOptions: BioTemplate[] = [];
  staffOnSupply$: Observable<StaffOnSupply | BadRequestDetail>;
  staffCoreTech$: Observable<UserAttribute[] | BadRequestDetail>;
  currentUpn: string;
  showAllDepartmentHistory = false;
  markStaffMemberForTermination$: Subject<void> = new Subject<void>();
  markStaffMemberForTerminationResult$: Observable<MarkStaffMemberForTerminationResult>;
  selectedStaffMemberIsActive$ = new BehaviorSubject<boolean>(true);
  isLoggedInUserMemberOfGenerateBioADGroups$: Observable<boolean>;
  readonly dialog = inject(MatDialog);
  selectedSkillsProfile: SkillsProfile;
  private SNACKBAR_DURATION: number;
  staffSpokenLanguages$: Observable<StaffSpokenLanguage[] | BadRequestDetail>;
  spokenLanguageProficiencies$: Observable<string[]>;
  spokenLanguages$: Observable<string[]>;
  filteredLanguages$: Observable<string[]>;
  isEditingLanguages = false;
  newLanguageControl = new FormControl('');
  newLanguageProficiency = ''
  editingLanguages: StaffSpokenLanguage[] = [];
  originalLanguages: StaffSpokenLanguage[] = [];
  isLoggedInUserMemberOfModifyBioInformationUsers$: Observable<boolean>;
  maximumNumberOfAllowedLanguages: number;
  dateOfBirthControl = new FormControl<Date>(undefined);
  nationalityControl = new FormControl<string>(undefined);
  saveDateOfBirth$: Observable<BadRequestDetail>;
  saveNationality$: Observable<BadRequestDetail>;
  displayResidenceComponent: boolean;
  selectedResidence = ''

  constructor(
    private dateFormatPipe: DateFormatPipe,
    private readonly staffService: StaffService,
    private readonly adGroupService: ADGroupsService,
    private feedbackService: FeedbackService,
    private fileService: FileService,
    private readonly skillsService: SkillsService,
    private readonly supplyService: SupplyService,
    private readonly snackBar: MatSnackBar,
    private environmentService: EnvironmentService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.getUserPrincipleName().subscribe((upn) => this.currentUpn = upn);
    this.loadBioTemplateOptions();
    this.isLoggedInUserMemberOfGenerateBioADGroups$ = this.adGroupService.isLoggedInUserMemberOfADGroups(this.environmentService.getConfiguratonValues().GENERATE_BIO_AD_GROUPS);
    this.isLoggedInUserMemberOfModifyBioInformationUsers$ = this.authService.getUserPrincipleName().pipe(map(upn => this.environmentService.getConfiguratonValues().MODIFY_BIO_INFORMATION_USERS.includes(upn)));
    this.SNACKBAR_DURATION = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this.spokenLanguageProficiencies$ = this.skillsService.retrieveProficiencies();
    this.spokenLanguages$ = this.skillsService.retrieveSpokenLanguages();
    this.maximumNumberOfAllowedLanguages = this.environmentService.getConfiguratonValues().MAXIMUM_NUMBER_OF_ALLOWED_SPOKEN_LANGUAGES;
    this.filteredLanguages$ = combineLatest([
      this.newLanguageControl.valueChanges.pipe(startWith('')),
      this.spokenLanguages$
    ]).pipe(
      map(([searchValue, languages]) => {
        if (!searchValue) {
          return languages;
        } else {
          return languages.filter(language =>
            language.toLowerCase().includes(searchValue.toLowerCase())
          );
        }
      })
    );
  }

  loadBioTemplateOptions(): void {
    this.skillsService
      .getBioTemplates()
      .subscribe((templates) => {
        this.bioTemplateOptions = templates;
      });
  }

  ngOnChanges(): void {
      if (this.selectedStaffMember != undefined) {
        this.userDepartmentHistory$ = this.feedbackService.getUserDepartmentHistory(this.selectedStaffMember.userPrincipleName)
          .pipe(
            catchError((errorMessage) => {
              return of({
                message: errorMessage
              });
            }),
          );

        this.getStaffOnSupply();
        this.getCoreTech();
        this.loadStaffSpokenLanguages();
        this.dateOfBirthControl.setValue(undefined);
        this.nationalityControl.setValue(undefined);
        this.saveDateOfBirth$ = undefined;
        this.saveNationality$ = undefined;
      } else {
        this.userDepartmentHistory$ = of(undefined);
      }
  }

  loadStaffSpokenLanguages(): void {
    this.staffSpokenLanguages$ = this.skillsService.retrieveStaffSpokenLanguages(this.selectedStaffMember.userPrincipleName).pipe(
      catchError((errorMessage) => {
        return of({
          message: errorMessage
        });
      }),
    );
  }

  startEditingLanguages(staffSpokenLanguages: Array<{languageId: number, language: string, proficiency: string, proficiencyId: number}>): void {
    this.isEditingLanguages = true;
    this.editingLanguages = [...staffSpokenLanguages];
    this.originalLanguages = [...staffSpokenLanguages];
    this.newLanguageControl.reset();
    this.newLanguageProficiency = '';
  }

  cancelEditingLanguages(): void {
    this.isEditingLanguages = false;
    this.newLanguageControl.reset();
    this.newLanguageProficiency = '';
    this.editingLanguages = [];
    this.originalLanguages = [];
  }

  availableToAddMoreLanguages(): boolean {
    return this.editingLanguages.length < this.maximumNumberOfAllowedLanguages;
  }

  addLanguage(): void {
    if (this.newLanguageControl.value && this.newLanguageProficiency && this.availableToAddMoreLanguages()) {
      this.editingLanguages.push({
        language: this.newLanguageControl.value,
        proficiency: this.newLanguageProficiency
      });
      this.newLanguageControl.reset();
      this.newLanguageProficiency = '';
    } else {
      // Cannot add language
    }
  }


  removeLanguage(languageToRemove: StaffSpokenLanguage): void {
    this.editingLanguages = this.editingLanguages.filter(
      (spokenLanguage) =>
        !(
          spokenLanguage.language === languageToRemove.language &&
          spokenLanguage.proficiency === languageToRemove.proficiency
        )
    );
  }

  updateLanguageProficiency(
    languageToUpdate: StaffSpokenLanguage,
    newProficiency: string
  ): void {
    const existingLanguage = this.editingLanguages.find(
      (spokenLanguage) =>
        spokenLanguage.language === languageToUpdate.language &&
        spokenLanguage.proficiency === languageToUpdate.proficiency
    );

    if (existingLanguage) {
      existingLanguage.proficiency = newProficiency;
    } else {
      // Language not found in the editing list
    }
  }

  saveLanguages(): void {
    this.skillsService.updateStaffSpokenLanguages(this.selectedStaffMember.userPrincipleName, this.editingLanguages)
      .subscribe({
        next: () => {
          this.isEditingLanguages = false;
          this.newLanguageControl.reset();
          this.newLanguageProficiency = '';
          this.editingLanguages = [];
          this.originalLanguages = [];
          this.loadStaffSpokenLanguages();
        }
      });
  }

  generateStaffBio(bioTemplate: BioTemplate):void {
    this.isGeneratingStaffBio = true;
    this.openDialog(bioTemplate);
  }

  getStaffOnSupply(): void {
    this.staffOnSupply$ = this.supplyService.retrieveStaffOnSupplyByUpn(this.selectedStaffMember.userPrincipleName).pipe(
      catchError((errorMessage) => {
        return of({
          message: errorMessage
        });
      }),
    )
  }

  getCoreTech(): void{
    this.staffCoreTech$ = this.skillsService.retrieveStaffCoreTech(this.selectedStaffMember.userPrincipleName).pipe(
      catchError((errorMessage) => {
        return of({
          message: errorMessage
        });
      }),
    )
  }

  toggleShowAllDepartmentHistory(): void {
    this.showAllDepartmentHistory = !this.showAllDepartmentHistory;
  }

  filterInVisibleDepartmentHistory(departmentHistory: DepartmentManager[]): DepartmentManager[] {
    if(this.showAllDepartmentHistory){
      return departmentHistory;
    } else{
      return departmentHistory.filter((_, departmentIndex) =>
        departmentIndex < this.initiallyVisibleDepartmentHistoryLength);
    }
  }

  openDialog(bioTemplate: BioTemplate): void {
    const dialogRef = this.dialog.open(ProfileDialog, {
      data: {selectedStaffMember: this.selectedStaffMember}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && !result.cancelled) {
        this.skillsService.generateStaffBio(this.selectedStaffMember.userPrincipleName, bioTemplate.bioTemplateId, result.profileId)
      .pipe(
        finalize(() => this.isGeneratingStaffBio = false)
      )
      .subscribe({
        next: (blob: Blob) => {
          const currentDate = moment().format('MMM YYYY');
          const bioTemplateName = bioTemplate.bioTemplateName.replace(' Bio', '');
          const bioName = `${this.selectedStaffMember.displayName} – BBD CV – ${currentDate} (${bioTemplateName}).docx`;
          this.fileService.downloadFile(blob, bioName);
          this.snackBar.open('Bio generated successfully!', 'Close', {
            duration: this.SNACKBAR_DURATION,
            panelClass: ['snackbar-success']
          })
        },
        error: () => {
          this.snackBar.open('Failed to generate bio document', 'Close', {
            duration: this.SNACKBAR_DURATION,
            panelClass: ['error-snackbar']
          });
        }
      });
      } else {
        this.isGeneratingStaffBio = false;
      }
    });
  }

  formatDateOfBirth(): string {
    if(!this.selectedStaffMember.dateOfBirth){
      return 'Date of birth not set';
    } else {
      return this.dateFormatPipe.transform(this.selectedStaffMember.dateOfBirth.toISOString());
    }
  }

  startEditingDateOfBirth(): void {
    if(this.selectedStaffMember.dateOfBirth){
      this.dateOfBirthControl.setValue(this.selectedStaffMember.dateOfBirth);
    } else {
      this.dateOfBirthControl.setValue(new Date());
    }
  }

  cancelEditingDateOfBirth(): void {
    this.dateOfBirthControl.reset();
    this.dateOfBirthControl.setValue(undefined);
    this.saveDateOfBirth$ = undefined;
  }

  saveDateOfBirth(): void {
    if (this.dateOfBirthControl.valid) {
      this.saveDateOfBirth$ = this.staffService.updateStaffDateOfBirth(this.selectedStaffMember.userPrincipleName, this.dateOfBirthControl.value);
      this.saveDateOfBirth$.subscribe({
        next: () => {
          this.selectedStaffMember.dateOfBirth = new Date(this.dateOfBirthControl.value);
          this.dateOfBirthControl.reset();
          this.dateOfBirthControl.setValue(undefined);
          this.saveDateOfBirth$ = undefined;
        },
        error: (error) => {
          this.dateOfBirthControl.setErrors({ 'serverError': error });
          this.dateOfBirthControl.markAsTouched();
          this.saveDateOfBirth$ = undefined;
        }
      });
    } else {
      this.dateOfBirthControl.markAsTouched();
    }
  }

  toggleEditResidence() {
    this.isEditingResidence = !this.isEditingResidence;
  }

  onResidenceSelected(selectedValue: string) {
    this.selectedResidence = selectedValue;
  }

  saveResidence (){
    if (this.selectedResidence){
      this.staffService.updateStaffResidence(this.selectedStaffMember.userPrincipleName, this.selectedResidence).subscribe({
        next: () => {
          this.selectedStaffMember.residence = this.selectedResidence;
          this.selectedResidence = '';
          this.isEditingResidence = !this.isEditingResidence;
        }
      });

    }else{
      //No residence option selected, dont do anything
    }
  }

  startEditingNationality(): void {
    this.nationalityControl.setValue(this.selectedStaffMember.nationality);
  }

  cancelEditingNationality(): void {
    this.nationalityControl.reset();
    this.nationalityControl.setValue(undefined);
    this.saveNationality$ = undefined;
  }

  saveNationality(): void {
    if (this.nationalityControl.valid) {
      this.saveNationality$ = this.staffService.updateStaffNationality(this.selectedStaffMember.userPrincipleName, this.nationalityControl.value);
      this.saveNationality$.subscribe({
        next: () => {
          this.selectedStaffMember.nationality = this.nationalityControl.value;
          this.nationalityControl.reset();
          this.nationalityControl.setValue(undefined);
          this.saveNationality$ = undefined;
        },
        error: (error) => {
          this.nationalityControl.setErrors({ 'serverError': error });
          this.nationalityControl.markAsTouched();
          this.saveNationality$ = undefined;
        }
      });
    } else {
      this.nationalityControl.markAsTouched();
    }
  }

}
