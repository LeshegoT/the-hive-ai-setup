import { fixCase } from "@the-hive/lib-core";
import { SqlRequest } from "@the-hive/lib-db";
import { ContractRecommendationStatusLatenessSummary, DashboardContractRecommendation, DashboardFilterParams } from "@the-hive/lib-reviews-shared";

export const retrieveContractsStatusSummary = async (db: () => Promise<SqlRequest>, filters: DashboardFilterParams): Promise<ContractRecommendationStatusLatenessSummary[]> => {
  const query = `
    WITH ExcludedLatenesses AS (
      SELECT value AS Lateness
      FROM STRING_SPLIT(@ExcludedLatenesses, ',')
    ),
    ExcludedStatuses AS (
      SELECT value AS ContractRecommendationStatus
      FROM STRING_SPLIT(@ExcludedStatuses, ',')
    ),
    ExcludedHrReps AS (
      SELECT value AS HrRep
      FROM STRING_SPLIT(@ExcludedHrReps, ',')
    ),
    unfilteredCounts AS (
      SELECT PeriodStartDate, PeriodEndDate, StatusId, Status, Lateness, COUNT (Status) AS NumberOfContractRecommendations, gcrssp.hrRep
      FROM GetContractRecommendationsStatusSummaryForPeriod(@AsAtEndOf, @NumberOfPeriods, @PeriodLength) gcrssp
      INNER JOIN DecoratedStaff ds ON ds.StaffId = gcrssp.StaffId
      WHERE ds.StaffStatus <> 'terminated'
        AND (@CompanyEntityIds IS NULL OR ds.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@CompanyEntityIds, ',')))
      GROUP BY StatusId, Status, HrRep, Lateness, PeriodStartDate, PeriodEndDate
    )
    SELECT p.PeriodStartDate, p.PeriodEndDate, ufc.StatusId, ufc.Status, ufc.Lateness, COALESCE(ufc.NumberOfContractRecommendations, 0) AS NumberOfContractRecommendations, ufc.hrRep
    FROM unfilteredCounts ufc
    RIGHT JOIN GetPeriodDateRanges(@AsAtEndOf, @PeriodLength, @NumberOfPeriods) AS p ON p.PeriodStartDate = ufc.PeriodStartDate
    AND p.PeriodEndDate = ufc.PeriodEndDate
	  WHERE (@ExcludedLatenesses IS NULL OR ufc.Lateness IS NULL OR ufc.Lateness NOT IN (SELECT Lateness FROM ExcludedLatenesses))
      AND (@ExcludedStatuses IS NULL OR ufc.Status IS NULL OR ufc.Status NOT IN (SELECT ContractRecommendationStatus FROM ExcludedStatuses))
      AND (@ExcludedHrReps IS NULL OR ufc.HrRep IS NULL OR ufc.HrRep NOT IN (SELECT HrRep FROM ExcludedHrReps))
  `;
  const request = await db();
  const result = await request
    .input('AsAtEndOf', filters.asAtEndOf)
    .input('NumberOfPeriods', filters.numberOfPeriods)
    .input('PeriodLength', filters.periodLength)
    .input('CompanyEntityIds', filters.companyEntities?.map(c => c.companyEntityId).join(','))
    .input("ExcludedHrReps", filters.excludedHrReps?.join(','))
    .input("ExcludedStatuses", filters.excludedStatuses?.join(','))
    .input("ExcludedLatenesses", filters.excludedLatenesses?.join(','))
    .timed_query(query, 'retrieveContractsStatusSummary');

  return fixCase(result.recordset) as ContractRecommendationStatusLatenessSummary[];
}

