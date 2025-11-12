import { cache, Lookup } from "@the-hive/lib-core";
import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import {
  DetailedReviewStatus,
  FeedbackAssignmentRetractionReason,
  FeedbackAssignmentTemplate,
  NextReview,
  ReviewAudit,
  ReviewStatusProgression
} from "@the-hive/lib-reviews-shared";
import { BadRequestDetail, Pagination } from "@the-hive/lib-shared";
import {
  createStaffDepartmentStaffReview,
  deleteReview,
  deleteStaffReview,
  findStaffReviewId,
  insertReviewComment,
  insertStaffReview,
  retrieveActiveFeedbackAssignmentIdsForStaff,
  retrieveActiveReviewIdByTemplateNameForStaffMember,
  retrieveActiveReviewIdForStaff,
  retrieveAllowedReviewStatusProgressions,
  retrieveCurrentStaffReviewIdForStaff,
  retrieveDetailedReviewStatuses,
  retrieveFeedbackAssignmentRetractionReasons,
  retrieveFeedbackAssignmentTemplateByName,
  retrieveReviewAudit,
  retrieveReviewIdBasedOnFeedbackAssignmentId,
  retrieveReviewStatusId
} from "../queries/review.queries";
import { ContractsLogic } from "./contracts.logic";
import { FeedbackLogic } from "./feedback.logic";

type HrRepAssignmentSplit = {
  hrRep: string,
  companies: string[],
  surnameRange: {
    from: string,
    to: string
  }
}

export class ReviewsLogic {
  db: () => Promise<SqlRequest>;

  constructor(db: () => Promise<SqlRequest>) {
    this.db = db;
  }

  async getReviewStatusesLookup() {
    return cache('ReviewStatusLookup', async () => {
      const detailedReviewStatuses = await retrieveDetailedReviewStatuses(this.db);
      return new Lookup('ReviewStatus', detailedReviewStatuses, 'reviewStatusId', 'actionName')
    });
  }


  async getAllAllowedReviewStatusProgressions() {
    return cache('AllowedReviewStatusProgressions', async () => await retrieveAllowedReviewStatusProgressions(this.db));
  }

  getStaffReviewId(reviewId: number) {
    return findStaffReviewId(this.db, reviewId);
  }

  async getStatusIdByActionName(actionName: string): Promise<DetailedReviewStatus> {
    return this.getReviewStatusesLookup().then(reviewStatusesLookup => reviewStatusesLookup.getByDescription(actionName));
  }

  getReviewStatusId(reviewId: number) {
    return retrieveReviewStatusId(this.db, reviewId);
  }

  async getAllowedReviewStatusProgressions(currentStatusId: number): Promise<ReviewStatusProgression[]> {
    return this.getAllAllowedReviewStatusProgressions().then(allowedProgressions => allowedProgressions.filter(progression => progression.currentStatusId === currentStatusId));
  }

  async checkProgression(currentStatusId: number, nextStatusId: number) {
    const allowedProgressions = await this.getAllowedReviewStatusProgressions(currentStatusId);
    return allowedProgressions.find(
      (progression) => progression.nextStatusId == nextStatusId
    );
  };

  removeReview(tx: SqlTransaction, id: number, upn: string) {
    return deleteReview(tx, id, upn);
  }

  addReviewComment(tx: SqlTransaction, id: number, createdByUpn: string, comment: string) {
    return insertReviewComment(tx, id, createdByUpn, comment);
  }

  async removeReviewWithAllAssociatedLinks(tx: SqlTransaction, reviewId: number, assignedBy: string, comment: string) {
    const feedbackLogic = new FeedbackLogic(this.db);

    await feedbackLogic.removeReviewFeedbackMessages(tx, reviewId, assignedBy);
    await feedbackLogic.removeReviewFeedbackAssignments(tx, reviewId, assignedBy);
    await this.removeReview(tx, reviewId, assignedBy);
    await this.addReviewComment(tx, reviewId, assignedBy, comment);
  }

  removeStaffReview(tx: SqlTransaction, id: number, deletedByUpn: string) {
    return deleteStaffReview(tx, id, deletedByUpn);
  }

  createStaffReview(tx: SqlTransaction, createdBy: string, staffId: number, nextReviewDate: Date, previousStaffReviewId: number, nextTypeId: number, holdReason: string = undefined, onHoldBy: string = undefined, onHoldDate: Date = undefined) {
    return insertStaffReview(tx, createdBy, staffId, nextReviewDate, previousStaffReviewId, nextTypeId, holdReason, onHoldBy, onHoldDate);
  }

