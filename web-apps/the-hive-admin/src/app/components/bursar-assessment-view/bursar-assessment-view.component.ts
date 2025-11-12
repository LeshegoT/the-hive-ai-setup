import { Component, OnInit, ViewChild } from '@angular/core';
import { BursarAssessmentService } from '../../services/bursar-assessment.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TableService } from '../../services/table.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';


export interface BursarAssessment {
  id: number;
  name: string;
  email: string;
  dueDate: Date;
  gameState: string;
  progress: BursarProgressionStatus,
  nudged: boolean;
}


export interface BursarProgressionStatus {
  id: number;
  status: Status;
  actionBy: string;
  actionDate: Date;
}

export interface Status {
  id: number;
  name: string; 
}

export interface PageInformation {
  pageNumber: number;
  pageSize: number;
  resultSetSize: number;
  totalPages: number;
}


@Component({
    selector: 'app-bursar-assessment-view',
    templateUrl: './bursar-assessment-view.component.html',
    styleUrls: ['./bursar-assessment-view.component.css'],
    standalone: false
})
export class BursarAssessmentViewComponent implements OnInit {
  statusses: Status[];
  bursarAssessmentCandidatesData = new MatTableDataSource();
  bursarAssessmentCandidatesColumns = ['name', 'email', 'dueDate', 'status', 'prompt', 'remove'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  currentPageInfo: PageInformation = {
    pageNumber: 1,
    pageSize: 10,
    totalPages: undefined,
    resultSetSize: undefined,
  };

  searchText = '';

  constructor(
    private bursarAssessmentService: BursarAssessmentService,
    private snackBar: MatSnackBar,
    public tableService: TableService
  ) {}

  ngOnInit() {
    this.getStatusses();
    this.loadCandidatesData();
  }

  loadCandidatesData() {
    this.bursarAssessmentService
      .getBursarAssessments(this.currentPageInfo.pageNumber, this.currentPageInfo.pageSize, this.searchText)
      .subscribe(
        (candidates) => {
          this.currentPageInfo = candidates.pageInfo;
          this.bursarAssessmentCandidatesData.data = candidates.data;
          this.bursarAssessmentCandidatesData.sort = this.sort;
        },
        (err) => {
          this.snackBar.open('Failed to load bursar candidates', 'Dismiss', { duration: 3000 });
        }
      );
  }

  pageChanged(event: PageEvent) {
    this.currentPageInfo.pageSize = event.pageSize;
    this.currentPageInfo.pageNumber = event.pageIndex + 1;
    this.loadCandidatesData();
  }

  getStatusses() {
    this.bursarAssessmentService.getAssessmentStates().subscribe((states) => {
      console.log(states);
      this.statusses = states;
    });
  }

  nudgeAssessment(selectedAssessment: BursarAssessment) {
    selectedAssessment.nudged = true;
  }

  removeAssessment(selectedAssessment: BursarAssessment) {
    this.bursarAssessmentService.cancelBursarAssessment(selectedAssessment.id).subscribe(
      (res) => {
        this.removeAssessmentFromDataSource(selectedAssessment);
        this.snackBar.open('Bursar Assessment Cancelled', 'Dismiss', { duration: 3000 });
      },
      (err) => {
        this.snackBar.open('Failed To Cancel', 'Dismiss', { duration: 3000 });
      }
    );
  }

  removeAssessmentFromDataSource(selectedAssessment: BursarAssessment) {
    const cancelledStatus = this.statusses.find((status) => status.name == 'Cancelled');
    selectedAssessment.progress.status = cancelledStatus;
    this.bursarAssessmentCandidatesData._updateChangeSubscription();
  }

  filterSearchText(event: KeyboardEvent) {
    if (this.searchText.length >= 3 || event.key == 'Backspace' || event.key == 'Delete') {
      this.loadCandidatesData();
    }
  }

}
