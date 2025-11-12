import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { SharedService } from "../../services/shared.service";
import { ContractStaff, PageInformation } from '../interfaces';

export interface FilterParameters {
  searchText?: string,
  selectedUnits?: string[],
  selectedEntities?: number[],
  onlyContractorsWithNoContracts: boolean
}

@Injectable({
    providedIn: 'root'
  })

export class ContractOverviewsService {
  
    constructor(private sharedService: SharedService) {}

    public getContractStaffMembers(filterParameters: FilterParameters, pageInfo: PageInformation): Observable<ContractStaff[]> {
        const filterPrameters = this.createParameterQuery(filterParameters)
        return this.sharedService.get(`/contract-staff/?page=${pageInfo.pageNumber}&pageSize=${pageInfo.pageSize}${filterPrameters}`);
    } 

    private createParameterQuery(filterParameters: FilterParameters) {
        let filterQuery = '';
        for (const property in filterParameters) {
          if (filterParameters[property]) {
            filterQuery += `&${property}=${encodeURIComponent(filterParameters[property])}`;
          }
        }
        return filterQuery;
      }
}