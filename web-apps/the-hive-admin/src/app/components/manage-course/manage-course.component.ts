import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { IconsService } from '../../services/icons.service';
import { SectionsService } from '../../services/sections.service';
import { TracksService } from '../../services/tracks.service';
import { Icon } from '../../shared/interfaces';
import { SectionEditorComponent } from '../section-editor/section-editor.component';

@Component({
    selector: 'app-manage-course',
    templateUrl: './manage-course.component.html',
    styleUrls: ['./manage-course.component.css'],
    standalone: false
})
export class ManageCourseComponent implements OnInit, OnDestroy {
  dataSubscription: Subscription = new Subscription();
  assignedTrackIds: number[]  = [];
  sections$: any;
  icons$: Observable<Icon[]>;
  courseForm: UntypedFormGroup;
  error = false;
  existingTypes = [];
  addedSections = [];
  creating = false;

  @ViewChild(SectionEditorComponent) sectionEditorComponent

  @Output() onSave = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  tracks$: Observable<any>;
  restrictions: any;
  private _course;
  @Input()
  set course(course) {
    this._course = course || undefined;
    this.setFormValues();
  }
  get course() {
    return this._course;
  }

  constructor(
    private trackService: TracksService,
    private formBuilder: UntypedFormBuilder,
    private sectionsService: SectionsService,
    private authService: AuthService,
    private IconsService: IconsService
  ) {
    this.courseForm = this.formBuilder.group({
      code: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(/^[a-z\-]+$/),
          Validators.minLength(2),
          Validators.maxLength(50),
        ]),
      ],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
      icon: ['', Validators.required],
      description: ['', Validators.compose([Validators.required, Validators.maxLength(500)])],
      assignedTrackIds:  [[],  Validators.required]
    });
  }

  ngOnInit() {
    this.subscribeToTracks();
    const sectionsSubscription = this.sectionsService.getAllSections().subscribe((sections) => {
      this.sections$ = sections;
      this.setFormValues();
    });

    this.tracks$ = this.trackService.getAllTracksWithCourses();
    this.icons$ = this.IconsService.getAllIcons();
    this.dataSubscription.add(sectionsSubscription);
  }

  subscribeToTracks() {
    const tracksSubscription = this.trackService.getAllTracksWithCourses().subscribe((tracks) => {
      tracks.map((track) => {
        track.courseIds.map((courseArr) => {
          if (courseArr == this.course.courseId) {
            this.assignedTrackIds.push(track.trackId);
          }
        });
      });
      this.courseForm.get('assignedTrackIds').setValue(this.assignedTrackIds);
    });
    this.dataSubscription.add(tracksSubscription);
  }

  trackByPath(image: Icon): string {
    if (image.path.includes(this.course.icon)) {
    this.courseForm.get('icon').setValue(image.path);
    } else {
      //Do not set default icon option.
    }
    return image.path;
  }

  setFormValues() {
    if (this._course !== undefined && this._course.courseId !== null) {
      for (const prop in this.course) {
        //set form values from the input
        if (this.courseForm.controls[prop]) {
          this.courseForm.controls[prop].setValue(this.course[prop]);
        }
        const sectionsToShow = [];
  
        if (this.sections$) {
          this.course['sectionIds'].forEach((id) => {
            const section = this.sections$.find((c) => c.sectionId === id);
            sectionsToShow.push(section);
          });
        }
  
        this.addedSections = sectionsToShow;
      }
    } 
  }
  onTrackChange(value: number[]) {
    this.assignedTrackIds = value;
    this.courseForm.get('assignedTrackIds').setValue(this.assignedTrackIds);
  }

  updateCourse() {
    if (!this.courseForm.valid) {
      this.error = true;
      return;
    }

    this.error = false;

    const trackFormValues = this.courseForm.getRawValue();

    const { code, name, icon, description } = trackFormValues;
    const courseId = this.course.courseId;
  

    const updatedCourse = {
      courseId,
      code,
      name,
      icon,
      description,
      trackIds:this.assignedTrackIds,
      restricted: this.restrictions.restricted,
      restrictions: this.restrictions,
      lastUpdatedBy: this.authService.getUserPrincipleName(),
      sections: this.addedSections.map((s, index) => {
        return {
          sectionId: s.sectionId,
          sortOrder: ++index,
          code: s.code,
          path: s.path,
          name: s.name,
          questions: s.questions,
        };
      }),
    };

    if(updatedCourse.sections.length > 0){
      this.onSave.emit(updatedCourse);
    }
    else{
      this.sectionEditorComponent.checkSectionValid();
      this.error = true;
      return;
    }
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
