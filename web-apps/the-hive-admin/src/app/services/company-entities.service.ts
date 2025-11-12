/** @format */
import { Injectable } from "@angular/core";
import { Observable, shareReplay } from "rxjs";
import { SharedService } from "./shared.service";
export type CompanyEntity = {
  companyEntityId: number;
  abbreviation: string;
  description: string;
};

@Injectable({
  providedIn: "root",
})
export class CompanyEntityService {
  companyEntities$: Observable<CompanyEntity[]>;
  constructor(private readonly sharedService: SharedService) {
    this.companyEntities$ = this.sharedService.get("/company-entities").pipe(
      shareReplay(1) 
    );
  }

  getAllCompanyEntities(): Observable<CompanyEntity[]> {
    return this.companyEntities$;
  }
}