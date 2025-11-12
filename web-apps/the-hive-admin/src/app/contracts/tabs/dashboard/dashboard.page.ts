import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { EnvironmentService } from '../../../services/environment.service';
import { DashboardContractRecommendation, DashboardFilterParams  } from '@the-hive/lib-reviews-shared';
import { SelectedStatusSummaryTableItem } from '../../../review/services/hr-review-dashboard.service';
import { ContractAndRecommendationStatus, contractAndRecommendationStatuses } from '../../services/contracts.service';
import { ContractsDashboardService } from '../../services/contracts-dashboard.service';
import { DashboardContractsListTableColumn } from '../../components/dashboard-contracts-list/dashboard-contracts-list';
import { DashboardContractsListComponent } from '../../components/dashboard-contracts-list/dashboard-contracts-list';

@Component({
    selector: 'app-contracts-dashboard',
    templateUrl: './dashboard.page.html',
    styleUrls: ['./dashboard.page.css'],
    standalone: false
})
export class DashboardComponent implements OnInit {

  @ViewChild('dashboard',{static:true}) view: ElementRef;
  typeSelection: string;
  contractSelected?: DashboardContractRecommendation;
  dashboardFilter: DashboardFilterParams;
  statuses: ContractAndRecommendationStatus[] = Array.from(contractAndRecommendationStatuses).filter(status => status !== "Upcoming Contracts");
  contractRecommendationsColumns: ReadonlyArray<DashboardContractsListTableColumn> = ['displayName', 'department', 'nextReviewDate', 'reviewer', 'hrRep', 'updatedAt'];
  selectedStatusSummaryTableItem$: BehaviorSubject<SelectedStatusSummaryTableItem> = new BehaviorSubject(undefined);
  contractListItems$: Observable<DashboardContractRecommendation[] | undefined>;

  constructor(private contractsDashboardService: ContractsDashboardService) { }
  
  ngOnInit(): void {
    this.contractListItems$ = this.selectedStatusSummaryTableItem$.pipe(
      switchMap(selectedStatusSummaryTableItem => {
        const isAnyGroupSelected = !!selectedStatusSummaryTableItem
          && (
            !!selectedStatusSummaryTableItem.lateness
            || !!selectedStatusSummaryTableItem.hrRep
            || !!selectedStatusSummaryTableItem.status
          );

        if (isAnyGroupSelected && selectedStatusSummaryTableItem.selectedItemType === 'numberOfUnchangedReviews') {
          return this.contractsDashboardService.retrieveReviewsWithUnchangedLatenessAndStatus(selectedStatusSummaryTableItem).pipe(startWith(undefined));
        } else if (isAnyGroupSelected && selectedStatusSummaryTableItem.selectedItemType === 'numberOfReviews') {
          return this.contractsDashboardService.retrieveReviewsForLatenessAndStatus(selectedStatusSummaryTableItem).pipe(startWith(undefined));
        } else {
          return of([]);
        }
      })
    );
  }

  setDashboardFilterValue(newFilter: DashboardFilterParams) {
    this.dashboardFilter = newFilter;
    this.resetSelections();
  }

  setSelectedStatusSummaryTableItem(selectedStatusSummaryTableItem: SelectedStatusSummaryTableItem) {
    this.selectedStatusSummaryTableItem$.next(selectedStatusSummaryTableItem);
  }

  resetSelections() {
    this.selectedStatusSummaryTableItem$.next(undefined);
  }

}
