/** @format */
import { Injectable } from "@angular/core";
import { Observable, shareReplay } from "rxjs";
import { SharedService } from "./shared.service";
export type Office  = {
  officeId: number;
  officeName: string;
}

@Injectable({
  providedIn: "root",
})
export class OfficeService {
  offices$: Observable<Office[]>;
  constructor(private readonly sharedService: SharedService) {
    this.offices$ = this.sharedService.get("/offices").pipe(
      shareReplay(1)
    );
  }

  retrieveAllOffices(): Observable<Office[]> {
    return this.offices$;
  }
}
