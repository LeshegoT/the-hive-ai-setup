import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { SideQuestService } from '../../services/side-quest.service';
import { GroupService } from '../../services/group.service';
import { Observable, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher'
import { CheckDateAndTime } from '../../shared/date-time-validators';

@Component({
    selector: 'app-create-side-quest',
    templateUrl: './create-side-quest.component.html',
    styleUrls: ['./create-side-quest.component.css'],
    standalone: false
})
export class CreateSideQuestComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();

  @ViewChild('parentForm') private parentForm: NgForm;
  typeSubscription$: Observable<any>;
  groups$: Observable<any>;
  sideQuestForm: UntypedFormGroup;
  startDate: Date = new Date();
  minDate: Date = new Date();
  addedGroups = [];
  groupDataSource = new MatTableDataSource();
  error = false;

  displayedGroupColumns: string[] = ['name', 'action'];

  constructor(
    private formBuilder: UntypedFormBuilder, 
    private sideQuestService: SideQuestService,
    private groupService: GroupService,
    private snackBar: MatSnackBar,
    public matcher: CreateContentErrorStateMatcher
  ) {
    this.sideQuestForm = this.formBuilder.group({
      type: [
        '',
        Validators.required
      ],
      name: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50)
        ])
      ],
      link: [
        '',
        Validators.maxLength(500) //500 as this is the NVARCHAR size in the DB
      ],
      venue: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(500) //500 as this is the NVARCHAR size in the DB
        ])
      ],
      startDate: [
        this.startDate,
        CheckDateAndTime(false)
      ],
      external: [
        false
      ],
      registrationRequired: [
        false
      ],
      description: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(1000) //1000 as this is the NVARCHAR size in the DB
        ])
      ],
      restrictGroup: [
        '',
      ]
    });
  }

  ngOnInit() {
    this.typeSubscription$ = this.sideQuestService.getSideQuestTypes();
    this.groups$ = this.groupService.getAllGroups();
  }

  async createQuest() {
    if(!this.sideQuestForm.valid) {
      this.error = true;
      if(!this.sideQuestForm.controls['startDate'].valid) {
        this.snackBar.open('Please choose a later starting time for Side Quest today', '', { duration: 1000 });
      }
    } else {
      const date = this.sideQuestForm.controls['startDate'].value;
      const sideQuest = this.sideQuestForm.getRawValue();

      sideQuest.restrictGroup = this.addedGroups;

      this.error = false;

      const createSubscription = this.sideQuestService.createSideQuest(sideQuest).subscribe(() => {
        this.snackBar.open('Side quest created successfully', '', { duration: 2000 });
        this.parentForm.resetForm();
        this.sideQuestForm.controls['startTime'].setValue('08:00');
        this.addedGroups = [];
      });
      this.dataSubscription.add(createSubscription);
    }
  }

  addGroup() {
    const group = this.sideQuestForm.controls['restrictGroup'].value;

    if (!group) {
      this.snackBar.open('Please select a group to add', '', { duration: 1000 });
      return;
    }

    const foundPos = this.addedGroups.map( (item) => item.groupName ).indexOf(group.groupName);

    if (foundPos !== -1) {
      this.snackBar.open('Cannot add duplicate group', '', { duration: 1000 });
      return;
    }

    this.addedGroups.push(group);
    this.groupDataSource.data = this.addedGroups;
  }

  deleteGroup(groupName) {
    const removePos = this.addedGroups.map( (item) => item.groupName ).indexOf(groupName);

    if (removePos !== -1) {
      this.addedGroups.splice(removePos, 1);
    }

    this.groupDataSource.data = this.addedGroups;
  }

  dateChanged(date) {
    this.startDate = date;
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
