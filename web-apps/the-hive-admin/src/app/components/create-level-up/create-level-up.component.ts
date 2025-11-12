import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, NgForm, ValidatorFn, Validators } from '@angular/forms';
import { GroupService } from '../../services/group.service';
import { Observable, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { LevelUpService } from '../../services/level-up.service';
import { CoursesService } from '../../services/courses.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { TimeValidator } from '../../shared/time-validator';
import { CheckDateAndTime } from '../../shared/date-time-validators';
import { IconsService } from '../../services/icons.service';
import { parseEmailList } from '../../shared/string-parsers';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LevelUpWarningDialogComponent } from '../level-up-warning-dialog/level-up-warning-dialog.component';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-create-level-up',
    templateUrl: './create-level-up.component.html',
    styleUrls: ['./create-level-up.component.css'],
    standalone: false
})
export class CreateLevelUpComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();

  groups$: Observable<any>;
  icons$: Observable<any>;
  courses$: Observable<any>;
  activities$: Observable<any>;
  levelUpForm: undefined | UntypedFormGroup;
  startDate: Date = new Date();
  minDate: Date = new Date();
  addedCourses = [];
  courseDataSource = new MatTableDataSource();
  addedActivities = [];
  activityDataSource = new MatTableDataSource();
  addedGroups = [];
  groupDataSource = new MatTableDataSource();
  error = false;
  @ViewChild('parentForm') parentForm: NgForm;
  @ViewChild('openForm') openForm: MatMenuTrigger;

  displayedCourseColumns: string[] = ['name', 'action'];
  displayedActivityColumns: string[] = ['name', 'duration', 'date', 'time', 'facilitators', 'action'];
  displayedGroupColumns: string[] = ['name', 'action'];
  data: { warningMessage: string };

  constructor(
    public formBuilder: UntypedFormBuilder,
    public levelUpService: LevelUpService,
    public groupService: GroupService,
    public courseService: CoursesService,
    public snackBar: MatSnackBar,
    public matcher: CreateContentErrorStateMatcher,
    public iconService: IconsService,
    public dialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    this.groups$ = this.groupService.getAllGroups();
    this.icons$ = this.levelUpService.getLevelUpIcons();
    this.courses$ = this.courseService.getAllCourses();
    this.activities$ = this.levelUpService.getLevelUpActivityTypes();
  }

  createLevelUp() {
    if(!this.levelUpForm.valid) {
      this.error = true;
      return;
    }

    this.error = false;

    const levelUp = this.levelUpForm.getRawValue();
    levelUp.courses = this.addedCourses;
    levelUp.activities = this.addedActivities;
    levelUp.restrictGroup = this.addedGroups;

    if (!levelUp.facilitators) {
      this.snackBar.open('Please add facilitators to the levelup', '', { duration: 1000 });
      return;
    }

    const facilitatorsArray = parseEmailList(levelUp.facilitators);

    if (!facilitatorsArray.length) {
      this.snackBar.open('Please add at least one valid facilitator the levelup', '', { duration: 1000 });
      return;
    }

    levelUp.facilitators = facilitatorsArray;

    const invalidCourses = (this.addedCourses == undefined || this.addedCourses.length == 0);
    const invalidActivities = (this.addedActivities == undefined || this.addedActivities.length == 0);

    if(invalidActivities && invalidCourses) {
      this.snackBar.open('Please add a course or an activity', '', { duration: 1000 });
      this.levelUpForm.controls['courses'].updateValueAndValidity();
      this.levelUpForm.controls['activities'].updateValueAndValidity();
      this.levelUpForm.controls['facilitators'].updateValueAndValidity();
    } else {
      const createSubscription = this.levelUpService.createLevelUp(levelUp).subscribe(() => {
        this.snackBar.open('Level Up created successfully', '', { duration: 2000 });
        this.addedCourses = [];
        this.addedActivities = [];
        this.addedGroups = [];
      });
      this.dataSubscription.add(createSubscription);
      this.levelUpForm = undefined;
    }
  }

  addCourse() {
    const course = this.levelUpForm.controls['courses'].value;
    if (!course) {
      this.snackBar.open('Please select a course to add', '', { duration: 1000 });
      return;
    }

    const foundPos = this.addedCourses.map( (item) => item.courseId ).indexOf(course.courseId);

    if (foundPos !== -1) {
      this.snackBar.open('Cannot add duplicate course', '', { duration: 1000 });
      return;
    }

    this.addedCourses.push(course);
    this.levelUpForm.controls['courses'].updateValueAndValidity();
    this.levelUpForm.controls['activities'].updateValueAndValidity();
    this.levelUpForm.controls['facilitators'].updateValueAndValidity();
    this.courseDataSource.data = this.addedCourses;
  }

  deleteCourse(courseId) {
    const removePos = this.addedCourses.map( (item) => item.courseId ).indexOf(courseId);

    if (removePos !== -1) {
      this.addedCourses.splice(removePos, 1);
    }
    
    this.levelUpForm.controls['courses'].updateValueAndValidity();
    this.levelUpForm.controls['activities'].updateValueAndValidity();
    this.levelUpForm.controls['facilitators'].updateValueAndValidity();
    this.courseDataSource.data = this.addedCourses;
  }

  addActivity() {
    const activity = Object.assign({}, this.levelUpForm.controls['activities'].value); //need to assign new object as otherwise the same activies reference the same object as it has already been created
    const duration = this.levelUpForm.controls['duration'].value;
    const activityDate = this.levelUpForm.controls['startDate'].value;

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

    if (this.levelUpForm.controls['startDate'].invalid) {
      this.snackBar.open('Please choose a later date/time for your selected activity', '', { duration: 1000 });
    } else {

      activity.startDate = activityDate;

      const sameTime = !this.addedActivities.every((item) => {
        if (item.levelUpActivityTypeId == activity.levelUpActivityTypeId) {
          const itemTime = item.startDate.getTime();
          return itemTime != activityDate.getTime();
        } else {
          return true;
        }
      });

      if (sameTime && this.addedActivities.length > 0) {
        this.snackBar.open('Cannot add duplicate activity', '', { duration: 1000 });
        return;
      }

      this.addedActivities.push(activity);
      this.levelUpForm.controls['courses'].updateValueAndValidity();
      this.levelUpForm.controls['activities'].updateValueAndValidity();
      this.levelUpForm.controls['facilitators'].updateValueAndValidity();
      this.activityDataSource.data = this.addedActivities;
    }
  }

  deleteActivity(activityId) {
    const removePos = this.addedActivities.map( (item) => item.levelUpActivityTypeId ).indexOf(activityId);

    if (removePos !== -1) {
      this.addedActivities.splice(removePos, 1);
    }

    this.levelUpForm.controls['courses'].updateValueAndValidity();
    this.levelUpForm.controls['activities'].updateValueAndValidity();
    this.levelUpForm.controls['facilitators'].updateValueAndValidity();
    this.activityDataSource.data = this.addedActivities;
  }

  addGroup() {
    const group = this.levelUpForm.controls['restrictGroup'].value;

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
    this.levelUpForm.controls['startTime'].setValidators( //reset the validator when the date is changed
      Validators.compose([
        Validators.required,
        TimeValidator(this.startDate) //change date the validator uses to the new start date
      ]));
    this.levelUpForm.controls['startTime'].updateValueAndValidity(); //update validity of time
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  private checkCourseOrActivity(form: AbstractControl): { [key: string]: any } {
    const courses = this.addedCourses;
    const activities = this.addedActivities;

    const validCourses = courses && (courses.length > 0);
    const validActivities = activities && (activities.length > 0);
  
    if (!validCourses && !validActivities) {
      return { 'invalidInput': {courseControl: courses, activityControl: activities},
            'message': 'Level up must have a course or activity'}
    } else {
      return null;
    }
  }

  openCreateNewLevelUpForm() {
    this.levelUpForm = this.formBuilder.group({
      name: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50)
        ])
      ],
      icon: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50)
        ])
      ],
      description: [
        '',
        Validators.compose([
          Validators.required
        ])
      ],
      link: [
        '',
        Validators.maxLength(200)
      ],
      restrictGroup: [
        ''
      ],
      courses: [
        '',
        [c => this.checkCourseOrActivity(c)]
      ],
      activities: [
        '',
        [c => this.checkCourseOrActivity(c)]
      ],
      duration: [
        '',
        Validators.compose([
          Validators.pattern(/^[0-9]+$/)
        ])
      ],
      startDate: [
        this.startDate,
        CheckDateAndTime(false),
      ],
      facilitators: [
        '',
        Validators.compose([
          Validators.required
        ])
      ]
    });      
  }

  closeCreateNewLevelUpForm() {
    const form = this.levelUpForm.getRawValue();
    const filledFields = Object.keys(form).filter(key => form[key] !== "");
    let dialogRef: MatDialogRef<LevelUpWarningDialogComponent>;

    if(filledFields) {
       dialogRef = this.dialog.open(LevelUpWarningDialogComponent, {
        width: '60em',
        data: {
          warningMessage: 'Warning! Are you sure you want to cancel? You will lose any data that you filled in.'
        },
      })
    }

    dialogRef.componentInstance.onConfirmClicked.subscribe(() => {
        dialogRef.afterClosed().subscribe(() => {
          dialogRef.componentInstance.onConfirmClicked.unsubscribe();
          this.levelUpForm = undefined;
          this.changeDetectorRef.detectChanges();
          this.openForm.focus();
        })
    })
  }
}
