import { SqlRequest } from "@the-hive/lib-db";
import { ContractRecommendationStatusLatenessSummary, DashboardContractRecommendation, DashboardFilterParams } from "@the-hive/lib-reviews-shared";
import { retrieveContractsStatusSummary,retrieveContractsWithUnchangedStatus,retrieveContractsWithUnchangedStatusSummary, retrieveFilteredContractRecommendations } from "../queries/contracts.dashboard.queries";

export class ContractsDashboardLogic {
  db: () => Promise<SqlRequest>;

  constructor(db: () => Promise<SqlRequest>) {
    this.db = db;
  }

  async getContractsStatusSummary(filters: DashboardFilterParams): Promise<ContractRecommendationStatusLatenessSummary[]> {
    return retrieveContractsStatusSummary(this.db, filters);
  }

  async getContractsWithUnchangedStatusSummary(filters: DashboardFilterParams): Promise<number> {
    return retrieveContractsWithUnchangedStatusSummary(this.db, filters);
  }

  async getFilteredContractRecommendations(filters: DashboardFilterParams): Promise<DashboardContractRecommendation[]> {
    return retrieveFilteredContractRecommendations(this.db, filters);
  }

  async getContractsWithUnchangedStatus(filters: DashboardFilterParams): Promise<DashboardContractRecommendation[]> {
    return retrieveContractsWithUnchangedStatus(this.db, filters);
  }
}
