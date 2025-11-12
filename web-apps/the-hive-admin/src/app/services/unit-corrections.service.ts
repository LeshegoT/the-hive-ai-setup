import { Injectable } from "@angular/core";
import { SharedService } from "./shared.service";
import { map, Observable, shareReplay } from "rxjs";
import { Unit } from "@the-hive/lib-shared";
import { StaffCompanyEntityUpdate } from "@the-hive/lib-staff-logic";

@Injectable({
  providedIn: 'root',
})
export class UnitCorrectionsService {
  private jobTitles$: Observable<string[]>;

  constructor(private sharedService: SharedService) { }

  updateStaffDepartment(upn: string, department: string, manager: string, startDate: Date): Observable<void> {
    return this.sharedService.post(`/staff/${upn}/department`, {
      department, 
      manager, 
      startDate
    });
  }

  updateStaffJobTitle(upn: string, jobTitle: string): Observable<void> {
    return this.sharedService.put(`/staff/${upn}/job-title`, {
      jobTitle
    });
  }

  updateStaffOffice(upn: string, officeId: number): Observable<void> {
    return this.sharedService.put(`/staff/${upn}/office`, {
      officeId
    });
  }

  updateStaffCompanyEntity(upn: string, staffCompanyEntityUpdate: StaffCompanyEntityUpdate): Observable<void> {
    return this.sharedService.post(`staff/${upn}/company-entity`, staffCompanyEntityUpdate);
  }

  getUnits(): Observable<Unit[]> {
      return this.sharedService.get('units').pipe(
          map(response => response.units)
      );
  }

  getJobTitles(): Observable<string[]> {
    if (this.jobTitles$) {
      return this.jobTitles$;
    } else {
      this.jobTitles$ = this.sharedService.get('job-titles').pipe(
        map(jobTitles => jobTitles.map(jobTitle => jobTitle.jobTitle)),
        shareReplay(1)
      );
      return this.jobTitles$;
    }
  }

}
