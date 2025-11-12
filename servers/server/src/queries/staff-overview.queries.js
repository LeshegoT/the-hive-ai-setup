const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const getAllStaffOverview = async (searchText, staffFilter, unit,entityFilterKeys) => {
  const query = `
    WITH Reviews AS (
        SELECT
            Reviewee,
            MAX(DueDate) AS DueDate
        FROM ReviewWithActiveStatus
        WHERE ReviewStatusId <> 13
        GROUP BY Reviewee
    )
    SELECT
        s.StaffId,
        s.DisplayName,
        s.UserPrincipleName,
        s.Department,
        s.EmploymentDate AS JoinedDate,
        s.StaffType,
        fat1.TemplateName as NextFeedbackType,
        sr.NextReviewDate,
        sr.StaffReviewId,
        fat2.TemplateName as currentFeedbackType,
        sub.currentReviewDate,
        sub.currentStaffReviewId,
        s.Manager AS Reviewer,
        s.EntityDescription as Entity,
        sub.currentHrRepDisplayName
    FROM StaffWithActiveDepartment s
        LEFT JOIN Reviews r
        ON r.Reviewee = s.UserPrincipleName
        LEFT JOIN StaffReview sr ON s.StaffId = sr.StaffId AND sr.ReviewId IS NULL AND sr.DeletedDate IS NULL
        LEFT JOIN (
            SELECT src.staffId, src.NextFeedbackTypeId AS currentFeedbackTypeId, src.NextReviewDate AS currentReviewDate,
                src.StaffReviewId AS currentStaffReviewId, 
                COALESCE(hr.DisplayName, rac.HrRep) as currentHrRepDisplayName
            FROM StaffReview src
                INNER JOIN ReviewWithActiveStatus rac ON rac.ReviewId = src.reviewId
                and rac.ReviewStatusId NOT IN (12, 13)
                INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId = rac.TemplateId
				        LEFT JOIN Staff hr ON hr.UserPrincipleName = rac.HrRep
            WHERE src.ReviewId IS NOT NULL
        ) sub ON s.StaffId = sub.StaffId
        LEFT JOIN FeedbackAssignmentTemplate fat1 on sr.NextFeedbackTypeId = fat1.FeedbackAssignmentTemplateId
        LEFT JOIN FeedbackAssignmentTemplate fat2 on sub.currentFeedbackTypeId = fat2.FeedbackAssignmentTemplateId
    WHERE s.StaffStatus <> 'terminated'
        and (s.staffTypeId is null OR s.staffTypeId not in (2,3))
        AND s.JobTitle not in ('Director', 'Executive', 'CEO', 'CIO', 'Other Executive Manager', 'Bursar')
        AND (@staffFilter is NULL OR @staffFilter != 'noReview' OR (@staffFilter='noReview' AND sr.NextReviewDate is NULL AND sub.currentReviewDate is NULL))
        AND (@staffFilter is NULL OR
             @staffFilter != 'newStaff' OR (
                @staffFilter='newStaff' AND
                DATEDIFF(MONTH, EmploymentDate, GETDATE()) < 6 AND
                sr.PreviousStaffReviewId IS NULL AND
                sub.currentReviewDate IS NULL AND (
                    sr.ReviewId IS NULL OR
                    CASE
                        WHEN DAY(s.EmploymentDate) <= 15 THEN DATEADD(MONTH, 5, DATEADD(DAY, 1 - DATEPART(DAY, s.EmploymentDate), s.EmploymentDate))
                        ELSE DATEADD(MONTH, 6, DATEADD(DAY, 1 - DATEPART(DAY, s.EmploymentDate), s.EmploymentDate))
                    END < sr.NextReviewDate
                )
            ))
        AND (@staffFilter is NULL OR
            @staffFilter != 'currentStaff' OR
            (@StaffFilter = 'currentStaff' AND (r.Reviewee IS NULL OR (DATEDIFF(MONTH, r.DueDate, GETDATE()) > 12 AND sub.currentReviewDate is NULL))
            AND (
              sr.NextReviewDate IS NULL
              OR ( DATEDIFF(MONTH, sr.NextReviewDate, GETDATE()) > 12 AND sr.NextReviewDate > GETDATE())
            ))
        )
        AND (@searchText is NULL OR(
            (s.UserPrincipleName = @searchText)
            ))
        AND (@unit is NULL OR (s.Department LIKE '%' + @unit + '%'))
         AND (@EntityFilterKeys IS NULL OR s.CompanyEntityId IN (SELECT VALUE FROM STRING_SPLIT(@EntityFilterKeys, ',')))
    `;

  const request = await db();
  const results = await request
    .input('searchText', searchText)
    .input('staffFilter', staffFilter)
    .input('EntityFilterKeys',entityFilterKeys)
    .input('unit', unit)
    .timed_query(query, 'getAllStaffOverview');
  return fixCase(results.recordset);
};

