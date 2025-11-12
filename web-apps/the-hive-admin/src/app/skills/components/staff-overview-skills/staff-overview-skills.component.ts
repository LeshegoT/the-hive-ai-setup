/**@format */
import { CommonModule } from "@angular/common";
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild, OnChanges, Output, EventEmitter } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { provideMomentDateAdapter } from "@angular/material-moment-adapter";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatSort, MatSortModule, Sort } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DecoratedStaff } from "@the-hive/lib-skills-shared";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
} from "rxjs";
import { LoadingIndicatorComponent } from "../../../components/loading-indicator/loading-indicator.component";
import { CompanyEntity } from "../../../services/company-entities.service";
import { EnvironmentService } from "../../../services/environment.service";
import { TableService } from "../../../services/table.service";
import { SkillsService, StaffSummaryPanel } from "../../services/skills.service";
export const FORMATS_DD_MM_YYYY = {
  parse: { dateInput: "DD-MM-YYYY" },
  display: {
    dateInput: "DD/MM/YYYY",
    monthYearLabel: "YYYY MMM",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "YYYY MMMM",
  },
};

interface StaffDetailsQueryParameters {
  companyEntities: CompanyEntity[];
  pageLength: number;
  startIndex: number;
  searchDate: Date;
  staffNameSearchText: string;
  sortState: StaffSummarySort;
}

interface StaffSummarySort extends Omit<Sort, "active" > {
  sortColumn?: keyof DecoratedStaff;
}

