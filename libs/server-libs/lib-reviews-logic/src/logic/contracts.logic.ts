import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { addContract, insertContractRecommendationStatus, retrieveAllowedContractRecommendationStatusProgressions, retrieveContractRecommendationById, retrieveContractRecommendationIdsByReviewId, retrieveStaffContracts } from "../queries/contracts.queries";
import { BadRequestDetail } from "@the-hive/lib-shared";
import { ContractWithLatestRecommendation } from "@the-hive/lib-reviews-shared";

export class ContractsLogic {
  db: () => Promise<SqlRequest>;

  constructor(db: () => Promise<SqlRequest>) {
    this.db = db;
  }

  getContractRecommendationIdsByReviewId(reviewId: number) {
    return retrieveContractRecommendationIdsByReviewId(this.db, reviewId);
  }

  getContractRecommendationById(contractRecommendationId: number) {
    return retrieveContractRecommendationById(this.db, contractRecommendationId);
  }

  getAllowedContractRecommendationStatusProgressions() {
    return retrieveAllowedContractRecommendationStatusProgressions(this.db);
  }

  async allowedContractRecommendationStatusProgressions(fromStatus: string) {
    const allStatuses = await this.getAllowedContractRecommendationStatusProgressions();
    return allStatuses.filter((status) => status.fromStatus === fromStatus);
  };

  async canContractRecommendationProgress(reviewId: number, toStatus: string) {
    const contractRecommendationIds = await this.getContractRecommendationIdsByReviewId(
      reviewId
    );
    const contractRecommendation = await this.getContractRecommendationById(
      contractRecommendationIds[0].contractRecommendationId
    );
    const allowedProgressions = await this.allowedContractRecommendationStatusProgressions(
      contractRecommendation.status
    );
    return allowedProgressions.some(
      (statusProgression) => statusProgression.toStatus === toStatus
    );
  };

  addContractRecommendationStatus(tx: SqlTransaction, contractRecommendationId: number, status: string, updatedBy: string): Promise<void> {
    return insertContractRecommendationStatus(tx, contractRecommendationId, status, updatedBy)
  }

  async createContract(tx: SqlTransaction, staffId: number, createdByUpn: string, startDate: Date, endDate: Date, nextReviewDate: Date): Promise<boolean | BadRequestDetail> {
    if (startDate.getTime() > endDate.getTime()) {
      return { message: 'Contract start date should be before the end date' };
    } else if (nextReviewDate.getTime() < startDate.getTime() || nextReviewDate.getTime() > endDate.getTime()) {
      return { message: 'Next review date should be between the start and end date of the contract' };
    } else {
      return addContract(tx, staffId, createdByUpn, startDate, endDate, nextReviewDate);
    }
  }

  async retrieveStaffContracts(upn: string): Promise<ContractWithLatestRecommendation[]> {
    return retrieveStaffContracts(this.db, upn);
  }
}
