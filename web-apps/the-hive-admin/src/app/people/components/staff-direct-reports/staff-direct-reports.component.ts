import { SelectionModel } from "@angular/cdk/collections";
import { CommonModule } from "@angular/common";
import { Component, inject, input, OnChanges, OnDestroy, OnInit, SimpleChanges, viewChild } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSort, MatSortModule, Sort } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BulkStaffReviewerReassignmentRequest, Staff } from "@the-hive/lib-staff-shared";
import { Moment } from "moment";
import { BehaviorSubject, combineLatest, map, merge, Observable, of, shareReplay, startWith, Subject, Subscription, switchMap } from "rxjs";
import { ErrorCardComponent } from "../../../components/error-card/error-card.component";
import { provideMaterialDatePickerConfiguration } from "../../../pipes/date-format.pipe";
import { TableService } from "../../../services/table.service";
import { LoadingStateObservable, withObservableLoadingState } from "../../../shared/observable-utils";
import { OffboardingStaffService } from "../offboarding/offboarding-staff.service";
import { AutocompleteInputComponent } from "../../../shared/components/autocomplete-input/autocomplete-input.component";

type PaginatedDirectReports = {
  data: Staff[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  allDirectReports: Staff[];
};

type UnitCorrectionsFormControls = {
  reviewerUpn: FormControl<string>;
  effectiveDate: FormControl<Moment>;
}

@Component({
    selector: 'app-staff-direct-reports',
    templateUrl: './staff-direct-reports.component.html',
    styleUrls: ['../../../shared/shared.css', './staff-direct-reports.component.css'],
    imports: [
      CommonModule,
      ErrorCardComponent,
      MatTableModule,
      MatProgressSpinnerModule,
      MatPaginatorModule,
      MatSortModule,
      MatCardModule,
      MatCheckboxModule,
      MatTooltipModule,
      MatChipsModule,
      MatIconModule,
      MatButtonModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatDatepickerModule,
      MatAutocompleteModule,
      AutocompleteInputComponent
  ],
  providers: [
    provideMaterialDatePickerConfiguration()
  ]
})
export class StaffDirectReportsComponent implements OnInit, OnChanges, OnDestroy {
  offboardingStaffService = inject(OffboardingStaffService);
  tableService = inject(TableService);

  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  manager = input<{ upn: string; displayName: string }>();
  displayedColumns = input<string[]>([
    'staffSelection',
    'displayName',
    'jobTitle',
    'upn',
    'bbdUserName',
    'department',
    'office',
  ]);

  allStaff$: Observable<Staff[]>;
  directReportsResult$: LoadingStateObservable<Staff[]>;
  paginatedDirectReports$ = new BehaviorSubject<PaginatedDirectReports>({ data: [], totalCount: 0, pageIndex: 0, pageSize: 0, allDirectReports: [] });
  bulkReviewerReassignmentResult$: LoadingStateObservable<void>;

  protected readonly pageSize$ = new BehaviorSubject<number>(20);
  protected readonly pageIndex$ = new BehaviorSubject<number>(0);
  protected readonly sort$ = new BehaviorSubject<Sort>({ active: '', direction: '' });
  protected staffSelection = new SelectionModel<Staff>(true);
  protected bulkReassignmentRequest$ = new BehaviorSubject<BulkStaffReviewerReassignmentRequest | undefined>(undefined);
  protected refreshDirectReports$ = new Subject<void>();

  protected readonly subscriptions = new Subscription();

  bulkReassignmentForm = new FormGroup<UnitCorrectionsFormControls>({
    reviewerUpn: new FormControl<string>(undefined, { nonNullable: true, validators: [Validators.required, Validators.email] }),
    effectiveDate: new FormControl<Moment>(undefined, { nonNullable: true, validators: [Validators.required] }),
  }, { validators: [this.validateAtLeastOneStaffSelected.bind(this)] });

  validateAtLeastOneStaffSelected(formGroup: FormGroup<UnitCorrectionsFormControls>): ValidationErrors | undefined {    
    if (formGroup.dirty && formGroup.valid && this.staffSelection.selected.length === 0) {
      return { noSelectedStaff: true };
    } else {
      return undefined;
    }
  }

  ngOnInit(): void {
    this.initialisePaginationAndSort();
    this.initialiseStaffForReviewSearch();
    this.initialiseBulkReassignmentObservable();

    this.subscriptions.add(
      this.staffSelection.changed.asObservable().subscribe(() => this.bulkReassignmentForm.updateValueAndValidity())
    );
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['manager']) {
      this.initialiseDirectReportsResult();
    } else {
      // the manager has not changed, no need to re-fetch the direct reports
    }
  }

  initialiseStaffForReviewSearch(): void {
    this.allStaff$ = this.offboardingStaffService.getActiveStaff().pipe(shareReplay(1));
  }

  initialiseBulkReassignmentObservable(): void {
    this.bulkReviewerReassignmentResult$ = merge(this.bulkReassignmentRequest$, this.refreshDirectReports$).pipe(
      switchMap(bulkReassignmentRequest => {
        if (bulkReassignmentRequest) {
          return this.offboardingStaffService.bulkReassignStaffToNewReviewer(bulkReassignmentRequest).pipe(withObservableLoadingState);
        } else {
          return of(undefined);
        }
      }),
      startWith(undefined),
      shareReplay(1),
    );

    this.subscriptions.add(this.bulkReviewerReassignmentResult$.subscribe((result) => {
      if (result?.status === 'success') {
        this.refreshDirectReports$.next();
        this.bulkReassignmentForm.reset();
        this.staffSelection.clear();
      } else {
        // The 'error' and 'loading' statuses are handled in the template by showing an error card
        // and loading spinner respectively.
      }
    }));
  }

  refreshDirectReports(): void {
    this.initialiseDirectReportsResult();
  }

  initialiseDirectReportsResult(): void {
    this.directReportsResult$ = merge(of(undefined), this.refreshDirectReports$).pipe(
      switchMap(() => this.offboardingStaffService.getActiveDirectReportsForStaffMember(this.manager().upn).pipe(withObservableLoadingState)),
      startWith(undefined),
      shareReplay(1),
    );
  }

  initialisePaginationAndSort(): void {
    combineLatest([
      this.directReportsResult$,
      this.pageSize$,
      this.pageIndex$,
      this.sort$,
    ]).pipe(
      map(([result, pageSize, pageIndex, sort]) => {
        if (result.status === 'success') {
          const sortedData = result.data.sort((a, b) => this.staffComparator(a, b, sort));

          const startIndex = pageIndex * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedData = sortedData.slice(startIndex, endIndex);

          return {
            data: paginatedData,
            totalCount: result.data.length,
            pageIndex,
            pageSize,
            allDirectReports: result.data,
          };
        } else {
          return {
            data: [],
            totalCount: 0,
            pageIndex: 0,
            pageSize: this.tableService.getPageSize(),
            allDirectReports: [],
          };
        }
      })
    ).subscribe((paginatedDirectReports) => this.paginatedDirectReports$.next(paginatedDirectReports));
  }

  staffComparator(a: Staff, b: Staff, sort: Sort): number {
    const sortColumn = sort.active;
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    const eitherIsNullOrUndefined = !aValue || !bValue;
    const isString = typeof aValue === 'string' && typeof bValue === 'string';
    const isNumber = typeof aValue === 'number' && typeof bValue === 'number';
    const isDate = aValue instanceof Date && bValue instanceof Date;

    if (isDate) {
      return sort.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
    } else if (isString) {
      return sort.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (isNumber) {
      return sort.direction === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (eitherIsNullOrUndefined) {
      const aIsNullUndefined = !aValue;
      const bIsNullUndefined = !bValue;
      if (aIsNullUndefined) {
        return sort.direction === 'asc' ? -1 : 1;
      } else if (bIsNullUndefined) {
        return sort.direction === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    } else {
      return sort.direction === 'asc' ? aValue.toString().localeCompare(bValue.toString()) : bValue.toString().localeCompare(aValue.toString());
    }
  }
  
  onPageChange(pageEvent: PageEvent) {
    this.pageSize$.next(pageEvent.pageSize);
    this.pageIndex$.next(pageEvent.pageIndex);
  }

  onSortChange(sort: Sort) {
    this.sort$.next(sort);
  }

  generateSupportEmailForFetchingDirectReports(errorMessage: string, staffMember: Staff): string {
    const subject = encodeURIComponent(`Error when fetching direct reports for ${staffMember.displayName}`);
    const body = encodeURIComponent(`Hi, \n\nI was trying to fetch direct reports for ${staffMember.displayName} (${staffMember.upn}), but it failed with the following error: ${errorMessage}. \n\nPlease can you assist? \n\nKind regards,`);
    return `mailto:reviews-support@bbd.co.za?subject=${subject}&body=${body}`;
  }

  areAllStaffSelected() {
    const numSelected = this.staffSelection.selected.length;
    const numRows = this.paginatedDirectReports$.getValue().allDirectReports.length;
    return numSelected === numRows;
  }

  toggleSelectAllStaff() {
    if (this.areAllStaffSelected()) {
      this.staffSelection.clear();
    } else {
      this.staffSelection.select(...this.paginatedDirectReports$.getValue().allDirectReports);
    }
  }

  removeStaffFromSelection(staff: Staff) {
    this.staffSelection.deselect(staff);
  }

  reassignStaff(staff: Staff[], bulkReassignmentForm: FormGroup<UnitCorrectionsFormControls>) {
    bulkReassignmentForm.updateValueAndValidity();

    if (bulkReassignmentForm.valid) {
      this.bulkReassignmentRequest$.next({
        staffIds: staff.map(s => s.staffId),
        effectiveDate: bulkReassignmentForm.controls.effectiveDate.value.toDate(),
        newManagerUpn: bulkReassignmentForm.controls.reviewerUpn.value,
      });
    } else {
      bulkReassignmentForm.markAllAsTouched();
      bulkReassignmentForm.updateValueAndValidity();
    }
  }

  generateSupportEmailForBulkReassignment(errorMessage: string): string {
    const selectedStaffMembers = this.staffSelection.selected.map(s => s.displayName).join(', ');
    const effectiveDate = this.bulkReassignmentForm.controls.effectiveDate.value.toDate().toISOString();
    const newReviewer = this.bulkReassignmentForm.controls.reviewerUpn.value;

    const subject = encodeURIComponent(`Error when bulk reassigning staff to a new reviewer for outgoing reviewer ${this.manager().displayName}`);
    const body = encodeURIComponent(`Hi, \n\nI was trying to bulk reassign staff to a new reviewer for outgoing reviewer ${this.manager().displayName}, but it failed with the following error: ${errorMessage}. \n\nThe staff members selected to be reassigned are: ${selectedStaffMembers}. \n\nThe effective date is: ${effectiveDate}. \n\nThe new reviewer is: ${newReviewer}. \n\nPlease can you assist? \n\nKind regards,`);
    return `mailto:reviews-support@bbd.co.za?subject=${subject}&body=${body}`;
  }

  getAllStaffOptions(): Observable<string[]> {
    return this.allStaff$.pipe(
      map(staff => staff.map(s => s.upn))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
