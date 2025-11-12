const { ContractsLogic } = require('@the-hive/lib-reviews-logic');
const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const contractsLogic = new ContractsLogic(db);

const retrieveContracts = async (
  pageNumber,
  pageSize,
  searchText,
  nextReviewDate,
  jobTitlesText,
  companyEntitiesFilter
) => {
  const query = `
    WITH SelectedJobTitles AS (
      SELECT value AS JobTitle
      FROM STRING_SPLIT(@JobTitlesText, ',')
    )
    SELECT         
      c.ContractId,
      c.StartsAt,
      c.EndsAt,
      c.NextReviewDate,
      c.HoldReason,
      c.OnHoldBy,
      swd.StaffId,
      swd.UserPrincipleName,
      swd.DisplayName,
      swd.JobTitle,
      swd.Office,
      swd.EmploymentDate,
      swd.Manager,
      COUNT(c.ContractId) OVER() AS resultSetSize
    FROM 
      ContractsWithLatestDates AS c
    INNER JOIN
      StaffWithActiveDepartment swd ON swd.StaffId = c.StaffId
    WHERE 
      (@SearchText IS NULL OR (
          (swd.UserPrincipleName LIKE '%' + @SearchText + '%') OR
          (swd.DisplayName LIKE '%' + @SearchText + '%')
      ))
      AND (@NextReviewDate is NULL OR
      (c.NextReviewDate <= @NextReviewDate))
      AND c.ContractId NOT IN (
        SELECT ContractId
        FROM ContractRecommendationsActiveStatusLatestContractDates
        WHERE Status <> 'Cancelled' AND (Status <> 'Archived' OR PreviousStatus <> 'Continue As Is')
      )
      AND (@JobTitlesText IS NULL OR swd.JobTitle IN (SELECT JobTitle From SelectedJobTitles))
      AND (@CompanyEntitiesFilter IS NULL OR swd.CompanyEntityId IN (SELECT VALUE FROM STRING_SPLIT(@CompanyEntitiesFilter, ',')))
      AND c.ScheduledBy IS NULL
      AND swd.StaffStatus <> 'terminated'
      ORDER BY c.HoldReason DESC
      OFFSET (@PageNumber * @PageSize) 
      ROWS FETCH NEXT @PageSize ROWS ONLY
    `;

  const connection = await db();
  const result = await connection
    .input('SearchText', searchText)
    .input('NextReviewDate', nextReviewDate)
    .input('PageNumber', pageNumber)
    .input('PageSize', pageSize)
    .input('JobTitlesText', jobTitlesText)
    .input('CompanyEntitiesFilter', companyEntitiesFilter)
    .timed_query(query, 'retrieveContracts');
  return fixCase(result.recordset);
};

const getAllContractRecommendations = async (
  pageNumber,
  pageSize,
  searchText,
  hrRep,
  status,
  nextReviewDate,
  jobTitlesText,
  companyEntitiesFilter
) => {
  const query = `
    WITH SelectedJobTitles AS (
        SELECT value AS JobTitle
        FROM STRING_SPLIT(@JobTitlesText, ',')
    )
    SELECT 
        crwa.StaffId,
        crwa.ContractId,
        crwa.UserPrincipleName,
        crwa.DisplayName,
        crwa.StartsAt,
        crwa.EndsAt,
        crwa.NextReviewDate,
        crwa.ContractRecommendationId,
        crwa.Status,
        crwa.HrRep,
        crwa.UpdatedAt,
        crwa.UpdatedBy,
        s.Manager,
        s.JobTitle,
        COUNT(crwa.ContractRecommendationId) OVER() AS resultSetSize
    FROM 
        ContractRecommendationsActiveStatusLatestContractDates crwa
    INNER JOIN
        StaffWithActiveDepartment s ON s.StaffId = crwa.StaffId 
    WHERE 
        (@SearchText IS NULL OR (
            (crwa.UserPrincipleName LIKE '%' + @SearchText + '%') OR
            (crwa.DisplayName LIKE '%' + @SearchText + '%')
        ))
        AND (@HrRep IS NULL OR LOWER(crwa.HrRep) = LOWER(@HrRep))
        AND (@Status IS NULL OR crwa.Status = @Status)
        AND (@NextReviewDate IS NULL OR crwa.NextReviewDate <= @NextReviewDate)
        AND (@JobTitlesText IS NULL OR s.JobTitle IN (SELECT JobTitle From SelectedJobTitles))
        AND (@CompanyEntitiesFilter IS NULL OR s.CompanyEntityId IN (SELECT VALUE FROM STRING_SPLIT(@CompanyEntitiesFilter, ',')))
        ORDER BY crwa.EndsAt
        OFFSET (@PageNumber * @PageSize) 
        ROWS FETCH NEXT @PageSize ROWS ONLY
    `;

  const request = await db();
  const results = await request
    .input('SearchText', searchText)
    .input('HrRep', hrRep)
    .input('Status', status)
    .input('NextReviewDate', nextReviewDate)
    .input('PageNumber', pageNumber)
    .input('PageSize', pageSize)
    .input('JobTitlesText', jobTitlesText)
    .input('CompanyEntitiesFilter', companyEntitiesFilter)
    .timed_query(query, 'getAllContractRecommendations');
  return fixCase(results.recordset);
};

