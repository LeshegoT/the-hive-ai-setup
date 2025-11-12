const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const retrieveWeeklyReviewAgeing = async () => {
  const query = `
  select n, viewDate, Upcoming, [On track], [Current], [30+ days], [60+ days], [90+ days], [120+ days]
  from HrReviewAgeingWeekly
  order by viewDate desc;
  `;

  const connection = await db();
  const results = await connection.timed_query(
    query,
    'retrieveWeeklyReviewAgeing'
  );
  return results.recordset; // This pivot view is purposefully not being fix-cased
};

const retrieveWeeklyReviewDashboard = async () => {
  const query = `
    SELECT n, viewDate, New, [Reviewers Requested], [Reviewers Assigned], [Feedback In Progress], [Feedback Completed],
      [Report Downloaded], [Summary sent to STRATCO], [STRATCO Feedback Received], [Review Meeting Scheduled],
      [Finalise Salary], [Confirm Next Review Date], Archived
    FROM HrReviewDashboardWeekly
    order by n asc;
  `;

  const connection = await db();
  const results = await connection.timed_query(
    query,
    'retrieveWeeklyReviewDashboard'
  );
  return results.recordset; // This pivot view is purposefully not being fix-cased
};

const retrieveStatusSummaries = async (asAt, periodLength, numberOfPeriods) => {
  const query = `
    WITH Inputs AS (
      SELECT CAST(@AsAt AS DATE) AS AsAt, @PeriodLength AS PeriodLength, @NumberOfPeriods AS NumberOfPeriods
    ),
    GenPeriods AS (
      SELECT 1 AS Period, PeriodLength, NumberOfPeriods, DATEADD(DAY, 1, AsAt) AS PeriodEndDate, PeriodStartDate =
        CASE PeriodLength
          WHEN 'week' THEN DATEADD(WEEK, -1, AsAt)
          WHEN 'fortnight' THEN DATEADD(WEEK, -2, AsAt)
          WHEN 'month' THEN DATEADD(MONTH, -1, AsAt)
          WHEN 'quarter' THEN DATEADD(QUARTER, -1, AsAt)
          WHEN 'half-year' THEN DATEADD(MONTH, -6, AsAt)
        END
      FROM Inputs
      UNION ALL
      SELECT Period+1, PeriodLength, NumberOfPeriods, PeriodStartDate AS PeriodEndDate, PeriodStartDate =
        CASE PeriodLength
          WHEN 'week' THEN DATEADD(WEEK, -1, PeriodStartDate)
          WHEN 'fortnight' THEN DATEADD(WEEK, -2, PeriodStartDate)
          WHEN 'month' THEN DATEADD(MONTH, -1, PeriodStartDate)
          WHEN 'quarter' THEN DATEADD(QUARTER, -1, PeriodStartDate)
          WHEN 'half-year' THEN DATEADD(MONTH, -6, PeriodStartDate)
        END
      FROM GenPeriods
      WHERE Period < NumberOfPeriods
    )
    SELECT gp.Period, gp.PeriodStartDate, gp.PeriodEndDate, Status, Description, Lateness, SUM(rss.NumberOfReeviews) AS NumberOfReviews
    FROM GenPeriods gp
    LEFT JOIN ReviewStatusSummary rss ON rss.PeriodStartDate >= gp.PeriodStartDate AND rss.PeriodEndDate <= gp.PeriodEndDate
    GROUP BY gp.Period, gp.PeriodStartDate, gp.PeriodEndDate, Description, Lateness, Status
    ORDER BY PeriodEndDate DESC
  `;

  const connection = await db();
  const results = await connection
    .input("AsAt", asAt)
    .input("PeriodLength", periodLength)
    .input("NumberOfPeriods", numberOfPeriods)
    .timed_query(
      query,
      'retrieveStatusSummaries'
    );
  return fixCase(results.recordset);
}

