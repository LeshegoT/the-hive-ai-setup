import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild, OnChanges} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TableService } from '../../../services/table.service';
import { AssignmentTrackingListItem } from '../../../shared/interfaces';
import { AssignmentTrackingService } from '../../services/assignment-tracking.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface PageInformation {
  pageNumber: number;
  pageSize: number;
  resultSetSize: number;
  totalPages: number;
}

@Component({
    selector: 'app-assignment-tracking-list',
    templateUrl: './assignment-tracking-list.component.html',
    styleUrls: ['../../../../styles.css', './assignment-tracking-list.component.css', '../../styles/reviewShared.css'],
    standalone: false
})
export class AssignmentTrackingListComponent implements OnChanges {
  assignmentTrackingTable = new MatTableDataSource<AssignmentTrackingListItem>();
  @Input() assignmentTrackingData: Array<AssignmentTrackingListItem> = [];
  @Input() assignmentTrackingColumns: string[];
  @Output() selectedRow: EventEmitter<any> = new EventEmitter();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  currentPageInfo: PageInformation = {
    pageNumber: 1,
    pageSize: 10,
    totalPages: undefined,
    resultSetSize: undefined,
  };
  rowSelected : AssignmentTrackingListItem;

  constructor(
    public tableService: TableService,
    public assignmentTrackingService: AssignmentTrackingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.loadData();
    if (changes['assignmentTrackingData']) {
      this.resetPaginator();
    }
  }

  loadData(){
    const startIndex = (this.currentPageInfo.pageNumber - 1) * this.currentPageInfo.pageSize;
    const endIndex = startIndex + this.currentPageInfo.pageSize;
    this.assignmentTrackingTable.data = this.assignmentTrackingData ? this.assignmentTrackingData.slice(startIndex, endIndex): undefined;
    this.currentPageInfo.resultSetSize = this.assignmentTrackingData ? this.assignmentTrackingData.length: 0;
    this.currentPageInfo.totalPages = Math.ceil(this.currentPageInfo.resultSetSize / this.currentPageInfo.pageSize);
  }

  pageChanged(event: PageEvent) {
    this.currentPageInfo.pageSize = event.pageSize;
    this.currentPageInfo.pageNumber = event.pageIndex + 1;
    this.loadData();
  }


  rowSelectTask(row: AssignmentTrackingListItem) {
    this.selectedRow.emit(row);
    this.rowSelected = row;
  }

  resetPaginator(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  sendBulkNudge(row: AssignmentTrackingListItem, clickEvent: MouseEvent) {
    const bulkNudgeButton = clickEvent.currentTarget as HTMLButtonElement;
    bulkNudgeButton.disabled = true;

    this.assignmentTrackingService.sendBulkNudgeReminder(row.upn).subscribe(
      (res) => {
        this.snackBar.open('Email Reminder Sent', 'Dismiss', { duration: 3000 });
      },
      (err) => {
        this.snackBar.open(err, '', { duration: 1000 });
        bulkNudgeButton.disabled = false;
      }
    );
  }
}