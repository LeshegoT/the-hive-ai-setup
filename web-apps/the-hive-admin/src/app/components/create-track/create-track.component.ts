import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { CoursesService } from '../../services/courses.service'
import { TracksService } from '../../services/tracks.service';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { IconsService } from '../../services/icons.service';

@Component({
    selector: 'app-create-track',
    templateUrl: './create-track.component.html',
    styleUrls: ['./create-track.component.css'],
    standalone: false
})
export class CreateTrackComponent implements OnInit, OnDestroy {

  dataSubscription: Subscription = new Subscription();
  @Output() onSave = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  icons$: Observable<any>;
  courses$: Observable<any>;
  groups$: Observable<any>;
  trackForm: UntypedFormGroup|undefined = undefined;
  @ViewChild('parentForm') parentForm: NgForm;
  error = false;
  existingTypes = [];
  addedCourses = [];
  addedGroups = [];
  courseDataSource = new MatTableDataSource();
  groupDataSource = new MatTableDataSource();
  @Input()
  set form(form) {
    this.trackForm = form;
  }
  get form() {
    return this.trackForm;
  }
  displayedCourseColumns: string[] = ['name', 'order', 'action'];
  displayedGroupColumns: string[] = ['name', 'action'];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private coursesService: CoursesService,
    private trackService: TracksService,
    private authService: AuthService,
    private groupService: GroupService,
    public matcher: CreateContentErrorStateMatcher,
    private iconService: IconsService
  ) {}

  ngOnInit() {
    const trackSubscription = this.trackService.getAllTracksWithCourses().subscribe( (types) => {
      for (const type of types) {
        this.existingTypes.push(type.code);
      }
    });
    this.icons$ = this.iconService.getAllIcons();
    this.courses$ = this.coursesService.getAllCourses();
    this.groups$ = this.groupService.getAllGroups();
    this.dataSubscription.add(trackSubscription);
  }

  addCourse() {
    const course = this.trackForm.controls['course'].value;
    this.trackForm.get('course').setValue(undefined);

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
    this.courseDataSource.data = this.addedCourses;
  }

  deleteCourse(courseId) {
    const removePos = this.addedCourses.map( (item) => item.courseId ).indexOf(courseId);

    if (removePos !== -1) {
      this.addedCourses.splice(removePos, 1);
    }

    this.courseDataSource.data = this.addedCourses;
  }

  changeCourseOrderUp(courseId) {
    const changePos = this.addedCourses.map( (item) => item.courseId ).indexOf(courseId);

    if (changePos == 0) {
      return;
    }

    this.changeSectionOrder(changePos, changePos - 1);
  }

  changeCourseOrderDown(courseId) {
    const changePos = this.addedCourses.map( (item) => item.courseId ).indexOf(courseId);

    if (changePos == this.addedCourses.length - 1) {
      return;
    }

    this.changeSectionOrder(changePos, changePos + 1);
  }

  changeSectionOrder(originalPos, newPos) {
    const tmp = this.addedCourses[newPos];
    this.addedCourses[newPos] = this.addedCourses[originalPos];
    this.addedCourses[originalPos] = tmp;

    this.courseDataSource.data = this.addedCourses;
  }

  addGroup() {
    const group = this.trackForm.controls['restrictions'].value;
    this.trackForm.get('restrictions').setValue(undefined);

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

  createTrack() {
   if(!this.trackForm.valid) {
      this.error = true;
      return;
    }

    const track = this.trackForm.getRawValue();

    if (this.existingTypes.indexOf(track.code) !== -1) {
      this.snackBar.open('Duplicate codes are not permitted', '', { duration: 1000 });
      return;
    }

    if (!this.addedCourses.length) {
      this.snackBar.open('A track cannot be added without at least one course', '', { duration: 1000 });
      return;
    }

    track.courses = this.addedCourses;
    track.restrictions = this.addedGroups;
    track.creator = this.authService.getUserPrincipleName();
    this.error = false;

    const createSubscription = this.trackService.createTrack(track).subscribe(() => {
      this.snackBar.open('Track created successfully', '', { duration: 2000 });
      this.resetForm()
      this.onSave.emit()
    });
    this.dataSubscription.add(createSubscription);
  }

  resetForm() {
    this.parentForm.resetForm();
    this.addedCourses = [];
    this.addedGroups = [];
  }

  cancel() {
    this.onCancel.emit();
    this.resetForm();
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
