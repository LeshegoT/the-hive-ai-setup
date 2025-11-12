import { Component, computed, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild, viewChildren, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatColumnDef, MatTableDataSource } from '@angular/material/table';
import { FeedbackService, PagedResult, Review } from '../../../review/services/feedback.service';
import { AuthService } from '../../../services/auth.service';
import { TableService } from '../../../services/table.service';
import { ReviewFilterParameters } from '../../review-filter-parameters';
import { HrCommentsDialogComponent } from '../hr-comments-dialog/hr-comments-dialog.component';

export interface PageInformation {
  pageNumber: number;
  pageSize: number;
  resultSetSize: number;
  totalPages: number;
}

@Component({
    selector: 'app-feedback-review',
    templateUrl: './feedback-review.component.html',
    styleUrls: ['./feedback-review.component.css', '../../../shared/shared.css', '../../styles/reviewShared.css'],
    standalone: false
})
export class FeedbackReviewComponent implements OnInit, OnChanges {
  @Output() displayFeedbackAssignments: EventEmitter<Review> = new EventEmitter();
  @Output() showSnackBar: EventEmitter<string> = new EventEmitter();

  reviewData = new MatTableDataSource<Review>();
  reviewMatColumnDefinitions = viewChildren(MatColumnDef)
  reviewColumns = computed(() => this.reviewMatColumnDefinitions().map((column) => column.name));
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Input() filterParameters: ReviewFilterParameters;

  selectedReview: Review;
  activeUPN: string;

  currentPageInfo: PageInformation = {
    pageNumber: 1,
    pageSize: 10,
    totalPages: undefined,
    resultSetSize: undefined,
  };

  constructor(
    public tableService: TableService,
    public feedbackService: FeedbackService,
    public dialog: MatDialog,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadData();
    this.setActiveUPN();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.selectedReview = undefined;
    this.displayFeedbackAssignments.emit(this.selectedReview);
    if (changes['filterParameters']) {
      this.resetPaginator();
    }
    this.loadData();
  }

  setActiveUPN() {
    this.authService.getUserPrincipleName().subscribe((activeUPN) => {
      this.activeUPN = activeUPN;
    });
  }

  loadData() {
    this.reviewData = undefined;
    this.feedbackService
      .getAllReviews(this.currentPageInfo.pageNumber, this.currentPageInfo.pageSize, this.filterParameters)
      .subscribe(
      {
        next:(response: PagedResult<Review>) => {
          this.reviewData = new MatTableDataSource<Review>();
          this.currentPageInfo = response.pageInfo;
          this.reviewData.data = response.data.map((review) => ({
            ...review,
            currentlyBeingEdited: false,
            active: false,
          }));
          this.reviewData.sort = this.sort;
        },
        error: () => {
          this.reviewData = new MatTableDataSource<Review>();
          this.showSnackBar.emit('Failed to load reviews');
        }
      }
      );
  }

  pageChanged(event: PageEvent) {
    this.selectedReview = undefined;
    this.displayFeedbackAssignments.emit(this.selectedReview);
    this.currentPageInfo.pageSize = event.pageSize;
    this.currentPageInfo.pageNumber = event.pageIndex + 1;
    this.loadData();
  }

  setActiveReview(row: Review) {
    this.reviewData.data.map((review: Review) => (review.active = false));
    row.active = true;
    this.selectedReview = row;
    this.displayFeedbackAssignments.emit(this.selectedReview);
  }

  resetPaginator(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  showHrNotes(review: Review) {
    if(this.activeUPN.toLowerCase() !== review.reviewee.toLowerCase()) {
      this.dialog.open(HrCommentsDialogComponent, {
        width: 'var(--mat-dialog-container-width)',
        data: {
          staffId: review.staffId,
          userPrincipleName: review.reviewee,
          userDisplayName: review.displayName
        },
      });
    } else {
      this.showSnackBar.emit('You cannot view notes for your own review')
    }
  }
}
