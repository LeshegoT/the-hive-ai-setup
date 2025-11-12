import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ReviewAudit } from '@the-hive/lib-reviews-shared';
import { Pagination, PageInfo } from '@the-hive/lib-shared';
import { catchError, map, Observable, of, startWith } from 'rxjs';
import { ErrorCardComponent } from '../../../components/error-card/error-card.component';
import { DateFormatPipe, provideMaterialDatePickerConfiguration, TimeFormatPipe } from '../../../pipes/date-format.pipe';
import { FeedbackAuditService } from '../../services/feedback-audit.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FilterDropDownOptionsComponent } from '../filter-drop-down-options/filter-drop-down-options.component';
import { TableService } from '../../../services/table.service';

type FetchAuditDataResult =
  | { status: 'success', data: ReviewAudit[] }
  | { status: 'error', error: string }
  | { status: 'loading' };

export type ReviewAuditTableDialogData = {
  reviewId: number,
  revieweeDisplayName: string
}

@Component({
  selector: 'app-review-audit-table-dialog',
  templateUrl: './review-audit-table-dialog.component.html',
  styleUrls: ['./review-audit-table-dialog.component.css', '../../../shared/shared.css'],
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, ErrorCardComponent, ReactiveFormsModule, FilterDropDownOptionsComponent, DateFormatPipe, TimeFormatPipe],
  providers: [provideMaterialDatePickerConfiguration()]
})
export class ReviewAuditTableDialogComponent implements OnInit {
  displayedColumns: (keyof ReviewAudit)[] = ['auditType', 'actionTime', 'actionUser', 'auditDescription'];
  auditDataResponse$: Observable<FetchAuditDataResult>;
  auditActions: { id: number; name: string }[] = [];

  pagination = signal<PageInfo>({
    pageNumber: 0,
    pageSize: 20,
    resultSetSize: 0,
    totalPages: 0
  });
  auditUsers: { id: number; name: string; value: string }[] = [];

  filterForm = new FormGroup({
    auditActions: new FormControl<{ id: number; name: string }[]>([]),
    auditUsers: new FormControl<{ id: number; name: string; value: string }[]>([]),
  });

  constructor(
    public dialogRef: MatDialogRef<ReviewAuditTableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReviewAuditTableDialogData,
    private feedbackService: FeedbackAuditService,
    public tableService: TableService
  ) {}

  ngOnInit() {
    this.loadReviewAuditData();
  }

  loadReviewAuditData() {
    this.loadReviewAuditDataWithPagination(this.pagination());
  }

  private loadReviewAuditDataWithPagination(pageInfo: PageInfo) {
    const selectedAuditTypes = this.filterForm.controls.auditActions.value || [];
    const selectedUsers = this.filterForm.controls.auditUsers.value || [];
    const auditTypeNames = selectedAuditTypes.map(action => action.name);
    const userValues = selectedUsers.map(user => user.value);

    const pagination: Pagination = {
      startIndex: pageInfo.pageNumber * pageInfo.pageSize,
      pageLength: pageInfo.pageSize
    };

    this.auditDataResponse$ = this.feedbackService.getReviewAudit(this.data.reviewId, {
      auditTypes: auditTypeNames,
      users: userValues
    }, pagination)
      .pipe(
         map(auditData => {
           const auditRecords = auditData.data;
           this.updateAuditTypesFromCurrentPage(auditRecords);
           this.updateUsersFromCurrentPage(auditRecords);
           this.pagination.set({
             pageNumber: auditData.pageInfo.pageNumber,
             pageSize: auditData.pageInfo.pageSize,
             resultSetSize: auditData.pageInfo.resultSetSize,
             totalPages: auditData.pageInfo.totalPages
           });
           return { status: 'success', data: auditRecords } as const;
         }),
        catchError((errorMessage: string) => {
          return of({ status: 'error', error: errorMessage } as const);
        }),
        startWith({ status: 'loading' } as const)
      );
  }

  onFilterSelectionComplete() {
    this.resetPageNumber();
    this.loadReviewAuditData();
  }

  onReviewTypeSelectionComplete() {
    this.onFilterSelectionComplete();
  }

  pageChanged(event: PageEvent) {
    const currentPageInfo = this.pagination();
    const isPageSizeChanged = event.pageSize !== currentPageInfo.pageSize;
    let targetPageIndex = isPageSizeChanged ? 0 : event.pageIndex;
    const lastValidPageIndex = currentPageInfo.totalPages && currentPageInfo.totalPages > 0 ? Math.max(0, currentPageInfo.totalPages - 1) : targetPageIndex;
    if (targetPageIndex > lastValidPageIndex) {
      targetPageIndex = lastValidPageIndex;
    } else {
      // requested page is within bounds
    }

    const updatedPageInfo = {
      pageNumber: targetPageIndex,
      pageSize: event.pageSize,
      resultSetSize: currentPageInfo.resultSetSize,
      totalPages: currentPageInfo.totalPages
    };
    this.pagination.set(updatedPageInfo);

    this.loadReviewAuditDataWithPagination(updatedPageInfo);
  }

  private resetPageNumber() {
    const currentPageInfo = this.pagination();
    this.pagination.set({
      ...currentPageInfo,
      pageNumber: 0
    });
  }

  private updateAuditTypesFromCurrentPage(auditRecords: ReviewAudit[]) {
    const currentPageTypes = this.extractAuditTypes(auditRecords);
    for (const type of currentPageTypes) {
      if (!this.auditActions.some(action => action.name === type.name)) {
        this.auditActions.push({ id: this.auditActions.length, name: type.name });
      } else {
        // audit type already exists, no need to add it
      }
    }
  }

  private updateUsersFromCurrentPage(auditRecords: ReviewAudit[]) {
    const currentPageUsers = this.extractUsers(auditRecords);
    for (const user of currentPageUsers) {
      if (!this.auditUsers.some(existingUser => existingUser.value === user.value)) {
        this.auditUsers.push({ id: this.auditUsers.length, name: user.name, value: user.value });
      } else {
        // user already exists, no need to add it
      }
    }
  }

  extractAuditTypes(auditData: ReviewAudit[]): { id: number; name: string }[] {
    const uniqueAuditTypes = [...new Set(auditData.map(audit => audit.auditType))];
    return uniqueAuditTypes.map((auditType, index) => ({
      id: index,
      name: auditType
    }));
  }

  extractUsers(auditData: ReviewAudit[]): { id: number; name: string, value: string }[] {
    const uniqueUsers = [...new Set(auditData.map(audit => audit.actionUser))];
    return uniqueUsers.map((actionUser, index) => {
      const audit = auditData.find(a => a.actionUser === actionUser);
      return {
        id: index,
        name: audit.actionUserDisplayName,
        value: actionUser
      };
    });
  }


  generateSupportEmail(error: string) {
    const subject = encodeURIComponent('Error retrieving review audit history');
    const body = encodeURIComponent(`Hi,\n\nI am getting an error retrieving the review audit history for the review "${this.data.revieweeDisplayName}".\n\nError Message: ${error}\n\nPlease help me fix this.\n\nThanks,\n`);
    return `mailto:reviews-support@bbd.co.za?subject=${subject}&body=${body}`;
  }
}