const makeContractorPermanent = async (
  tx,
  staffId,
  upn,
  nextReviewDate,
  previousStaffReviewId,
  nextFeedbackTypeId
) => {
  const q = `
    INSERT INTO StaffTypeHistory (StaffTypeId, StaffId, UpdatedBy, UpdatedAt) 
    SELECT StaffTypeId, @StaffId, @UPN, GETDATE()
    FROM StaffType
    WHERE StaffType = 'Permanent'

    INSERT INTO StaffReview(CreatedDate, CreatedBy, StaffId, NextReviewDate, PreviousStaffReviewId, NextFeedbackTypeId)
    VALUES(GETDATE(), @UPN, @StaffId, @NextReviewDate, @PreviousStaffReviewId, @NextFeedbackTypeId);
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('StaffId', staffId)
    .input('UPN', upn)
    .input('NextReviewDate', nextReviewDate)
    .input('PreviousStaffReviewId', previousStaffReviewId)
    .input('NextFeedbackTypeId', nextFeedbackTypeId)
    .timed_query(q, 'makeContractorPermanent');
  return result.recordset;
};

const getHrRepsWithRecommendations = async () => {
  const query = `
        SELECT DISTINCT(HrRep) AS Upn FROM ContractRecommendationsActiveStatusLatestContractDates
        WHERE LOWER([Status]) <> 'cancelled'
    `;

  const request = await db();
  const results = await request.timed_query(
    query,
    'getHrRepsWithRecommendations'
  );
  return fixCase(results.recordset);
};

const createContractRecommendation = async (tx, contractId, hrRep, updatedBy) => {
  const q = `
    DECLARE @ContractRecommendationId INT;

    INSERT INTO ContractRecommendations (ContractId)
    VALUES (@ContractId);

    SET @ContractRecommendationId = SCOPE_IDENTITY();

    INSERT INTO ContractsHrRepHistory (ContractRecommendationId, HrRep, UpdatedBy, UpdatedAt)
    VALUES (
      @ContractRecommendationId,
      @HrRep,
      @UpdatedBy,
      GETDATE()
    )

    INSERT INTO ContractRecommendationStatusHistory
    (
        ContractRecommendationStatusId,
        ContractRecommendationId,
        UpdatedBy,
        UpdatedAt
    )
    SELECT ContractRecommendationStatusId, @ContractRecommendationId, @HrRep, GETDATE()
    FROM ContractRecommendationStatus
    WHERE Status = 'New';
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('ContractId', contractId)
    .input('HrRep', hrRep)
    .input('UpdatedBy', updatedBy)
    .timed_query(q, 'createContractRecommendation');
  return result.recordset;
};

const addContractRecommendationStaffReviewLink = async (
  tx,
  contractRecommendationId,
  staffReviewId
) => {
  const query = `
        INSERT INTO ContractRecommendationStaffReviewLink(ContractRecommendationId, StaffReviewId)
        VALUES (@ContractRecommendationID, @StaffReviewID)
    `;

  const connection = await tx.timed_request();
  await connection
    .input('ContractRecommendationID', contractRecommendationId)
    .input('StaffReviewID', staffReviewId)
    .timed_query(query, 'addContractRecommendationStaffReviewLink');
};

