import { SqlRequest } from "@the-hive/lib-db";
import { DashboardFilterParams, DashboardReview, DashboardStatusSummary } from "@the-hive/lib-reviews-shared";
import { retrieveReviewsForLatenessAndStatus, retrieveReviewsWithUnchangedLatenessAndStatus, retrieveStatusSummaryForPeriod } from "../queries/reviews.dashboard.queries";

export class ReviewsDashboardLogic {
  db: () => Promise<SqlRequest>;

  constructor(db: () => Promise<SqlRequest>) {
    this.db = db;
  }

  async getReviewsForLatenessAndStatus(filters: DashboardFilterParams): Promise<DashboardReview[]> {
    return retrieveReviewsForLatenessAndStatus(this.db, filters);
  }

  async getReviewsWithUnchangedLatenessAndStatus(filters: DashboardFilterParams): Promise<DashboardReview[]> {
    return retrieveReviewsWithUnchangedLatenessAndStatus(this.db, filters);
  }

  async getStatusSummaryForPeriod(filters: DashboardFilterParams): Promise<DashboardStatusSummary[]> {
    return retrieveStatusSummaryForPeriod(this.db, filters);
  }
}
