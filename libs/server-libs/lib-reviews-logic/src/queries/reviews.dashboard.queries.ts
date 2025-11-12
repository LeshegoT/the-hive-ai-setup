import { SqlRequest } from "@the-hive/lib-db";
import { DashboardFilterParams, DashboardReview, DashboardStatusSummary } from "@the-hive/lib-reviews-shared";

export const retrieveReviewsForLatenessAndStatus = async (db: () => Promise<SqlRequest>, filters: DashboardFilterParams): Promise<DashboardReview[]> => {
  const query = `
    WITH ExcludedLatenesses AS (
      SELECT value AS Lateness
      FROM STRING_SPLIT(@ExcludedLatenesses, ',')
    ),
    ExcludedStatuses AS (
      SELECT value AS ReviewStatus
      FROM STRING_SPLIT(@ExcludedStatuses, ',')
    ),
    ExcludedHrReps AS (
      SELECT value AS HrRep
      FROM STRING_SPLIT(@ExcludedHrReps, ',')
    )
    SELECT
      sr.StaffId AS staffId,
      rwsaat.HrRep AS hrRep,
      rwsaat.UpdatedDate AS updatedDate,
      sr.NextReviewDate AS nextReviewDate,
      sr.ReviewId AS reviewId,
      ds.DisplayName AS displayName,
      ds.Department AS department,
      ds.Manager AS manager,
      r.DueDate AS dueDate,
      (dbo.CategoriseLateness(r.DueDate, @AsAt)) AS lateness,
      rs.Description AS reviewStatus,
      ds.StaffStatus AS staffStatus
    FROM
      Review r
      INNER JOIN ReviewWithStatusAsAt(@AsAt) rwsaat ON rwsaat.ReviewId = r.ReviewId
      INNER JOIN ReviewStatus rs ON rwsaat.ReviewStatusId = rs.ReviewStatusId
      INNER JOIN StaffReview sr ON sr.ReviewId = r.ReviewId
      INNER JOIN DecoratedStaff ds ON sr.StaffId = ds.StaffId
      INNER JOIN FeedbackAssignmentTemplate fat on r.TemplateId=fat.FeedbackAssignmentTemplateId
    WHERE ds.StaffStatus <> 'terminated'
      AND (@Lateness IS NULL OR dbo.CategoriseLateness(r.DueDate, @AsAt) = @Lateness)
      AND (@Status IS NULL OR rs.Description = @Status)
      AND (@HrRep IS NULL OR rwsaat.HrRep = @HrRep)
      AND r.DeletedDate IS NULL
      AND (@CompanyEntityIds IS NULL OR ds.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@CompanyEntityIds, ',')))
      AND (@ExcludedLatenesses IS NULL OR dbo.CategoriseLateness(r.DueDate, @AsAt) NOT IN (SELECT Lateness FROM ExcludedLatenesses))
      AND (@ExcludedStatuses IS NULL OR rs.Description NOT IN (SELECT ReviewStatus FROM ExcludedStatuses))
      AND (@ExcludedHrReps IS NULL OR rwsaat.HrRep NOT IN (SELECT HrRep FROM ExcludedHrReps))
  `;

  const connection = await db();
  const results = await connection
    .input("AsAt", filters.asAtEndOf)
    .input("Lateness", filters.lateness)
    .input("Status", filters.status)
    .input("CompanyEntityIds", filters.companyEntities?.map(c => c.companyEntityId).join(','))
    .input("HrRep", filters.hrRep)
    .input("ExcludedLatenesses", filters.excludedLatenesses?.join(','))
    .input("ExcludedStatuses", filters.excludedStatuses?.join(','))
    .input("ExcludedHrReps", filters.excludedHrReps?.join(','))
    .timed_query(
      query,
      'retrieveReviewsForLatenessAndStatus'
    );
  return results.recordset as DashboardReview[];
}