const contractHasActiveContractRecommendation = async (contractId) => {
  const query = `
    SELECT 1 
    FROM ContractRecommendationsActiveStatusLatestContractDates
    WHERE ContractId = @ContractId
    AND LOWER([Status]) <> 'cancelled'
    `;
  const request = await db();
  const result = await request
    .input('ContractId', contractId)
    .query(query, 'contractHasActiveContractRecommendation');
  return result.recordset.length > 0;
};

const hasContractRecommendations = async (reviewId) => {
  const contractRecommendationIds = await contractsLogic.getContractRecommendationIdsByReviewId(
    reviewId
  );
  return contractRecommendationIds.length > 0;
};

const retrieveContractRecommendationId = async (reviewId) => {
  const contractRecommendationIds = await contractsLogic.getContractRecommendationIdsByReviewId(
    reviewId
  );
  return contractRecommendationIds[0]?.contractRecommendationId;
};

const retrieveFinalContractRecommendationStatus = async () => {
  const query = `
        SELECT 
            crs.ContractRecommendationStatusId,
            crs.Status
        FROM ContractRecommendationStatus crs 
        WHERE crs.ContractRecommendationStatusId in (
            SELECT 
                crsp.ToStatusId
            FROM ContractRecommendationStatusProgression crsp
            WHERE crsp.ToStatusId NOT IN (SELECT FromStatusId FROM ContractRecommendationStatusProgression)
        );
    `;

  const connection = await db();
  const result = await connection.query(
    query,
    'retrieveFinalContractRecommendationStatus'
  );

  if (result.recordset.length > 0) {
    return fixCase(result.recordset)[0];
  } else {
    throw new Error('Final contract recommendation status was not found.');
  }
};

const updateContractDates = async (contractId, startsAt, endsAt, reviewDueDate, upn) => {
    const q = `
        INSERT INTO ContractDateHistory (ContractId, StartsAt, EndsAt, NextReviewDate, UpdatedBy, UpdatedAt)
        VALUES (@ContractId, @StartsAt, @EndsAt, @NextReviewDate, @UpdatedBy, GETDATE());
    `;
    
    const connection = await db();
    const results = await connection
      .input('ContractId', contractId)
      .input('StartsAt', startsAt)
      .input('EndsAt', endsAt)
      .input('UpdatedBy', upn)
      .input('NextReviewDate', reviewDueDate)
      .timed_query(q, 'updateContractDates');
    return results.recordset;
};

const updateContractDatesTx = async (tx, contractId, startsAt, endsAt, nextReviewDate, upn) => {
  const q = `
      INSERT INTO ContractDateHistory (ContractId, StartsAt, EndsAt, NextReviewDate, UpdatedBy, UpdatedAt)
      VALUES (@ContractId, @StartsAt, @EndsAt, @NextReviewDate, @UpdatedBy, GETDATE());
  `;
  
  const connection = await tx.timed_request();
  const results = await connection
    .input('ContractId', contractId)
    .input('StartsAt', startsAt)
    .input('EndsAt', endsAt)
    .input('UpdatedBy', upn)
    .input('NextReviewDate', nextReviewDate)
    .timed_query(q, 'updateContractDatesTx');
  return results.recordset;
};

const updateContractRecommendationHrRep = async (tx, contractRecommendationId, hrRep, updatedBy) => {
  const query = `
    INSERT INTO ContractsHrRepHistory (ContractRecommendationId, HrRep, UpdatedBy, UpdatedAt)
    VALUES (
      @ContractRecommendationId,
      @HrRep,
      @UpdatedBy,
      GETDATE()
    )
  `;

  const connection = await tx.timed_request();
  await connection
      .input('ContractRecommendationID', contractRecommendationId)
      .input('HrRep', hrRep)
      .input('UpdatedBy', updatedBy)
      .timed_query(query, 'updateContractRecommendationHrRep');
}

