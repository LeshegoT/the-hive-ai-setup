import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TableService } from '../../services/table.service';
import { UserProgressService } from '../../services/user-progress.service';
import { TableCourseProgressItem } from './table-course-progress-datasource';

@Component({
    selector: 'app-table-course-progress',
    templateUrl: './table-course-progress.component.html',
    styleUrls: ['./table-course-progress.component.css'],
    standalone: false
})
export class TableCourseProgressComponent implements AfterViewInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource();

  @ViewChild(MatSort) set content(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  @Input()
  set userProgess(data: TableCourseProgressItem[]) {
    this.setCourseProgressData(data)
  }


  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = [
    'upn',
    'courseId',
    'name',
    'sectionsInCourse',
    'sectionsDone',
    'percentage',
    'nextSectionId',
    'nextSectionCode',
    'totalTimeOnCourse',
    'averageTimeOnSection',
    'actions'
  ];

  constructor(public tableService: TableService, public userProgressService: UserProgressService) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.firstPage();
    this.dataSource.sort = this.sort;    
  }

  setCourseProgressData(data: TableCourseProgressItem[]) {
    console.log(data)
    this.dataSource.data = data;
    this.paginator._changePageSize(this.paginator.pageSize);
  }
  completionStatusForSectionId(row : any):string{
    if(row.percentage < 100 && !row.nextSectionId){
      return 'Incomplete';
    }else if(row.nextSectionId){
      return row.nextSectionId;
    }else{
      return 'Completed';
    }
  }

  completionStatusForSectionCode(row : any):string{
    if(row.percentage < 100 && !row.nextSectionCode){
      return 'Incomplete';
    }else if(row.nextSectionCode){
      return row.nextSectionCode;
    }else{
      return 'Completed';
    }
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  resetProgress(row: any) {
    this.userProgressService.resetUserCourseProgress(row.upn, row.courseId).subscribe();
  }
}