export const retrieveReviewsWithUnchangedLatenessAndStatus = async (db: () => Promise<SqlRequest>, filters: DashboardFilterParams): Promise<DashboardReview[]> => {
  const query = `
    WITH ExcludedLatenesses AS (
      SELECT value AS Lateness
      FROM STRING_SPLIT(@ExcludedLatenesses, ',')
    ),
    ExcludedStatuses AS (
      SELECT value AS ReviewStatus
      FROM STRING_SPLIT(@ExcludedStatuses, ',')
    ),
    ExcludedHrReps AS (
      SELECT value AS HrRep
      FROM STRING_SPLIT(@ExcludedHrReps, ',')
    )
    SELECT
      rwuls.ReviewId AS reviewId,
      sr.StaffId AS staffId,
      rwsaat.HrRep AS hrRep,
      rwsaat.UpdatedDate AS updatedDate,
      sr.NextReviewDate AS nextReviewDate,
      ds.DisplayName AS displayName,
      ds.Department AS department,
      ds.Manager AS manager,
      r.DueDate AS dueDate,
      ds.StaffStatus AS staffStatus,
      rwuls.ReviewStatus AS reviewStatus,
      (dbo.CategoriseLateness(r.DueDate, @AsAtEndOf)) AS lateness
    FROM dbo.GetReviewsWithUnchangedStatus(@AsAtEndOf, 2, @PeriodLength) rwuls --we are only interested in comparing this period against the previous period, thus there is no need to get more than 2 periods
      INNER JOIN Review r on rwuls.ReviewId = r.ReviewId
      INNER JOIN StaffReview sr ON sr.ReviewId = rwuls.ReviewId
      INNER JOIN ReviewWithStatusAsAt(@AsAtEndOf) rwsaat ON rwsaat.ReviewId = rwuls.ReviewId
      INNER JOIN DecoratedStaff ds ON ds.StaffId = sr.StaffId
    WHERE ds.StaffStatus <> 'terminated'
      AND (@Lateness IS NULL OR dbo.CategoriseLateness(r.DueDate, @AsAtEndOf) = @Lateness)
      AND (@ReviewStatus IS NULL OR rwuls.ReviewStatus = @ReviewStatus)
      AND (@HrRep IS NULL OR rwsaat.HrRep = @HrRep)
      AND r.DeletedDate IS NULL
      AND (@CompanyEntityIds IS NULL OR ds.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@CompanyEntityIds, ',')))
      AND (@ExcludedLatenesses IS NULL OR dbo.CategoriseLateness(r.DueDate, @AsAtEndOf) NOT IN (SELECT Lateness FROM ExcludedLatenesses))
      AND (@ExcludedStatuses IS NULL OR rwuls.ReviewStatus NOT IN (SELECT ReviewStatus FROM ExcludedStatuses))
      AND (@ExcludedHrReps IS NULL OR rwsaat.HrRep NOT IN (SELECT HrRep FROM ExcludedHrReps))
  `;

  const connection = await db();
  const results = await connection
    .input("AsAtEndOf", filters.asAtEndOf)
    .input("PeriodLength", filters.periodLength)
    .input("ReviewStatus", filters.status)
    .input("CompanyEntityIds", filters.companyEntities?.map(c => c.companyEntityId).join(','))
    .input("Lateness", filters.lateness)
    .input("HrRep", filters.hrRep)
    .input("ExcludedHrReps", filters.excludedHrReps?.join(','))
    .input("ExcludedStatuses", filters.excludedStatuses?.join(','))
    .input("ExcludedLatenesses", filters.excludedLatenesses?.join(','))
    .timed_query(
      query,
      'retrieveReviewsWithUnchangedLatenessAndStatus'
    );
  return results.recordset as DashboardReview[];
}


export const retrieveStatusSummaryForPeriod = async (db: () => Promise<SqlRequest>, filters: DashboardFilterParams): Promise<DashboardStatusSummary[]> => {
  const query = `
    WITH ExcludedLatenesses AS (
      SELECT value AS Lateness
      FROM STRING_SPLIT(@ExcludedLatenesses, ',')
    ),
    ExcludedStatuses AS (
      SELECT value AS ReviewStatus
      FROM STRING_SPLIT(@ExcludedStatuses, ',')
    ),
    ExcludedHrReps AS (
      SELECT value AS HrRep
      FROM STRING_SPLIT(@ExcludedHrReps, ',')
    ),
    unfilteredCounts AS (
      SELECT Period, PeriodStartDate, PeriodEndDate, ReviewStatus, Lateness, COUNT (grssp.ReviewId) AS NumberOfReviews, grssp.hrRep
      FROM GetReviewStatusSummaryForPeriod(@AsAtEndOf, @NumberOfPeriods, @PeriodLength) grssp
        INNER JOIN StaffReview sr ON sr.ReviewId = grssp.ReviewId
        INNER JOIN Review r ON sr.ReviewId = r.ReviewId
        INNER JOIN DecoratedStaff ds ON ds.StaffId = sr.StaffId
      WHERE ds.StaffStatus <> 'terminated'
        AND (@CompanyEntityIds IS NULL OR ds.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@CompanyEntityIds, ',')))
      GROUP BY ReviewStatus, grssp.hrRep, Lateness, Period, PeriodLength, NumberOfPeriods, PeriodStartDate, PeriodEndDate
    )
    SELECT Period AS period, PeriodStartDate AS periodStartDate, PeriodEndDate AS periodEndDate, ReviewStatus AS reviewStatus, Lateness AS lateness, NumberOfReviews AS numberOfReviews, HrRep AS hrRep
    FROM unfilteredCounts
    WHERE (@ExcludedLatenesses IS NULL OR Lateness NOT IN (SELECT Lateness FROM ExcludedLatenesses))
      AND (@ExcludedStatuses IS NULL OR ReviewStatus NOT IN (SELECT ReviewStatus FROM ExcludedStatuses))
      AND (@ExcludedHrReps IS NULL OR HrRep NOT IN (SELECT HrRep FROM ExcludedHrReps))
  `;

  const connection = await db();
  const results = await connection
    .input("AsAtEndOf", filters.asAtEndOf)
    .input("PeriodLength", filters.periodLength)
    .input("NumberOfPeriods", filters.numberOfPeriods)
    .input("CompanyEntityIds", filters.companyEntities?.map(c => c.companyEntityId).join(','))
    .input("ExcludedHrReps", filters.excludedHrReps?.join(','))
    .input("ExcludedStatuses", filters.excludedStatuses?.join(','))
    .input("ExcludedLatenesses", filters.excludedLatenesses?.join(','))
    .timed_query(
      query,
      'retrieveStatusSummaryForPeriod'
    );
  return results.recordset as DashboardStatusSummary[];
}
