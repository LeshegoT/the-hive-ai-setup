import { Component, Input, OnInit, SimpleChanges, ViewChild, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl, NgForm, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Person } from '../../../shared/interfaces';
import { WorkExperienceService } from './work-experience.service';
import { BehaviorSubject, map, Observable, shareReplay } from 'rxjs';
import { NewWorkExperience, SkillsEntity, WorkExperience, WorkExperienceRole, WorkExperienceSector } from '@the-hive/lib-skills-shared';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateFormatPipe, provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { EnvironmentService } from '../../../services/environment.service';
import { CdkColumnDef } from '@angular/cdk/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AutocompleteInputComponent } from '../../../shared/components/autocomplete-input/autocomplete-input.component';
import { MultiSelectInputComponent } from '../../../shared/components/multi-select-input/multi-select-input.component';
import { SkillsService } from '../../services/skills.service';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../services/auth.service';
import moment, { Moment } from 'moment';

interface TableColumn {
  columnName: string;
  headerName: string;
}

interface WorkExperienceForm {
  companyName: FormControl<string>;
  sectorName: FormControl<string>;
  roleName: FormControl<string>;
  startDate: FormControl<Moment | undefined>;
  endDate: FormControl<Moment | undefined>;
  bbdExperience: FormControl<boolean>;
  projectDescription: FormControl<string>;
  outcomes: FormArray<FormControl<string>>;
  technologies: FormControl<Omit<SkillsEntity, 'canonicalNameGuid'>[]>;
  new: FormControl<boolean>;
}

interface MinMaxDate {
  minimum: Date;
  maximum: Date;
}

interface SelectedRow {
  workExperience: WorkExperience;
  action: 'edit' | 'view';
}

@Component({
  selector: 'app-work-experience',
  templateUrl: './work-experience.component.html',
  styleUrls: ['./work-experience.component.css', '../../../../styles.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DragDropModule,
    AutocompleteInputComponent,
    MultiSelectInputComponent,
    MatChipsModule
  ],
  providers: [DateFormatPipe, CdkColumnDef, provideMaterialDatePickerConfiguration()]
})
export class WorkExperienceComponent implements OnInit, OnChanges{
  @ViewChild('formGroupDirective', { static: false }) formGroupDirective: NgForm;
  @ViewChild(MultiSelectInputComponent) multiSelectInputComponent: MultiSelectInputComponent<Omit<SkillsEntity, 'canonicalNameGuid'>>;
  @Input() selectedStaffMember: Person;
  tableColumns: TableColumn[] = [
    { columnName: 'companyName', headerName: 'Company Name' },
    { columnName: 'sectorName', headerName: 'Company Sector' },
    { columnName: 'roleName', headerName: 'Role Name' },
    { columnName: 'startDate', headerName: 'Start Date' },
    { columnName: 'endDate', headerName: 'End Date' },
    { columnName: 'bbdExperience', headerName: 'BBD Subcontracted' },
    { columnName: 'actions', headerName: '' }
  ];  
  workExperienceForm: FormGroup<WorkExperienceForm>;
  workExperiences$: Observable<WorkExperience[]>;
  saveChanges$: Observable<void>;
  selectedRow$: BehaviorSubject<SelectedRow> = new BehaviorSubject<SelectedRow>(undefined);
  minimumInputText: number;
  maximumOutcomeCharacterLength: number;
  maximumProjectDescriptionCharacterLength: number;
  snackbarDuration: number;
  workExperinceMinDateYears: number;
  minMaxStartDate: MinMaxDate;
  minMaxEndDate: MinMaxDate;
  sectors$: Observable<WorkExperienceSector[]>;
  roles$: Observable<WorkExperienceRole[]>;
  technologies$: Observable<Omit<SkillsEntity, 'canonicalNameGuid'>[]>;
  isLoggedInUserMemberOfModifyBioInformationUsers$: Observable<boolean>;


