/** @format */
import { Injectable, Injector } from "@angular/core";
import { OnSupplyRole, StaffOnSupply, UserAttribute } from "@the-hive/lib-skills-shared";
import { Observable, shareReplay } from "rxjs";
import { BaseService } from "../../services/base.service";
import { SharedService } from "../../services/shared.service";

@Injectable({
  providedIn: "root",
})
export class SupplyService extends BaseService {
  onSupplyRoles$: Observable<OnSupplyRole[]>;
  constructor(private readonly sharedService: SharedService, inject: Injector) {
    super(inject);
    this.onSupplyRoles$ = this.sharedService.get(`supply/on-supply-roles`).pipe(
      shareReplay(1)
    );
  }

  getStaffOnSupply(): Observable<StaffOnSupply[]> {
    return this.sharedService.get(`supply/staff-on-supply`);
  }

  retrieveStaffOnSupplyByUpn(upn: string): Observable<StaffOnSupply> {
    return this.sharedService.get(`supply/staff-on-supply/${encodeURIComponent(upn)}`);
  }

  addStaffToSupply(upn: string, onSupplyAsOf: Date): Observable<UserAttribute[]> {
    return this.sharedService.post(`supply/staff-on-supply`, { upn, onSupplyAsOf });
  }

  removeStaffFromSupply(upn: string): Observable<void> {
    return this.sharedService.delete(`supply/staff-on-supply/${encodeURIComponent(upn)}`);
  }

  updateOnSupplyAsOf(staffToUpdate: StaffOnSupply): Observable<void> {
    return this.sharedService.patch(
      `supply/staff-on-supply/${encodeURIComponent(staffToUpdate.upn)}`,
      staffToUpdate,
    );
  }

  getOnSupplyRoles(): Observable<OnSupplyRole[]>{
    return this.onSupplyRoles$;
  }

  updateStaffOnSupplyRole(upn: string, onSupplyRole: OnSupplyRole): Observable<void>{
    return this.sharedService.post(`supply/staff-on-supply-role/${upn}`, onSupplyRole)
  }
}
