import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { CoursesService } from '../../services/courses.service';
import { TableService } from '../../services/table.service';

@Component({
    selector: 'app-table-course',
    templateUrl: './table-course.component.html',
    styleUrls: ['./table-course.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class TableCourseComponent implements OnInit, AfterViewInit, OnDestroy {
  private dataSubscription = new Subscription();
  @Output() triggerRefresh = new EventEmitter();
  private _allCourses = [];
  @Input()
  set allCourses(allCourses) {
    this._allCourses = allCourses;
    this.refreshData();
  }
  get allCourses() {
    return this._allCourses;
  }
  courseForm: UntypedFormGroup|undefined = undefined;
  columns = ['courseId', 'name', 'code', 'icon', 'description', 'sectionNo','averageTime','actions'];

  filter = '';
  creating = false;
  courseData = new MatTableDataSource<CourseInterface>();
  existingCourses = [];

  courseFormatted: CourseInterface[];
  defaultCourse: CourseInterface;
  expandedCourse: CourseInterface | undefined = undefined;
  cachedCourse: CourseInterface | undefined = undefined;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private courseService: CoursesService, private snackBar: MatSnackBar, public tableService: TableService, public formBuilder: FormBuilder) {}

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.courseData.paginator = this.paginator;
    this.courseData.paginator.firstPage();
    this.courseData.sort = this.sort;
    const sortFunctionHandle = this.courseData.sortData;
    this.courseData.sortData = (data, sort) => {
      if (!sort.active || sort.direction === '') {
        return sortFunctionHandle(data, sort);
      }

      if (sort.active == 'sectionNo') {
        return data.sort((a, b) => {
          const isAsc = sort.direction === 'asc';
          return (a.sectionIds.length < b.sectionIds.length ? -1 : 1) * (isAsc ? 1 : -1);
        });
      }

      return sortFunctionHandle(data, sort);
    };
  }
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  refreshData() {
    if (this.allCourses) {
      this.courseFormatted = this.allCourses.map((element) => {
        const newFormatted: CourseInterface = {
          name: element.name,
          code: element.code,
          courseId: element.courseId,
          description: element.description,
          icon: element.icon,
          averageTimeOnCourse: element.averageTimeOnCourse,
          sectionIds: element.sectionIds,
        };
        return newFormatted;
      });

      this.existingCourses = this.courseFormatted.map(c => c.code);
      this.courseData.data = this.courseFormatted;
    }
  }

  updateSelected(course) {
    const sameType = this.expandedCourse === course;
    this.creating = false;
    this.expandedCourse = sameType ? undefined : course;
    this.cachedCourse = { ...this.expandedCourse };
  }

  applyFilter($event) {
    const filterValue = $event;
    this.courseData.filter = filterValue.trim().toLowerCase();
    if (this.courseData.paginator) {
      this.courseData.paginator.firstPage();
    }
  }

  cancelCreate() {
    this.courseForm = undefined;
  }

  cancelEdit() {
    this.expandedCourse = undefined;
  }

  reload() {
    this.triggerRefresh.emit();
    this.cancelCreate()
  }

  checkDetailExpand(course) {
    if (course === this.expandedCourse) {
      return 'expanded';
    } else {
      return 'collapsed';
    }
  }

  checkCreateExpand() {
    if (this.creating) {
      return 'expanded';
    } else {
      return 'collapsed';
    }
  }

  enableCreate() {
    this.expandedCourse = undefined;
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
      icon: [
        '',
        Validators.compose([
          Validators.required, 
          Validators.maxLength(50), //max length is 50 because of database
        ]),
      ],
      description: ['', Validators.compose([Validators.required, Validators.maxLength(500)])],
      trackId: [''],
      restricted: false,
      restrictions: [''],
    });
  }

  deleteCourse(course) {
    const courseId = course.courseId;
    this.courseService.checkUserRegiteredForCourse(courseId).subscribe((usersRegisteredForCourse:number) => {
    if (usersRegisteredForCourse == 0) {
    this.courseService.checkCourseAssignedToUser(courseId).subscribe((usersAssignedToCourse:number) => {
      if (usersAssignedToCourse == 0) {
        this.courseService.checkUserWithCourseMission(courseId).subscribe((userWithCourseMission:number) => {
          if(userWithCourseMission == 0) {
            this.courseService.checkCourseContainsMessage(courseId).subscribe((messagesAttatchedToCourse:number) => {
              if (messagesAttatchedToCourse == 0) {
                const deleteSubscription = this.courseService.deleteCourse(courseId).subscribe((statusCode:any) => {
                  console.log(statusCode);
                  this.snackBar.open('Course deleted successfully', '', { duration: 2000 });
                  this.triggerRefresh.emit(courseId);
                });
                this.dataSubscription.add(deleteSubscription);
              } else {
                this.snackBar.open('Users have messages attatched to this course, cannot delete the course. ', 'Dismiss');
              }
            });
          } else {
            this.snackBar.open('Some user has added the course to their mission, cannot delete the course.','Dismiss');
          }
        });
      } else {
        this.snackBar.open('The course is currently assigned to the user, cannot delete the course. ', 'Dismiss');
      }
    });
    }
    else{
      this.snackBar.open(
        'Some user has registered themselves for a course, cannot delete the course. ',
        'Dismiss'
      );
    }
  });
  }

  updateCourse(course) {
    //check duplicate course code
    const indexNew = this.existingCourses.indexOf(course.code);
    const sameCode = this.cachedCourse && course.code === this.cachedCourse.code;
    const foundNew = indexNew === -1;

    if(sameCode || foundNew) {
      let updateSubscription;
      if(this.expandedCourse) {
        updateSubscription = this.courseService.updateCourse(course).subscribe(() => {
          this.snackBar.open('Course Updated successfully', '', { duration: 2000 });
          this.triggerRefresh.emit();
        });
      } else {
        updateSubscription = this.courseService.createCourse(course).subscribe(() => {
          this.snackBar.open('Course Created successfully', '', { duration: 2000 });
          this.triggerRefresh.emit();
        });
      }
      this.creating = false;
      this.expandedCourse = undefined;
      this.cachedCourse = undefined;
      this.dataSubscription.add(updateSubscription);
    } else {
      this.snackBar.open('Cannot allow duplicate codes', '', { duration: 2000 });
    }
  }
}

export interface CourseInterface {
  code: string;
  courseId: number;
  description: string;
  icon: string;
  name: string;
  averageTimeOnCourse: string;
  sectionIds: number[];
}