const retrieveStatusSummaryForPeriod = async (asAtEndOf, periodLength, numberOfPeriods, companyEntityIds, templateName, excludedHrReps, excludedLatenesses, excludedStatuses, excludedTemplateNames) => {
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
    ExcludedTemplates AS (
      SELECT value AS TemplateName
      FROM STRING_SPLIT(@ExcludedTemplates, ',')
    ),
    unfilteredCounts AS (
      SELECT Period, PeriodStartDate, PeriodEndDate, ReviewStatus, Lateness, COUNT (grssp.ReviewId) AS NumberOfReviews, grssp.hrRep, grssp.TemplateName
      FROM GetReviewStatusSummaryForPeriod(@AsAtEndOf, @NumberOfPeriods, @PeriodLength) grssp
        INNER JOIN StaffReview sr ON sr.ReviewId = grssp.ReviewId
        INNER JOIN Review r ON sr.ReviewId = r.ReviewId
        INNER JOIN DecoratedStaff ds ON ds.StaffId = sr.StaffId
      WHERE ds.StaffStatus <> 'terminated'
      AND (@CompanyEntityIds IS NULL OR ds.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@CompanyEntityIds, ',')))
      AND (@TemplateName IS NULL OR grssp.TemplateName = @TemplateName)
      GROUP BY ReviewStatus, grssp.hrRep, Lateness, Period, PeriodLength, NumberOfPeriods, PeriodStartDate, PeriodEndDate, grssp.TemplateName
    )
    SELECT ufc.Period AS period, ufc.PeriodStartDate AS periodStartDate, ufc.PeriodEndDate AS periodEndDate, ufc.ReviewStatus AS reviewStatus, ufc.Lateness AS lateness, ufc.NumberOfReviews AS numberOfReviews, ufc.HrRep AS hrRep, ufc.TemplateName as templateName
    FROM unfilteredCounts ufc
    RIGHT JOIN GetPeriodDateRanges(@AsAtEndOf, @PeriodLength, @NumberOfPeriods) AS p ON p.PeriodStartDate = ufc.PeriodStartDate
    AND p.PeriodEndDate = ufc.PeriodEndDate
    WHERE (@ExcludedLatenesses IS NULL OR ufc.Lateness IS NULL OR ufc.Lateness NOT IN (SELECT Lateness FROM ExcludedLatenesses))
      AND (@ExcludedStatuses IS NULL OR ufc.ReviewStatus IS NULL OR ufc.ReviewStatus NOT IN (SELECT ReviewStatus FROM ExcludedStatuses))
      AND (@ExcludedHrReps IS NULL OR ufc.HrRep IS NULL OR ufc.HrRep NOT IN (SELECT HrRep FROM ExcludedHrReps))
      AND (@ExcludedTemplates IS NULL OR TemplateName NOT IN (SELECT TemplateName FROM ExcludedTemplates))
  `;

  const connection = await db();
  const results = await connection
    .input("AsAtEndOf", asAtEndOf)
    .input("PeriodLength", periodLength)
    .input("NumberOfPeriods", numberOfPeriods)
    .input("CompanyEntityIds", companyEntityIds)
    .input("TemplateName", templateName)
    .input("ExcludedHrReps", excludedHrReps)
    .input("ExcludedStatuses", excludedStatuses)
    .input("ExcludedLatenesses", excludedLatenesses)
    .input("ExcludedTemplates", excludedTemplateNames)
    .timed_query(
      query,
      'retrieveStatusSummaryForPeriod'
    );
  return fixCase(results.recordset);
}

const retrieveReviewsWithUnchangedLatenessAndStatus = async (asAtEndOf, periodLength, reviewStatus, lateness, hrRep, companyEntityIds, excludedLatenesses, excludedStatuses, excludedHrReps, templateName, excludedTemplateNames) => {
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
    ExcludedTemplateNames AS (
      SELECT value AS TemplateName
      FROM STRING_SPLIT(@ExcludedTemplateNames, ',')
    )
    SELECT
      rwuls.ReviewId,
      sr.CreatedDate,
      sr.CreatedBy,
      sr.StaffId,
      rwsaat.HrRep,
      rwsaat.UpdatedDate,
      sr.NextReviewDate,
      ds.DisplayName,
      ds.Department,
      ds.Manager,
      r.DueDate,
      ds.StaffStatus
    FROM dbo.GetReviewsWithUnchangedStatus(@AsAtEndOf, 2, @PeriodLength) rwuls --we are only interested in comparing this period against the previous period, thus there is no need to get more than 2 periods
      INNER JOIN Review r on rwuls.ReviewId = r.ReviewId
      INNER JOIN StaffReview sr ON sr.ReviewId = rwuls.ReviewId
      INNER JOIN ReviewWithStatusAsAt(@AsAtEndOf) rwsaat ON rwsaat.ReviewId = rwuls.ReviewId
      INNER JOIN DecoratedStaff ds ON ds.StaffId = sr.StaffId
      INNER JOIN FeedbackAssignmentTemplate fat on r.TemplateId=fat.FeedbackAssignmentTemplateId
    WHERE ds.StaffStatus <> 'terminated'
      AND (@Lateness IS NULL OR dbo.CategoriseLateness(r.DueDate, @AsAtEndOf) = @Lateness)
      AND (@ReviewStatus IS NULL OR rwuls.ReviewStatus = @ReviewStatus)
      AND (@HrRep IS NULL OR rwsaat.HrRep = @HrRep)
      AND (@TemplateName IS NULL OR fat.TemplateName = @TemplateName)
      AND r.DeletedDate IS NULL
      AND (@CompanyEntityIds IS NULL OR ds.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@CompanyEntityIds, ',')))
      AND (@ExcludedLatenesses IS NULL OR dbo.CategoriseLateness(r.DueDate, @AsAtEndOf) NOT IN (SELECT Lateness FROM ExcludedLatenesses))
      AND (@ExcludedStatuses IS NULL OR rwuls.ReviewStatus NOT IN (SELECT ReviewStatus FROM ExcludedStatuses))
      AND (@ExcludedHrReps IS NULL OR rwsaat.HrRep NOT IN (SELECT HrRep FROM ExcludedHrReps))
      AND (@ExcludedTemplateNames IS NULL OR fat.TemplateName NOT IN (SELECT TemplateName FROM ExcludedTemplateNames))
  `;

  const connection = await db();
  const results = await connection
    .input("AsAtEndOf", asAtEndOf)
    .input("PeriodLength", periodLength)
    .input("ReviewStatus", reviewStatus)
    .input("CompanyEntityIds", companyEntityIds)
    .input("Lateness", lateness)
    .input("HrRep", hrRep)
    .input("TemplateName", templateName)
    .input("ExcludedHrReps", excludedHrReps)
    .input("ExcludedStatuses", excludedStatuses)
    .input("ExcludedLatenesses", excludedLatenesses)
    .input("ExcludedTemplateNames", excludedTemplateNames)
    .timed_query(
      query,
      'retrieveReviewsWithUnchangedLatenessAndStatus'
    );
  return fixCase(results.recordset);
}

