import { AfterContentChecked, Component, Input, OnInit, output, QueryList, signal, ViewChild, viewChild, ViewChildren } from '@angular/core';
import { MatColumnDef, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { EMPTY, map, Observable, switchMap, take } from 'rxjs';
import { FeedbackAssignmentTemplate } from '../../../shared/interfaces';
import { ContractsAndContractRecommendationsFilterParameters, ContractsService, PagedResult } from '../../services/contracts.service';
import { ContractRecommendation } from '@the-hive/lib-reviews-shared';
import { ContractRecommendationStatusProgression, PageInformation } from '../../interfaces';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EnvironmentService } from '../../../services/environment.service';
import { MatDialog } from '@angular/material/dialog';
import { HrRepSelectionDialogComponent } from '../../../review/components/hr-rep-selection-dialog/hr-rep-selection-dialog.component';
import { MatSelectChange } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TableService } from '../../../services/table.service';
import { AuthService } from '../../../services/auth.service';
import { HrCommentsDialogComponent } from '../../../review/components/hr-comments-dialog/hr-comments-dialog.component';
import { ReviewStealDialogComponent } from '../../../review/components/review-steal-dialog/review-steal-dialog.component';
import { ReviewAndContractRecommendationDeleteDialogComponent } from '../../../review/components/review-and-contract-recommendation-delete-dialog/review-and-contract-recommendation-delete-dialog.component';
import { TextInputDialogComponent } from '../../../text-input-dialog/text-input-dialog.component';
import { ReviewAndContractHoldDetailsDialogComponent } from '../../../review/components/review-and-contract-hold-details-dialog/review-and-contract-hold-details-dialog.component';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { calculateEndOfDay } from '../../../shared/date-utils';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';

enum ContractRecommendationStatus {
  UpcomingContract = 'Upcoming Contracts',
  InReview = 'In Review',
  New = 'New',
  ReviewCompleted = 'Review Completed',
  ToRenew = 'To Renew',
  ToTerminate = 'To Terminate',
  ToMakePermanent = 'To Make Permanent',
  Archived = 'Archived',
  Cancelled = 'Cancelled',
  ContinueAsIs = 'Continue As Is',
}

@Component({
    selector: 'app-contract-review-list',
    templateUrl: './contract-review-list.component.html',
    imports: [
        MatTableModule,
        DatePipe,
        MatIconModule,
        MatTooltipModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        AsyncPipe,
        MatPaginatorModule,
        MatDatepicker,
        MatDatepickerToggle,
        MatDatepickerInput,
        MatMenuModule,
        MatSortModule
    ],
    styleUrls: ['./contract-review-list.component.css', '../../../review/styles/reviewShared.css'],
    providers: [provideMaterialDatePickerConfiguration()],
})
export class ContractReviewListComponent implements OnInit, AfterContentChecked {
  contractReviewsTableDataSource: MatTableDataSource<ContractRecommendation>;
  @Input() filters$: Observable<ContractsAndContractRecommendationsFilterParameters>;
  @ViewChildren(MatColumnDef) contractTable: QueryList<MatColumnDef>;
  columnsToShow: string[] = [];
  paginator = viewChild.required<MatPaginator>('paginator');
  pageInfo = signal<PageInformation>({
    pageNumber: 0,
    pageSize: 10,
    totalPages: undefined,
    resultSetSize: undefined,
  });

  contractRecommendationStatuses = ContractRecommendationStatus;
  allowedStatusProgressions: ContractRecommendationStatusProgression[] = [];

  selectedContractRecommendationForContinuing: ContractRecommendation;
  selectedContractRecommendationForReview: ContractRecommendation;
  reviewTypes$: Observable<FeedbackAssignmentTemplate>;

