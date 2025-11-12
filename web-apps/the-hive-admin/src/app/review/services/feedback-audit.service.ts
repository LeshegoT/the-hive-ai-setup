import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { ReviewAudit } from '@the-hive/lib-reviews-shared';
import { RouteAccessService } from '../../services/route-access.service';
import { Pagination, PagedResponse, includeInObjectWhenSet } from '@the-hive/lib-shared';

@Injectable({
  providedIn: 'root',
})
export class FeedbackAuditService {

  constructor(private sharedService: SharedService, private routeAccessService: RouteAccessService) {}

  getReviewAudit(reviewId: number, auditFilters?: { auditTypes?: string[], users?: string[] }, pagination?: Pagination): Observable<PagedResponse<ReviewAudit>> {
    const params = new URLSearchParams({
      ...includeInObjectWhenSet('auditTypes', auditFilters?.auditTypes?.join(',')),
      ...includeInObjectWhenSet('users', auditFilters?.users?.join(',')),
      ...includeInObjectWhenSet('startIndex', pagination?.startIndex?.toString()),
      ...includeInObjectWhenSet('pageLength', pagination?.pageLength?.toString()),
    });
    return this.sharedService.get(`reviews/${reviewId}/audit?${params.toString()}`);
  }

  canViewReviewAudit(reviewId: number): Observable<boolean> {
    return this.routeAccessService.loggedInUserHasAccessToRoute(`/api/reviews/${reviewId}/audit`);
  }

}
