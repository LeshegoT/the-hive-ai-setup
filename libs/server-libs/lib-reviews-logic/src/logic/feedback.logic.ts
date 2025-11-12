import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { createReviewCommunicationReviewLink, deleteReviewFeedbackAssignments, deleteReviewFeedbackMessages, hasFeedbackProvidersRequestEmailBeenSentForReviewToday, retrieveReviewDeletedRetractReason } from "../queries/feedback.queries";

export class FeedbackLogic {
  db: () => Promise<SqlRequest>;

  constructor(db: () => Promise<SqlRequest>) {
    this.db = db;
  }

  getReviewDeletedRetractReason() {
    return retrieveReviewDeletedRetractReason(this.db);
  }

  removeReviewFeedbackMessages(tx: SqlTransaction, id: number, upn: string) {
    return deleteReviewFeedbackMessages(tx, this.db, id, upn);
  }

  removeReviewFeedbackAssignments(tx: SqlTransaction, id: number, upn: string) {
    return deleteReviewFeedbackAssignments(tx, id, upn);
  }

  createReviewCommunicationReviewLink(tx: SqlTransaction, reviewId: number, reviewCommunicationId: number): Promise<boolean> {
    return createReviewCommunicationReviewLink(tx, reviewId, reviewCommunicationId);
  }

  hasFeedbackProvidersRequestEmailBeenSentForReviewToday(reviewId: number): Promise<boolean> {
    return hasFeedbackProvidersRequestEmailBeenSentForReviewToday(this.db, reviewId);
  }
}