const getAllReviews = async (staffId) => {
  const query = `
    select
        r.Reviewee as userPrincipleName,
        sdpt.Department as Unit,
        sdpt.Manager as Reviewer,
        r.DueDate as ReviewDate,
        fat.TemplateName,
        fat.RequiresFeedback,
        r.ReviewStatus,
        r.HrRep,
        sr.StaffId,
        s.DisplayName,
        r.ReviewId,
        r.ReviewStatusId
    from staffReview sr
    INNER JOIN Staff s on sr.StaffId = s.StaffId
    left join (
      SELECT
        rwas.Reviewee,
        rwas.DueDate,
        rwas.HrRep,
        rwas.ReviewId,
        rwas.TemplateId,
        rs.Description AS ReviewStatus,
        rwas.ReviewStatusId
      FROM ReviewWithActiveStatus rwas
      INNER JOIN ReviewStatus rs
          ON rs.ReviewStatusId = rwas.ReviewStatusId AND rs.Description <> 'Cancelled'
    ) r on r.ReviewId = sr.ReviewId
    left join (SELECT sdt.StaffId, sdt.Department, sdt.StartDate, sdt.Manager,
        LEAD(sdt.StartDate, 1, '9999-12-31')
        OVER ( PARTITION BY sdt.StaffId ORDER BY sdt.StartDate ASC ) endDate
        FROM StaffDepartment sdt) sdpt on sr.StaffId=sdpt.StaffId
    LEFT JOIN FeedbackAssignmentTemplate fat on r.TemplateId = fat.FeedbackAssignmentTemplateId
    where sr.StaffId = @staffId
      and (fat.FeedbackAssignmentTemplateId is null OR fat.ManualFeedbackAssignment=1)
      and r.DueDate BETWEEN sdpt.StartDate and sdpt.endDate
   `;
  const request = await db();
  const results = await request
    .input('staffId', staffId)
    .timed_query(query, 'getAllReviews');
  return fixCase(results.recordset);
};

const getStaffId = async (upn) => {
  const query = `
        SELECT StaffId
        FROM Staff
        WHERE UserPrincipleName = @UPN
    `;

  const request = await db();
  const result = await request.input('UPN', upn).timed_query(query, 'getStaffId');
  return fixCase(result.recordset)[0];
};

const getStaffNamesByIds = async (staffIds) => {
  const query = `
        SELECT DisplayName AS UserName, BBDUserName , UserPrincipleName , StaffId, JobTitle, Department, Office, Manager,
         CAST(
          CASE
              WHEN BBDUserName LIKE 'bbdnet1[0-9][0-9][0-9][0-9]' THEN 1
              ELSE 0
          END
        AS BIT) AS IsIndia,
        EntityDescription AS Entity
        FROM DecoratedStaff
        WHERE StaffId IN (
        SELECT CAST(value AS INT) AS StaffId
        FROM STRING_SPLIT(@StaffIds, ',')
        )
    `;

  const request = await db();
  const result = await request
    .input('StaffIds', staffIds.join(','))
    .timed_query(query, 'getStaffNamesByIds');
  return fixCase(result.recordset);
};

const getAllStaffJobTitles = async () => {
  const query = `
        SELECT JobTitle
        FROM JobTitles`;
  const request = await db();
  const results = await request.timed_query(query, 'getAllStaffJobTitles');
  return fixCase(results.recordset);
};

module.exports = {
  getAllStaffOverview,
  getAllReviews,
  getStaffId,
  getStaffNamesByIds,
  getAllStaffJobTitles,
};
