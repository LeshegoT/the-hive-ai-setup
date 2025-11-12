import { Component, OnInit, Output, EventEmitter, ViewChild, Input, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, NgForm, UntypedFormControl, FormGroupDirective } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subscription } from 'rxjs';
import { LevelUpService } from '../../services/level-up.service';
import { ProgrammeService } from '../../services/programme.service';
import { StaffFilterComponent } from '../staff-filter/staff-filter.component';

export interface levelUpData {
  levelUpId: number;
  name: string;
}

export interface userData {
  displayName: string;
  UPN: string;
}

@Component({
    selector: 'app-create-programme',
    templateUrl: './create-programme.component.html',
    styleUrls: ['./create-programme.component.css'],
    standalone: false
})
export class CreateProgrammeComponent implements OnInit, OnDestroy {
  dataSubscription: Subscription = new Subscription();

  @ViewChild('parentForm') private parentForm: NgForm;
  date = new UntypedFormControl();
  startDate: Date;
  levelups$: Observable<levelUpData[]>;
  selectedlevelup: number;
  selectedPeriod: number;
  allLevelUps: levelUpData[];
  programmeForm: UntypedFormGroup;
  levelupDataSource: MatTableDataSource<levelUpData> = new MatTableDataSource<levelUpData>();
  userDataSource: MatTableDataSource<userData> = new MatTableDataSource<userData>();
  addedUsersArray: userData[];
  addedLevelUps : levelUpData[];
  addedUsers : userData[];
  displayedLevelUpColumns = ['name', 'action'];
  displayedUserColumns = ['displayName', 'userPrincipleName', 'action'];
  dateChanges: Subscription;
  @Output() dateValue = new EventEmitter<Date>();
  @Input() initDate: Date = new Date();
  @Input() minDate: Date;
  @Output() triggerRefresh = new EventEmitter();
  @Output() cancel = new EventEmitter();

  @ViewChild(StaffFilterComponent) staffFilterComponent;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private levelupService: LevelUpService,
    private programmeService: ProgrammeService,
    private snackBar: MatSnackBar
  ) {
    this.programmeForm = this.formBuilder.group({
      name: ['', Validators.compose([Validators.required, Validators.maxLength(30)])],
      period: ['', Validators.required],
    });
  }
  ngOnInit() {
    this.addedUsers = [];
    this.addedLevelUps = [];
    this.levelups$ = this.levelupService.getAllLevelUps();
    this.levelups$.subscribe((levelUps) => {
      this.selectedlevelup = levelUps[0].levelUpId;
      this.allLevelUps = levelUps;
      this.levelupDataSource.data = [];
      this.userDataSource.data = [];
    });
    this.date.setValue(this.initDate);
    this.dateChanges = this.date.valueChanges.subscribe((newDate: Date) => {
      this.startDate = newDate;
    });
  }

  async createProgramme(formDirective: FormGroupDirective) {
    let error = false;
    const selectedPeriod = this.programmeForm.controls['period'].value;
    if (!this.programmeForm.controls['name'].valid) {
      this.callSnackBar('Please enter a valid name.');
      return;
    } else if (!this.startDate) {
      this.callSnackBar('Please select a valid startdate.');
      return;
    } else if (!selectedPeriod) {
      this.callSnackBar('Please select a period.');
    } else if (this.addedLevelUps.length <= 0 || this.addedLevelUps == undefined) {
      this.callSnackBar('Please select a levelup to add.');
      return;
    }
    if (!this.programmeForm.valid) {
      error = true;
      return;
    }

    error = false;
    const programme = this.programmeForm.getRawValue();
    programme.levelups = this.addedLevelUps;
    programme.period = this.selectedPeriod;
    programme.startDate = this.startDate;
    programme.users = this.addedUsers;
    programme.dateAdded = new Date();

    const createSubscription = this.programmeService.createProgramme(programme).subscribe((newID) => {
      this.callSnackBar('Programme created successfully');
    });
    formDirective.resetForm();
    this.programmeForm.reset();
    this.dataSubscription.add(createSubscription);
    this.levelups$.subscribe((levelUps) => {
      this.selectedlevelup = levelUps[0].levelUpId;
      this.allLevelUps = levelUps;
      this.levelupDataSource.data = [];
      this.userDataSource.data = [];
      this.addedLevelUps = [];
      this.addedUsers = [];
      document.getElementById('fieldName').focus();
    });
    this.triggerRefresh.emit()
  }

  addLevelUp() {
    const levelupInfo = this.allLevelUps.find((lvlUp) => lvlUp.levelUpId === this.selectedlevelup);
    const addedLevelUpsArray = this.levelupDataSource.data;
    const indexOfObject = addedLevelUpsArray.findIndex((object) => {
      return object.name === levelupInfo.name;
    });

    if (indexOfObject !== -1) {
      this.callSnackBar('Cannot add duplicate group');
      return;
    } else {
      this.addedLevelUps.push(levelupInfo);
      this.levelupDataSource.data.push(levelupInfo);
      this.levelupDataSource._updateChangeSubscription();
    }
  }

  deleteLevelup(levelup) {
    const addedLevelUpsArray = this.levelupDataSource.data;
    const indexOfObject = addedLevelUpsArray.findIndex((object) => {
      return object.name === levelup.name;
    });
    if (indexOfObject !== -1) {
      this.levelupDataSource.data.splice(indexOfObject, 1);
      this.addedLevelUps.splice(indexOfObject, 1);
    }
    this.levelupDataSource._updateChangeSubscription();
  }

  selectUser() {
    const userInfo = {
      displayName: this.staffFilterComponent.selectedUserPrinciple.displayName,
      UPN: this.staffFilterComponent.selectedUserPrinciple.userPrincipleName,
    };
    this.addedUsersArray = this.userDataSource.data;
    const indexOfObject = this.addedUsersArray.findIndex((object) => {
      return object.UPN === userInfo.UPN;
    });

    if (indexOfObject !== -1) {
      this.callSnackBar('Cannot add duplicate users');
      return;
    } else {
      this.addedUsers.push(userInfo);
      this.userDataSource.data.push(userInfo);
      this.userDataSource._updateChangeSubscription();
    }
  }

  deleteUser(user) {
    this.addedUsersArray = this.userDataSource.data;
    const indexOfObject = this.addedUsersArray.findIndex((object) => {
      return object.UPN === user.UPN;
    });
    if (indexOfObject !== -1) {
      this.userDataSource.data.splice(indexOfObject, 1);
      this.addedUsers.splice(indexOfObject, 1);
    }
    this.userDataSource._updateChangeSubscription();
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  clearForm(formDirective: FormGroupDirective) {
    formDirective.resetForm();
    this.programmeForm.reset();
    this.callSnackBar('Form cleared successfully.');
  }
  callSnackBar(message) {
    this.snackBar.open(message, '', { duration: 1000 });
  }

  cancelCreate() {
    this.cancel.emit()
  }
}
