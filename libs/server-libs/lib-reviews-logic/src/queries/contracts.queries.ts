import { fixCase } from "@the-hive/lib-core";
import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { ContractRecommendationStatusProgression, ContractWithLatestRecommendation } from "@the-hive/lib-reviews-shared";

export const retrieveContractRecommendationIdsByReviewId = async (db: () => Promise<SqlRequest>, reviewId: number): Promise<{ contractRecommendationId: number }[]> => {
  const query = `
    SELECT ContractRecommendationId as contractRecommendationId
    FROM ContractRecommendationStaffReviewLink crsrl
    INNER JOIN StaffReview sr ON sr.StaffReviewId = crsrl.StaffReviewId
    WHERE sr.ReviewId = @ReviewId
    `;
  const request = await db();
  const results = await request.input('ReviewId', reviewId).timed_query(query, 'retrieveContractRecommendationIdByReviewId');
  return results.recordset as { contractRecommendationId: number }[];
};

export const retrieveContractRecommendationById = async (db: () => Promise<SqlRequest>, contractRecommendationId: number) => {
  const query = `
        SELECT 
            crwa.StaffId as staffId,
            crwa.ContractId as contractId,
            crwa.UserPrincipleName as userPrincipleName,
            crwa.DisplayName as displayName,
            crwa.StartsAt as startsAt,
            crwa.EndsAt as endsAt,
            crwa.ContractRecommendationId as contractRecommendationId,
            crwa.Status as status,
            crwa.HrRep as hrRep,
            crwa.UpdatedAt as updatedAt,
            crwa.UpdatedBy as updatedBy
        FROM 
            ContractRecommendationsActiveStatusLatestContractDates crwa 
        WHERE ContractRecommendationId = @ContractRecommendationID
    `;

  const request = await db();
  const results = await request
    .input('ContractRecommendationID', contractRecommendationId)
    .timed_query(query, 'retrieveContractRecommendationById');

  return results.recordset[0] as {
    staffId: number;
    contractId: number;
    userPrincipleName: string;
    displayName: string;
    startsAt: Date;
    endsAt: Date;
    contractRecommendationId: number;
    status: string;
    hrRep: string;
    updatedAt: Date;
    updatedBy: string;
  };
};

export const retrieveAllowedContractRecommendationStatusProgressions = async (db: () => Promise<SqlRequest>): Promise<ContractRecommendationStatusProgression[]> => {
  const query = `
        SELECT
            crsp.ContractRecommendationStatusProgressionId AS contractRecommendationStatusProgressionId,
            fromStatus.Status AS fromStatus,
            toStatus.Status AS toStatus
        FROM ContractRecommendationStatusProgression crsp
        INNER JOIN ContractRecommendationStatus fromStatus
            ON fromStatus.ContractRecommendationStatusId = crsp.FromStatusId
        INNER JOIN ContractRecommendationStatus toStatus
            ON toStatus.ContractRecommendationStatusId = crsp.ToStatusId
    `;

  const connection = await db();
  const results = await connection.timed_query(
    query,
    'retrieveAllowedContractRecommendationStatusProgressions'
  );
  return results.recordset as ContractRecommendationStatusProgression[];
};

export const insertContractRecommendationStatus = async (
  tx: SqlTransaction,
  contractRecommendationId: number,
  status: string,
  updatedBy: string
) => {
  const query = `
        INSERT INTO ContractRecommendationStatusHistory(ContractRecommendationStatusId, ContractRecommendationId, UpdatedBy, UpdatedAt)
        SELECT ContractRecommendationStatusId, @ContractRecommendationID, @UpdatedBy, GETDATE()
        FROM ContractRecommendationStatus
        WHERE Status = @Status
    `;

  const connection = await tx.timed_request();
  await connection
    .input('ContractRecommendationID', contractRecommendationId)
    .input('Status', status)
    .input('UpdatedBy', updatedBy)
    .timed_query(query, 'insertContractRecommendationStatus');
};

export const addContract = async (
  tx: SqlTransaction,
  staffId: number,
  updatedBy: string,
  startDate: Date,
  endDate: Date,
  nextReviewDate: Date
) => {
  const query = `
        INSERT INTO StaffTypeHistory(StaffTypeId, StaffId, UpdatedBy, UpdatedAt)
        SELECT StaffTypeId, @StaffID, @UpdatedBy, GETDATE()
        FROM StaffType
        WHERE StaffType = 'Contract';

        INSERT INTO Contracts(StaffId)
        VALUES (@StaffID);

        INSERT INTO ContractDateHistory (ContractId, StartsAt, EndsAt, UpdatedBy, UpdatedAt, NextReviewDate)
        VALUES (SCOPE_IDENTITY(), @StartDate, @EndDate, @UpdatedBy, GETDATE(), @NextReviewDate);
    `;
  const connection = await tx.timed_request();
  const result = await connection
    .input('StaffID', staffId)
    .input('UpdatedBy', updatedBy)
    .input('StartDate', startDate)
    .input('EndDate', endDate)
    .input('NextReviewDate', nextReviewDate)
    .timed_query(query, 'addContract');

  return result.rowsAffected.length > 0;
};

export const retrieveStaffContracts = async (db: () => Promise<SqlRequest>, upn: string): Promise<ContractWithLatestRecommendation[]> => {
  const query = `
        SELECT
            c.ContractId,
            LatestRecommendation.ContractRecommendationId,
            c.StartsAt,
            c.EndsAt,
            c.NextReviewDate,
            s.StaffId,
            s.UserPrincipleName,
            s.DisplayName,
            s.JobTitle,
            s.Office,
            s.EmploymentDate,
            OutcomeRecommendation.Status AS Recommendation
        FROM ContractsWithLatestDates c
        INNER JOIN DecoratedStaff s
            ON s.StaffId = c.StaffId
        OUTER APPLY (
            SELECT TOP 1
                cr.ContractRecommendationId
            FROM ContractRecommendations cr
            WHERE cr.ContractId = c.ContractId
            ORDER BY cr.ContractRecommendationId DESC
        ) LatestRecommendation
        OUTER APPLY (
            SELECT TOP 1
                crs.Status
            FROM ContractRecommendationStatusHistory crsh
            INNER JOIN ContractRecommendationStatus crs
                ON crs.ContractRecommendationStatusId = crsh.ContractRecommendationStatusId
            WHERE crsh.ContractRecommendationId = LatestRecommendation.ContractRecommendationId
            AND crs.Status in ('To Renew', 'To Terminate', 'To Make Permanent')
            ORDER BY crsh.ContractRecommendationStatusHistory DESC
        ) OutcomeRecommendation
        WHERE s.UserPrincipleName = @UserPrincipleName
    `;

  const connection = await db();
  const results = await connection
    .input('UserPrincipleName', upn)
    .timed_query(query, 'retrieveStaffContracts');
  return fixCase(results.recordset) as ContractWithLatestRecommendation[];
};
