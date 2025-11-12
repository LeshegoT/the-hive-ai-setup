import { animate, state, style, transition, trigger } from '@angular/animations';
import { FlatTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { Component, Inject, Input, Output, SimpleChanges, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { DashboardStatusSummary, latenessCategories, UnchangedReviewsItem } from '@the-hive/lib-reviews-shared';
import { BehaviorSubject, catchError, concatMap, map, Observable, of, ReplaySubject, startWith, switchMap } from 'rxjs';
import { ContractsDashboardService } from '../../../contracts/services/contracts-dashboard.service';
import { MaterialModule } from '../../../material.module';
import { EnvironmentService } from '../../../services/environment.service';
import { buildGroupedSummary, GroupAndDateTotal, KeyValueSortOrder } from '../../../shared/group';
import { ReviewDashboardServiceToken } from '../../../shared/reviews-dashboard-service-token';
import { HrReviewDashboardService, ReviewsDashboardGroupingCategories, SelectedStatusSummaryTableItem } from '../../services/hr-review-dashboard.service';
import { DashboardFilter } from '../dashboard-filter/dashboard-filter.component';
import { WarningBadgeComponent } from '../warning-badge/warning-badge.component';

export type FlatGroupedSummary = GroupAndDateTotal<DashboardStatusSummary> & {
  expandable: boolean;
  groupingDepth: number;
};

export type UnchangedItemsCountResult =
  | { type: 'error' }
  | { type: 'success'; data: number };

export type UnchangedReviewsItemWithObservableCount = Omit<UnchangedReviewsItem, 'numberOfItemsWithUnchangedStatus'> & {
  unchangedItemsCount?: BehaviorSubject<UnchangedItemsCountResult>;
};

type DashboardStatusSummaryResult = { error: string, type: 'error' } | { data: DashboardStatusSummary[], type: 'success' };

@Component({
    selector: 'review-status-summary-table',
    templateUrl: './review-status-summary-table.component.html',
    styleUrls: ['../../../../styles.css', './review-status-summary-table.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed,void', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    imports: [
      CommonModule,
      MaterialModule,
      MatBadgeModule,
      WarningBadgeComponent,
    ]
})
export class ReviewStatusSummaryTableComponent implements OnInit, OnDestroy, OnChanges {

  @Input() dashboardFilter: DashboardFilter;
  dashboardFilterSubject$: BehaviorSubject<DashboardFilter> = new BehaviorSubject(undefined);
  fieldNames: string[];
  @Output('selectedStatusSummaryTableItem') selectedStatusSummaryTableItem$ = new BehaviorSubject<SelectedStatusSummaryTableItem>(undefined);
  unchangedReviews$: ReplaySubject<Observable<UnchangedReviewsItem>> = new ReplaySubject(undefined);
  pendingUnchangedReviewRequests: Observable<UnchangedReviewsItem>[] = [];
  retrieveStatusSummaryErrorMessage$: Observable<string>;
  reviewsWithUnchangedStatusTotals: UnchangedReviewsItemWithObservableCount[] = [];
  groupingCategorySortOrders: KeyValueSortOrder<DashboardStatusSummary>[];
  private transformer = (group: GroupAndDateTotal<DashboardStatusSummary>, groupingDepth: number) => {
    return {
      expandable: !!group.subGroups && group.subGroups.length > 0,
      groupingDepth: groupingDepth,
      ...group,
    };
  };

  treeControl = new FlatTreeControl<FlatGroupedSummary>(
    (group) => group.groupingDepth,
    (group) => group.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this.transformer,
    (group) => group.groupingDepth,
    (group) => group.expandable,
    (group) => group.subGroups
  );

   dataSource$: Observable<MatTreeFlatDataSource<GroupAndDateTotal<DashboardStatusSummary>, FlatGroupedSummary>>;

  constructor(
    @Inject(ReviewDashboardServiceToken)
    private dashboardService: HrReviewDashboardService | ContractsDashboardService,
    private environmentService: EnvironmentService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    const dashboardStatusSummary$ = this.dashboardFilterSubject$.pipe(
      switchMap(filters => {
        this.pendingUnchangedReviewRequests = [];
        this.selectedStatusSummaryTableItem$.next(undefined);
        this.groupingCategorySortOrders = [
          {
            key: "lateness",
            sortOrder: latenessCategories
          },
          {
            key: "status",
            sortOrder: this.dashboardService.getStatusSortOrder()
          },
        ];

        this.groupingCategorySortOrders.sort((firstCategory, secondCategory) => 
          filters.groupingOrder.indexOf(firstCategory.key) - filters.groupingOrder.indexOf(secondCategory.key)
        );
        return this.retrieveStatusSummary(filters);
      }),
    );

    this.dataSource$ = dashboardStatusSummary$.pipe(
      map(statusSummaryResult => {
        this.reviewsWithUnchangedStatusTotals = [];
        if (statusSummaryResult?.type === 'success') {
          return this.mapStatusSummaryToTreeDataSource(statusSummaryResult.data);
        } else {
          return undefined;
        }
      })
    );

    this.retrieveStatusSummaryErrorMessage$ = dashboardStatusSummary$.pipe(
      map(statusSummaryResult => {
        if (statusSummaryResult?.type === 'error') {
          return statusSummaryResult.error;
        } else {
          return undefined;
        }
      })
    );

    this.unchangedReviews$.pipe(
      concatMap(unchangedReviewItems => {
        return this.pendingUnchangedReviewRequests.some(unchangedReviewsRequest => unchangedReviewsRequest === unchangedReviewItems)? unchangedReviewItems: of();
      })
    ).subscribe((unchangedReviewItem) => {
      const matchingTrackedReview = this.reviewsWithUnchangedStatusTotals.find(trackedReview =>
        unchangedReviewItem.asAtEndOf.getTime() === trackedReview.asAtEndOf.getTime() &&
        (unchangedReviewItem.lateness === trackedReview.lateness) &&
        (unchangedReviewItem.hrRep === trackedReview.hrRep) &&
        (unchangedReviewItem.status === trackedReview.status) &&
        (unchangedReviewItem.templateName === trackedReview.templateName)
      );
      if (matchingTrackedReview) {
        const count = unchangedReviewItem.numberOfItemsWithUnchangedStatus;
        const result: UnchangedItemsCountResult = count !== undefined ? { type: 'success', data: count } : { type: 'error' };
        matchingTrackedReview.unchangedItemsCount.next(result);
      } else {
        // Filters have changed and reviewsWithUnchangedStatusTotals does not contain the item with status, lateness, hrRep and asAtEndOf
      }
    });
  }

  mapStatusSummaryToTreeDataSource(statusSummary: DashboardStatusSummary[]): MatTreeFlatDataSource<GroupAndDateTotal<DashboardStatusSummary>, FlatGroupedSummary, FlatGroupedSummary> {
    const dataSource = new MatTreeFlatDataSource<GroupAndDateTotal<DashboardStatusSummary>, FlatGroupedSummary>(this.treeControl, this.treeFlattener);
    const excludedGroupNames = this.dashboardFilter.excludedHrReps.concat(this.dashboardFilter.excludedLatenesses).concat(this.dashboardFilter.excludedStatuses).concat(this.dashboardFilter.excludedTemplateNames);
    const statusSummaryGroupingOrder = this.filterHrRepOrTemplateFromGroupingOrderIfNotShown(this.dashboardFilter);
    this.fieldNames = this.getSummaryFields(statusSummary);
    statusSummary = statusSummary.filter(item => item.status && item.lateness && item.hrRep);
    dataSource.data = buildGroupedSummary(statusSummary, statusSummaryGroupingOrder, this.groupingCategorySortOrders, excludedGroupNames);
    return dataSource;
  }

  retrieveStatusSummary(dashboardFilter: DashboardFilter): Observable<DashboardStatusSummaryResult> {
    return this.dashboardService.retrieveStatusSummary(dashboardFilter).pipe(
        map(statusSummary => ({ data: statusSummary, type: "success" } as const)),
        catchError((errorMessage: string) => of({ error: errorMessage, type: "error" } as const)), 
        startWith(undefined),
      )
  }

  ngOnDestroy(): void {
    this.unchangedReviews$.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dashboardFilter']) {
      this.dashboardFilterSubject$.next(this.dashboardFilter);
    } else {
      // the dashboardFilter did not change, no need to fetch new data
    }
  }

  filterHrRepOrTemplateFromGroupingOrderIfNotShown(dashboardFilter: DashboardFilter): ReviewsDashboardGroupingCategories[] {
    return dashboardFilter.groupingOrder.filter(groupingCategory => (groupingCategory !== "hrRep" || dashboardFilter[`${groupingCategory}Shown`]) && (groupingCategory !== "templateName" || dashboardFilter[`${groupingCategory}Shown`]));
  }

  getSummaryFields(summary: DashboardStatusSummary[]): string[] {
    const uniqueDates = [...new Set(summary.map(item => item.asAtEndOf.toISOString()))];
    const sortedDates = uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return ['ageing', ...sortedDates];
  }

  hasChild = (_: number, flatGroup: FlatGroupedSummary) => flatGroup.expandable;

  setSelectedStatusSummaryTableItem(element: FlatGroupedSummary, isoDateString: string, selectedItemType: SelectedStatusSummaryTableItem['selectedItemType']) {
    const selectedStatusSummaryTableItem: SelectedStatusSummaryTableItem = this.createSelectedStatusSummaryTableItemObject(element, new Date(isoDateString), this.dashboardFilter, selectedItemType);
    this.selectedStatusSummaryTableItem$.next(selectedStatusSummaryTableItem);
  }

  getTotalNumberOfReviewsForGroupAndDate(row: FlatGroupedSummary, isoDateString: string): number {
    const dateOfInterest = new Date(isoDateString);
    return row.dateTotals
      .find(dateTotal => dateTotal.asAtEndOf.getTime() === dateOfInterest.getTime())?.numberOfItems ?? 0;
  }

  createSelectedStatusSummaryTableItemObject(element: FlatGroupedSummary, selectedDate: Date, dashboardFilter: DashboardFilter, selectedItemType: SelectedStatusSummaryTableItem['selectedItemType']): SelectedStatusSummaryTableItem {
    const selectedItem = element.pathToGroup.reduce((path, group) => ({
      ...path,
      [group.groupKey]: group.groupName
    }), {} as Partial<DashboardStatusSummary>);

    return {
      ...dashboardFilter,
      ...selectedItem,
      asAtEndOf: selectedDate,
      selectedItemType: selectedItemType,
    };

  }

  retrieveNumberOfReviewsWithUnchangedStatusAndLateness(row: FlatGroupedSummary, asAt: string): BehaviorSubject<UnchangedItemsCountResult> {
    const selectedDate = new Date(asAt);
    const selectedItem = row.pathToGroup.reduce((path, group) => ({
      ...path,
      [group.groupKey]: group.groupName
    }), {} as Partial<DashboardStatusSummary>);

    const matchingUnchangedReviewsCountRecord = this.reviewsWithUnchangedStatusTotals.find(reviewsCount =>
      reviewsCount.asAtEndOf.getTime() === selectedDate.getTime() &&
      reviewsCount.lateness === selectedItem.lateness &&
      (!this.dashboardFilter.hrRepShown || reviewsCount.hrRep === selectedItem.hrRep) &&
      (!this.dashboardFilter.templateNameShown || reviewsCount.templateName === selectedItem.templateName) &&
      reviewsCount.status === selectedItem.status,
    );

    const numberOfReviewsForStatus = this.getTotalNumberOfReviewsForGroupAndDate(row, asAt);

    if (matchingUnchangedReviewsCountRecord){
      return matchingUnchangedReviewsCountRecord.unchangedItemsCount;
    } else if (numberOfReviewsForStatus === 0) {
      return new BehaviorSubject({ type: 'success', data: 0 });
    } else {
      const {
        excludedLatenesses,
        excludedStatuses,
        excludedHrReps,
        companyEntities,
        excludedTemplateNames,
        periodLength
      } = this.dashboardFilter;
      const numberOfUnchangedItems$ = this.dashboardService.retrieveReviewsWithUnchangedLatenessAndStatusCount({
        asAtEndOf: selectedDate,
        lateness: selectedItem.lateness,
        status: selectedItem.status,
        hrRep: this.dashboardFilter.hrRepShown && selectedItem.hrRep || undefined,
        templateName: this.dashboardFilter.templateNameShown && selectedItem.templateName || undefined,
        periodLength: periodLength,
        excludedLatenesses,
        excludedStatuses,
        excludedHrReps,
        excludedTemplateNames,
        companyEntities
      });

      const reviewsWithUnchangedStatusItem: UnchangedReviewsItemWithObservableCount = {
        asAtEndOf: selectedDate,
        unchangedItemsCount: new BehaviorSubject<UnchangedItemsCountResult>(undefined),
        hrRep: this.dashboardFilter.hrRepShown && selectedItem.hrRep || undefined,
        status: selectedItem.status,
        lateness: selectedItem.lateness,
        templateName: this.dashboardFilter.templateNameShown && selectedItem.templateName || undefined
      }
      this.reviewsWithUnchangedStatusTotals.push(reviewsWithUnchangedStatusItem);
      this.pendingUnchangedReviewRequests.push(numberOfUnchangedItems$);
      this.unchangedReviews$.next(numberOfUnchangedItems$);
      return reviewsWithUnchangedStatusItem.unchangedItemsCount;
    }

  }

  refetchUnchangedStatusItems(row: FlatGroupedSummary, asAt: string) {
    const selectedDate = new Date(asAt);
    const selectedItem = row.pathToGroup.reduce((path, group) => ({
      ...path,
      [group.groupKey]: group.groupName
    }), {} as Partial<DashboardStatusSummary>);

    const matchingUnchangedReviewsCountRecord = this.reviewsWithUnchangedStatusTotals.find(reviewsCount =>
      reviewsCount.asAtEndOf.getTime() === selectedDate.getTime() &&
      reviewsCount.lateness === selectedItem.lateness &&
      (!this.dashboardFilter.hrRepShown || reviewsCount.hrRep === selectedItem.hrRep) &&
      (!this.dashboardFilter.templateNameShown || reviewsCount.templateName === selectedItem.templateName) &&
      reviewsCount.status === selectedItem.status
    );

    matchingUnchangedReviewsCountRecord.unchangedItemsCount.next(undefined);
    const {
      excludedLatenesses,
      excludedStatuses,
      excludedHrReps,
      excludedTemplateNames,
      companyEntities,
      periodLength
    } = this.dashboardFilter;

    this.dashboardService.retrieveReviewsWithUnchangedLatenessAndStatusCount({
      asAtEndOf: selectedDate,
      lateness: selectedItem.lateness,
      status: selectedItem.status,
      hrRep: this.dashboardFilter.hrRepShown && selectedItem.hrRep || undefined,
      templateName: this.dashboardFilter.templateNameShown && selectedItem.templateName || undefined,
      periodLength: periodLength,
      excludedLatenesses,
      excludedStatuses,
      excludedHrReps,
      companyEntities,
      excludedTemplateNames
    }).subscribe((unchangedReviewItem) => {
      const matchingTrackedReview = this.reviewsWithUnchangedStatusTotals.find(trackedReview =>
        unchangedReviewItem.asAtEndOf.getTime() === trackedReview.asAtEndOf.getTime() &&
        (unchangedReviewItem.lateness === trackedReview.lateness) &&
        (unchangedReviewItem.hrRep === trackedReview.hrRep) &&
        (unchangedReviewItem.templateName === trackedReview.templateName) &&
        (unchangedReviewItem.status === trackedReview.status)
      );
      if (matchingTrackedReview) {
        const count = unchangedReviewItem.numberOfItemsWithUnchangedStatus;
        const result: UnchangedItemsCountResult = count !== undefined ? { type: 'success', data: count } : { type: 'error' };
        matchingTrackedReview.unchangedItemsCount.next(result);
      } else {
        // Filters have changed and reviewsWithUnchangedStatusTotals does not contain the item with status, lateness, hrRep and asAtEndOf
      }
    });
  }

  getTotalForDate(isoDateString: string, groupedSummaries: GroupAndDateTotal<DashboardStatusSummary>[]): number {
    const selectedDate = new Date(isoDateString);
    return groupedSummaries.reduce(
      (totalForDate, currentGroupedSummary) => {
        const dateTotalsForDate = currentGroupedSummary.dateTotals.filter(dateTotal => dateTotal.asAtEndOf.getTime() === selectedDate.getTime());
        const numberOfReviewsForDate = dateTotalsForDate.reduce((totalForDate, dateTotal) => totalForDate + dateTotal.numberOfItems, 0)
        return totalForDate + numberOfReviewsForDate;
      }, 0);
  }


  isSelectedStatusSummaryTableItem(element: FlatGroupedSummary, isoDateString: string): boolean {
    const selectedItem = this.selectedStatusSummaryTableItem$.getValue();
    const selectedDate = selectedItem?.asAtEndOf?.toISOString();
    const itemIsSelected = !!selectedItem
    const dateIsSelected = !!selectedDate && selectedDate === isoDateString;
    const isClickableRow = !element.expandable;
    const selectedItemMatchesGroup = element.pathToGroup.every(group =>
      selectedItem?.[group.groupKey] === group?.groupName
    );

    return itemIsSelected && dateIsSelected && isClickableRow && selectedItemMatchesGroup
  }

}