  constructor(private formBuilder: FormBuilder, private workExperienceService: WorkExperienceService, private skillsService: SkillsService, private dateFormatPipe: DateFormatPipe, private environmentService: EnvironmentService, private snackBar: MatSnackBar, private authService: AuthService) {}

  ngOnInit() {
    this.minimumInputText = this.environmentService.getConfiguratonValues().SKILL_MIN_SEARCH_CHARACTERS;
    this.workExperinceMinDateYears = this.environmentService.getConfiguratonValues().WORK_EXPERIENCE_MIN_DATE_YEARS;
    this.maximumOutcomeCharacterLength = this.environmentService.getConfiguratonValues().WORK_EXPERIENCE_MAXIMUM_OUTCOME_CHARACTER_LENGTH;
    this.maximumProjectDescriptionCharacterLength = this.environmentService.getConfiguratonValues().WORK_EXPERIENCE_MAXIMUM_PROJECT_DESCRIPTION_CHARACTER_LENGTH;
    this.minMaxStartDate = { minimum: this.minimumStartDate, maximum: new Date() };
    this.minMaxEndDate = { minimum: this.minimumStartDate, maximum: new Date() };
    this.snackbarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this.workExperienceForm = this.formBuilder.group<WorkExperienceForm>({
      companyName: this.formBuilder.control('', [Validators.required, Validators.minLength(this.minimumInputText)]),
      sectorName: this.formBuilder.control('', [Validators.required, Validators.minLength(this.minimumInputText)]),
      roleName: this.formBuilder.control('', [Validators.required, Validators.minLength(this.minimumInputText)]),
      startDate: this.formBuilder.control<Moment | undefined>(undefined, [Validators.required]),
      endDate: this.formBuilder.control<Moment | undefined>(undefined, [Validators.required, this.workExperienceEndDateValidation.bind(this)]),
      bbdExperience: this.formBuilder.control<boolean>(false),
      projectDescription: this.formBuilder.control(''),
      outcomes: this.formBuilder.array<FormControl>([this.formBuilder.control('', [Validators.required, Validators.minLength(this.minimumInputText)])]),
      technologies: this.formBuilder.control([]), 
      new: this.formBuilder.control<boolean>(true)
    });
    this.sectors$ = this.workExperienceService.getWorkExperienceSectors();
    this.roles$ = this.workExperienceService.getWorkExperienceRoles();
    this.workExperiences$ = this.workExperienceService.getWorkExperiences(this.selectedStaffMember.userPrincipleName).pipe(
      shareReplay(1)
    );

    this.workExperienceForm.controls.startDate.valueChanges.subscribe(startDate => {
      if (startDate) {
        this.minMaxEndDate.minimum = startDate.toDate();
        this.minMaxEndDate.maximum = new Date();
      } else {
        this.minMaxEndDate.minimum = this.minimumStartDate; 
        this.minMaxEndDate.maximum = new Date(); 
      }
      this.workExperienceForm.controls.endDate.updateValueAndValidity({ emitEvent: false });
    });

    this.workExperienceForm.controls.endDate.valueChanges.subscribe(endDate => {
      if (endDate) {
        this.minMaxStartDate.minimum = this.minimumStartDate;
        this.minMaxStartDate.maximum = endDate.toDate();
      } else {
        this.minMaxStartDate.minimum = this.minimumStartDate;
        this.minMaxStartDate.maximum = new Date();
      }
      this.workExperienceForm.controls.startDate.updateValueAndValidity({ emitEvent: false });
    });
    this.isLoggedInUserMemberOfModifyBioInformationUsers$ = this.authService.getUserPrincipleName().pipe(
      map(upn => this.environmentService.getConfiguratonValues().MODIFY_BIO_INFORMATION_USERS.includes(upn))
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedStaffMember']) {
      this.closeForm();
      this.technologies$ = this.skillsService.getUserAttributes(this.selectedStaffMember.userPrincipleName, 'skill').pipe(
        map((userAttributes) => userAttributes.map((userAttribute) => userAttribute.attribute))
      );
      this.workExperiences$ = this.workExperienceService.getWorkExperiences(this.selectedStaffMember.userPrincipleName).pipe(
        shareReplay(1)
      );
      if (this.workExperienceForm) {
        this.resetForm();
      } else {
        // workExperienceForm is not defined
      }
    } else {
      //do nothing, selectedStaffMember did not change
    }
  }

