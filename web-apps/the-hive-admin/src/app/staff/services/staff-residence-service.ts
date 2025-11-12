import { Injectable, Injector } from "@angular/core";
import { BaseService } from "../../services/base.service";
import { SharedService } from "../../services/shared.service";
import { Observable } from "rxjs";
import { ResidenceSuggestions } from "../../components/staff-residence/staff-residence.component";

@Injectable({
  providedIn: "root",
})
export class StaffResidenceService extends BaseService {

    constructor(private readonly sharedService: SharedService, inject: Injector) {
    super(inject);
  }

  getResidenceSuggestions(query: string): Observable<ResidenceSuggestions[]> {
    return this.sharedService.get(`azuremaps/suggest?q=${encodeURIComponent(query)}`);
  }

}