  snackBarDuration: number;
  activeHrRepUpn: string = undefined;
  buttonsEnabled = signal<boolean>(false);
  selectedRecommendation =  output<ContractRecommendation>();
  onFiltersOrListChanged = output<ContractsAndContractRecommendationsFilterParameters>();

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (this.contractReviewsTableDataSource) {
      this.contractReviewsTableDataSource.sort = sort;
    } else {
      // contractReviewsTableDataSource is undefined, so sort cannot be set
    }
  }

  constructor(
    private contractsService: ContractsService,
    private feedbackService: FeedbackService,
    private environmentService: EnvironmentService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    public tableService: TableService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadActiveHrRepUpn();
    this.fetchEnvironmentConfigurations();
    this.fetchContractAndContractRecommendations();
    this.fetchContractRecommendationStatusProgressions();
    this.fetchReviewTypes();
  }

  ngAfterContentChecked() {
    if (this.contractTable !== undefined) {
      this.columnsToShow = this.contractTable.map((column) => column.name);
    } else {
      // Cannot read the columns to be displayed from the template
    }
  }

  createContractRecommendation(row: ContractRecommendation) {
    this.contractReviewsTableDataSource = undefined;
    this.resetPageNumber();
    this.filters$
    .pipe(
      take(1),
      switchMap(filter => 
        this.contractsService.createContractRecommendation(row.contractId, this.activeHrRepUpn)
          .pipe(
            switchMap(() => {
              this.onFiltersOrListChanged.emit(filter);
              return this.contractsService.getContracts(filter, this.pageInfo());
            })
          )
      )
    )
    .subscribe({
      next: (result: PagedResult<ContractRecommendation>) => {
        this.contractReviewsTableDataSource = new MatTableDataSource<ContractRecommendation>(result.data);
        this.pageInfo.set(result.pageInfo);
        this.snackBar.open(`A contract recommendation has been successfully created for '${row.displayName}'.`, 'Dismiss', { duration: this.snackBarDuration });
      },
    });
  }

  fetchEnvironmentConfigurations(): void {
    this.environmentService.getConfig().subscribe((env) => {
      this.snackBarDuration = env.SNACKBAR_DURATION; 
    });
  }

  fetchContractAndContractRecommendations() {
    this.filters$.pipe(
      switchMap((filter: ContractsAndContractRecommendationsFilterParameters) => {
        this.contractReviewsTableDataSource = undefined;
        this.updateButtonStates(filter.hrRep);
        this.onFiltersOrListChanged.emit(filter);
        if (filter.status !== this.contractRecommendationStatuses.UpcomingContract) {
          return this.contractsService.getAllContractRecommendations(filter, this.pageInfo());
        } else {
          return this.contractsService.getContracts(filter, this.pageInfo());
        }
      })
    ).subscribe({
      next: (result: PagedResult<ContractRecommendation>) => {
        this.contractReviewsTableDataSource = new MatTableDataSource<ContractRecommendation>(result.data);
        this.pageInfo.set(result.pageInfo);
      },
    });
  }

  fetchContractRecommendationStatusProgressions() {
    this.contractsService.getContractRecommendationStatusProgressions().subscribe((statusProgressions) => {
      this.allowedStatusProgressions = statusProgressions;
    });
  }

  fetchReviewTypes() {
    this.reviewTypes$ = this.feedbackService.getFeedbackAssignmentTemplates().pipe(
      map((reviewTypes) => {
        return reviewTypes.filter((reviewType) => reviewType.manualFeedbackAssignment);
      })
    );
  }

  isStatusProgressionAllowed(fromStatus: ContractRecommendationStatus, toStatus: ContractRecommendationStatus) {
    return this.allowedStatusProgressions.some(
      (statusProgression) => statusProgression.fromStatus === fromStatus && statusProgression.toStatus === toStatus && this.buttonsEnabled()
    );
  }

  updateContractRecommendationStatus(contractRecommendation: ContractRecommendation, data: { status: ContractRecommendationStatus, nextReviewType?: string, nextReviewDate?: Date }) {
    this.resetPageNumber();
    this.contractsService.updateContractRecommendation(contractRecommendation.contractRecommendationId, data).subscribe({
      next: () => {
        this.snackBar.open(`The contract recommendation was successfully moved to '${data.status}' status.`, 'Dismiss', { duration: this.snackBarDuration });
        this.fetchContractAndContractRecommendations();
      },
      error: (error) => {
        const isNonCustomError = error.startsWith("Error Code:") && error.includes("Message: Http failure response for");
        if (isNonCustomError) {
          this.snackBar.open("We experienced technical difficulties while updating the contract recommendation status. Please try again. If the issue persists, contact support for assistance.", 'Dismiss', { duration: this.snackBarDuration });
        }
        else {
          this.snackBar.open(error, 'Dismiss', { duration: this.snackBarDuration });
        }
        
      }
    });
  }

  updateStatusOnButtonClick(contractRecommendation: ContractRecommendation, status: ContractRecommendationStatus): void {
    if (contractRecommendation.status === ContractRecommendationStatus.ContinueAsIs){
      this.selectedContractRecommendationForContinuing = contractRecommendation;
    } else {
      this.updateContractRecommendationStatus(contractRecommendation, { status });
    }
  }

  updateStatusOnSelect(row: ContractRecommendation, nextReviewType: string): void {
    this.updateContractRecommendationStatus(row, {
      status: this.contractRecommendationStatuses.InReview,
      nextReviewType: nextReviewType,
      nextReviewDate: row.nextReviewDate
    });
  }

  updateReviewDate(contractRecommendation: ContractRecommendation, reviewDateInput: MatDatepickerInput<Date>) {
    const reviewDate = calculateEndOfDay(reviewDateInput.value);
    this.updateContractRecommendationStatus(contractRecommendation, {
      status: this.contractRecommendationStatuses.Archived,
      nextReviewDate: reviewDate
    });
  }

  createAllRecommendations() {
    const indiaContractIds: number[] = [];
    const contractIds: number[] = [];
    const contractsList = this.contractReviewsTableDataSource.data
      .filter(contract => !contract.onHoldBy || !contract.holdReason)

    for (const contract of contractsList) {
      if (contract.isIndia) {
        indiaContractIds.push(contract.contractId);
      } else {
        contractIds.push(contract.contractId);
      }
    }
    this.openHRRepDialog(indiaContractIds, contractIds);
  }

  openHRRepDialog(indiaContractIds: number[], contractIds: number[]) {
    this.feedbackService.getHRRepresentatives().subscribe((reps) => {
      const dialog = this.dialog.open(HrRepSelectionDialogComponent, {
        width: '60em',
        data: {
          indiaReps: { reps: reps.hrIndia, heading: 'India representatives' },
          otherReps: { reps: reps.hrOther, heading: 'All other representatives' },
          actionButtonText: 'Create Contract Recommendations',
        },
      });
      dialog.afterClosed().subscribe((repGroups) => {
        this.contractsService.bulkCreateContractRecommendations(contractIds, indiaContractIds, repGroups[1], repGroups[0])
          .subscribe({
            next: () => {
              this.snackBar.open('Contract recommendations created', 'Dismiss', { duration: this.snackBarDuration });
              this.fetchContractAndContractRecommendations();
            },
            error: (error) => {
              this.snackBar.open(error, 'Dismiss', { duration: this.snackBarDuration });
            }
          });
      });
    });
  }

  resetPageNumber() {
    this.pageInfo().pageNumber = 0;
  }

  pageChanged(event: PageEvent) {
    this.pageInfo().pageSize = event.pageSize;
    this.pageInfo().pageNumber = event.pageIndex;
    this.fetchContractAndContractRecommendations();
  }

  updateButtonStates(hrRep: string) {
    this.buttonsEnabled.set(hrRep.toLocaleLowerCase() === this.activeHrRepUpn?.toLocaleLowerCase())
  }

  loadActiveHrRepUpn() {
    this.authService.getUserPrincipleName().subscribe({
      next: (userPrincipleName) => {
        this.activeHrRepUpn = userPrincipleName;
      }
    });
  }

  emitRenewContract(recommendation: ContractRecommendation) {
    this.selectedRecommendation.emit(recommendation);
  }

  hrNotes(contract: ContractRecommendation) {
    this.dialog.open(HrCommentsDialogComponent, {
      width: 'var(--mat-dialog-container-width)',
      data: {
        staffId: contract.staffId,
        userPrincipleName: contract.userPrincipleName,
        userDisplayName: contract.displayName
      },
    });
  }

  canStealContractRecommendation(contractRecommendation: ContractRecommendation): boolean {
    return this.activeHrRepUpn && contractRecommendation.status && contractRecommendation.status !== this.contractRecommendationStatuses.UpcomingContract && 
    (contractRecommendation.hrRep.toLocaleLowerCase() !== this.activeHrRepUpn.toLocaleLowerCase());
           
  }

  openStealContractRecommendationDialog(contractRecommendation: ContractRecommendation) {
    this.dialog.open(ReviewStealDialogComponent, {
      width: 'var(--mat-dialog-container-width)',
      data: {
        contractRecommendationId: contractRecommendation.contractRecommendationId,
        reviewee: contractRecommendation.displayName,
        activeUPN: this.activeHrRepUpn,
        deadline: contractRecommendation.endsAt,
        status: contractRecommendation.status,
        hrRep: contractRecommendation.hrRep,
        stealType: 'Contract Recommendation',
        afterSuccess: () => {
          this.fetchContractAndContractRecommendations();
        }
      }
    });
  }

  openDeleteContractRecommendationDialog(contractRecommendation: ContractRecommendation) {
    this.dialog.open(ReviewAndContractRecommendationDeleteDialogComponent, {
      width: 'var(--mat-dialog-container-width)',
      data: {
        contractRecommendationId: contractRecommendation.contractRecommendationId,
        reviewee: contractRecommendation.userPrincipleName,
        deadline: contractRecommendation.endsAt,
        warningMessage: "Ensure you supply a sufficiently clear reason.",
        status: contractRecommendation.status,
        contractRecommendationCancelStatus: this.contractRecommendationStatuses.Cancelled,
        afterSuccess: () => {
          this.fetchContractAndContractRecommendations();
        }
      }
    });
  }

  placeContractOnHold(contract: ContractRecommendation) {
    this.dialog.open(TextInputDialogComponent, {
      width: 'var(--mat-dialog-container-width)',
      data: {
        currentText: "",
        editable: true,
        title: "Please provide a reason for placing this contract on hold",
        placeholder: "Please type in the reason",
        inputLabel: "Contract hold reason",
        warning: "Ensure that you provide a clear and sufficient reason for placing the contract on hold.",
      }
    })
    .afterClosed()
    .pipe(
      switchMap((results?: string) => {
        if (results) {
          return this.contractsService.putContractOnHold(contract.contractId, results);
        } else {
          return EMPTY;
        }
      })
    ).subscribe({
      next: () => {
        this.snackBar.open('The contract was successfully placed on hold', 'Dismiss', { duration: this.snackBarDuration });
        this.fetchContractAndContractRecommendations();
      },
      error: () => {
        this.snackBar.open('We encountered an issue while trying to place the contract on hold. Please try again.', 'Dismiss', { duration: this.snackBarDuration });
      }
    });
  }

  showContractHoldReason(contract: ContractRecommendation) {
    this.dialog.open(ReviewAndContractHoldDetailsDialogComponent, {
      width:'var(--mat-dialog-container-width)',
      data: {
        holdReasonText: contract.holdReason,
        onHoldByText: contract.onHoldBy, 
        editable: false,
      }
    });
  }

  removeContractHold(contract: ContractRecommendation) {
    this.contractsService.removeContractHold(contract.contractId).subscribe({
      next: () => {
        this.snackBar.open('The contract hold was successfully removed.', 'Dismiss', { duration: this.snackBarDuration });
        this.fetchContractAndContractRecommendations();
      }, 
      error: () => {
        this.snackBar.open('We encountered an issue while trying to remove the contract on hold. Please try again.', 'Dismiss', { duration: this.snackBarDuration });
      }
    })
  }

  onActionSelect(event: MatSelectChange, contractRecommendation: ContractRecommendation) {
    this.updateContractRecommendationStatus(contractRecommendation, { status: event.value });
  }
}
