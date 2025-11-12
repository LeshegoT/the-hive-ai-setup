import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ReportService} from '../../services/report.service';
import { FileService } from '../../services/file.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntypedFormControl } from '@angular/forms';
import { CoursesService } from '../../services/courses.service';
import { filter, map, startWith, switchMap } from 'rxjs/operators';
import { TableService } from '../../services/table.service';
@Component({
    selector: 'app-prescribed-training-report',
    templateUrl: './prescribed-training-report.component.html',
    styleUrls: ['./prescribed-training-report.component.css'],
    standalone: false
})
export class PrescribedTrainingReportComponent implements OnInit, OnDestroy {
  courseControl = new UntypedFormControl();
  options = [];
  filteredOptions: Observable<string[]>;
  private dataSubscription: Subscription = new Subscription();

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator) {
    if(this.reportData){
      this.reportData.paginator = paginator;
    } else {
      //Do not set the paginator since the table is undefined
    }
  }

  @ViewChild(MatSort)
  set reportSort(reportSort: MatSort) {
    if (this.reportData) {
      this.reportData.sort = reportSort;
    } else {
      //Do not set the sort since the table is undefined
    }
  }

  courses$;

  reportData: MatTableDataSource<PrescribedTrainingReport>;
  reportColumns = [
    'displayName',
    'jobTitle',
    'userPrincipleName',
    'userName',
    'department',
    'office',
    'courseId',
    'courseName',
    'requiredSections',
    'completedSections',
    'progress',
  ];

  constructor(
    private courseService: CoursesService,
    private reportService: ReportService,
    private fileService: FileService,
    public tableService: TableService
  ) {}

  ngOnInit() {
    this.options=[];
    const coursesSubscription = this.courseService.getAllCourses().subscribe((courses) => {
      this.courses$ = courses;
      this.options=courses;
    });
    this.getReports();
    this.filteredOptions = this.courseControl.valueChanges.pipe(
      startWith(''),
      switchMap((value) => this._filter(value))
    );
    
  }
  private _filter(value: string) {
   const filterValue = value.toLowerCase();
    return this.courseService.getAllCourses().pipe(
      filter(data => !!data),
      map((data) => {
        return data.filter((option: { name: string; }) => option.name.toLowerCase().includes(value))
      })
    )
  }

  getReports() {
    const reportsSubscription = this.reportService.getPrescribedCourseProgress().subscribe((reports) => {
      this.reportData = new MatTableDataSource(reports);
    });

    this.dataSubscription.add(reportsSubscription);
  }

  applyFilter(filterValue: string) {
    const selectedCourse = filterValue;
    this.reportData.filter = selectedCourse.trim().toLowerCase();
  }

  exportToCSV() {
    this.fileService.generateCSVFile(
      this.reportColumns,
      this.reportData.filteredData,
      'Prescribed Courses Progress Report'
    );
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}

interface PrescribedTrainingReport {
  userName: string,
  userPrincipleName: string,
  displayName: string,
  jobTitle: string,
  office: string,
  department: string,
  courseId: number,
  courseName: string,
  requiredSections: number,
  completedSections: number,
  progress: string
}