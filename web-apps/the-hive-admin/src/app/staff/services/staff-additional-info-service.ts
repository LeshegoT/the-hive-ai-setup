import { Injectable, Injector } from "@angular/core";
import { removeProperty } from "@the-hive/lib-shared";
import { map, Observable } from "rxjs";
import { BaseService } from "../../services/base.service";
import { SharedService } from "../../services/shared.service";


export type AdditionalInfo = {
  flag?: string;
}

@Injectable({
  providedIn: "root",
})
export class StaffAdditionalInfoService extends BaseService {

  constructor(private readonly sharedService: SharedService, inject: Injector) {
    super(inject);
  }

  fetchAdditionalInfo(upn: string): Observable<AdditionalInfo> {
    const encodedUpn = encodeURIComponent(upn);
    return this.sharedService.get(`/staff/${encodedUpn}/additional-info`);
  };

  toggleFlag(upn: string, info:AdditionalInfo, toSetFlag: boolean): Observable<AdditionalInfo> {
    const encodedUpn = encodeURIComponent(upn);
    const newInfo: AdditionalInfo = toSetFlag ? {...info, flag:"⛳️"} : removeProperty(info, "flag");
    return this.sharedService.patch(`/staff/${encodedUpn}/additional-info`, newInfo).pipe(map(
        () => newInfo
    ));
  }
}