export const retrieveContractsWithUnchangedStatusSummary = async (db: () => Promise<SqlRequest>, filters: DashboardFilterParams): Promise<number> => {
  const query = `
    SELECT
      COUNT(crus.ContractRecommendationId) AS numberOfContracts
    FROM GetContractRecommendationsWithUnchangedStatus(@AsAtEndOf, 2, @PeriodLength) crus --we are only interested in comparing this period against the previous period, thus there is no need to get more than 2 periods
      INNER JOIN DecoratedStaff ds ON ds.StaffId = crus.StaffId
    WHERE ds.StaffStatus <> 'terminated'
      AND dbo.CategoriseLateness(crus.NextReviewDate, @AsAtEndOf) = @Lateness
      AND crus.ContractRecommendationStatus = @ContractStatus
      AND (@HrRep IS NULL OR crus.HrRep = @HrRep)
      AND (@CompanyEntityIds IS NULL OR ds.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@CompanyEntityIds, ',')))
      AND (@ExcludedHrReps IS NULL OR crus.HrRep NOT IN (SELECT value FROM STRING_SPLIT(@ExcludedHrReps, ',')))
  `;

  const request = await db();
  const result = await request
    .input('AsAtEndOf', filters.asAtEndOf)
    .input('PeriodLength', filters.periodLength)
    .input('CompanyEntityIds', filters.companyEntities?.map(c => c.companyEntityId).join(','))
    .input("Lateness", filters.lateness)
    .input("ContractStatus", filters.status)
    .input("HrRep", filters.hrRep)
    .input("ExcludedHrReps", filters.excludedHrReps?.join(','))
    .timed_query(query, 'retrieveContractsWithUnchangedStatusSummary');

  return result.recordset.length > 0 ? result.recordset[0]['numberOfContracts'] : 0;
}

export const retrieveFilteredContractRecommendations = async (db: () => Promise<SqlRequest>, filters: DashboardFilterParams): Promise<DashboardContractRecommendation[]> => {
  const query = `
    WITH ExcludedContractRecommendationStatuses AS (
      SELECT VALUE AS ContractRecommendationStatus FROM STRING_SPLIT(@ExcludedStatuses, ',')
    ),
    ExcludedContractRecommendationLateness AS (
      SELECT VALUE AS Lateness FROM STRING_SPLIT(@ExcludedLatenesses, ',')
    ),
    ExcludedHrReps AS (
      SELECT VALUE AS HrRep FROM STRING_SPLIT(@ExcludedHrReps, ',')
    ),
    SelectedCompanyEntities AS (
      SELECT CAST(VALUE AS INT) AS CompanyEntityId FROM STRING_SPLIT(@CompanyEntities, ',')
    )
    SELECT
      craslcd.StaffId as staffId,
      craslcd.ContractId as contractId,
      craslcd.StartsAt as startsAt,
      craslcd.EndsAt as endsAt,
      craslcd.NextReviewDate as nextReviewDate,
      craslcd.UserPrincipleName as userPrincipleName,
      craslcd.DisplayName as displayName,
      craslcd.ContractRecommendationId as contractRecommendationId,
      craslcd.Status as status,
      craslcd.HrRep as hrRep,
      craslcd.UpdatedAt as updatedAt,
      craslcd.UpdatedBy as updatedBy,
      dbo.CategoriseLateness(craslcd.NextReviewDate, @AsAtEndOf) as lateness,
      ds.Department as department,
      ds.Manager as reviewer
    FROM ContractRecommendationsWithStatusAsAt(@AsAtEndOf) craslcd
    INNER JOIN DecoratedStaff ds ON ds.StaffId = craslcd.StaffId
    WHERE ds.StaffStatus <> 'terminated'
      AND (@Status IS NULL OR craslcd.Status = @Status)
      AND (@Lateness IS NULL OR dbo.CategoriseLateness(craslcd.NextReviewDate, @AsAtEndOf) = @Lateness)
      AND (@HrRep IS NULL OR craslcd.HrRep = @HrRep)
      AND (@ExcludedStatuses IS NULL OR craslcd.Status NOT IN (SELECT ContractRecommendationStatus FROM ExcludedContractRecommendationStatuses))
      AND (@ExcludedLatenesses IS NULL OR dbo.CategoriseLateness(craslcd.NextReviewDate, @AsAtEndOf) NOT IN (SELECT Lateness FROM ExcludedContractRecommendationLateness))
      AND (@CompanyEntities IS NULL OR ds.CompanyEntityId IN (SELECT CompanyEntityId FROM SelectedCompanyEntities))
      AND (@ExcludedHrReps IS NULL OR craslcd.HrRep NOT IN (SELECT HrRep FROM ExcludedHrReps));
  `

  const request = await db();
  const result = await request
    .input('AsAtEndOf', filters.asAtEndOf)
    .input('ExcludedStatuses', filters.excludedStatuses?.join(','))
    .input('ExcludedLatenesses', filters.excludedLatenesses?.join(','))
    .input('ExcludedHrReps', filters.excludedHrReps?.join(','))
    .input('CompanyEntities', filters.companyEntities?.map(c => c.companyEntityId).join(','))
    .input('Status', filters.status)
    .input('Lateness', filters.lateness)
    .input('HrRep', filters.hrRep)
    .timed_query(query, 'retrieveFilteredContractRecommendations');

  return result.recordset as DashboardContractRecommendation[];
}

