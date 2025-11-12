import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { CoursesService } from '../../services/courses.service';
import { AuthService } from '../../services/auth.service';
import { TracksService } from '../../services/tracks.service';
import { Subscription, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { SectionEditorComponent } from '../section-editor/section-editor.component';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { GroupService } from '../../services/group.service';
import { IconsService } from '../../services/icons.service';

@Component({
    selector: 'course-editor',
    templateUrl: './course-editor.component.html',
    styleUrls: ['./course-editor.component.css', '../../shared/shared.css'],
    standalone: false
})
export class CourseEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  courseForm: UntypedFormGroup| undefined = undefined;
  @ViewChild(SectionEditorComponent) sectionChild: SectionEditorComponent; //grabbing child section editor to reset later
  @ViewChild('parentForm') parentForm: NgForm;
  @Output() onSave = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  @Input()
  set form(form) {
    this.courseForm = form;
  }
  get form() {
    return this.courseForm;
  }
  dataSubscription: Subscription = new Subscription();
  tracks$: Observable<any>;
  icons$: Observable<any>;
  error = false;
  loggedInUser: string;
  existingTypes = [];
  addedSections = [];
  addedGroups = [];
  groups$: Observable<string>;
  groupDataSource = new MatTableDataSource();

  displayedGroupColumns: string[] = ['name', 'action'];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private coursesService: CoursesService,
    private authService: AuthService,
    private trackService: TracksService,
    public matcher: CreateContentErrorStateMatcher,
    private iconService: IconsService,
    private groupService: GroupService,
  ) {}

  ngOnInit() {
    const courseSubscription = this.coursesService.getAllCourses().subscribe((types) => {
      for (const type of types) {
        this.existingTypes.push(type.code);
      }
    });

    this.tracks$ = this.trackService.getAllTrack();
    this.icons$ = this.iconService.getAllIcons();
    this.groups$ = this.groupService.getAllGroups();
    this.dataSubscription.add(courseSubscription);
    this.authService.getUserPrincipleName().subscribe((upn) => (this.loggedInUser = upn));
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  addGroup() {
    const group = this.courseForm.controls['restrictions'].value;
    this.courseForm.get('restrictions').setValue(undefined)

    if (!group) {
      this.snackBar.open('Please select a group to add', '', { duration: 1000 });
      return;
    }

    const foundPos = this.addedGroups.map((item) => item.groupName).indexOf(group.groupName);

    if (foundPos !== -1) {
      this.snackBar.open('Cannot add duplicate group', '', { duration: 1000 });
      return;
    }

    this.addedGroups.push(group);
    this.groupDataSource.data = this.addedGroups;
  }

  deleteGroup(groupName) {
    const removePos = this.addedGroups.map((item) => item.groupName).indexOf(groupName);

    if (removePos !== -1) {
      this.addedGroups.splice(removePos, 1);
    }

    this.groupDataSource.data = this.addedGroups;
  }
  updateTrack(){
    this.tracks$ = this.trackService.getAllTrack();
  }

  createCourse() {
    if (!this.courseForm.valid) {
      this.error = true;
      Object.keys(this.courseForm.controls).forEach((fieldName) => {
        this.courseForm.controls[fieldName].markAsDirty();
        this.courseForm.controls[fieldName].markAsTouched();
      });
      return;
    }

    const course = this.courseForm.getRawValue();

    if (this.existingTypes.indexOf(course.code) !== -1) {
      this.snackBar.open('Duplicate codes are not permitted', '', { duration: 1000 });
      return;
    }

    if (!this.addedSections.length) {
      this.snackBar.open('A course cannot be added without at least one section', '', { duration: 1000 });
      return;
    }

    course.sections = this.addedSections;
    course.creator = this.loggedInUser;

    this.error = false;
    course.restrictions = this.addedGroups;

    const createSubscription = this.coursesService.createCourse(course).subscribe(() => {
      this.snackBar.open('Course created successfully', '', { duration: 2000 });
      this.resetForm();
      this.onSave.emit();
    });
    this.dataSubscription.add(createSubscription);
  }

  resetForm() {
    this.sectionChild.sectionGroup.reset();
    this.courseForm.reset();
    this.parentForm.resetForm();
    this.addedSections = [];
    this.addedGroups = [];
  }

  cancel(){
    this.onCancel.emit();
    this.resetForm();
  }

}
