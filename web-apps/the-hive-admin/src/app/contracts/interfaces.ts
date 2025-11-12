export interface ContractStaff {
    staffId: number;
    upn: string;
    displayName: string;
    employmentDate: Date;
    jobTitle: string;
    department: string;
    entity: string;
    office: string;
    staffType: string;
    hasActiveContractRecommendation: boolean;
    recommendation?: string;
    resultSetSize: number;
    contractRecommendationId?: number;
    reviewer: string;
  }


export interface ContractRecommendationStatusProgression {
  contractRecommendationStatusProgressionId: number;
  fromStatus: string;
  toStatus: string;
}


export interface PageInformation {
  pageNumber: number;
  pageSize: number;
  resultSetSize: number;
  totalPages: number;
}
