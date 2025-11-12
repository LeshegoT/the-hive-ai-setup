import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SharedService } from "../../services/shared.service";
import { StaffOverviewFilterParameters } from "../../shared/interfaces";

export interface StaffOverviewReview {
  staffId: number,
  displayName: string,
  userPrincipleName: string,
  unit?: string,
  reviewer: string,
  reviewDate: Date,
  templateName: string,
  reviewStatus: string,
  hrRep?: string,
  reviewId: number,
}

@Injectable({
    providedIn: 'root',
})
export class StaffOverviewService {
    constructor(private sharedService: SharedService) {}

    getAllStaffOverview(filterParameters: StaffOverviewFilterParameters): Observable<any> {
        const queryFilterParameters = this.createParameterQuery(filterParameters);
        return this.sharedService.get(`staff-overview/?${queryFilterParameters}`);
    }

    getReviewsForStaffMember(staffId: number): Observable<StaffOverviewReview[]> {
        return this.sharedService.get(`staff-overview/reviews/${staffId}`);
    }

    createParameterQuery(filterParameters: StaffOverviewFilterParameters) {
        let filterQuery = '';
        for (const property in filterParameters) {
          if (filterParameters[property] && filterParameters[property] != '') {
            filterQuery += `&${property}=${encodeURIComponent(filterParameters[property])}`;
          }
        }
        return filterQuery;
      }

      addStaffReviewForStaffWithNoUpcomingReviews(
        staffId: number,
        requestBody: { nextReviewDate: Date; nextFeedbackTemplateId: number }
      ): Observable<any> {
        return this.sharedService.post(`/staff-reviews/${staffId}/no-upcoming-reviews`, requestBody);
      }
    
    getStaffOnRecord(upn : string): Observable<any> {
      return this.sharedService.get(`staff-info/${encodeURIComponent(upn)}`);
    }

    changeStaffToContractorEmployee(staffId: number, startsAt: Date, endsAt: Date, staffReviewId: number, nextReviewDate: Date): Observable<{}> {
      return this.sharedService.post(`contracts/`, { staffId, startsAt, endsAt, staffReviewId, nextReviewDate });
    }
}