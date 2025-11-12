import { Injectable, OnInit } from '@angular/core';
import { DashboardContractRecommendation, DashboardFilterParams, DashboardStatusSummary, PeriodLength, UnchangedReviewsItem } from '@the-hive/lib-reviews-shared';
import { calculateEndOfDay, includeArrayJoinedByCommaInObject, includeInObjectWhenSet } from '@the-hive/lib-shared';
import { catchError, map, Observable, of } from 'rxjs';
import { EnvironmentService } from '../../services/environment.service';
import { SharedService } from '../../services/shared.service';
import { ContractAndRecommendationStatus, contractAndRecommendationStatuses } from './contracts.service';
import { ReviewsDashboardGroupingCategories } from '../../review/services/hr-review-dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class ContractsDashboardService implements OnInit {
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
        return this.sharedService.get(`contracts/recommendations/status-summary?${this.generateDashboardFilterQueryParams(dashboardFilter)}`)
          .pipe(map(value => {
            return value.map(dataPoint => {
              return {
                asAtEndOf: new Date(dataPoint.periodEndDate),
                numberOfItems: dataPoint.numberOfContractRecommendations,
                status: dataPoint.status,
                lateness: dataPoint.lateness,
                hrRep: dataPoint.hrRep
              }
            })
          }))
    }
  
    retrieveReviewsWithUnchangedLatenessAndStatusCount(
      dashboardFilter: DashboardFilterParams
    ): Observable<UnchangedReviewsItem> {
      return this.sharedService.get(`/contracts/recommendations/unchanged-status-summary?${this.generateDashboardFilterQueryParams(dashboardFilter)}`).pipe(
        map(numberOfReviewsWithUnchangedStatus => ({
          asAtEndOf: calculateEndOfDay(dashboardFilter.asAtEndOf),
          lateness: dashboardFilter.lateness,
          hrRep: dashboardFilter.hrRep,
          status: dashboardFilter.status,
          numberOfItemsWithUnchangedStatus: numberOfReviewsWithUnchangedStatus
        })),
        catchError(() => (of<UnchangedReviewsItem>({
          asAtEndOf: calculateEndOfDay(dashboardFilter.asAtEndOf),
          lateness: dashboardFilter.lateness,
          hrRep: dashboardFilter.hrRep,
          status: dashboardFilter.status
        })))
      )
    }
  
    retrieveReviewsWithUnchangedLatenessAndStatus(
      dashboardFilter: DashboardFilterParams
    ): Observable<DashboardContractRecommendation[]> {
      return this.sharedService.get(`/contracts/recommendations/status-unchanged?${this.generateDashboardFilterQueryParams(dashboardFilter)}`);
    }

    retrieveReviewsForLatenessAndStatus(dashboardFilter: DashboardFilterParams): Observable<DashboardContractRecommendation[]> {
      return this.sharedService.get(`/contracts/dashboard/recommendations?${this.generateDashboardFilterQueryParams(dashboardFilter)}`);
    }
  
    generateDashboardFilterQueryParams(
      dashboardFilter: DashboardFilterParams
    ) {
      return new URLSearchParams({
        asAtEndOf: calculateEndOfDay(dashboardFilter.asAtEndOf).toISOString(),
        ...(includeInObjectWhenSet('status', dashboardFilter.status)),
        ...(includeInObjectWhenSet('lateness', dashboardFilter.lateness)),
        ...(includeInObjectWhenSet('hrRep', dashboardFilter.hrRep)),
        ...(includeInObjectWhenSet('periodLength', dashboardFilter.periodLength)),
        ...(includeInObjectWhenSet('numberOfPeriods', dashboardFilter.numberOfPeriods)),
        ...(includeArrayJoinedByCommaInObject('excludedLatenesses', dashboardFilter.excludedLatenesses)),
        ...(includeArrayJoinedByCommaInObject('excludedStatuses', dashboardFilter.excludedStatuses)),
        ...(includeArrayJoinedByCommaInObject('excludedHrReps', dashboardFilter.excludedHrReps)),
        ...(includeArrayJoinedByCommaInObject('companyEntities', dashboardFilter.companyEntities?.map(entity => entity.companyEntityId)))
      });
    }

    getStatusSortOrder(): readonly ContractAndRecommendationStatus[] {
      return contractAndRecommendationStatuses;
    }
  
    getSupportedGroupingCategories(): ReviewsDashboardGroupingCategories[] {
      return this.environmentService.getConfiguratonValues().REVIEWS_DASHBOARD_SUPPORTED_GROUPING_CATEGORIES?.contracts ?? ['lateness', 'status', 'hrRep'];
    }
}
