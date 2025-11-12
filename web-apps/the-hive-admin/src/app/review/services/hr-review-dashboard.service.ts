import { Injectable, OnInit } from "@angular/core";
import { DashboardFilterParams, LatenessCategory, PeriodLength, ReviewStatus, reviewStatuses, UnchangedReviewsItem } from "@the-hive/lib-reviews-shared";
import { calculateEndOfDay, includeArrayJoinedByCommaInObject, includeInObjectWhenSet } from "@the-hive/lib-shared";
import { catchError, map, Observable, of } from "rxjs";
import { EnvironmentService } from "../../services/environment.service";
import { SharedService } from "../../services/shared.service";
import { DateTotal } from "../../shared/group";
import { DashboardFilter } from "../components/dashboard-filter/dashboard-filter.component";
import { ReviewListItem } from "../review-shared-interfaces";

export type ReviewsDashboardGroupingCategories = keyof DashboardStatusSummary;

export type DashboardStatusSummary = DateTotal & {
  status: ReviewStatus,
  lateness: LatenessCategory,
  hrRep?: string,
  templateName?: string
};

export type SelectedStatusSummaryTableItem = DashboardFilter & {
  selectedItemType: 'numberOfReviews' | 'numberOfUnchangedReviews';
};

@Injectable({
    providedIn: 'root',
})
export class HrReviewDashboardService implements OnInit {
    minimumNumberOfPeriods: number;
    defaultPeriodLength: PeriodLength;

    constructor(private sharedService: SharedService, private environmentService: EnvironmentService) {}

    ngOnInit() {
      this.environmentService.getConfig().subscribe((env) => {
        this.minimumNumberOfPeriods = env.HR_REVIEW_DASHBOARD_MINIMUM_PERIODS;
        this.defaultPeriodLength = env.HR_REVIEW_DASHBOARD_DEFAULT_PERIOD_LENGTH;
      });
    }

  retrieveStatusSummary(dashboardFilter: DashboardFilterParams): Observable<DashboardStatusSummary[]> {
      return this.sharedService.get(`hr-review-dashboard/status-summaries?${this.generateDashboardFilterQueryParams(dashboardFilter)}`)
        .pipe(map(value => {
          return value.map(dataPoint => {
            return {
              asAtEndOf: new Date(dataPoint.periodEndDate),
              numberOfItems: dataPoint.numberOfReviews,
              status: dataPoint.reviewStatus,
              lateness: dataPoint.lateness,
              hrRep: dataPoint.hrRep,
              templateName: dataPoint.templateName
            }
          })
        }))
  }

  retrieveReviewsWithUnchangedLatenessAndStatusCount(
    dashboardFilter: DashboardFilterParams
  ): Observable<UnchangedReviewsItem> {
    return this.sharedService.get(`/reviews/with-unchanged-status-count?${this.generateDashboardFilterQueryParams(dashboardFilter)}`).pipe(
      map(numberOfReviewsWithUnchangedStatus => ({
        asAtEndOf: calculateEndOfDay(dashboardFilter.asAtEndOf),
        lateness: dashboardFilter.lateness,
        hrRep: dashboardFilter.hrRep,
        status: dashboardFilter.status,
        numberOfItemsWithUnchangedStatus: numberOfReviewsWithUnchangedStatus,
        templateName: dashboardFilter.templateName
      })),
      catchError(() => (of<UnchangedReviewsItem>({
        asAtEndOf: calculateEndOfDay(dashboardFilter.asAtEndOf),
        lateness: dashboardFilter.lateness,
        hrRep: dashboardFilter.hrRep,
        status: dashboardFilter.status,
      })))
    );
  }

  retrieveReviewsWithUnchangedLatenessAndStatus(
    dashboardFilter: DashboardFilterParams
  ): Observable<ReviewListItem[]> {
    return this.sharedService.get(`/reviews/with-unchanged-status?${this.generateDashboardFilterQueryParams(dashboardFilter)}`);
  }

  generateDashboardFilterQueryParams(
    dashboardFilter: DashboardFilterParams
  ) {
    return new URLSearchParams({
      asAtEndOf: calculateEndOfDay(dashboardFilter.asAtEndOf).toISOString(),
      ...(includeInObjectWhenSet('status', dashboardFilter.status)),
      ...(includeInObjectWhenSet('lateness', dashboardFilter.lateness)),
      ...(includeInObjectWhenSet('hrRep', dashboardFilter.hrRep)),
      ...(includeInObjectWhenSet('templateName', dashboardFilter.templateName)),
      ...(includeInObjectWhenSet('periodLength', dashboardFilter.periodLength)),
      ...(includeInObjectWhenSet('numberOfPeriods', dashboardFilter.numberOfPeriods)),
      ...(includeArrayJoinedByCommaInObject('excludedLatenesses', dashboardFilter.excludedLatenesses)),
      ...(includeArrayJoinedByCommaInObject('excludedStatuses', dashboardFilter.excludedStatuses)),
      ...(includeArrayJoinedByCommaInObject('excludedHrReps', dashboardFilter.excludedHrReps)),
      ...(includeArrayJoinedByCommaInObject('excludedTemplateNames', dashboardFilter.excludedTemplateNames)),
      ...(includeArrayJoinedByCommaInObject('companyEntityIds', dashboardFilter.companyEntities?.map(entity => entity.companyEntityId)))
    });
  }

  retrieveReviewsForLatenessAndStatus(dashboardFilter: DashboardFilterParams): Observable<ReviewListItem[]> {
    return this.sharedService.get(`/reviews/dashboard/staff-reviews?${this.generateDashboardFilterQueryParams(dashboardFilter)}`);
  }

  getStatusSortOrder(): readonly ReviewStatus[] {
    return reviewStatuses;
  }

  getSupportedGroupingCategories(): ReviewsDashboardGroupingCategories[] {
    return this.environmentService.getConfiguratonValues().REVIEWS_DASHBOARD_SUPPORTED_GROUPING_CATEGORIES?.reviews ?? ['lateness', 'status', 'hrRep', 'templateName'];
  }
}