  get minimumStartDate() { 
    const currentDate = new Date();
    return new Date(currentDate.getFullYear() - this.workExperinceMinDateYears, 0, 1);
  }

  get columnNames() { return this.tableColumns.map(column => column.columnName); }

  get companyName() { return this.workExperienceForm.controls.companyName; }
  get sectorName() { return this.workExperienceForm.controls.sectorName; }
  get roleName() { return this.workExperienceForm.controls.roleName; }
  get startDate() { return this.workExperienceForm.controls.startDate; }
  get endDate() { return this.workExperienceForm.controls.endDate; }
  get outcomes() { return this.workExperienceForm.controls.outcomes; }
  get bbdExperience() { return this.workExperienceForm.controls.bbdExperience; }
  get projectDescription() { return this.workExperienceForm.controls.projectDescription; }
  get technologies() { return this.workExperienceForm.controls.technologies; }

  dropOutcome(event: CdkDragDrop<FormControl[]>) {
    moveItemInArray(this.outcomes.controls, event.previousIndex, event.currentIndex);
    this.outcomes.updateValueAndValidity();
  }

  addOutcome() { this.outcomes.push(this.formBuilder.control('', [Validators.required, Validators.minLength(this.minimumInputText)])); }
  removeOutcome(index: number) { this.outcomes.removeAt(index); }

  saveChanges() {
    if (!this.workExperienceForm.invalid) {
      this.saveChanges$ = this.workExperienceForm.value.new ? this.workExperienceService.addWorkExperience(this.mapWorkExperienceFormToNewWorkExperience(), this.selectedStaffMember.userPrincipleName) : this.workExperienceService.updateWorkExperience(this.mapWorkExperienceFormToNewWorkExperience(), this.selectedRow$.value.workExperience.workExperienceId, this.selectedStaffMember.userPrincipleName);
      this.saveChanges$.subscribe({
        next: () => {
          this.workExperiences$ = this.workExperienceService.getWorkExperiences(this.selectedStaffMember.userPrincipleName).pipe(
            shareReplay(1)
          );
          this.resetForm();
          this.saveChanges$ = undefined;
          this.closeForm();
        },
        error: (error) => {
          this.snackBar.open(error, 'Dismiss', { duration: this.snackbarDuration });
          this.saveChanges$ = undefined;
        }
      });
    } else {
      this.workExperienceForm.markAllAsTouched();
      this.outcomes.controls.forEach(outcomeControl => outcomeControl.markAsTouched());
      this.workExperienceForm.updateValueAndValidity({ emitEvent: false });
    }
  }

  mapWorkExperienceFormToNewWorkExperience(): NewWorkExperience {
    return {
      companyName: this.companyName.value,
      sectorName: this.sectorName.value,
      roleName: this.roleName.value,
      startDate: this.startDate.value ? this.startDate.value.toDate() : undefined,
      endDate: this.endDate.value ? this.endDate.value.toDate() : undefined,
      bbdExperience: this.bbdExperience.value || false,
      projectDescription: this.projectDescription.value || undefined,
      outcomes: this.outcomes.value.map((outcome: string, index: number) => ({ body: outcome, order: index })),
      technologies: this.technologies.value.map((technology: Omit<SkillsEntity, 'canonicalNameGuid'>, index: number) => ({ standardizedName: technology.standardizedName, order: index })),
    };
  }

  addNewWorkExperience() {
    this.selectedRow$.next({ workExperience: undefined, action: 'edit' });
    this.resetForm();
  }

  resetForm() {
    this.formGroupDirective?.resetForm();
    this.workExperienceForm.patchValue({
      bbdExperience: false,
      new: true,
    });

    this.outcomes.clear();
    this.outcomes.push(
      this.formBuilder.control('', [
        Validators.required,
        Validators.minLength(this.minimumInputText)
      ])
    );
  
    this.technologies.setValue([]);
    if (this.multiSelectInputComponent) {
      this.multiSelectInputComponent.resetSelection(this.technologies.value);
    } else {
      // multiSelectInputComponent is not defined
    }
  }