const addTemporaryContractRecommendationHrRep = async (tx, contractRecommendationId, tempHrRep, tempHrRepEndDate, updatedBy) => {
  const query = `
    INSERT INTO ContractsHrRepHistory(ContractRecommendationId, HrRep, UpdatedBy, UpdatedAt)
    SELECT @ContractRecommendationID, HrRep, @UpdatedBy, @TemporaryHrEndDate
    FROM ContractRecommendationsActiveStatusLatestContractDates
    WHERE 
        ContractRecommendationId = @ContractRecommendationID;

    INSERT INTO ContractsHrRepHistory (ContractRecommendationId, HrRep, UpdatedBy, UpdatedAt)
    VALUES (@ContractRecommendationId, @TemporaryHrRep, @UpdatedBy, GETDATE());
  `;

  const request = await tx.timed_request();
  await request
      .input('ContractRecommendationID', contractRecommendationId)
      .input('TemporaryHrRep', tempHrRep)
      .input('TemporaryHrEndDate', tempHrRepEndDate)
      .input('UpdatedBy', updatedBy)
      .timed_query(query, 'updateContractRecommendationHrRep');
}

const addContractRecommendationComment = async (tx, contractRecommendationId, createdBy, comment) => {
  const query = `
      INSERT INTO ContractHrComments (CreatedAt, CreatedBy, Comment)
      VALUES (GETDATE(), @CreatedBy, @Comment);

      INSERT INTO ContractHrCommentsContractRecommendations (ContractHrCommentId, ContractRecommendationId)
      VALUES (SCOPE_IDENTITY(), @ContractRecommendationID);
  `;

  const connection = await tx.timed_request();
  await connection
      .input('ContractRecommendationID', contractRecommendationId)
      .input('CreatedBy', createdBy)
      .input('Comment', comment)
      .timed_query(query, 'addContractRecommendationComment');
}

const getContractRecommendationNumbers = async (searchText, hrRep, endDate, jobTitlesText, companyEntitiesFilter) => {
  const query = `
    WITH SelectedJobTitles AS (
      SELECT value AS JobTitle
      FROM STRING_SPLIT(@JobTitlesText, ',')
    )
    SELECT
      [New],
      [To Terminate],
      [To Renew],
      [In Review],
      [Review Completed],
      [To Make Permanent],
      [Continue As Is]
    FROM (
      SELECT ContractId, [Status]
      FROM ContractRecommendationsActiveStatusLatestContractDates cal
      INNER JOIN
            StaffWithActiveDepartment swd ON swd.StaffId = cal.StaffId 
      WHERE 
            (@SearchText IS NULL OR (
                (cal.UserPrincipleName LIKE '%' + @SearchText + '%') OR
                (cal.DisplayName LIKE '%' + @SearchText + '%')
            ))
            AND (@HrRep IS NULL OR LOWER(cal.HrRep) = LOWER(@HrRep))
            AND (@EndDate IS NULL OR cal.NextReviewDate <= @EndDate)
            AND (@JobTitlesText IS NULL OR swd.JobTitle IN (SELECT JobTitle From SelectedJobTitles))
            AND (@CompanyEntitiesFilter IS NULL OR swd.CompanyEntityId IN (SELECT VALUE FROM STRING_SPLIT(@CompanyEntitiesFilter, ',')))
      ) as ContractsTable
      PIVOT( 
        COUNT(ContractID)
        FOR [Status] IN (
          [New],
          [To Terminate],
          [To Renew],
          [In Review],
          [Review Completed],
          [To Make Permanent],
          [Archived],
          [Continue As Is]
        )
      ) as ContractStatusNumbers
    `;
  const request = await db();
  const results = await request
    .input('SearchText', searchText)
    .input('HrRep', hrRep)
    .input('EndDate', endDate)
    .input('JobTitlesText', jobTitlesText)
    .input('CompanyEntitiesFilter', companyEntitiesFilter)
    .timed_query(query, 'getContractRecommendationNumbers');
  return results.recordset[0] ;
}

const getContractRecommendationCommentsForStaff  = async (userPrincipleName) => {
  const query = `
    SELECT
      chccr.ContractHrCommentsContractRecommendationId,
      chccr.ContractRecommendationId,
      chc.Comment,
      chc.CreatedAt,
      chc.CreatedBy,
      s.UserPrincipleName
    FROM 
      ContractHrCommentsContractRecommendations chccr
    INNER JOIN ContractHrComments chc 
      ON chc.ContractHrCommentId = chccr.ContractHrCommentId
    INNER JOIN ContractRecommendations cr 
      ON cr.ContractRecommendationId = chccr.ContractRecommendationId
    INNER JOIN Contracts c 
      ON c.ContractId = cr.ContractId
    INNER JOIN Staff s 
      ON s.StaffId = c.StaffId AND s.UserPrincipleName = @UserPrincipleName
  `

  const request = await db();
  const results = await request
    .input('UserPrincipleName', userPrincipleName)
    .timed_query(query, 'getContractRecommendationCommentsForStaff');
  return fixCase(results.recordset);
}

