/** @format */

import { isSqlTransaction, SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { FeedbackAssignmentWithDisplayName, ReviewWithDisplayNames } from "@the-hive/lib-reviews-shared";
import { Office } from "@the-hive/lib-shared";
import { BulkStaffReviewerReassignmentRequest, OnboardingStaff, OnboardingStaffWithContractDates, StaffDepartment, StaffFilter, StaffSpokenLanguage, StaffStatus, StaffStatusChangeReason, StaffStatusDetail, StaffType, StaffTypeDetail, StaffWithDirectReportsCount } from "@the-hive/lib-staff-shared";

interface StaffQueryResult {
  additionalInfo: string;
}

export async function retrieveStaffDisplayName(
  db: () => Promise<SqlRequest>,
  staffId: number,
): Promise<string | undefined> {
  const query = `
        SELECT DisplayName as displayName
        FROM Staff
        WHERE StaffId = @staffId
    `;

  const request = await db();
  const result = await request.input("staffId", staffId).timed_query(query, "retrieveStaffDisplayName");
  return result.recordset?.[0]?.["displayName"];
};

export const getStaffAdditionalInfo = async (
  db: () => Promise<SqlRequest>,
  upn: string,
): Promise<Record<string, unknown>> => {
  const q = `
    SELECT
      st.AdditionalInfo as additionalInfo
    FROM Staff st
    WHERE LOWER(st.UserPrincipleName) = LOWER(@UPN)
    `;

  const connection = await db();
  const results = await connection.input("UPN", upn).timed_query(q, "getStaffAdditionalInfo");

  const record = results.recordset[0] as StaffQueryResult;
  return JSON.parse(record?.additionalInfo || "{}");
};

export const updateStaffAdditionalInfo = async (
  db: () => Promise<SqlRequest>,
  upn: string,
  info: object,
): Promise<void> => {
  const q = `
    UPDATE Staff
    SET AdditionalInfo = @INFO
    WHERE LOWER(UserPrincipleName) = LOWER(@UPN)
    `;

  const valueToSet = JSON.stringify(info);

  const connection = await db();
  await connection
    .input("UPN", upn)
    .input("INFO", valueToSet != "{}" ? valueToSet : undefined)
    .timed_query(q, "updateStaffAdditionalInfo");
};

export const retrieveStaffWithOnboardingStatus = async (db: () => Promise<SqlRequest>): Promise<OnboardingStaffWithContractDates[]> => {
  const query = `
        WITH LatestContractDates AS (
          SELECT
            c.ContractId,
            c.StaffId,
            cdh.StartsAt,
            cdh.EndsAt,
            cdh.NextReviewDate,
            cdh.UpdatedAt AS ValidFrom,
            LEAD(cdh.UpdatedAt, 1, '9999-12-31') OVER (PARTITION BY cdh.ContractId ORDER BY UpdatedAt) AS ValidTo
          FROM Contracts c
          INNER JOIN ContractDateHistory cdh ON c.ContractId = cdh.ContractId
        ),
        LatestStaffReview AS (
          SELECT
            StaffReviewId,
            CreatedDate AS ValidFrom,
            LEAD(CreatedDate, 1, '9999-12-31') OVER (PARTITION BY StaffId ORDER BY CreatedDate) AS ValidTo,
            NextReviewDate,
            StaffId
          FROM StaffReview
          WHERE ReviewId IS NULL
                AND Scheduled = 0
                AND DeletedDate IS NULL
        )
        SELECT
            swmi.DisplayName AS displayName,
            swmi.StaffId AS staffId,
            swmi.BBDUserName AS bbdUserName,
            swmi.UserPrincipleName AS upn,
            swmi.JobTitle AS jobTitle,
            swmi.Department AS department,
            swmi.DepartmentId AS departmentId,
            swmi.Office AS office,
            swmi.OfficeId AS officeId,
            swmi.Manager AS manager,
            swmi.StaffType AS staffType,
            swmi.StaffTypeId AS staffTypeId,
            swmi.CompanyEntityAbbreviation AS companyEntityAbbreviation,
            swmi.CompanyEntityId AS companyEntityId,
            swmi.EmploymentDate AS employmentDate,
            sr.NextReviewDate AS probationaryReviewDate,
            lcd.StartsAt AS contractStartDate,
            lcd.EndsAt AS contractEndDate,
            lcd.NextReviewDate AS contractReviewDate
        FROM StaffWithMissingInfo swmi
        LEFT JOIN LatestStaffReview sr ON swmi.StaffId = sr.StaffId
            AND GETDATE() BETWEEN sr.ValidFrom AND sr.ValidTo
        LEFT JOIN LatestContractDates lcd ON swmi.StaffId = lcd.StaffId
            AND GETDATE() BETWEEN lcd.ValidFrom AND lcd.ValidTo
        WHERE swmi.StaffStatus = 'onboarding'
    `;

  const connection = await db();
  const results = await connection.timed_query(query, "retrieveStaffWithOnboardingStatus");

  return results.recordset as OnboardingStaffWithContractDates[];
};

export const retrieveStaffWithMissingInformation = async (
  db: () => Promise<SqlRequest>,
): Promise<OnboardingStaff[]> => {
  const query = `
        SELECT
            swmi.DisplayName AS displayName,
            swmi.StaffId AS staffId,
            swmi.BBDUserName AS bbdUserName,
            swmi.UserPrincipleName AS upn,
            swmi.JobTitle AS jobTitle,
            swmi.Department AS department,
            swmi.DepartmentId AS departmentId,
            swmi.Office AS office,
            swmi.OfficeId AS officeId,
            swmi.Manager AS manager,
            swmi.StaffType AS staffType,
            swmi.StaffTypeId AS staffTypeId,
            swmi.StaffStatus AS staffStatus,
            swmi.StaffStatusId AS staffStatusId,
            swmi.CompanyEntityAbbreviation AS companyEntityAbbreviation,
            swmi.CompanyEntityId AS companyEntityId
        FROM StaffWithMissingInfo swmi WHERE
            (swmi.Department IS NULL OR
            swmi.DepartmentId IS NULL OR
            swmi.Office IS NULL OR
            swmi.officeId IS NULL OR
            swmi.Manager IS NULL OR
            swmi.StaffType IS NULL OR
            swmi.StaffTypeId IS NULL OR
            swmi.StaffStatus is NULL OR
            swmi.StaffStatusId IS NULL OR
            swmi.CompanyEntityId IS NULL OR
            swmi.CompanyEntityAbbreviation IS NULL) AND
            swmi.StaffType <> 'Terminated'

    `;

  const connection = await db();
  const results = await connection.timed_query(query, "retrieveStaffWithMissingInfo");

  return results.recordset as OnboardingStaff[];
};

export const retrieveStaffStatuses = async (db: () => Promise<SqlRequest>): Promise<StaffStatusDetail[]> => {
  const query = `SELECT StaffStatusId AS staffStatusId, Status AS staffStatus FROM StaffStatus`;
  const connection = await db();
  const result = await connection.timed_query(query, "retrieveStaffStatuses");
  if (!result?.recordset) {
    return [];
  } else {
    return result.recordset as StaffStatusDetail[];
  }
};

export const retrieveStaffTypes = async (db: () => Promise<SqlRequest>): Promise<StaffTypeDetail[]> => {
  const query = `SELECT StaffTypeId AS staffTypeId, StaffType AS staffType FROM StaffType`;
  const connection = await db();
  const result = await connection.timed_query(query, "retrieveStaffTypes");
  return result.recordset as StaffTypeDetail[];
};

export const checkIfStaffIsAllowedToTransitionToStaffStatus = async (
  db: () => Promise<SqlRequest>,
  staffId: number,
  staffStatus: StaffStatus,
): Promise<boolean> => {
  const query = `
    WITH CurrentStatus AS (
      SELECT StaffStatusId
      FROM staffWithMissingInfo
      WHERE StaffId = @StaffId
    ),
    TargetStatus AS (
      SELECT StaffStatusId
      FROM StaffStatus
      WHERE [Status] = @StaffStatus
    )
    SELECT 1
    FROM StaffStatusTransitions ssp
    JOIN CurrentStatus cs ON ssp.FromStatusId = cs.StaffStatusId
    JOIN TargetStatus ts ON ssp.ToStatusId = ts.StaffStatusId
  `;

  const connection = await db();
  const results = await connection
    .input("StaffId", staffId)
    .input("StaffStatus", staffStatus)
    .timed_query(query, "checkIfStaffIsAllowedToTransitionToStaffStatus");
  return results.recordset.length > 0;
};

export const createStaffStatusHistory = async (
  tx: SqlTransaction,
  staffId: number,
  staffStatus: StaffStatus,
  updatedByUPN: string,
  updatedAt: Date = new Date()
): Promise<boolean> => {
  const query = `
    INSERT INTO StaffStatusHistory (
      StaffStatusId,
      StaffId,
      UpdatedBy,
      UpdatedAt
    ) VALUES (
      (SELECT StaffStatusId FROM StaffStatus WHERE [Status] = @StaffStatus),
      @StaffId,
      @UpdatedBy,
      @UpdatedAt
    )
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input("StaffId", staffId)
    .input("StaffStatus", staffStatus)
    .input("UpdatedBy", updatedByUPN)
    .input("UpdatedAt", updatedAt)
    .timed_query(query, "createStaffStatusHistory");

  return results.rowsAffected.length > 0;
};

export const createStaffTypeHistory = async (
  tx: SqlTransaction,
  staffId: number,
  staffType: StaffType,
  updatedByUPN: string,
): Promise<boolean> => {
  const query = `
    INSERT INTO StaffTypeHistory (
      StaffTypeId,
      StaffId,
      UpdatedBy,
      UpdatedAt
    ) VALUES (
      (SELECT StaffTypeId FROM StaffType WHERE StaffType = @StaffType),
      @StaffId,
      @UpdatedBy,
      GETDATE()
    )
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input("StaffId", staffId)
    .input("StaffType", staffType)
    .input("UpdatedBy", updatedByUPN)
    .timed_query(query, "createStaffTypeHistory");

  return results.rowsAffected.length > 0;
};

export const createCompanyEntityHistoryByEntityAbbreviation = async (
  tx: SqlTransaction,
  staffId: number,
  companyEntityAbbreviation: string,
  updatedByUPN: string,
  effectiveFrom: Date
): Promise<boolean> => {
  const query = `
    INSERT INTO StaffCompanyEntityHistory (
      CompanyEntityId,
      StaffId,
      UpdatedBy,
      UpdatedAt,
      EffectiveFrom
    ) VALUES (
      (SELECT CompanyEntityId FROM CompanyEntity WHERE Abbreviation = @CompanyEntityAbbreviation),
      @StaffId,
      @UpdatedBy,
      GETDATE(),
      @EffectiveFrom
    )
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input("StaffId", staffId)
    .input("CompanyEntityAbbreviation", companyEntityAbbreviation)
    .input("UpdatedBy", updatedByUPN)
    .input("EffectiveFrom", effectiveFrom)
    .timed_query(query, "createCompanyEntityHistoryByEntityAbbreviation");

  return results.rowsAffected.length > 0;
};

export const createStaffCompanyEntityHistory = async (
  tx: SqlTransaction,
  staffId: number,
  companyEntityId: number,
  updatedByUPN: string,
  effectiveFrom: Date
): Promise<boolean> => {
  const query = `
    INSERT INTO StaffCompanyEntityHistory (
      CompanyEntityId,
      StaffId,
      UpdatedBy,
      UpdatedAt,
      EffectiveFrom
    ) VALUES (
      @CompanyEntityId,
      @StaffId,
      @UpdatedBy,
      GETDATE(),
      @EffectiveFrom
    )
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input("StaffId", staffId)
    .input("CompanyEntityId", companyEntityId)
    .input("UpdatedBy", updatedByUPN)
    .input("EffectiveFrom", effectiveFrom)
    .timed_query(query, "createStaffCompanyEntityHistory");

  return results.rowsAffected.length > 0;
};

export const createStaffDepartmentHistory = async (
  tx: SqlTransaction,
  staffId: number,
  department: string,
  manager: string,
  updatedByUPN: string,
  effectiveFrom: Date
): Promise<boolean> => {
  const query = `
    WITH LatestStaffDepartment AS (
      SELECT sd.StaffId, sd.Department, sd.Manager, sd.StartDate,
      LEAD(sd.StartDate, 1, '9999-12-31')
      OVER (ORDER BY sd.StartDate ASC) endDate
      FROM StaffDepartment sd
      WHERE sd.StaffId=@StaffId
    )
    MERGE INTO StaffDepartment AS Target
    USING (
      SELECT
        COALESCE(@Department, lsd.Department) AS Department,
        COALESCE(@Manager, lsd.Manager) AS Manager
      FROM LatestStaffDepartment lsd
      WHERE GETDATE() BETWEEN lsd.StartDate AND lsd.endDate
      UNION ALL
      SELECT @Department, @Manager
      WHERE NOT EXISTS (SELECT 1 FROM LatestStaffDepartment)
    ) AS Source
    ON target.StaffId = @StaffId
    AND ISNULL(target.Department, '') = ISNULL(source.Department, '')
    AND ISNULL(target.Manager, '') = ISNULL(source.Manager, '')
    WHEN NOT MATCHED BY TARGET THEN
    INSERT (StaffId, Department, Manager, StartDate, UpdatedBy)
    VALUES (@StaffId, Source.Department, Source.Manager, @EffectiveFrom, @UpdatedBy);
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input("StaffId", staffId)
    .input("Department", department)
    .input("UpdatedBy", updatedByUPN)
    .input("Manager", manager)
    .input("EffectiveFrom", effectiveFrom)
    .timed_query(query, "createStaffDepartmentHistory");

  return results.rowsAffected.length > 0;
};

export const createNewStaffDepartmentEntry = async (
  tx: SqlTransaction,
  staffId: number,
  department: string,
  manager: string,
  startDate: Date,
  updatedByUPN: string,
): Promise<boolean> => {
  const query = `
    INSERT INTO StaffDepartment (
      StaffId,
      Department,
      Manager,
      StartDate,
      UpdatedBy
    ) VALUES (
      @StaffId,
      @Department,
      @Manager,
      @StartDate,
      @UpdatedBy
    )
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input("StaffId", staffId)
    .input("Department", department)
    .input("StartDate", startDate)
    .input("Manager", manager)
    .input("UpdatedBy", updatedByUPN)
    .timed_query(query, "createNewStaffDepartmentEntry");

  return results.rowsAffected.length > 0;
};

export const updateStaffOffice = async (tx: SqlTransaction, staffId: number, officeId: number, updatedByUPN: string): Promise<boolean> => {
  const query = `
    Update Staff SET OfficeId = @OfficeId WHERE StaffId = @StaffId
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('StaffId', staffId)
    .input('OfficeId', officeId)
    .input('UpdatedBy', updatedByUPN)
    .timed_query(
      query,
      'updateStaffOffice'
    );

  return results.rowsAffected.length > 0;
}

export const updateStaffOfficeByOfficeName = async (tx: SqlTransaction, staffId: number, officeName: string, updatedByUPN: string): Promise<boolean> => {
  const query = `
    Update Staff SET OfficeId = (SELECT OfficeId FROM Offices WHERE OfficeName = @OfficeName) WHERE StaffId = @StaffId
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('StaffId', staffId)
    .input('OfficeName', officeName)
    .input('UpdatedBy', updatedByUPN)
    .timed_query(query, 'updateStaffOfficeByOfficeName');

  return results.rowsAffected.length > 0;
}

export const retrieveStaffByFilter = async (
  dbOrTx: (() => Promise<SqlRequest>) | SqlTransaction,
  staffFilter: StaffFilter,
  activeAndOnboardingStaffOnly = false,
): Promise<StaffWithDirectReportsCount[]> => {
  const query = `
    WITH DirectReportingStaff AS (
      SELECT
        COUNT(dr.UserPrincipleName) as DirectReports,
        ds.UserPrincipleName as ManagerUpn
      FROM DecoratedStaff ds
      INNER JOIN DecoratedStaff dr ON dr.Manager = ds.UserPrincipleName AND dr.StaffStatus IN ('active', 'onboarding')
      GROUP BY ds.UserPrincipleName
    )
    SELECT
      ds.DisplayName AS displayName,
      ds.StaffId AS staffId,
      ds.BBDUserName AS bbdUserName,
      ds.UserPrincipleName AS upn,
      ds.JobTitle AS jobTitle,
      ds.Department AS department,
      ds.Office AS office,
      ds.Manager AS manager,
      ds.StaffType AS staffType,
      ds.StaffTypeId AS staffTypeId,
      ds.CompanyEntityId AS companyEntityId,
      ds.EntityAbbreviation AS entityAbbreviation,
      ds.EntityDescription AS entityDescription,
      ds.EmploymentDate AS employmentDate,
      ds.StaffStatusId AS staffStatusId,
      ds.StaffStatus AS staffStatus,
      COALESCE(drs.DirectReports, 0) AS directReportsCount
    FROM DecoratedStaff ds
    LEFT JOIN DirectReportingStaff drs ON ds.UserPrincipleName = drs.ManagerUpn
    WHERE
      (
      (@displayName IS NOT NULL AND ds.DisplayName LIKE '%' + @displayName + '%')
      OR (@staffIds IS NOT NULL AND ds.StaffId IN (SELECT value FROM STRING_SPLIT(@staffIds, ',')))
      OR (@bbdUserName IS NOT NULL AND ds.BBDUserName LIKE '%' + @bbdUserName + '%')
      OR (@upn IS NOT NULL AND ds.UserPrincipleName LIKE '%' + @upn + '%')
      OR (@jobTitle IS NOT NULL AND ds.JobTitle LIKE '%' + @jobTitle + '%')
      OR (@department IS NOT NULL AND ds.Department LIKE '%' + @department + '%')
      OR (@office IS NOT NULL AND ds.Office LIKE '%' + @office + '%')
      OR (@manager IS NOT NULL AND ds.Manager LIKE '%' + @manager + '%')
      OR (@staffTypes IS NOT NULL AND ds.StaffType IN (SELECT value FROM STRING_SPLIT(@staffTypes, ',')))
      OR (@entityAbbreviation IS NOT NULL AND ds.EntityAbbreviation LIKE '%' + @entityAbbreviation + '%')
      OR (@employmentDate IS NOT NULL AND ds.EmploymentDate = @employmentDate)
      OR (@staffStatuses IS NOT NULL AND ds.StaffStatus IN (SELECT value FROM STRING_SPLIT(@staffStatuses, ',')))
      OR (@retrieveAllRows = 1)
      )
      AND (@activeAndOnboardingStaffOnly = 0 OR ds.StaffStatus IN ('active', 'onboarding'))
  `;

  const retrieveAllRows = Object.values(staffFilter).every(value => value === undefined) || Object.keys(staffFilter).length === 0;

  let sqlRequest: SqlRequest;
  if (isSqlTransaction(dbOrTx)) {
    sqlRequest = await dbOrTx.timed_request();
  } else {
    sqlRequest = await dbOrTx();
  }

  const results = await sqlRequest
    .input("displayName", staffFilter.displayName)
    .input("staffIds", staffFilter.staffIds?.join(","))
    .input("bbdUserName", staffFilter.bbdUserName)
    .input("upn", staffFilter.upn)
    .input("jobTitle", staffFilter.jobTitle)
    .input("department", staffFilter.department)
    .input("office", staffFilter.office)
    .input("manager", staffFilter.manager)
    .input("staffTypes", staffFilter.staffTypes?.join(","))
    .input("entityAbbreviation", staffFilter.entityAbbreviation)
    .input("employmentDate", staffFilter.employmentDate)
    .input("staffStatuses", staffFilter.staffStatuses?.join(","))
    .input("retrieveAllRows", retrieveAllRows)
    .input("activeAndOnboardingStaffOnly", activeAndOnboardingStaffOnly)
    .timed_query(query, "retrieveStaffByFilter");

  return results.recordset as StaffWithDirectReportsCount[];
};

export const retrieveActiveStaffDepartment = async (
  db: () => Promise<SqlRequest>,
  staffId: number,
): Promise<StaffDepartment> => {
  const query = `
    WITH StaffDepartmentActiveRanges AS (
      SELECT
        sd.staffDepartmentId,
        sd.StaffId,
        sd.Department,
        sd.Manager,
        sd.StartDate,
        LEAD(sd.StartDate, 1, '9999-12-31') OVER (PARTITION BY sd.StaffId ORDER BY sd.StartDate ASC) endDate
      FROM StaffDepartment sd
      WHERE sd.StaffId = @StaffId
    )
    SELECT
      StaffId as staffId,
      StaffDepartmentId as staffDepartmentId,
      Department as department,
      Manager as manager,
      StartDate as startDate
    FROM StaffDepartmentActiveRanges
    WHERE GETDATE() BETWEEN StartDate AND endDate
  `;

  const connection = await db();
  const results = await connection.input("StaffId", staffId).timed_query(query, "retrieveActiveStaffDepartment");

  return results.recordset[0] as StaffDepartment;
};

export const updateStaffJobTitle = async (tx: SqlTransaction, staffId: number, jobTitle: string): Promise<boolean> => {
  const query = `
    Update Staff SET JobTitle = @JobTitle WHERE StaffId = @StaffId
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input("StaffId", staffId)
    .input("JobTitle", jobTitle)
    .timed_query(query, "updateStaffJobTitle");

  return results.rowsAffected.length > 0;
};

export const getStaffId = async (db: () => Promise<SqlRequest>, upn: string): Promise<number | undefined> => {
  const query = `
    SELECT StaffId AS staffId FROM Staff WHERE UserPrincipleName = @UPN
  `;

  const connection = await db();
  const results = await connection.input("UPN", upn).timed_query(query, "getStaffId");
  return (results.recordset[0] as { staffId: number })?.staffId;
}

export const createStaffMember = async (
  tx: SqlTransaction,
  upn: string,
  displayName: string,
  bbdUsername: string,
  jobTitle: string,
): Promise<number> => {
  const query = `
    INSERT INTO Staff (
      UserPrincipleName,
      DisplayName,
      BBDUserName,
      JobTitle
    )
    OUTPUT INSERTED.StaffId AS staffId
    VALUES (
      @UPN,
      @DisplayName,
      @BBDUserName,
      @JobTitle
    )
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input("UPN", upn)
    .input("DisplayName", displayName)
    .input("BBDUserName", bbdUsername)
    .input("JobTitle", jobTitle)
    .timed_query(query, "createStaffMember");
  return (results.recordset[0] as { staffId: number })?.staffId;
}

export const retrieveOffices = async (db: () => Promise<SqlRequest>): Promise<Office[]> => {
  const query = `SELECT OfficeId as officeId, OfficeName as officeName FROM Offices`;
  const connection = await db();
  const results = await connection.timed_query(query, "retrieveOffices");
  return results.recordset as Office[];
}

export const updateStaffEmploymentDate = async (tx: SqlTransaction, staffId: number, employmentDate: Date): Promise<boolean> => {
  const query = `
    Update Staff SET EmploymentDate = @EmploymentDate WHERE StaffId = @StaffId
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input("StaffId", staffId)
    .input("EmploymentDate", employmentDate)
    .timed_query(query, "updateStaffEmploymentDate");
  return results.rowsAffected.length > 0;
}

export const retrieveActiveFeedbackAssignmentsWithDisplayNames = async (db: () => Promise<SqlRequest>, upn: string): Promise<FeedbackAssignmentWithDisplayName[]> => {
  const query = `
    SELECT
      fawas.feedbackAssignmentId,
      s.DisplayName as revieweeDisplayName,
      r.hrRep,
      shr.DisplayName as hrRepDisplayName,
      fas.StatusDescription as feedbackAssignmentStatus,
      fawas.feedbackDeadline
    FROM FeedbackAssignmentsWithActiveStatus fawas
    INNER JOIN FeedbackAssignmentStatus fas ON fawas.FeedbackAssignmentStatusId = fas.FeedbackAssignmentStatusId
      AND fas.StatusDescription IN ('New', 'Viewed', 'Started', 'Saved for Later')
    INNER JOIN ReviewWithActiveStatus r ON r.ReviewId = fawas.ReviewId
    LEFT JOIN Staff s ON r.Reviewee = s.UserPrincipleName
    LEFT JOIN Staff shr ON r.HrRep = shr.UserPrincipleName
	  LEFT JOIN Staff sReviewer ON sReviewer.UserPrincipleName = fawas.Reviewer
    WHERE sReviewer.UserPrincipleName = @UPN
      AND fawas.DeletedDate IS NULL AND fawas.DeletedBy IS NULL
  `;

  const connection = await db();
  const result = await connection.input('UPN', upn).timed_query(query, 'retrieveActiveFeedbackAssignmentsWithDisplayNames');
  return result.recordset as FeedbackAssignmentWithDisplayName[];
}

export const retrieveActiveReviewsWithDisplayNames = async (db: () => Promise<SqlRequest>, { hrRepUpn, revieweeUpn }: { hrRepUpn?: string, revieweeUpn?: string }): Promise<ReviewWithDisplayNames[]> => {
  const query = `
    SELECT
      r.reviewId,
      r.reviewee,
      s.displayName as revieweeDisplayName,
      r.hrRep,
      shr.displayName as hrRepDisplayName,
      rs.Description as reviewStatus,
      r.dueDate
    FROM ReviewWithActiveStatus r
    INNER JOIN ReviewStatus rs ON r.ReviewStatusId = rs.ReviewStatusId AND rs.Description NOT IN ('Archived', 'Cancelled')
      LEFT JOIN Staff s ON r.Reviewee = s.UserPrincipleName
      LEFT JOIN Staff shr ON r.HrRep = shr.UserPrincipleName
      WHERE (@hrRepUpn IS NULL OR r.hrRep = @hrRepUpn) AND (@revieweeUpn IS NULL OR r.reviewee = @revieweeUpn)
  `;

  const connection = await db();
  const result = await connection
    .input('hrRepUpn', hrRepUpn)
    .input('revieweeUpn', revieweeUpn)
    .timed_query(query, 'retrieveActiveReviewsWithDisplayNames');
  return result.recordset as ReviewWithDisplayNames[];
}

/**
 * Finds the language ID for a given language name, creating it if it doesn't exist.
 * Uses a case-insensitive comparison to check if the language already exists.
 *
 * @param {SqlTransaction} tx - The database transaction to use for the query
 * @param {string} language - The name of the language to find or create
 * @returns {Promise<number>} The SpokenLanguageId for the given language
 */
export const findOrCreateSpokenLanguageIdByLanguageDescription = async (
  tx: SqlTransaction,
  language: string
): Promise<number> => {
  const query = `
  MERGE SpokenLanguages AS TARGET
  USING (SELECT @Language AS SpokenLanguage) AS SOURCE
  ON UPPER(TARGET.SpokenLanguage) = UPPER(SOURCE.SpokenLanguage)
  WHEN NOT MATCHED THEN
      INSERT (SpokenLanguage) VALUES (SOURCE.SpokenLanguage);

  SELECT SpokenLanguageId
  FROM SpokenLanguages
  WHERE SpokenLanguage = @Language
  `;

  const result = await tx.timed_request();
  const results = await result
    .input("Language", language)
    .timed_query(query, "findLanguageId");

  return (results.recordset as { SpokenLanguageId: number }[])[0].SpokenLanguageId;
};

export const findLanguageProficiencyIdByProficiencyDescription = async (db: () => Promise<SqlRequest>, proficiency: string): Promise<number> => {
  const query = `
  SELECT SpokenLanguageProficiencyId FROM SpokenLanguageProficiencies WHERE Proficiency = @Proficiency
  `;
  const result = await db();
  const results = await result
      .input("Proficiency", proficiency)
      .timed_query(query, "findLanguageProficiencyId");
  return (results.recordset[0] as { SpokenLanguageProficiencyId: number }).SpokenLanguageProficiencyId;
}
export const addStaffSpokenLanguage = async (transaction: SqlTransaction, staffId: number, languageId: number, proficiencyId: number): Promise<void> => {
  const query = `
  MERGE StaffSpokenLanguageProficiencies AS TARGET
  USING (VALUES (@StaffId, @LanguageId, @ProficiencyId)) AS SOURCE (StaffId, LanguageId, ProficiencyId)
  ON TARGET.StaffId = SOURCE.StaffId AND TARGET.LanguageId = SOURCE.LanguageId
  WHEN MATCHED THEN
      UPDATE SET ProficiencyId = SOURCE.ProficiencyId
  WHEN NOT MATCHED THEN
      INSERT (StaffId, LanguageId, ProficiencyId)
      VALUES (SOURCE.StaffId, SOURCE.LanguageId, SOURCE.ProficiencyId);
  `;
  const request = await transaction.timed_request();
  await request
      .input("StaffId", staffId)
      .input("LanguageId", languageId)
      .input("ProficiencyId", proficiencyId)
      .timed_query(query, "addStaffSpokenLanguage");
}

export const retrieveStaffSpokenLanguages = async (db: () => Promise<SqlRequest>, staffId: number): Promise<StaffSpokenLanguage[]> => {
  const query = `
  SELECT
      sl.SpokenLanguage as language,
      slp.Proficiency as proficiency
  FROM StaffSpokenLanguageProficiencies sspl
  INNER JOIN SpokenLanguages sl ON sspl.LanguageId = sl.SpokenLanguageId
  INNER JOIN SpokenLanguageProficiencies slp ON sspl.ProficiencyId = slp.SpokenLanguageProficiencyId
  WHERE sspl.StaffId = @StaffId
  `;
  const result = await db();
  const results = await result
      .input("StaffId", staffId)
      .timed_query(query, "retrieveStaffSpokenLanguages");
  return results.recordset as StaffSpokenLanguage[];
}

export const retrieveLanguageProficiencies = async (db: () => Promise<SqlRequest>): Promise<string[]> => {
  const query = `
  SELECT
      Proficiency as proficiency
  FROM SpokenLanguageProficiencies
  `;
  const result = await db();
  const results = await result.timed_query(query, "retrieveLanguageProficiencies");
  return results.recordset.map((row: { proficiency: string }) => row.proficiency);
}

export const deleteStaffSpokenLanguage = async (transaction: SqlTransaction, staffId: number, staffSpokenLanguage: StaffSpokenLanguage): Promise<void> => {
  const query = `
  DELETE FROM StaffSpokenLanguageProficiencies
  WHERE StaffId = @StaffId
  AND LanguageId = (
      SELECT SpokenLanguageId
      FROM SpokenLanguages
      WHERE SpokenLanguage = @Language
  )
  AND ProficiencyId = (
      SELECT SpokenLanguageProficiencyId
      FROM SpokenLanguageProficiencies
      WHERE Proficiency = @Proficiency
  );
  `;
  const request = await transaction.timed_request();
  await request
      .input("StaffId", staffId)
      .input("Language", staffSpokenLanguage.language)
      .input("Proficiency", staffSpokenLanguage.proficiency)
      .timed_query(query, "deleteStaffSpokenLanguage");
}

export const bulkReassignStaffToNewReviewer = async (tx: SqlTransaction, bulkReviewerReassignmentRequest: BulkStaffReviewerReassignmentRequest, updatedByUpn: string): Promise<boolean> => {
  const query = `
    WITH StaffIds AS (
      SELECT VALUE as StaffId
      FROM STRING_SPLIT(@StaffIds, ',')
    ),
    CurrentStaffUnits AS (
      SELECT ds.StaffId, ds.Department
      FROM DecoratedStaff ds
      WHERE ds.StaffId IN (SELECT StaffId FROM StaffIds)
    ),
    NewStaffDepartments AS (
      SELECT csu.Department, @NewManagerUpn AS NewManagerUpn, @EffectiveDate AS EffectiveDate, csu.StaffId
      FROM CurrentStaffUnits csu
    )
    INSERT INTO StaffDepartment (Department, Manager, StartDate, StaffId, UpdatedBy)
    SELECT nsd.Department, nsd.NewManagerUpn, nsd.EffectiveDate, nsd.StaffId, @UpdatedByUpn
    FROM NewStaffDepartments nsd
  `;

  const transactionRequest = await tx.timed_request();
  const results = await transactionRequest
    .input("StaffIds", bulkReviewerReassignmentRequest.staffIds.join(","))
    .input("NewManagerUpn", bulkReviewerReassignmentRequest.newManagerUpn)
    .input("EffectiveDate", bulkReviewerReassignmentRequest.effectiveDate)
    .input("UpdatedByUpn", updatedByUpn)
    .timed_query(query, "bulkReassignReviewers");

  return results.rowsAffected.every(rowsAffected => rowsAffected > 0);
}

export const retrieveStaffStatusChangeReasons = async (db: () => Promise<SqlRequest>): Promise<StaffStatusChangeReason[]> => {
  const query = `
    SELECT
      sscr.reason,
      sscr.nextStaffStatusId,
      ss.Status AS nextStaffStatus
    FROM StaffStatusChangeReason sscr
    INNER JOIN StaffStatus ss ON ss.StaffStatusId = sscr.NextStaffStatusId
    WHERE DeletedDate IS NULL
  `;

  const connection = await db();
  const results = await connection.timed_query(query, "retrieveStaffStatusChangeReasons");

  return results.recordset as StaffStatusChangeReason[];
}

export const updateStaffDateOfBirth = async (tx: SqlTransaction, staffId: number, dateOfBirth: Date): Promise<boolean> => {
  const query = `
    Update Staff SET DateOfBirth = @DateOfBirth WHERE StaffId = @StaffId
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('StaffId', staffId)
    .input('DateOfBirth', dateOfBirth)
    .timed_query(query, "updateStaffDateOfBirth");
  return results.rowsAffected.every(rowsAffected => rowsAffected > 0);
};

export const updateStaffResidence = async (tx: SqlTransaction, staffId: number, staffResidence: string): Promise<boolean> =>
    {
    const query = `
      UPDATE Staff SET Residence = @Residence WHERE StaffId = @StaffId
    `;

    const connection = await tx.timed_request();
    const results = await connection
    .input('StaffId', staffId)
    .input('Residence', staffResidence)
    .timed_query(query, "updateStaffResidence");
    return results.rowsAffected.every(rowsAffected => rowsAffected > 0);
  }


export const retrieveStaffNationalities = async (db: () => Promise<SqlRequest>): Promise<string[]> => {
  const query = `
    SELECT DISTINCT Nationality FROM Staff WHERE Nationality IS NOT NULL
  `;
  const connection = await db();
  const results = await connection.timed_query(query, "retrieveStaffNationalities");
  return results.recordset.map((row: { Nationality: string }) => row.Nationality);
}

export const updateStaffNationality = async (tx: SqlTransaction, staffId: number, nationality: string): Promise<boolean> => {
  const query = `
    Update Staff SET Nationality = @Nationality WHERE StaffId = @StaffId
  `;
  const connection = await tx.timed_request();
  const results = await connection
    .input('StaffId', staffId)
    .input('Nationality', nationality)
    .timed_query(query, "updateStaffNationality");
  return results.rowsAffected.every(rowsAffected => rowsAffected > 0);
}