import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { LevelUpService } from '../../services/level-up.service';
import { Subscription } from 'rxjs';
import { contentTypeCodes } from '../../shared/enums';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { StaffFilterComponent } from '../staff-filter/staff-filter.component';
import { ProgrammeData } from '../table-programme/table-programme.component';

export interface LevelUpData {
  levelUpId: number;
  name: string;
}

export interface UserData {
  displayName: string;
  upn: string;
  dateAdded: Date;
}

@Component({
    selector: 'app-manage-programme',
    templateUrl: './manage-programme.component.html',
    styleUrls: ['./manage-programme.component.css'],
    standalone: false
})
export class ManageProgrammeComponent implements OnInit, OnDestroy {
  @ViewChild('levelUpTable') levelUpTable: MatTable<Element>;
  @ViewChild('userTable') userTable: MatTable<Element>;
  private dataSubscription: Subscription = new Subscription();
  date = new UntypedFormControl();
  dateF: Date = new Date();
  selectedlevelup: number;
  selectedPeriod: number;
  addedLevelUpsArray: LevelUpData[];
  addedUsersArray: UserData[];
  allLevelUps: LevelUpData[];
  startDate: Date = new Date();
  userDataSource: MatTableDataSource<UserData> = new MatTableDataSource<UserData>();
  levelupDataSource: MatTableDataSource<LevelUpData> = new MatTableDataSource<LevelUpData>();
  addedLevelUps: LevelUpData[];
  programmeForm: UntypedFormGroup;
  dateChanges: Subscription;

  private _programme: ProgrammeData;
  @Input()
  set programme(programme) {
    this._programme = programme || null;
    this.setFormValues();
  }
  get programme() {
    return this._programme;
  }

  contentType: contentTypeCodes = contentTypeCodes.track;
  @Output() onSave = new EventEmitter();
  @Input() initDate: Date = new Date();
  @Input() minDate: Date;
  @Output() cancel = new EventEmitter();

  displayedLevelUpColumns: string[] = ['name', 'action'];
  displayedUserColumns: string[] = ['userPrincipleName', 'action'];

  @ViewChild(StaffFilterComponent) staffFilterComponent;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private LevelUpService: LevelUpService,
    private snackBar: MatSnackBar,
    public matcher: CreateContentErrorStateMatcher
  ) {
    this.programmeForm = this.formBuilder.group({
      programmeId: [{ value: null, disabled: true }, Validators.compose([Validators.required])],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(30)])],
      period: ['', Validators.required],
      levelups: [''],
      date: [''],
    });
  }

  ngOnInit() {
    this.levelupDataSource.data = [];
    this.userDataSource.data = [];
    if (this.programme.programmeID != null) {
      this.levelupDataSource.data = this._programme.levelups;
      this.userDataSource.data = this._programme.users;
    }
    this.startDate = this.programmeForm.controls['date'].value;
    this.startDate = new Date(this.startDate);

    this.date.setValue(this.initDate);
    this.dateChanges = this.date.valueChanges.subscribe((newDate: Date) => {
      this.startDate = newDate;
    });
  }

  setFormValues() {
    this.programmeForm.controls['programmeId'].setValue(this.programme.programmeID);
    this.programmeForm.controls['name'].setValue(this.programme.name);
    this.programmeForm.controls['date'].setValue(this.programme.startDate);
    this.programmeForm.controls['period'].setValue(`${this.programme.period}`);
    this.dateF = new Date(this.programme.startDate);
    this.addedLevelUps = this._programme.levelups;
    this.LevelUpService.getAllLevelUps().subscribe((levelUps) => {
      this.selectedlevelup = levelUps[0].levelUpId;
      this.allLevelUps = levelUps;
    });
  }

  addLevelUp() {
    const levelupInfo = this.allLevelUps.find((lvlUp) => lvlUp.levelUpId === this.selectedlevelup);
    this.addedLevelUpsArray = this.levelupDataSource.data;
    const indexOfObject = this.addedLevelUpsArray.findIndex((object) => {
      return object.levelUpId === levelupInfo.levelUpId;
    });
    if (indexOfObject !== -1) {
      this.callSnackBar('Cannot add duplicate group');
      return;
    }
    this.levelupDataSource.data.push(levelupInfo);
    this.levelUpTable.renderRows();
  }

  selectUser() {
    const userInfo = {
      displayName: this.staffFilterComponent.selectedUserPrinciple.displayName,
      upn: this.staffFilterComponent.selectedUserPrinciple.userPrincipleName,
      dateAdded: new Date(),
    };
    this.addedUsersArray = this.userDataSource.data;

    const indexOfObject = this.addedUsersArray.findIndex((object) => {
      return object.upn.toLocaleLowerCase() === userInfo.upn.toLocaleLowerCase();
    });

    if (indexOfObject !== -1) {
      this.callSnackBar('Cannot add duplicate users');
      return;
    } else {
      this.userDataSource.data.push(userInfo);
      this.userTable.renderRows();
    }
  }

  deleteLevelup(levelup) {
    this.addedLevelUpsArray = this.levelupDataSource.data;
    const indexOfObject = this.addedLevelUpsArray.findIndex((object) => {
      return object.name === levelup.name;
    });
    if (indexOfObject !== -1) {
      this.levelupDataSource.data.splice(indexOfObject, 1);
      this.addedLevelUps = this.levelupDataSource.data;
    }
    this.levelUpTable.renderRows();
  }

  deleteUser(user) {
    this.addedUsersArray = this.userDataSource.data;
    const indexOfObject = this.addedUsersArray.findIndex((object) => {
      return object.upn === user.upn;
    });
    if (indexOfObject !== -1) {
      this.userDataSource.data.splice(indexOfObject, 1);
      this.userDataSource.data.splice(indexOfObject, 1);
    }
    this.userTable.renderRows();
  }

  updateProgramme() {
    let error = false;
    if (!this.startDate || this.startDate == undefined) {
      const formDateString = this.programmeForm.controls['date'].value;
      this.startDate = new Date(formDateString);
    }

    const startDate = this.startDate.toLocaleDateString();

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
    } else {
      error = false;
      const programmeFormValues = this.programmeForm.getRawValue();

      const { programmeId, name, period } = programmeFormValues;

      const updatedProgramme = {
        programmeId,
        name,
        startDate,
        period,
        levelups: this.addedLevelUps.map((c) => {
          return {
            levelUpId: c.levelUpId,
            sortOrder: c.levelUpId,
          };
        }),
        users: this.userDataSource.data.map((c, index) => {
          return {
            upn: c.upn,
            sortOrder: ++index,
            dateAdded: c.dateAdded,
          };
        }),
      };
      this.onSave.emit(updatedProgramme);
    }
  }

  callSnackBar(Message) {
    this.snackBar.open(Message, '', { duration: 1000 });
  }
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  cancelCreate() {
    this.cancel.emit()
  }
}
