import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SharedService } from "../../services/shared.service";
import { AssignmentTrackingFilterParameters } from "../../shared/interfaces";

@Injectable({
    providedIn: 'root',
})
export class AssignmentTrackingService {
    constructor(private sharedService: SharedService) {}

    getAllAssignmentTracking(filterParameters: AssignmentTrackingFilterParameters): Observable<any> {
        const queryFilterParameters = this.createParameterQuery(filterParameters);
        return this.sharedService.get(`assignment-tracking/?${queryFilterParameters}`);
    }

    getFeedbackAssignmentsForStaffMember(upn: string): Observable<any> {
        return this.sharedService.get(`assignment-tracking/feedback-assignments/${upn}`);
    }

    createParameterQuery(filterParameters: AssignmentTrackingFilterParameters) {
        let filterQuery = '';
        for (const property in filterParameters) {
          if (filterParameters[property] && filterParameters[property] != '') {
            filterQuery += `&${property}=${filterParameters[property]}`;
          }
        }
        return filterQuery;
      }

    sendBulkNudgeReminder(upn: string): Observable<any> {
      return this.sharedService.post(`assignment-tracking/bulknudge/`, {upn});
    }
    
}