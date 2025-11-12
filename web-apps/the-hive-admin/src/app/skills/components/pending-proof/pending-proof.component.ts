import { Component, ViewChild, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatSort, MatSortModule, Sort } from "@angular/material/sort";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  switchMap,
  catchError,
  finalize,
  of,
  shareReplay,
  Subject,
  takeUntil,
  map,
  Observable,
  take,
} from "rxjs";
import { SkillsProofDownloadService } from "../../services/skills-proof-download.service";
import { ProofValidationService } from "../../services/skills-proof-validation.service";
import { EnvironmentService } from "../../../services/environment.service";
import { TableService } from "../../../services/table.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AuthService } from "../../../services/auth.service";
import { Guid } from "@the-hive/lib-skills-shared";
import { LoadingIndicatorComponent } from "../../../components/loading-indicator/loading-indicator.component";


interface StaffPendingProofValidationViewModel {
  displayName: string;
  email: string;
  qualification: string;
  proofPath: string;
  enableValidationButton: boolean;
  guidOfEdgeRequiringValidation : Guid;
}

interface ProofValidationSort extends Omit<Sort, "active"> {
  sortColumn?: keyof StaffPendingProofValidationViewModel;
}
@Component({
  selector: "app-pending-proof",
  standalone: true,
  templateUrl: "./pending-proof.component.html",
  styleUrls: ["./pending-proof.component.css"],
  imports: [
    CommonModule,
    LoadingIndicatorComponent,
    MatTableModule,
    MatSortModule,
    FormsModule,
    MatInputModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
})
export class PendingProofComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = ["displayName", "email", "qualification", "downloadProof", "validate"];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @Output() reloadProofValdiationData = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  pageLength$ = new BehaviorSubject<number>(10);
  pageIndex$ = new BehaviorSubject<number>(0);
  searchText$ = new BehaviorSubject<string>(undefined);
  private reloadComponentDataTrigger$ = new BehaviorSubject<void>(undefined);
  private sortChangeSubject$ = new BehaviorSubject<ProofValidationSort>(undefined);

  proofValidations$: Observable<StaffPendingProofValidationViewModel[]>;
  totalCount$ = new BehaviorSubject<number>(0);

  snackBarDuration: number;
  debounceTimeInMilliseconds: number;
  errorMessage: string | undefined;
  validatingUser: string;

  constructor(
    private proofDownloadService: SkillsProofDownloadService,
    private proofValidationService: ProofValidationService,
    private snackBar: MatSnackBar,
    private environmentService: EnvironmentService,
    public tableService: TableService,
    private authService: AuthService,
  ) {
    const config = this.environmentService.getConfiguratonValues();
    this.snackBarDuration = config.SNACKBAR_DURATION;
    this.debounceTimeInMilliseconds = config.SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS;
  }

  ngOnInit() {
    this.initializeProofValidationStream();
    this.authService.getUser().subscribe(user => {
      this.validatingUser = user;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeProofValidationStream() {
    this.proofValidations$ = combineLatest({
      pageSize: this.pageLength$,
      pageIndex: this.pageIndex$,
      sortState: this.sortChangeSubject$,
      searchText: this.searchText$,
      reloadData: this.reloadComponentDataTrigger$
    }).pipe(
      takeUntil(this.destroy$),
      debounceTime(this.debounceTimeInMilliseconds),
      switchMap(({ pageSize, pageIndex, sortState, searchText }) =>
        this.fetchProofValidations(pageIndex, pageSize, sortState, searchText),
      ),
      shareReplay(1),
    );
  }

  private fetchProofValidations(
    pageIndex: number,
    pageSize: number,
    sortState: ProofValidationSort | undefined,
    searchText: string,
  ) {
    this.loadingSubject.next(true);
    const sortDir = sortState?.direction ?? "";

    return this.proofValidationService
      .getPendingProofValidations(pageIndex, pageSize, sortState?.sortColumn, sortDir, searchText)
      .pipe(
        takeUntil(this.destroy$),
        map((res) => {
          this.totalCount$.next(res.totalCount);
          return res.data.map((v) => ({
            displayName: v.staffName,
            email: v.staffEmail,
            qualification: v.qualification,
            proofPath: v.proofFile,
            enableValidationButton: false,
            guidOfEdgeRequiringValidation : v.guidOfEdgeRequiringValidation  ,
          }));
        }), 
        catchError(() => {
          this.errorMessage = "Failed to load pending proof validations";
          this.snackBar.open(this.errorMessage, "Dismiss", {
            duration: this.snackBarDuration,
          });
          return of([]);
        }),
        finalize(() => this.loadingSubject.next(false)),
      );
  }

  onSearchChange(search: string) {
    this.pageIndex$.next(0);
    if (this.paginator) this.paginator.firstPage();
    this.searchText$.next(search);
  }

  pageChanged(event: PageEvent) {
    this.pageLength$.next(event.pageSize);
    this.pageIndex$.next(event.pageIndex);
  }

  isKeyOfStaffWithMoreDetails(key: string | undefined): key is keyof StaffPendingProofValidationViewModel {
    return key !== undefined && this.displayedColumns.includes(key as keyof StaffPendingProofValidationViewModel);
  }

  sortData(sort: Sort) {
    const sortColumn = this.isKeyOfStaffWithMoreDetails(sort.active) ? sort.active : "displayName";
    this.sortChangeSubject$.next({
      sortColumn: sortColumn,
      direction: sort.direction,
    });
  }

  ngAfterViewInit() {
    this.sort.sortChange.pipe(takeUntil(this.destroy$)).subscribe((sort: Sort) => {
      this.sortData(sort);
      this.pageIndex$.next(0);
      if (this.paginator) this.paginator.firstPage();
    });
  }

  downloadProof(fileValue: string, fileName: string, row: StaffPendingProofValidationViewModel) {
    this.proofDownloadService.downloadProof(fileValue, fileName).subscribe({
      next: (message) => {
        this.snackBar.open(message, "Dismiss", {
          duration: this.snackBarDuration,
        });
        row.enableValidationButton = true;
      },
      error: (error) => {
        this.snackBar.open(error, "Dismiss", {
          duration: this.snackBarDuration,
        });
      },
    });
  }

  async onApprove(row: StaffPendingProofValidationViewModel) {
    this.loadingSubject.next(true);
    this.proofValidationService.updateProofValidationApproved(row.guidOfEdgeRequiringValidation)
    .pipe(
      switchMap(() => {
        this.snackBar.open("Proof was successfully approved", "Dismiss", {
          duration: this.snackBarDuration,
        });
        this.reloadComponentDataTrigger$.next();
        return this.proofValidations$.pipe(take(1)); 
      }),
    )
    .subscribe({
      error: (error) => {
        this.snackBar.open(error, "Dismiss", {
          duration: this.snackBarDuration,
        });
        this.loadingSubject.next(false);
      }
    });
  }

  async onReject (row: StaffPendingProofValidationViewModel){
    this.loadingSubject.next (true);
    this.proofValidationService.updateProofValidationRejected(row.guidOfEdgeRequiringValidation, row.displayName, row.email, row.qualification, row.proofPath)
    .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: () => {
          this.snackBar.open("Proof was successfully rejected", "Dismiss", {
            duration: this.snackBarDuration,
          });
          this.reloadComponentDataTrigger$.next()
        },
        error: (error) => {
          this.snackBar.open(error, "Dismiss", {
            duration: this.snackBarDuration
          })
        }
      }) 
  }
}
