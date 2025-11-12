import { Component, Input, OnInit, Output, ViewChild, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subscription } from 'rxjs';
import { CoursesService } from '../../services/courses.service';
import { GroupService } from '../../services/group.service';
import { LevelUpService } from '../../services/level-up.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { CheckDateAndTime } from '../../shared/date-time-validators';
import { LevelUpInterface } from '../table-level-up/table-level-up.component';
import { parseEmailList } from '../../shared/string-parsers';
import { StaffFilterComponent } from '../staff-filter/staff-filter.component';

@Component({
    selector: 'app-manage-level-up',
    templateUrl: './manage-level-up.component.html',
    styleUrls: ['./manage-level-up.component.css'],
    standalone: false
})
export class ManageLevelUpComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();

  groups$: Observable<any>;
  icons$: Observable<any>;
  courses$;
  activities$: Observable<any>;
  allActivities$: Observable<any>;
  manageLevelUpForm: UntypedFormGroup;
  activityTable: UntypedFormArray;
  startDate: Date = new Date();
  minDate: Date = new Date();
  addedCourses = [];
  courseDataSource = new MatTableDataSource();
  addedFacilitators: { displayName: string, userPrincipleName: string }[] = [];
  facilitatorDataSource = new MatTableDataSource();
  addedActivities = [];
  removedActivities = [];
  activityDataSource = new MatTableDataSource();
  restrictions: any;
  groupDataSource = new MatTableDataSource();
  error = false;
  @ViewChild('parentForm') parentForm: NgForm;
  @ViewChild(StaffFilterComponent) staffFilterComponent;

  private _levelUp;
  @Input()
  set levelUp(levelUp) {
    this._levelUp = levelUp || '';
    this.setFormValues();
    this.manageLevelUpForm.updateValueAndValidity();
  }
  get levelUp() {
    return this._levelUp;
  }
  @Output() OnSave = new EventEmitter<LevelUpInterface>();

  displayedCourseColumns: string[] = ['name', 'action'];
  displayedActivityColumns: string[] = ['name', 'duration', 'date', 'action'];
  displayedFacilitatorColumns: string[] = ['name', 'action'];
  displayedGroupColumns: string[] = ['name', 'action'];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private levelUpService: LevelUpService,
    private groupService: GroupService,
    private courseService: CoursesService,
    private snackBar: MatSnackBar,
    public matcher: CreateContentErrorStateMatcher
  ) {
    this.manageLevelUpForm = this.formBuilder.group({
      name: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
      icon: ['', Validators.required],
      description: ['', Validators.compose([Validators.required])],
      link: ['', Validators.maxLength(200)],
      restrictGroup: [''],
      courses: [''],
      activities: [''],
      duration: ['', Validators.compose([Validators.pattern(/^[0-9]+$/)])],
      startDate: [this.startDate, CheckDateAndTime(true)],
      activityTable: this.formBuilder.array([]),
      facilitators: [''],
    });
  }

  ngOnInit(): void {
    this.activityTable = this.manageLevelUpForm.controls['activityTable'] as UntypedFormArray;

    this.groups$ = this.groupService.getAllGroups();
    this.icons$ = this.levelUpService.getLevelUpIcons();
    this.activities$ = this.levelUpService.getLevelUpActivityTypes();
    const coursesSubscription = this.courseService.getAllCourses().subscribe((courses) => {
      this.courses$ = courses;
      this.setFormValues();
    });

    this.dataSubscription.add(coursesSubscription);
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  setFormValues() {
    if (this._levelUp) {
      this.startDate = new Date(this.levelUp.startDate);
      this.manageLevelUpForm.controls['startDate'].setValue(this.startDate);

      for (const prop in this.levelUp) {
        if (prop != 'startDate' && this.manageLevelUpForm.controls[prop]) {
          this.manageLevelUpForm.controls[prop].setValue(this.levelUp[prop]);
        }
      }

      const coursesToShow = [];

      if (this.courses$ && this.levelUp['courseIds']) {
        this.levelUp['courseIds'].forEach((id) => {
          const course = this.courses$.find((c) => c.courseId === id);
          coursesToShow.push(course);
        });
      }

      this.addedCourses = coursesToShow;
      this.courseDataSource.data = coursesToShow;

      const levelUpSubscription = this.levelUpService.getLevelUp(this.levelUp.levelUpId).subscribe((foundLevelUp) => {
        this.activityTable.clear();
        this.addedActivities = foundLevelUp.activities.map((row) => ({
          name: row.levelUpActivityType,
          levelUpActivityId: row.levelUpActivityId,
          durationInMinutes: row.durationInMinutes,
          startDate: new Date(row.activityDate),
          levelUpActivityTypeId: row.levelUpActivityTypeId,
        }));
        this.addedActivities.forEach((entry) => {
          this.addDateRow(entry);
        });
        this.activityDataSource.data = this.addedActivities;

        this.addedFacilitators = foundLevelUp.facilitators.map((row) => ({
          displayName: row.displayName,
          userPrincipleName: row.userPrincipleName,
        }));
        this.facilitatorDataSource.data = this.addedFacilitators;
      });

      this.dataSubscription.add(levelUpSubscription);
    }
  }

  addDateRow(entry) {
    this.activityTable.push(
      this.formBuilder.group({
        startDate: [entry.startDate],
        duration: [entry.durationInMinutes, Validators.compose([Validators.required, Validators.pattern(/^[0-9]+$/)])],
      })
    );
  }

  addActivity() {
    const activity = { ...this.manageLevelUpForm.controls['activities'].value }; //need to assign new object as otherwise the same activies reference the same object as it has already been created
    const duration = this.manageLevelUpForm.controls['duration'].value as number;
    const activityDate = this.manageLevelUpForm.controls['startDate'].value;

    if (!activity) {
      this.snackBar.open('Please select an activity to add', '', { duration: 1000 });
      return;
    }

    if (!duration) {
      this.snackBar.open('Please add a duration to your selected activity', '', { duration: 1000 });
      return;
    }

    activity.durationInMinutes = duration;

    if (!this.startDate) {
      this.snackBar.open('Please add a date for your selected activity', '', { duration: 1000 });
      return;
    }

    if (this.manageLevelUpForm.controls['startDate'].invalid) {
      this.snackBar.open('Please choose a later date/time for your selected activity', '', { duration: 1000 });
    } else {
      activity.startDate = activityDate;

      const sameTime = !this.addedActivities.every((item) => this.checkActivityTime(activity, item));

      if (sameTime && this.addedActivities.length > 0) {
        this.snackBar.open('Cannot add duplicate activity', '', { duration: 1000 });
        return;
      }
      const act = {
        name: activity.name,
        levelUpActivityId: activity.levelUpActivityId,
        durationInMinutes: parseInt(activity.durationInMinutes),
        startDate: activity.startDate,
        levelUpActivityTypeId: activity.levelUpActivityTypeId,
      };
      act.levelUpActivityId = null; //used in the SQL to determine if the item should be updated, or inserted
      this.addedActivities.push(act);
      this.addDateRow(act);
      this.manageLevelUpForm.controls['courses'].updateValueAndValidity();
      this.manageLevelUpForm.controls['activities'].updateValueAndValidity();
      this.manageLevelUpForm.controls['facilitators'].updateValueAndValidity();
      this.activityDataSource.data = this.addedActivities;
    }
  }

  checkActivityTime(activity, item): boolean {
    if (item.levelUpActivityTypeId == activity.levelUpActivityTypeId) {
      const itemTime = item.startDate.getTime();
      return itemTime != activity.startDate.getTime();
    } else {
      return true;
    }
  }

  deleteActivity(activityId, indexRow) {
    const removePos = this.addedActivities.map((item) => item.levelUpActivityTypeId).indexOf(activityId);

    if (removePos !== -1) {
      this.removedActivities.push(this.addedActivities[removePos]);
      this.addedActivities.splice(removePos, 1);
      this.activityTable.removeAt(indexRow);
    }

    this.manageLevelUpForm.controls['courses'].updateValueAndValidity();
    this.manageLevelUpForm.controls['activities'].updateValueAndValidity();
    this.manageLevelUpForm.controls['facilitators'].updateValueAndValidity();
    this.activityDataSource.data = this.addedActivities;
  }

  addCourse() {
    const course = this.manageLevelUpForm.controls['courses'].value;

    if (!course) {
      this.snackBar.open('Please select a course to add', '', { duration: 1000 });
      return;
    }

    const foundPos = this.addedCourses.map((item) => item.courseId).indexOf(course.courseId);

    if (foundPos !== -1) {
      this.snackBar.open('Cannot add duplicate course', '', { duration: 1000 });
      return;
    }

    this.addedCourses.push(course);
    this.manageLevelUpForm.controls['courses'].updateValueAndValidity();
    this.manageLevelUpForm.controls['activities'].updateValueAndValidity();
    this.manageLevelUpForm.controls['facilitators'].updateValueAndValidity();
    this.courseDataSource.data = this.addedCourses;
    this.manageLevelUpForm.controls['courses'].reset();
  }

  deleteCourse(courseId) {
    const removePos = this.addedCourses.map((item) => item.courseId).indexOf(courseId);

    if (removePos !== -1) {
      this.addedCourses.splice(removePos, 1);
    }

    this.manageLevelUpForm.controls['courses'].updateValueAndValidity();
    this.manageLevelUpForm.controls['activities'].updateValueAndValidity();
    this.manageLevelUpForm.controls['facilitators'].updateValueAndValidity();
    this.courseDataSource.data = this.addedCourses;
  }

  addFacilitator() {
    const newUser = this.staffFilterComponent.selectedUserPrinciple.userPrincipleName;

    const facilitatorsSubscription = this.levelUpService.getUserDetails(newUser).subscribe((facilitatorDetails) => {
      const newFacilitator = {
        displayName: facilitatorDetails.displayName,
        userPrincipleName: facilitatorDetails.userPrincipleName,
      }

      const newFacilitatorEmailExists = this.addedFacilitators.find(facilitator => facilitator.userPrincipleName === newFacilitator.userPrincipleName);
      if (newFacilitatorEmailExists) {
        this.snackBar.open('Facilitator was added already.', '', { duration: 3000 });
      } else {
        this.addedFacilitators.push(newFacilitator);
        this.facilitatorDataSource.data = this.addedFacilitators;
      }
    });
    this.dataSubscription.add(facilitatorsSubscription);
    this.facilitatorDataSource.data = this.addedFacilitators;
    

    this.manageLevelUpForm.controls['facilitators'].setValue("");

    this.manageLevelUpForm.controls['courses'].updateValueAndValidity();
    this.manageLevelUpForm.controls['activities'].updateValueAndValidity();
    this.manageLevelUpForm.controls['facilitators'].updateValueAndValidity();
  }

  deleteFacilitator(upn) {
    const removePos = this.addedFacilitators.map((item) => item.userPrincipleName).indexOf(upn);

    if (removePos !== -1) {
      this.addedFacilitators.splice(removePos, 1);
    }

    this.manageLevelUpForm.controls['courses'].updateValueAndValidity();
    this.manageLevelUpForm.controls['activities'].updateValueAndValidity();
    this.manageLevelUpForm.controls['facilitators'].updateValueAndValidity();
    this.facilitatorDataSource.data = this.addedFacilitators;
  }

  updateLevelUp() {
    if (this.manageLevelUpForm.valid) {
      this.error = false;
      const levelUp = this.manageLevelUpForm.getRawValue();
      const { levelUpId } = this.levelUp;
      levelUp.levelUpId = levelUpId;
      levelUp.courses = this.addedCourses;
      levelUp.activities = this.addedActivities;
      levelUp.facilitators = [];
      levelUp.facilitators = this.addedFacilitators.map(facilitator => facilitator.userPrincipleName);
      levelUp.removedActivities = this.removedActivities;
      const allDates = [];
      for (let i = 0; i < levelUp.activities.length; i++) {
        //updating time and duration values
        const newDate = this.activityTable.at(i).value.startDate;
        allDates.push(newDate);
        const newDuration = this.activityTable.at(i).value.duration;
        levelUp.activities[i].startDate = newDate;
        levelUp.activities[i].durationInMinutes = parseInt(newDuration);
      }
      levelUp.restricted = this.restrictions.restricted;
      levelUp.restrictions = levelUp.restricted ? this.restrictions : null;

      const newStartDate = new Date(Math.min(...allDates));
      const newEndDate = new Date(Math.max(...allDates));

      const invalidCourses = this.addedCourses == undefined || this.addedCourses.length == 0;
      const invalidActivities = this.addedActivities == undefined || this.addedActivities.length == 0;
      const invalidFacilitators = this.addedFacilitators == undefined || this.addedFacilitators.length == 0;

      if (invalidActivities && invalidCourses) {
        this.snackBar.open('Please add a course or an activity', '', { duration: 1000 });
        this.manageLevelUpForm.controls['courses'].updateValueAndValidity();
        this.manageLevelUpForm.controls['activities'].updateValueAndValidity();
        this.manageLevelUpForm.controls['facilitators'].updateValueAndValidity();
      } else if (invalidFacilitators) {
        this.snackBar.open('Please add at least one facilitator', '', { duration: 1000 });
        this.manageLevelUpForm.controls['courses'].updateValueAndValidity();
        this.manageLevelUpForm.controls['activities'].updateValueAndValidity();
        this.manageLevelUpForm.controls['facilitators'].updateValueAndValidity();
      } else {
        const levelUpInt: LevelUpInterface = this.levelUp;
        levelUpInt.name = levelUp.name;
        levelUpInt.description = levelUp.description;
        levelUpInt.icon = levelUp.icon;
        levelUpInt.startDate = newStartDate;
        levelUpInt.endDate = newEndDate;
        this.OnSave.emit(levelUp);
      }
    } else {
      this.error = true;
    }
  }
}