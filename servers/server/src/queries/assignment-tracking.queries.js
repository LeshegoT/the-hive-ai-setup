const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const getAllAssignmentTracking = async (searchText, manager) => {
  const query = `
    with outstandingFeedbackAssignments as(
        SELECT s.StaffId ,
        s.DisplayName,
        s.UserPrincipleName,
        s.Department,
        s.Manager,
        s.JobTitle,
        s.EntityDescription,
        s.StaffStatus,
            count(1) as outstandingFeedbackAssignmentsForStaffMember,
            min(fawas.FeedbackDeadline) as mostOutstanding
       FROM FeedbackAssignmentsWithActiveStatus fawas
       INNER JOIN ReviewWithActiveStatus r
         ON r.ReviewId = fawas.ReviewId
           AND r.TemplateId in (SELECT FeedbackAssignmentTemplateId FROM FeedbackAssignmentTemplate)
           AND r.ReviewStatusId NOT IN (12, 13)
           AND r.DeletedBy is null
       INNER JOIN DecoratedStaff s
         ON fawas.Reviewer = s.UserPrincipleName
           and s.StaffStatus <> 'terminated'
       INNER JOIN FeedbackAssignmentStatus fs
         ON fs.FeedbackAssignmentStatusId = fawas.FeedbackAssignmentStatusId
           AND fs.StatusDescription  NOT IN ('Completed', 'Retracted', 'Deleted')
       WHERE fawas.DeletedDate IS NULL
           AND fawas.FeedbackDeadline < GETDATE()
       GROUP BY s.StaffId,
		    s.DisplayName,
        s.UserPrincipleName,
        s.Department,
        s.Manager,
        s.JobTitle,
        s.EntityDescription,
        s.StaffStatus
       HAVING count(1) > 0
   )
   SELECT
    ofa.StaffId,
    ofa.DisplayName,
    ofa.UserPrincipleName,
    ofa.Department,
    ofa.Manager,
    ofa.JobTitle,
    ofa.EntityDescription,
    ofa.outstandingFeedbackAssignmentsForStaffMember AS numberOfOutstandingAssignments,
    ofa.mostOutstanding
FROM outstandingFeedbackAssignments ofa
      WHERE (@searchText is NULL OR(
            (ofa.UserPrincipleName LIKE '%' + @searchText + '%') OR
            (ofa.Department LIKE '%' + @searchText + '%') OR
            (ofa.DisplayName LIKE '%' + @searchText + '%')))
        AND (@manager IS NULL OR (LOWER(ofa.Manager) = LOWER(@manager)))
        AND ofa.StaffStatus <> 'terminated'
    order by ofa.mostOutstanding asc, ofa.outstandingFeedbackAssignmentsForStaffMember desc
    `;

  const request = await db();
  const results = await request
    .input('searchText', searchText)
    .input('manager', manager)
    .timed_query(query, 'getAllAssignmentTracking');
  return fixCase(results.recordset);
};

const getAllFeedbackAssignments = async (upn) => {
  const query = `
    SELECT fawas.Reviewer,
        fawas.AssignedBy,
        fawas.FeedbackDeadline as DueBy,
        fawas.MessageId,
        fawas.FeedbackAssignmentID,
        fawas.DeletedDate,
        fawas.DeletedBy,
        fawas.ReviewId,
        fawas.ConstructiveMessageId,
        fawas.Anonymous,
        fawas.ClientEmail,
        fawas.RetractionReasonId,
        fs.StatusDescription as Status,
        fawas.UpdateDate,
        r.Reviewee,
        fat.TemplateName,
        COALESCE(fnc.HRNudges, 0) as hrNudges,
        COALESCE(fnc.SystemNudges, 0) as SystemNudges,
        r.HrRep
    FROM FeedbackAssignmentsWithActiveStatus fawas
    INNER JOIN Staff s
      ON fawas.Reviewer = s.UserPrincipleName
        and s.UserPrincipleName = @userPrincipleName
    INNER JOIN FeedbackAssignmentStatus fs
      ON fs.FeedbackAssignmentStatusId = fawas.FeedbackAssignmentStatusId
        AND fs.StatusDescription  NOT IN ('Completed', 'Retracted', 'Deleted')
    INNER JOIN ReviewWithActiveStatus r
      ON fawas.ReviewId = r.ReviewId
        AND r.ReviewStatusId NOT IN (12, 13)
        AND r.DeletedBy is null
    INNER JOIN FeedbackAssignmentTemplate fat
      ON r.TemplateId = fat.FeedbackAssignmentTemplateId
    LEFT JOIN FeedbackAssignmentNudgeCount fnc ON fawas.FeedbackAssignmentID = fnc.FeedbackAssignmentId
    WHERE fawas.DeletedDate IS NULL
      AND fawas.FeedbackDeadline < GETDATE()
    `;

  const request = await db();
  const results = await request
    .input('userPrincipleName', upn)
    .timed_query(query, 'getAllFeedbackAssignments');
  return fixCase(results.recordset);
};

const getOverdueFeedbackAssignments = async (upn) => {
  const query = `
    SELECT fawas.Reviewer,
        s.DisplayName,
        fawas.FeedbackDeadline as DueBy,
        fawas.FeedbackAssignmentID,
        fawas.ReviewId,
        fawas.UpdateDate,
        r.Reviewee,
        sad.DisplayName as RevieweeName,
        fat.TemplateName,
        COALESCE(fnc.HRNudges, 0) as HRNudges,
        COALESCE(fnc.SystemNudges, 0) as SystemNudges
    FROM FeedbackAssignmentsWithActiveStatus fawas
    INNER JOIN Staff s
      ON fawas.Reviewer = s.UserPrincipleName
        and s.UserPrincipleName = @UPN
    INNER JOIN FeedbackAssignmentStatus fs
      ON fs.FeedbackAssignmentStatusId = fawas.FeedbackAssignmentStatusId
        AND fs.StatusDescription  NOT IN ('Completed', 'Retracted', 'Deleted')
    INNER JOIN ReviewWithActiveStatus r 
      ON fawas.ReviewId = r.ReviewId
        AND r.ReviewStatusId NOT IN (12, 13)
        AND r.DeletedBy is null
    INNER JOIN FeedbackAssignmentTemplate fat
      ON r.TemplateId = fat.FeedbackAssignmentTemplateId
        AND fat.TemplateName in ('Annual', 'Probationary', 'Interim')
    LEFT JOIN FeedbackAssignmentNudgeCount fnc ON fawas.FeedbackAssignmentID = fnc.FeedbackAssignmentId
    LEFT JOIN StaffWithActiveDepartment sad ON sad.UserPrincipleName = r.Reviewee
    WHERE fawas.DeletedDate IS NULL
      AND fawas.FeedbackDeadline < GETDATE()
      AND sad.StaffStatus <> 'terminated'
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(query, 'getOverdueFeedbackAssignments');
  return fixCase(results.recordset);
};

module.exports = {
  getAllAssignmentTracking,
  getAllFeedbackAssignments,
  getOverdueFeedbackAssignments,
};
