import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component,  OnInit,  ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { TableService } from '../../../services/table.service';
import { FeedbackRetractionReasonsService } from '../../../review/services/feedback-retraction-reasons.service';

export interface FeedbackRetractionReasons {
  text: string;
  retractionReason: string;
  tags: string;
  ratingStar: number;
}

@Component({
    selector: 'app-view-retracted-feedback',
    templateUrl: './view-retracted-feedback.component.html',
    styleUrls: ['./view-retracted-feedback.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class ReviewFeedbackRetractionReason implements OnInit, AfterViewInit {
  reasonsData = new MatTableDataSource<FeedbackRetractionReasons>();
  columns = ['createdBy', 'createdDate', 'text','Tag', 'RatingStar'];
  filter = '';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public tableService: TableService, private retractService: FeedbackRetractionReasonsService) {}
  ngOnInit() {
    this.retractService.getFeedbackRetractionReasonsWithTags().subscribe((reasons) => {
      this.reasonsData.data = reasons;
    });
  }

  applyFilter(filterValue) {
    this.reasonsData.filter = filterValue.trim().toLowerCase();
    if (this.reasonsData.paginator) {
      this.reasonsData.paginator.firstPage();
    }
  }
  ngAfterViewInit() {
    this.reasonsData.paginator = this.paginator;
    this.reasonsData.paginator.firstPage();
    this.reasonsData.sort = this.sort;
  }
}
