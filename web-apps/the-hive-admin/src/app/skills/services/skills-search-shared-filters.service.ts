import { Injectable } from '@angular/core';
import { checkIfArraysEqual, CompanyEntity, Office } from '@the-hive/lib-shared';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SkillsSearchSharedFiltersService {
  private selectedCompanyEntities$ = new BehaviorSubject<CompanyEntity[]>([]);
  private selectedOffices$ = new BehaviorSubject<Office[]>([]);
  get selectedCompanyEntities(): Observable<CompanyEntity[]> {
    return this.selectedCompanyEntities$;
  }

  get selectedOffices(): Observable<Office[]> {
    return this.selectedOffices$;
  }

  setSelectedEntities(selectedCompanyEntities: CompanyEntity[]) {
    if (!checkIfArraysEqual<CompanyEntity>((companyEntity1, companyEntity2) => companyEntity1.companyEntityId === companyEntity2.companyEntityId, this.selectedCompanyEntities$.value, selectedCompanyEntities)) {
      this.selectedCompanyEntities$.next(selectedCompanyEntities);
    } else {
      // Selection unchanged; no update needed
    } 
  }

  setSelectedOffices(selectedOffices: Office[]) {
    if (!checkIfArraysEqual<Office>((office1, office2) => office1.officeId === office2.officeId, this.selectedOffices$.value, selectedOffices)) {
      this.selectedOffices$.next(selectedOffices);
    } else {
      // Selection unchanged; no update needed
    }
  }
}