const getContractRecommendationComments = async (contractRecommendationId) => {
  const query = `
    SELECT 
      chccr.ContractHrCommentsContractRecommendationId,
      chccr.ContractRecommendationId,
      chc.Comment,
      chc.CreatedAt,
      chc.CreatedBy
    FROM ContractHrCommentsContractRecommendations chccr
    INNER JOIN ContractHrComments chc 
      ON chc.ContractHrCommentId = chccr.ContractHrCommentId
    WHERE
        chccr.ContractRecommendationId = @ContractRecommendationID
  `;

  const request = await db();
  const results = await request
    .input('ContractRecommendationID', contractRecommendationId)
    .timed_query(query, 'getContractRecommendationComments');
  return fixCase(results.recordset);
}

const putContractOnHold = async (tx, contractId, holdReason, hrRepUpn) => {
  const query = `
    UPDATE Contracts
    SET HoldReason = @HoldReason, OnHoldBy=@HrRepUPN
    WHERE ContractId = @ContractID
  `;

  const request = await tx.timed_request();
  await request
    .input('ContractID', contractId)
    .input('HoldReason', holdReason)
    .input('HrRepUPN', hrRepUpn)
    .timed_query(query, 'putContractOnHold');
}

const removeContractHold = async (tx, contractId) => {
  const query = `
    UPDATE Contracts
    SET HoldReason = NULL, OnHoldBy = NULL
    WHERE ContractId = @ContractID
  `;

  const request = await tx.timed_request();
  await request
    .input('ContractID', contractId)
    .timed_query(query, 'removeContractHold');
}

const getContractById = async (contractId) => {
  const query = `
    SELECT
      cwld.StaffId,
      cwld.ContractId,
      cwld.HoldReason,
      cwld.OnHoldBy,
      cwld.StartsAt,
      cwld.EndsAt,
      cwld.UpdatedBy,
      cwld.UpdatedAt,
      cwld.ScheduledBy
    FROM ContractsWithLatestDates cwld
    WHERE
      cwld.ContractId = @ContractID
  `;

  const request = await db();
  const results = await request
    .input('ContractID', contractId)
    .timed_query(query, 'getContractById');
  return fixCase(results.recordset)[0];
}

const getContractRecommendationCancellationReasons = async () => {
  const query = `
    SELECT
      ContractRecommendationCancellationReasonId,
      Reason
    FROM ContractRecommendationCancellationReasons
  `;

  const request = await db();
  const results = await request
    .timed_query(query, 'getContractRecommendationCancellationReasons');
  return fixCase(results.recordset);
}

const markContractAsScheduled = async (tx, contractId, scheduledBy) => {
  const query = `
    UPDATE Contracts
      SET ScheduledBy = @ScheduledBy
    WHERE ContractId = @ContractId
  `
  const connection = await tx.timed_request();
  await connection
    .input('ContractId', contractId)
    .input('ScheduledBy', scheduledBy)
    .timed_query(query, 'markContractAsScheduled');
}

const markContractAsUnscheduled = async (tx, contractId) => {
  await markContractAsScheduled(tx, contractId, undefined);
}

module.exports = {
  retrieveContracts,
  getAllContractRecommendations,
  makeContractorPermanent,
  getHrRepsWithRecommendations,
  createContractRecommendation,
  addContractRecommendationStaffReviewLink,
  contractHasActiveContractRecommendation,
  hasContractRecommendations,
  retrieveContractRecommendationId,
  retrieveFinalContractRecommendationStatus,
  updateContractDates,
  updateContractDatesTx,
  updateContractRecommendationHrRep,
  addContractRecommendationComment,
  getContractRecommendationNumbers,
  getContractRecommendationCommentsForStaff,
  getContractRecommendationComments,
  putContractOnHold,
  removeContractHold,
  getContractById,
  getContractRecommendationCancellationReasons,
  markContractAsScheduled,
  markContractAsUnscheduled,
  addTemporaryContractRecommendationHrRep,
};
