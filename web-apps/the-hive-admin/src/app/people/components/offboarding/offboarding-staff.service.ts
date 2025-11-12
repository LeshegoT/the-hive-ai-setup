import { Injectable } from "@angular/core";
import { BulkStaffReviewerReassignmentRequest, Staff, StaffStatus, StaffWithDirectReportsCount } from "@the-hive/lib-staff-shared";
import { Observable, of } from "rxjs";
import { SharedService } from "../../../services/shared.service";
import { map, startWith, catchError } from "rxjs/operators";
import { AuthGuard } from "../../../services/auth-guard.service";

export type StaffMemberTerminationResult =
  | { status: 'pending' }
  | { status: 'success' }
  | { status: 'error'; errorMessage: string };

@Injectable({
    providedIn: 'root',
})
export class OffboardingStaffService {
    constructor(private sharedService: SharedService, private readonly authGuard: AuthGuard) {}

    terminateStaffMember(upn: string, terminationDate: Date): Observable<void> {
      const terminateStaffBody: { status: StaffStatus, effectiveFrom: string } = { status: 'terminated', effectiveFrom: terminationDate.toISOString() };
      return this.sharedService.patch(`staff/${upn}/status`, terminateStaffBody);
    }

    markStaffMemberAsPendingDelete(upn: string): Observable<void> {
      const markStaffMemberAsPendingDeleteBody: { status: StaffStatus, effectiveFrom: string } = { status: 'pending-delete', effectiveFrom: new Date().toISOString() };
      return this.sharedService.patch(`staff/${upn}/status`, markStaffMemberAsPendingDeleteBody);
    }

    getActiveStaff(): Observable<Staff[]> {
      const activeStaffStatus: StaffStatus = 'active';
      const queryParameters = new URLSearchParams({ staffStatuses: activeStaffStatus });
      return this.sharedService.get(`/staff?${queryParameters.toString()}`);
    }

    getOffboardingStaff(): Observable<StaffWithDirectReportsCount[]> {
      const offboardingStaffStatus: StaffStatus = 'pending-delete';
      const queryParameters = new URLSearchParams({ staffStatuses: offboardingStaffStatus });
      return this.sharedService.get(`/staff?${queryParameters.toString()}`);
    }

    getActiveDirectReportsForStaffMember(upn: string): Observable<Staff[]> {
      return this.sharedService.get(`/staff/${upn}/direct-reports`);
    }

    loggedInUserHasManageStaffPermissions(): Observable<boolean> {
      return this.authGuard.checkUser('/api/staff/').pipe(
        map(result => result === true)
      );
    }
    
    terminateStaffMemberWithResult(upn: string, terminationDate: Date): Observable<StaffMemberTerminationResult> {
      return this.terminateStaffMember(upn, terminationDate).pipe(
          map(() => ({ status: 'success' as const })),
          startWith({ status: 'pending' as const }),
          catchError((error) => of({ status: 'error' as const, 
            errorMessage: error instanceof Error ? error.message : String(error) 
            }))
      );
  }

  bulkReassignStaffToNewReviewer(bulkReassignmentRequest: BulkStaffReviewerReassignmentRequest): Observable<void> {
    return this.sharedService.post(`staff/bulk-reviewer-reassignments`, bulkReassignmentRequest);
  }

}