  async cancelReviewAndCascadeUpdates(
    tx: SqlTransaction,
    reviewId: number,
    comment: string,
    assignedBy: string,
    nextReviewDetails?: NextReview,
  ): Promise<number | BadRequestDetail> {
    const contractsLogic = new ContractsLogic(this.db);
    if (isNaN(reviewId)) {
      return { message: 'Request failed: id must be a number.' };
    } else {
      const previousStaffReviewId = await this.getStaffReviewId(reviewId);
      const newStatusId = (await this.getStatusIdByActionName('Cancelled')).reviewStatusId;
      const currentStatusId = (await this.getReviewStatusId(reviewId)).reviewStatusId;
      const allowedToProgress = await this.checkProgression(
        currentStatusId,
        newStatusId
      );
      const contractRecommendationId = (await contractsLogic.getContractRecommendationIdsByReviewId(reviewId))[0]?.contractRecommendationId;

      if (allowedToProgress && contractRecommendationId) {
        const recommendationAllowedToProgress = await contractsLogic.canContractRecommendationProgress(reviewId, 'New');

        if (recommendationAllowedToProgress) {
          await this.removeReviewWithAllAssociatedLinks(tx, reviewId, assignedBy, comment)
          await this.removeStaffReview(tx, previousStaffReviewId, assignedBy);
          await contractsLogic.addContractRecommendationStatus(
            tx,
            contractRecommendationId,
            'New',
            assignedBy
          );

          return reviewId;
        } else {
          return {
            message: `Request failed: The contract recommendation status for review '${reviewId}' cannot be set to 'New'.`
          };
        }

      } else if (allowedToProgress && !contractRecommendationId) {
        await this.removeReviewWithAllAssociatedLinks(tx, reviewId, assignedBy, comment);

        if (nextReviewDetails) {
          const onHoldBy = comment ? assignedBy : undefined;
          const onHoldDate = comment ? new Date() : undefined;
          await this.createStaffReview(
            tx,
            assignedBy,
            nextReviewDetails.staffId,
            nextReviewDetails.nextReviewDate,
            previousStaffReviewId,
            nextReviewDetails.typeId,
            comment,
            onHoldBy,
            onHoldDate
          );
        } else {
          // the default behaviour for this function is to create a follow up staff review
          // if no `nextReviewDetails` are provided, we don't want to create a follow up staff review
          // this will essentially cancel both the current review as well as future reviews
          // unless a follow up staff review is created manually via the UI at a later stage.
        }

        return reviewId;
      } else {
        return { message: `Request failed: You are not allowed to cancel review '${reviewId}' from current status.`, };
      }
    }
  }

  getActiveReviewForStaff(staffId: number): Promise<number> {
    return retrieveActiveReviewIdForStaff(this.db, staffId);
  }

  getCurrentStaffReviewId(staffId: number): Promise<number> {
    return retrieveCurrentStaffReviewIdForStaff(this.db, staffId);
  }

  async addStaffDepartmentStaffReview(tx: SqlTransaction, staffReviewId: number, staffDepartmentId: number) {
    return createStaffDepartmentStaffReview(tx, staffReviewId, staffDepartmentId);
  }

  getFeedbackAssignmentTemplateByName(templateName: string): Promise<FeedbackAssignmentTemplate> {
    return retrieveFeedbackAssignmentTemplateByName(this.db, templateName);
  }

  getActiveReviewIdByTemplateNameForStaffMember(upn: string, templateName: string): Promise<number | BadRequestDetail> {
    return retrieveActiveReviewIdByTemplateNameForStaffMember(this.db, upn, templateName).catch(
      error => ({ message: error.message })
    );
  }

  getHrRepForRevieweeGivenAssignmentSplit(assignmentSplits: HrRepAssignmentSplit[], revieweeDisplayName: string, revieweeEntityAbbreviation: string): string | BadRequestDetail {
    const lastName = revieweeDisplayName.split(' ')[1].toUpperCase();
    const split = assignmentSplits.find(
      split => lastName[0] >= split.surnameRange.from && lastName[0] <= split.surnameRange.to && split.companies.includes(revieweeEntityAbbreviation)
    );

    if (split) {
      return split.hrRep;
    } else {
      return { message: `No HR Rep found for ${revieweeDisplayName} (${revieweeEntityAbbreviation})` };
    }
  }

  async getReviewAuditWithCount(reviewId: number, actionTypes?: string[], users?: string[], pagination?: Pagination): Promise<{ reviewAuditRecords: ReviewAudit[]; auditRecordsTotalCount: number }> {
    const defaultPagination: Pagination = { startIndex: 0, pageLength: 20 };
    const paginationToUse = pagination ?? defaultPagination;

    return retrieveReviewAudit(this.db, reviewId, actionTypes, paginationToUse, users);
  }

  getFeedbackAssignmentIdsForStaff(staffId: number): Promise<number[]> {
    return retrieveActiveFeedbackAssignmentIdsForStaff(this.db, staffId);
  }

  async getFeedbackAssignmentRetractionReasons(): Promise<FeedbackAssignmentRetractionReason[]> {
    return cache('FeedbackAssignmentRetractionReasons', async () => await retrieveFeedbackAssignmentRetractionReasons(this.db));
  }

  async getReviewIdBasedOnFeedbackAssignmentId(dbOrTx: SqlTransaction | (() => Promise<SqlRequest>), feedbackAssignmentId: number) {
    return retrieveReviewIdBasedOnFeedbackAssignmentId(dbOrTx, feedbackAssignmentId)
  }
}
