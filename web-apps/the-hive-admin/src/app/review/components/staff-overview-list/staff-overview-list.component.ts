import { Component, computed, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild, viewChildren, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatColumnDef, MatTableDataSource } from '@angular/material/table';
import { AuthService } from '../../../services/auth.service';
import { TableService } from '../../../services/table.service';
import { calculateEndOfDay } from '../../../shared/date-utils';
import { FeedbackAssignmentTemplate, StaffOverviewListItem } from '../../../shared/interfaces';
import { FeedbackService } from '../../services/feedback.service';
import { StaffOverviewService } from '../../services/staff-overview.service';
import { HrCommentsDialogComponent } from '../hr-comments-dialog/hr-comments-dialog.component';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';

export interface PageInformation {
  pageNumber: number;
  pageSize: number;
  resultSetSize: number;
  totalPages: number;
}

@Component({
    selector: 'app-staff-overview-list',
    templateUrl: './staff-overview-list.component.html',
    styleUrls: ['../../../../styles.css', './staff-overview-list.component.css', '../../styles/reviewShared.css'],
    standalone: false,
    providers: [provideMaterialDatePickerConfiguration()]
})
export class StaffOverviewListComponent implements OnInit, OnChanges {
  staffOverviewTable = new MatTableDataSource<StaffOverviewListItem>();
  @Input() showHrNotesButton: boolean;
  @Input() staffOverviewData: Array<StaffOverviewListItem> = [];
  staffOverviewMatColumnDefinitions = viewChildren(MatColumnDef)
  staffOverviewColumns = computed(() => this.staffOverviewMatColumnDefinitions().map((column) => column.name));
  @Output() selectedRow: EventEmitter<StaffOverviewListItem> = new EventEmitter();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('reviewTableSort') reviewTableSort = new MatSort();
  @Output() reloadStaffData = new EventEmitter<void>();

  currentPageInfo: PageInformation = {
    pageNumber: 1,
    pageSize: 10,
    totalPages: undefined,
    resultSetSize: undefined,
  };
  feedbackAssignmentTemplates: FeedbackAssignmentTemplate[] = [];
  rowCurrentlyBeingEdited: StaffOverviewListItem;
  selectedRowDate: Date;
  selectedRowTemplateName : string;
  activeUPN: string;

  constructor(
    public feedbackService: FeedbackService,
    public staffOverviewService: StaffOverviewService,
    private authService: AuthService,
    public snackbar: MatSnackBar,
    public tableService: TableService,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.feedbackService.getFeedbackAssignmentTemplates().subscribe((feedbackAssignmentTemplates) => {
      this.feedbackAssignmentTemplates = feedbackAssignmentTemplates.filter((assignmentTemplate) => assignmentTemplate.manualFeedbackAssignment);
    });
    this.setActiveUPN();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadData();
    if (changes['staffOverviewData']) {
      this.resetPaginator();
    }
  }

  loadData(){
    const startIndex = (this.currentPageInfo.pageNumber - 1) * this.currentPageInfo.pageSize;
    const endIndex = startIndex + this.currentPageInfo.pageSize;
    this.staffOverviewTable.data = this.staffOverviewData ? this.staffOverviewData.slice(startIndex, endIndex): undefined;
    this.currentPageInfo.resultSetSize = this.staffOverviewData ? this.staffOverviewData.length: 0;
    this.currentPageInfo.totalPages = Math.ceil(this.currentPageInfo.resultSetSize / this.currentPageInfo.pageSize);
  }

  setActiveUPN() {
    this.authService.getUserPrincipleName().subscribe((activeUPN) => {
      this.activeUPN = activeUPN;
    });
  }

  pageChanged(event: PageEvent) {
    this.currentPageInfo.pageSize = event.pageSize;
    this.currentPageInfo.pageNumber = event.pageIndex + 1;
    this.loadData();
  }


  rowSelectTask(row: StaffOverviewListItem) {
    const selectableRows = document.getElementsByClassName('selectable-row');
    Array.from(selectableRows).forEach((element) => {
      element.classList.remove('selected');
    });
    const selectedRow = document.getElementById(row.staffId.toString());
    selectedRow.classList.add('selected');
    this.selectedRow.emit(row);
  }

  resetPaginator(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  editReview(selectedRow: StaffOverviewListItem) {
    this.rowCurrentlyBeingEdited = selectedRow;
    this.selectedRowDate = selectedRow.nextReview.date;
    this.selectedRowTemplateName = selectedRow.nextReview.templateName;
  }

  addStaffReviewForStaffWithNoUpcomingReviews(
    staffId: number,
    requestBody: { nextReviewDate: Date; nextFeedbackTemplateId: number }
  ) {
    return this.staffOverviewService.addStaffReviewForStaffWithNoUpcomingReviews(staffId, requestBody);
  }

  cancelCreateReview(selectedRow: StaffOverviewListItem) {
    this.rowCurrentlyBeingEdited = undefined;
    selectedRow.nextReview.templateName = this.selectedRowTemplateName;
    selectedRow.nextReview.date = this.selectedRowDate;
  }

  getFeedbackAssignmentTemplateId(name: string) {
    const feedbackAssignmentTemplate = this.feedbackAssignmentTemplates.find(
      (template) => template.templateName == name
    );
    return feedbackAssignmentTemplate ? feedbackAssignmentTemplate.feedbackAssignmentTemplateId : undefined;
  }

  confirmCreateReview(selectedRow: StaffOverviewListItem) {
    const nextReviewDate = calculateEndOfDay(selectedRow.nextReview.date);
    const nextFeedbackTemplateId = this.getFeedbackAssignmentTemplateId(selectedRow.nextReview.templateName);
    const staffId = selectedRow.staffId;

    if (nextReviewDate && nextFeedbackTemplateId && staffId) {
      this.addStaffReviewForStaffWithNoUpcomingReviews(staffId, { nextReviewDate, nextFeedbackTemplateId }).subscribe(
        (_response) => {
          this.rowCurrentlyBeingEdited = undefined;
          this.snackbar.open('Successfully created next review', 'Dismiss', { duration: 3000 });
          this.reloadStaffData.emit();
          this.selectedRow.emit(undefined);
        },
        (error) => {
          this.snackbar.open(`Error adding review: ${error}`, 'Dismiss', { duration: 3000 });
        }
      );
    } else {
      this.snackbar.open('Please enter review type and date', 'Dismiss', { duration: 3000 });
    }
  }

  getDateDisplay(row: StaffOverviewListItem) {
    return row.nextReview.templateName
      ? row.nextReview.date
      : row.currentReview.templateName
      ? row.currentReview.date
      : undefined;
  }

  hasMissingCurrentOrNextReview(staffReviewDetails: StaffOverviewListItem) {
    const hasCurrentReview = staffReviewDetails.currentReview.date && staffReviewDetails.currentReview.templateName;
    const hasNextReview = staffReviewDetails.nextReview.date && staffReviewDetails.nextReview.templateName;
    return !hasCurrentReview && !hasNextReview;
  }

  hrNotes(event: Event,review:StaffOverviewListItem) {
    if(this.activeUPN.toLowerCase() !== review.upn.toLowerCase()) {
      event.stopPropagation();
      this.dialog.open(HrCommentsDialogComponent, {
        width: '60em',
        data: {
          staffId: review.staffId,
          userPrincipleName: review.upn,
          userDisplayName: review.displayName
        },
      });
    } else {
      this.snackbar.open('You cannot view your own review notes', 'Dismiss', { duration: 3000 });
    }
  }
}
