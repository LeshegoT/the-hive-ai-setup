import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { TracksService } from "../../services/tracks.service";
import { CoursesService } from '../../services/courses.service';
import { combineLatest, map, Observable, Subscription } from 'rxjs';
import { contentTypeCodes } from '../../shared/enums';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { IconsService } from '../../services/icons.service';
import { Icon } from '../../shared/interfaces';

@Component({
    selector: 'app-manage-tracks',
    templateUrl: './manage-tracks.component.html',
    styleUrls: ['./manage-tracks.component.css'],
    standalone: false
})
export class ManageTracksComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();

  restrictions;
  groups$;
  icons$: Observable<Icon[]>;
  courses$;
  startDate: Date = new Date();
  addedCourses = [];
  courseDataSource = new MatTableDataSource();
  addedGroups = [];
  groupDataSource = new MatTableDataSource();
  error = false;
  tracksForm: UntypedFormGroup;
  private _track;
  @Input()
  set track(track) {
    this._track = (track || '');
    this.setFormValues();
  }
  get track() { return this._track; }

  contentType: contentTypeCodes = contentTypeCodes.track;
  @Output() onSave = new EventEmitter();
  @Output() onCancel = new EventEmitter();

  displayedCourseColumns: string[] = ['name', 'action'];
  trackName;
  constructor(
    private formBuilder: UntypedFormBuilder,
    private courseService: CoursesService,
    private tracksService: TracksService,
    private iconsService: IconsService,
    private snackBar: MatSnackBar,
    public matcher: CreateContentErrorStateMatcher) {
    this.tracksForm = this.formBuilder.group({
      trackId: [{ value: null, disabled: true }, Validators.compose([Validators.required])],
      code: ['', Validators.compose([Validators.required, Validators.pattern(/^[a-z\-]+$/), Validators.maxLength(50)])],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
      icon: [
        '', 
        Validators.compose([
          Validators.required, 
        ]),
      ],
      restricted: ['', Validators.compose([Validators.required])],
      courses: [''],
      courseId: [''],
      courseIds: [''],
    });
  }


  ngOnInit() {

    const coursesSubscription = this.courseService.getAllCourses()
    .subscribe((courses) => {
      this.courses$ = courses;
      this.setFormValues();
    });
    const allIcons$ = this.iconsService.getAllIcons();
    const trackIcons$ = this.tracksService.getTracksIcons();
    this.icons$ = combineLatest([allIcons$, trackIcons$]).pipe(
      map(([icons, trackIcons]) => {
        return [...icons, ...trackIcons];
      })
    );

    this.dataSubscription.add(coursesSubscription);
  }

  setFormValues() {
    if (this._track) {
      this.trackName = this.track.name;

      for (const prop in this.track) {
        //set form values friom the input
        this.tracksForm.controls[prop].setValue(this.track[prop]);
      }
      const coursesToShow = [];

      if (this.courses$) {
        this.track['courseIds'].forEach(id => {
          const course = this.courses$.find(c => c.courseId === id);
          coursesToShow.push(course);
        });
      }

      this.addedCourses = coursesToShow;
      this.courseDataSource.data = coursesToShow;
    }
  }

  addCourse() {
    const course = this.tracksForm.controls['courses'].value;

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
    this.courseDataSource.data = this.addedCourses;
  }

  deleteCourse(courseId) {
    const removePos = this.addedCourses.map((item) => item.courseId).indexOf(courseId);

    if (removePos !== -1) {
      this.addedCourses.splice(removePos, 1);
    }

    this.courseDataSource.data = this.addedCourses;
  }

  updateTrack() {
    if (!this.tracksForm.valid) {
      this.error = true;
    } else if (this.addedCourses.length < 1) {
      this.snackBar.open('A track must have at least one course', '', { duration: 1000 });
    } else {

      this.error = false;

      const trackFormValues = this.tracksForm.getRawValue();

      const { trackId, code, name , icon } = trackFormValues;
      const restricted = this.restrictions.restricted;

      const updatedTrack = {
        trackId, code, name, restricted, icon,
        restrictions: this.restrictions,
        courses: this.addedCourses.map((c, index) => {
          return {
            courseId: c.courseId,
            sortOrder: ++index
          };
        }),
        courseIds: this.addedCourses.map(c => c.courseId)
      };

      this.onSave.emit(updatedTrack);
    }
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}