const retrieveReviewDurations = async (asAt, periodLength, numberOfPeriods) => {
  const query = `
    WITH Input AS (
      SELECT
        CAST(@AsAt AS DATE) AS AsAt,
        @PeriodLength AS PeriodLength,
        @NumberOfPeriods AS NumberOfPeriods
    ),
    Period AS (
      SELECT
        AsAt,
        StartAt =
          CASE PeriodLength
            WHEN 'week' THEN DATEADD(WEEK, -1 * NumberOfPeriods, AsAt)
            WHEN 'fortnight' THEN DATEADD(WEEK, -2 * NumberOfPeriods, AsAt)
            WHEN 'month' THEN DATEADD(MONTH, -1 * NumberOfPeriods, AsAt)
            WHEN 'quarter' THEN DATEADD(QUARTER, -1 * NumberOfPeriods, AsAt)
            WHEN 'half-year' THEN DATEADD(MONTH, -6 * NumberOfPeriods, AsAt)
          END
      FROM
        Input
    ),
    CompletedReviews AS (
      SELECT
        rwas.ReviewId,
        rwas.DateCreated,
        CAST(rwas.UpdatedDate AS DATE) AS UpdatedDate
      FROM
        ReviewWithActiveStatus rwas
      INNER JOIN ReviewStatus rs ON
        rs.ReviewStatusId = rwas.ReviewStatusId
      WHERE
        rs.Description = 'Archived'
    )
    SELECT
      cr.ReviewId,
      cr.UpdatedDate,
      DATEDIFF(DAY, cr.DateCreated, cr.UpdatedDate) AS Duration
    FROM
      Period p
    INNER JOIN CompletedReviews cr ON
      cr.DateCreated >= p.StartAt
      AND cr.UpdatedDate <= p.AsAt
  `;

  const connection = await db();
  const results = await connection
    .input("AsAt", asAt)
    .input("PeriodLength", periodLength)
    .input("NumberOfPeriods", numberOfPeriods)
    .timed_query(
      query,
      'retrieveReviewDurations'
    );
  return fixCase(results.recordset);
}

