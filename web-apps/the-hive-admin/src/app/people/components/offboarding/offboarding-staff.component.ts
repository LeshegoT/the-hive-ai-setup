import { CommonModule } from '@angular/common';
import { Component, OnInit, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatError } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Staff, StaffWithDirectReportsCount } from '@the-hive/lib-staff-shared';
import { Moment } from 'moment';
import { BehaviorSubject, catchError, combineLatest, map, merge, Observable, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { ErrorCardComponent } from '../../../components/error-card/error-card.component';
import { MarkStaffMemberForTerminationActionComponent } from '../../../components/mark-staff-member-for-termination-action/mark-staff-member-for-termination-action.component';
import { StaffFilterComponent } from '../../../components/staff-filter/staff-filter.component';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { TableService } from '../../../services/table.service';
import { Person } from '../../../shared/interfaces';
import { StaffMemberSearchResultCardComponent } from '../staff-member-search-result-card/staff-member-search-result-card.component';
import { OffboardingStaffService, StaffMemberTerminationResult } from './offboarding-staff.service';
import { StaffDirectReportsComponent } from '../staff-direct-reports/staff-direct-reports.component';

type FetchOffboardingStaffMembersResult =
  | { status: 'loading' }
  | { status: 'success'; offboardingStaffMembers: StaffWithDirectReportsCount[] }
  | { status: 'error'; errorMessage: string };

type PaginatedOffboardingStaffMembers = {
  data: Staff[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
};

@Component({
    selector: 'app-offboarding-staff',
    templateUrl: './offboarding-staff.component.html',
    styleUrls: ['./offboarding-staff.component.css', '../../../shared/shared.css'],
    imports: [
      CommonModule,
      MatButtonModule,
      StaffMemberSearchResultCardComponent,
      MarkStaffMemberForTerminationActionComponent,
      MatError,
      StaffFilterComponent,
      MatIconModule,
      ErrorCardComponent,
      MatProgressSpinnerModule,
      MatTableModule,
      MatPaginatorModule,
      MatSortModule,
      ReactiveFormsModule,
      MatDatepickerModule,
      MatInputModule,
      MatTooltipModule,
      StaffDirectReportsComponent
    ],
  providers: [
    provideMaterialDatePickerConfiguration(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic'
      }
    }
  ]
})
export class OffboardingStaffComponent implements OnInit {
  private readonly staffFilterComponent = viewChild(StaffFilterComponent);
  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  viewDirectReports$ = new BehaviorSubject<Staff | undefined>(undefined);
  selectedStaffMember$ = new BehaviorSubject<Person | undefined>(undefined);
  offboardingStaffMembersResult$: Observable<FetchOffboardingStaffMembersResult>;
  refreshOffboardingStaffMembers$ = new Subject<void>();
  staffMemberTerminationResults$: Record<string, Observable<StaffMemberTerminationResult>> = {};

  private readonly pageSize$ = new BehaviorSubject<number>(10);
  private readonly pageIndex$ = new BehaviorSubject<number>(0);
  private readonly sort$ = new BehaviorSubject<Sort>({ active: '', direction: '' });
  private readonly filter$ = new BehaviorSubject<string>('');

  paginatedOffboardingStaffMembers$: Observable<PaginatedOffboardingStaffMembers>;

  terminationEffectiveDateControls: Record<string, FormControl<Moment | null>> = {};
  filterControl = new FormControl<string>('');

  staffMemberSearchControlRestrictions = {
    minimumLength: 3
  };

  getTerminationEffectiveDateControl(upn: string): FormControl<Moment | null> {
    if (!this.terminationEffectiveDateControls[upn]) {
      this.terminationEffectiveDateControls[upn] = new FormControl<Moment | null>(null, [Validators.required]);
    } else {
      // We've already created the control, so we don't need to do anything
    }
    return this.terminationEffectiveDateControls[upn];
  }

  displayedColumns = [
    'displayName',
    'jobTitle',
    'upn',
    'bbdUserName',
    'department',
    'office',
    'manager',
    'actions',
  ];

  constructor(
    private readonly offboardingStaffService: OffboardingStaffService,
    public tableService: TableService,
  ) { }

  ngOnInit(): void {
    this.offboardingStaffMembersResult$ = merge(of(undefined), this.refreshOffboardingStaffMembers$).pipe(
      switchMap(() => this.offboardingStaffService.getOffboardingStaff().pipe(
        map((staff) => ({ status: 'success' as const, offboardingStaffMembers: staff })),
        catchError((error: string) => of({ status: 'error' as const, errorMessage: error })),
        startWith({ status: 'loading' as const }),
      )),
      shareReplay(1)
    );

    this.paginatedOffboardingStaffMembers$ = combineLatest([
      this.offboardingStaffMembersResult$,
      this.pageSize$,
      this.pageIndex$,
      this.sort$,
      this.filter$
    ]).pipe(
      map(([result, pageSize, pageIndex, sort, filter]) => {
        if (result.status === 'success') {
          let filteredData = result.offboardingStaffMembers;
          if (filter.trim()) {
            const filterLower = filter.toLowerCase().trim();
            filteredData = result.offboardingStaffMembers.filter(staff =>
              staff.displayName?.toLowerCase().includes(filterLower) ||
              staff.bbdUserName?.toLowerCase().includes(filterLower)
            );
          }

          const sortedData = filteredData.sort((a, b) => {
            const sortColumn = sort.active;
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            return sort.direction === 'asc' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
          });

          const startIndex = pageIndex * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedData = sortedData.slice(startIndex, endIndex);

          return {
            data: paginatedData,
            totalCount: filteredData.length,
            pageIndex,
            pageSize
          };
        } else {
          return {
            data: [],
            totalCount: 0,
            pageIndex: 0,
            pageSize: this.tableService.getPageSize()
          };
        }
      })
    );
  }

  onPageChange(pageEvent: PageEvent) {
    this.pageSize$.next(pageEvent.pageSize);
    this.pageIndex$.next(pageEvent.pageIndex);
  }

  onSortChange(sort: Sort) {
    this.sort$.next(sort);
  }

  onFilterChange() {
    this.filter$.next(this.filterControl.value || '');
    this.pageIndex$.next(0);
  }

  onStaffMemberSelected() {
    this.selectedStaffMember$.next(this.staffFilterComponent().selectedUserPrinciple);
  }

  markStaffMemberForTermination(upn: string, terminationDate: Date) {
    this.staffMemberTerminationResults$[upn] = this.offboardingStaffService.terminateStaffMemberWithResult(upn, terminationDate).pipe(
      shareReplay(1)
    );
  }

  openDirectReports(_event: MouseEvent, manager: Staff) {
    this.viewDirectReports$.next(manager);
  }

  closeDirectReports() {
    this.viewDirectReports$.next(undefined);
    this.refreshOffboardingStaffMembers();
  }

  refreshOffboardingStaffMembers() {
    this.refreshOffboardingStaffMembers$.next();
  }

  generateSupportEmailForFetchingOffboardingStaffMembers(errorMessage: string): string {
    const subject = encodeURIComponent(`Error fetching offboarding staff members`);
    const emailBody = encodeURIComponent(`Hi team, \n\n I'm having an issue with getting a list of offboarding staff members. \n\n The error message is: ${errorMessage}\n\n Please can you assist? \n\nKind regards,\n`);
    return `mailto:reviews-support@bbd.co.za?subject=${subject}&body=${emailBody}`;
  }

  generateSupportEmailForTermination(errorMessage: string, staffMember: Staff): string {
    const subject = encodeURIComponent(`Error terminating staff member ${staffMember.displayName}`);
    const emailBody = encodeURIComponent(`Hi team, \n\n I'm having an issue with terminating ${staffMember.displayName}. \n\n The error message is: ${errorMessage}.\n\n The staff member's details are as follows: \n\n${JSON.stringify(staffMember)}\n\n Please can you assist? \n\nKind regards,\n`);
    return `mailto:reviews-support@bbd.co.za?subject=${subject}&body=${emailBody}`;
  }
}