  setFormValues(workExperience: WorkExperience) {
    const { companyName, sectorName, roleName, startDate, endDate, bbdExperience, projectDescription } = workExperience;
    this.formGroupDirective?.resetForm();
    this.workExperienceForm.patchValue({
      companyName,
      sectorName,
      roleName,
      startDate: startDate ? moment(startDate) : undefined,
      endDate: endDate ? moment(endDate) : undefined,
      bbdExperience,
      projectDescription: projectDescription,
      new: false
    });
  
    this.outcomes.clear();
    workExperience.outcomes.sort((outcome1, outcome2) => outcome1.order - outcome2.order).forEach(outcome =>
      this.outcomes.push(
        this.formBuilder.control(outcome.body, [
          Validators.required,
          Validators.minLength(this.minimumInputText)
        ])
      )
    );
    if (this.outcomes.length === 0) {
      this.outcomes.push(
        this.formBuilder.control('', [
          Validators.required,
          Validators.minLength(this.minimumInputText)
        ])
      );
    } else {
      // outcomes are already set, no need to add a default empty outcome
    }
  
    this.technologies.setValue([...workExperience.technologies.sort((technology1, technology2) => technology1.order - technology2.order).map(technology => ({
      standardizedName: technology.standardizedName,
      canonicalName: technology.canonicalName,
      canonicalNameId: technology.canonicalNameId
    }))]);
    if (this.multiSelectInputComponent) {
      this.multiSelectInputComponent.resetSelection(this.technologies.value);
    } else {
      // multiSelectInputComponent is not defined
    }
  }  

  selectRow(row: WorkExperience, action: 'edit' | 'view') {
    this.selectedRow$.next({ workExperience: row, action: action });
    if (action === 'edit') {
      this.setFormValues(row);
    } else {
      // don't set the form values for view action
    }
  }

  revertChanges() {
    if (this.selectedRow$.value.workExperience) {
      this.setFormValues(this.selectedRow$.value.workExperience);
    } else {
      this.resetForm();
    }
  }

  closeForm() {
    this.selectedRow$.next(undefined);
  }

  formatDate(date: Date): string {
    return this.dateFormatPipe.transform(date.toDateString());
  }
  onTechnologySelected(technology: Omit<SkillsEntity, 'canonicalNameGuid'>[]) {
    this.technologies.setValue([...technology]);
  }

  getMinimumLengthErrorMessage(field: string) {
    return `${field} must be at least ${this.minimumInputText} characters`;
  }

  isRowSelected(row: WorkExperience): boolean {
    return this.selectedRow$.value && this.selectedRow$.value.workExperience === row;
  }

  workExperienceEndDateValidation(control: AbstractControl): ValidationErrors {
    const startDate = this.workExperienceForm?.get('startDate')?.value;
    const endDate = control.value;
    if (!startDate || !endDate) {
      return undefined;
    } else {
      if (endDate.toDate() < startDate.toDate()) {
        return { dateRange: true };
      } else {
        return undefined;
      }
    }
  }

  onAddNewSector(sectorName: string) {
    this.sectors$ =this.workExperienceService.addNewSector(sectorName);
    this.sectorName.setValue(sectorName);
    this.sectorName.updateValueAndValidity();
  }

  onAddNewRole(roleName: string) {
    this.roles$ = this.workExperienceService.addNewRole(roleName);
    this.roleName.setValue(roleName);
    this.roleName.updateValueAndValidity();
  }

  getRolesOptions(): Observable<string[]> {
    return this.roles$.pipe(
      map(roles => roles.map(role => role.roleName))
    );
  }
  getSectorsOptions(): Observable<string[]> {
    return this.sectors$.pipe(
      map(sectors => sectors.map(sector => sector.sectorName))
    );
  }
}