export const retrieveContractsWithUnchangedStatus = async (db: () => Promise<SqlRequest>, filters: DashboardFilterParams): Promise<DashboardContractRecommendation[]> => {
  const query = `
    SELECT
      crus.StaffId as staffId,
      craslcd.ContractId as contractId,
      craslcd.StartsAt as startsAt,
      craslcd.EndsAt as endsAt,
      craslcd.NextReviewDate as nextReviewDate,
      craslcd.UserPrincipleName as userPrincipleName,
      craslcd.DisplayName as displayName,
      craslcd.ContractRecommendationId as contractRecommendationId,
      craslcd.Status as status,
      craslcd.HrRep as hrRep,
      craslcd.UpdatedAt as updatedAt,
      craslcd.UpdatedBy as updatedBy,
      dbo.CategoriseLateness(craslcd.NextReviewDate, @AsAtEndOf) as lateness,
      ds.Department as department,
      ds.Manager as reviewer
    FROM GetContractRecommendationsWithUnchangedStatus(@AsAtEndOf, 2, @PeriodLength) crus --we are only interested in comparing this period against the previous period, thus there is no need to get more than 2 periods
      INNER JOIN DecoratedStaff ds ON ds.StaffId = crus.StaffId
      INNER JOIN ContractRecommendationsWithStatusAsAt(@AsAtEndOf) craslcd ON craslcd.ContractRecommendationId = crus.ContractRecommendationId
    WHERE ds.StaffStatus <> 'terminated'
      AND dbo.CategoriseLateness(crus.NextReviewDate, @AsAtEndOf) = @Lateness
      AND crus.ContractRecommendationStatus = @ContractStatus
      AND (@HrRep IS NULL OR crus.HrRep = @HrRep)
      AND (@CompanyEntityIds IS NULL OR ds.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@CompanyEntityIds, ',')))
      AND (@ExcludedHrReps IS NULL OR crus.HrRep NOT IN (SELECT value FROM STRING_SPLIT(@ExcludedHrReps, ',')))
  `;

  const request = await db();
  const result = await request
    .input('AsAtEndOf', filters.asAtEndOf)
    .input('PeriodLength', filters.periodLength)
    .input("Lateness", filters.lateness)
    .input("ContractStatus", filters.status)
    .input("HrRep", filters.hrRep)
    .input("CompanyEntityIds", filters.companyEntities?.map(c => c.companyEntityId).join(','))
    .input("ExcludedHrReps", filters.excludedHrReps?.join(','))
    .timed_query(query, 'retrieveContractsWithUnchangedStatusSummary');

  return result.recordset as DashboardContractRecommendation[];
}