const retrieveHrReviewCountSummaryByPeriod = async (asAtEndOf, periodLength, numberOfPeriods) => {
  const query = `
    WITH PeriodDateRanges AS (
      SELECT
        Period, PeriodStartDate, PeriodEndDate
      FROM GetPeriodDateRanges(@asAtEndOf, @periodLength, @numberOfPeriods)
    )
    SELECT
      s.DisplayName,
      s.UserPrincipleName,
      p.PeriodEndDate,
      p.PeriodStartDate,
      p.Period,
      rs.Description,
      SUM(CASE
          WHEN rwas.dueDate <= p.PeriodEndDate
          AND rwas.dueDate > p.PeriodStartDate
          THEN 1 ELSE 0
        END) AS reviewTotal
    FROM ReviewWithActiveStatus rwas
    INNER JOIN DecoratedStaff s ON rwas.HrRep = s.UserPrincipleName
    INNER JOIN ReviewStatus rs
      ON rwas.reviewStatusId = rs.reviewStatusId
      AND rs.Description NOT IN ('Archived', 'Cancelled')
    CROSS JOIN PeriodDateRanges p
    WHERE s.StaffStatus <> 'terminated'
      AND rwas.DeletedBy IS NULL AND rwas.dueDate <= @asAtEndOf AND rwas.dueDate > (SELECT PeriodStartDate FROM PeriodDateRanges WHERE @numberOfPeriods = Period)
    GROUP BY s.DisplayName, s.UserPrincipleName, p.PeriodEndDate, p.PeriodStartDate, rs.Description, p.Period
  `;

  const connection = await db();
  const results = await connection
    .input('periodLength', periodLength)
    .input('asAtEndOf', asAtEndOf)
    .input('numberOfPeriods', numberOfPeriods)
    .timed_query(query, 'retrieveReviewSummaryByHr');

  return fixCase(results.recordset);

}

const retrieveReviewsForLatenessAndStatus = async (asAt, lateness, status, hrRep, companyEntityIds, excludedLatenesses, excludedStatuses, excludedHrReps, templateName, excludedTemplateNames) => {
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
    ExcludedTemplateNames AS (
      SELECT value AS TemplateName
      FROM STRING_SPLIT(@ExcludedTemplateNames, ',')
    )
    SELECT
      sr.StaffReviewId,
      sr.CreatedDate,
      sr.CreatedBy,
      sr.StaffId,
      rwsaat.HrRep,
      rwsaat.UpdatedDate,
      sr.NextReviewDate,
      sr.ReviewId,
      ds.DisplayName,
      ds.Department,
      ds.Manager,
      r.DueDate,
      (dbo.CategoriseLateness(r.DueDate, @AsAt)) AS Lateness,
      rs.Description AS ReviewStatus,
      ds.StaffStatus,
      fat.TemplateName
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
      AND (@TemplateName IS NULL OR fat.TemplateName = @TemplateName)
      AND r.DeletedDate IS NULL
      AND (@CompanyEntityIds IS NULL OR ds.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@CompanyEntityIds, ',')))
      AND (@ExcludedLatenesses IS NULL OR dbo.CategoriseLateness(r.DueDate, @AsAt) NOT IN (SELECT Lateness FROM ExcludedLatenesses))
      AND (@ExcludedStatuses IS NULL OR rs.Description NOT IN (SELECT ReviewStatus FROM ExcludedStatuses))
      AND (@ExcludedHrReps IS NULL OR rwsaat.HrRep NOT IN (SELECT HrRep FROM ExcludedHrReps))
      AND (@ExcludedTemplateNames IS NULL OR fat.TemplateName NOT IN (SELECT TemplateName FROM ExcludedTemplateNames))
  `;

  const connection = await db();
  const results = await connection
    .input("AsAt", asAt)
    .input("Lateness", lateness)
    .input("Status", status)
    .input("CompanyEntityIds", companyEntityIds)
    .input("HrRep", hrRep)
    .input("TemplateName", templateName)
    .input("ExcludedLatenesses", excludedLatenesses)
    .input("ExcludedStatuses", excludedStatuses)
    .input("ExcludedHrReps", excludedHrReps)
    .input("ExcludedTemplateNames", excludedTemplateNames)
    .timed_query(
      query,
      'retrieveReviewsForLatenessAndStatus'
    );
  return fixCase(results.recordset);
}

module.exports = {
  retrieveWeeklyReviewDashboard,
  retrieveWeeklyReviewAgeing,
  retrieveStatusSummaries,
  retrieveStatusSummaryForPeriod,
  retrieveReviewDurations,
  retrieveHrReviewCountSummaryByPeriod,
  retrieveReviewsForLatenessAndStatus,
  retrieveReviewsWithUnchangedLatenessAndStatus,
};
