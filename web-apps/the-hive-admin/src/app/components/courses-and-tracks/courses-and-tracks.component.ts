import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CoursesService } from '../../services/courses.service';
import { TracksService } from '../../services/tracks.service';
import { UserProgressService } from '../../services/user-progress.service';
import { TableCourseProgressItem } from '../table-course-progress/table-course-progress-datasource';
import { TracksInterface } from '../table-track/table-track.component';
import { CourseInterface } from './../table-course/table-course.component';

@Component({
    selector: 'learning-manage-courses',
    templateUrl: './courses-and-tracks.component.html',
    styleUrls: ['./courses-and-tracks.component.css'],
    standalone: false
})
export class CoursesAndTracksComponent implements OnInit {
  dataSubscription: Subscription = new Subscription();
  tracks: TracksInterface[]
  courses: CourseInterface[]
  userProgress$: Observable<TableCourseProgressItem[]>

  constructor(
    private courseService: CoursesService,
    private tracksService: TracksService,
    private UserProgressService: UserProgressService
  ) {}

  ngOnInit() {
    this.tracks = undefined;
    this.courses = undefined;
    this.userProgress$ = this.UserProgressService.userCourseProgress();
    this.refreshContent();
  }

  refreshCourses() {
    const courseSubscription = this.courseService.getAllCourses().subscribe((courses) => {
      this.courses = courses;
    });
    this.dataSubscription.add(courseSubscription);
  }

  refreshTracks() {
    const tracksSubscription = this.tracksService.getAllTracksWithCourses().subscribe((tracks) => {
      this.tracks = tracks;
    });
    this.dataSubscription.add(tracksSubscription);
  }

  refreshContent() {
    this.refreshTracks();
    this.refreshCourses();
  }
}

