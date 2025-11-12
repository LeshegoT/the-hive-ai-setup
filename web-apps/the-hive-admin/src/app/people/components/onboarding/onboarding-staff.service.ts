import { Injectable } from "@angular/core";
import { map, Observable, shareReplay } from "rxjs";
import { SharedService } from "../../../services/shared.service";
import { NewStaffMemberRequest, OnboardingStaffWithContractDates, Staff, StaffFilter, StaffStatus, StaffUpdateFields } from "@the-hive/lib-staff-shared";
import { CompanyEntity, Manager, Office, Unit, includeArrayJoinedByCommaInObject, includeInObjectWhenSet } from "@the-hive/lib-shared";

@Injectable({
    providedIn: 'root',
})
export class OnboardingStaffService {
    private readonly companyEntities$: Observable<CompanyEntity[]>;
    private readonly offices$: Observable<Office[]>;
    private readonly units$: Observable<Unit[]>;
  
    constructor(private sharedService: SharedService) {
      this.companyEntities$ = this.sharedService.get('company-entities').pipe(shareReplay(1));
      this.offices$ = this.sharedService.get('offices').pipe(shareReplay(1));
      this.units$ = this.sharedService.get('units').pipe(
        map(response => response.units),
        shareReplay(1)
      );
    }

    getOnboardingStaffWithContractDates(): Observable<OnboardingStaffWithContractDates[]> {
        return this.sharedService.get(`staff/onboarding-status`);
    }

    private constructStaffFilterUrlSearchParams(staffFilter: StaffFilter): URLSearchParams {      
      return new URLSearchParams({
        ...includeInObjectWhenSet("upn", staffFilter.upn),
        ...includeArrayJoinedByCommaInObject("staffIds", staffFilter.staffIds),
        ...includeInObjectWhenSet("bbdUserName", staffFilter.bbdUserName),
        ...includeInObjectWhenSet("displayName", staffFilter.displayName),
        ...includeInObjectWhenSet("jobTitle", staffFilter.jobTitle),
        ...includeInObjectWhenSet("office", staffFilter.office),
        ...includeInObjectWhenSet("employmentDate", staffFilter.employmentDate?.toISOString()),
        ...includeArrayJoinedByCommaInObject("staffTypes", staffFilter.staffTypes),
        ...includeArrayJoinedByCommaInObject("staffStatuses", staffFilter.staffStatuses),
        ...includeInObjectWhenSet("department", staffFilter.department),
        ...includeInObjectWhenSet("manager", staffFilter.manager),
        ...includeInObjectWhenSet("entityAbbreviation", staffFilter.entityAbbreviation)
      });
    }

    getStaffByStaffFilter(staffFilter: StaffFilter): Observable<Staff[]> {
      return this.sharedService.get(`staff?${this.constructStaffFilterUrlSearchParams(staffFilter).toString()}`);
    }

    getCompanyEntities(): Observable<CompanyEntity[]> {
        return this.companyEntities$;
    }

    getOffices(): Observable<Office[]> {
        return this.offices$;
    }

    getUnits(): Observable<Unit[]> {
        return this.units$;
    }

    getManagers(): Observable<Manager[]> {
        return this.sharedService.get('managers');
    }

    saveStaffDetails(upn: string, staffDetails: StaffUpdateFields): Observable<void>{
        return this.sharedService.patch(`staff/${upn}/onboarding`, staffDetails);
    }

    addNewStaffMember(staffDetails: NewStaffMemberRequest): Observable<void>{
        return this.sharedService.post('staff/onboarding', staffDetails);
    }

    updateStaffStatus(upn: string, status: StaffStatus): Observable<void>{
        return this.sharedService.patch(`staff/${upn}/status`, { status, effectiveFrom: new Date().toISOString() });
    }
}