@Component({
    selector: "app-staff-overview-skills",
    templateUrl: "./staff-overview-skills.component.html",
    styleUrls: ["./staff-overview-skills.component.css"],
    providers: [provideMomentDateAdapter(FORMATS_DD_MM_YYYY)],
    imports: [
        MatTableModule,
        CommonModule,
        LoadingIndicatorComponent,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatDatepickerModule,
        MatIconButton,
        MatIcon,
        MatTooltipModule
    ]
})
export class StaffOverviewSkillsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() staffWithSkills = false;
  @Input() companyEntities: CompanyEntity[] = [];
  @Input() attributeType?: StaffSummaryPanel;
  @Input() hasAttributeType? = true;
  @Output() staffNameSearchTextChanged = new EventEmitter<string>();
  @Output() searchDateChanged = new EventEmitter<Date>();


  skillsColumns: (keyof DecoratedStaff)[] = [
    "displayName",
    "upn",
    "jobTitle",
    "department",
    "manager",
    "entityDescription",
    "lastVisited",
  ];
  maxDate: Date = new Date();
  debounceTimeInMilliseconds: number;
  loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  staffDetails$: Observable<DecoratedStaff[]>;
  staffWhoHaveUsedCount$: Observable<number>;
  staffWhoHaveNotUsedCount$: Observable<number>;
  snackBarDuration: number;
  pageLength$ = new BehaviorSubject<number>(5);
  startIndex$ = new BehaviorSubject<number>(0);
  errorMessage : string = undefined;
  selectedCompanyEntities$ = new BehaviorSubject<CompanyEntity[]>(undefined);
  private pageChangeSubject = new BehaviorSubject<void>(undefined);
  private sortChangeSubject$ = new BehaviorSubject<StaffSummarySort>(undefined);
  private destroy$ = new Subject<void>();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  searchDate$ = new BehaviorSubject<Date | undefined>(undefined);
  staffNameSearchText$ = new BehaviorSubject<string>(undefined);

  constructor(private skillsService: SkillsService, public tableService: TableService, private matSnackBar: MatSnackBar,  private environmentService: EnvironmentService,) {
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
  }

  ngOnInit() {
    if (this.staffWithSkills) {
      this.skillsColumns.push("lastModified")
    } else {
      // table will not show Last Modified column as it will always be empty for everyone who never used skills
    }
    this.debounceTimeInMilliseconds =this.environmentService.getConfiguratonValues().SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS;

    this.getStaffDetails();
    this.getStaffSummary();
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  getStaffDetails() {
    this.staffDetails$ = combineLatest({
      companyEntities: this.selectedCompanyEntities$,
      pageLength: this.pageLength$,
      startIndex: this.startIndex$,
      searchDate: this.searchDate$,
      staffNameSearchText: this.staffNameSearchText$,
      sortState: this.sortChangeSubject$,
    }).pipe(
      takeUntil(this.destroy$),
      debounceTime(this.debounceTimeInMilliseconds),
      map(details => ({
        companyEntities: details.companyEntities || [],
        ...details
      })),
      switchMap(staffDetailParameters => this.fetchStaffDetails(staffDetailParameters)),
      shareReplay(1)
    );
  }

  fetchStaffDetails( staffDetailParameters : StaffDetailsQueryParameters) : Observable<DecoratedStaff[]> {
    this.loadingSubject.next(true);

    if (staffDetailParameters.companyEntities.length === 0) {
      this.matSnackBar.open('Please select at least one company entity', 'Dismiss', {
        duration: this.snackBarDuration,
      });
      this.loadingSubject.next(false);
      return of (undefined);
    } else {
      return this.skillsService.getStaffDetailsForSkills(
        this.staffWithSkills,
        staffDetailParameters.companyEntities,
        staffDetailParameters.pageLength,
        staffDetailParameters.startIndex,
        staffDetailParameters.searchDate,
        staffDetailParameters.staffNameSearchText,
        staffDetailParameters.sortState?.sortColumn,
        staffDetailParameters.sortState?.direction,
        this.attributeType?.attributeType,
      ).pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.errorMessage = `Failed to load data`;
          this.matSnackBar.open(`Failed to ${this.generateErrorContextMessage()}`, "Dismiss", {
              duration: this.snackBarDuration,
            });
            return of([]);
          }),
        finalize(() => this.loadingSubject.next(false))
      );
    }
  }

  getStaffSummary() {
    const staffSummary$ = combineLatest({
      companyEntities: this.selectedCompanyEntities$,
      searchDate: this.searchDate$,
      staffNameSearchText: this.staffNameSearchText$,
    }).pipe(
      takeUntil(this.destroy$),
      debounceTime(this.debounceTimeInMilliseconds),
      switchMap(({ companyEntities, searchDate, staffNameSearchText }) => {
        if (companyEntities.length === 0) {
          return of({ usersWithSkillsProfiles: 0, totalStaff: 0 });
        } else {
          return this.skillsService.getStaffWhoHaveUsedSkillsSummary(
            companyEntities,
            searchDate,
            staffNameSearchText,
            this.attributeType?.attributeType,
          ).pipe(
            takeUntil(this.destroy$)
          );
        }
      }),
      shareReplay(1),
    );
    this.staffWhoHaveUsedCount$ = staffSummary$.pipe(map((res) => res.usersWithSkillsProfiles));
    this.staffWhoHaveNotUsedCount$ = staffSummary$.pipe(map((res) => res.totalStaff - res.usersWithSkillsProfiles));
  }

  onSearchChange(event: string): void {
    this.startIndex$.next(0);
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.staffNameSearchText$.next(event);
    this.staffNameSearchTextChanged.emit(event);
  }

  generateErrorContextMessage(): string {
    if (!this.attributeType && this.staffWithSkills) {
      return "load data for staff who have a portfolio";
    } else if (!this.attributeType && !this.staffWithSkills) {
      return "load data for staff who have not added a portfolio";
    } else {
      return (
        "load data for staff who have not added any " +
        this.attributeType.attributeTypeCanonicalName.toLowerCase() +
        " to their portfolio"
      );
    }
  }

  onDateSearchChange(event: Date | undefined): void {
    this.searchDate$.next(event);
    this.searchDateChanged.emit(event);
  }
  public pageChanged(event: PageEvent) {
    this.pageLength$.next(event.pageSize);
    this.startIndex$.next(event.pageIndex);
    this.pageChangeSubject.next();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['companyEntities'] && this.companyEntities) {
      this.selectedCompanyEntities$.next(this.companyEntities);
    }
  }

   isKeyOfStaffWithMoreDetails(key: string | undefined): key is keyof DecoratedStaff {
    return key !== undefined && this.skillsColumns.includes(key as keyof DecoratedStaff);
  }

  sortData(sort: Sort) {
    const sortColumn = this.isKeyOfStaffWithMoreDetails(sort.active) ? sort.active : 'staffId';
    this.sortChangeSubject$.next({
      sortColumn: sortColumn,
      direction: sort.direction
    });
  }
}
