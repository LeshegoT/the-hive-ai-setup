import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { SharedService } from "../../services/shared.service";
import { ContractRecommendationStatusProgression, PageInformation } from '../interfaces';
import { ContractRecommendation } from '@the-hive/lib-reviews-shared';

export interface ContractsAndContractRecommendationsFilterParameters {
  searchText?: string;
  hrRep?: string;
  endDate?: Date;
  status?: string;
  jobTitlesText?: string[];
  companyEntitiesFilter?: number[];
}

export interface PagedResult<T> {
  pageInfo: PageInformation;
  data: T[];
}

export interface ContractRecommendationCancellationReason {
  contractRecommendationCancelReasonId: number;
  reason: string;
}

export const contractAndRecommendationStatuses = [
  'Upcoming Contracts',
  'New',
  'In Review',
  'Review Completed',
  'To Terminate',
  'To Renew',
  'To Make Permanent',
  'Continue As Is',
  'Cancelled',
  'Archived'
] as const;

export type ContractAndRecommendationStatus = typeof contractAndRecommendationStatuses[number];

export type ContractRecommendationCounts = {
    [key in ContractAndRecommendationStatus]?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContractsService {

  constructor(private sharedService: SharedService) {}

  getAllContractRecommendations(filterParameters: ContractsAndContractRecommendationsFilterParameters, pageInfo: PageInformation): Observable<PagedResult<ContractRecommendation>> {
    const queryFilterParameters = this.createParameterQuery(filterParameters);
    return this.sharedService.get(`contracts/recommendations/?page=${pageInfo.pageNumber}&pageSize=${pageInfo.pageSize}&${queryFilterParameters}`);
  }

  getHrRepsWithContractRecommendations() {
    return this.sharedService.get('contracts/recommendations/hr-reps');
  }

  private createParameterQuery(filterParameters: ContractsAndContractRecommendationsFilterParameters) {
    return Object.entries(filterParameters)
      .filter(([_property, value]) => value)
      .map(([property, value]) => 
        {
          if(filterParameters.endDate === value) {
            return `${property}=${JSON.stringify(value)}`
          } else {
            return `${property}=${encodeURIComponent(value)}`
          }
        })
      .join('&');
  }

  makeContractorPermanent(staffId:number, requestBody: {nextReviewDate: Date, nextFeedbackTypeId: number, contractRecommendationId: number}): Observable<any> {
    return this.sharedService.patch(`staff/${staffId}`, requestBody);
  }

  createContractRecommendation(contractId:number, hrRep: string): Observable<any> {
    return this.sharedService.post(`contracts/recommendations`, {contractId, hrRep});
  }

  getContracts(filterParameters: ContractsAndContractRecommendationsFilterParameters, pageInfo: PageInformation): Observable<PagedResult<ContractRecommendation>> {
    const queryFilterParameters = this.createParameterQuery(filterParameters);
    return this.sharedService.get(`contracts/?page=${pageInfo.pageNumber}&pageSize=${pageInfo.pageSize}&${queryFilterParameters}`);
  }

  getStaffContracts(staffUserPrincipleName: string): Observable<ContractRecommendation[]> {
    return this.sharedService.get(`/contracts/staff/${staffUserPrincipleName}`);
  }

  updateContractRecommendation(contractRecommendationId: number, data: {status: string, nextReviewDate?: Date, nextReviewType?: string, startDate?: Date, endDate?: Date, recommendationCancelReason?: string }): Observable<{}> {
    return this.sharedService.patch(`contracts/recommendations/${contractRecommendationId}`, data);
  }

  getContractRecommendationStatusProgressions(): Observable<ContractRecommendationStatusProgression[]> {
    return this.sharedService.get(`contracts/recommendations/status-progressions/`);
  }

  bulkCreateContractRecommendations(contractIds: number[], indiaContractIds: number[], hrReps: string[], indiaHrReps: string[]): Observable<ContractRecommendation[]> {
    return this.sharedService.post(`contracts/recommendations/bulk`, {contractIds, indiaContractIds, hrReps, indiaHrReps});
  }

  updateContractDates(contractId: number, startsAt: Date, endsAt: Date, nextReviewDate: Date): Observable<{}> {
    return this.sharedService.patch(`contracts/${contractId}`, {startsAt, endsAt, nextReviewDate});
  }

  createContract(staffId: number, startsAt: Date, endsAt: Date, reviewDate: Date): Observable<void> {
    return this.sharedService.post(`contracts/`, { staffId, startsAt, endsAt, nextReviewDate: reviewDate });
  }

  getStaffJobTitles():Observable<{jobTitle: string}[]> {
    return this.sharedService.get('job-titles');
  }

  stealContractRecommendation(contractRecommendationId: number, hrRep: string, comment: string, temporaryHrRepEndDate?: Date): Observable<void> {
    return this.sharedService.patch(`contracts/recommendations/${contractRecommendationId}/hrRep`, { contractRecommendationId, hrRep, comment, temporaryHrRepEndDate });
  }

  getContractRecommendationNumbers(filterParameters : ContractsAndContractRecommendationsFilterParameters): Observable<ContractRecommendationCounts> {
    const queryFilterParameters = this.createParameterQuery(filterParameters);
    return this.sharedService.get(`contracts-recommendations-numbers/?${queryFilterParameters}`);
  }

  putContractOnHold(contractId: number, holdReason?: string): Observable<void> {
    return this.sharedService.post(`contracts/${contractId}/hold`, { holdReason });
  }

  removeContractHold(contractId: number): Observable<void> {
    return this.sharedService.delete(`contracts/${contractId}/hold`);
  }

  getContractRecommendationCancelReasons(): Observable<ContractRecommendationCancellationReason[]> {
    return this.sharedService.get( `contracts/recommendations/cancellation-reasons`);
  }
}
