import { fixCase } from "@the-hive/lib-core";
import { isSqlTransaction, SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { DetailedReviewStatus, FeedbackAssignmentRetractionReason, FeedbackAssignmentTemplate, ReviewAudit, ReviewStatusProgression } from "@the-hive/lib-reviews-shared";
import { Pagination } from "@the-hive/lib-shared";

export const findStaffReviewId = async (db: () => Promise<SqlRequest>, reviewId: number): Promise<number> => {
  const query = `
    SELECT StaffReviewId as staffReviewId
    FROM StaffReview
    WHERE ReviewId = @ReviewId
  `;

  const connection = await db();
  const result = await connection
    .input('ReviewId', reviewId)
    .timed_query(query, 'findStaffReviewId');

  return result.recordset.length > 0 ?
    fixCase(result.recordset as { staffReviewId: number }[])[0].staffReviewId
    : undefined;
};

export const retrieveReviewStatusId = async (db: () => Promise<SqlRequest>, reviewId: number): Promise<{ reviewStatusId: number }> => {
  const q = `
    SELECT ReviewStatusId as reviewStatusId
    FROM ReviewWithActiveStatus
    WHERE ReviewId = @ReviewId
  `;
  const connection = await db();
  const result = await connection
    .input('ReviewId', reviewId)
    .timed_query(q, 'retrieveReviewStatusId');
  return (result.recordset)[0] as { reviewStatusId: number };
};

export const retrieveDetailedReviewStatuses = async (db: () => Promise<SqlRequest>): Promise<DetailedReviewStatus[]> => {
  const query = `
    SELECT ReviewStatusId as reviewStatusId, Description as description, ActionName as actionName
    FROM ReviewStatus
  `;

  const connection = await db();
  const result = await connection.timed_query(query, 'retrieveReviewStatuses');
  return result.recordset as DetailedReviewStatus[];
};

export const retrieveAllowedReviewStatusProgressions = async (db: () => Promise<SqlRequest>): Promise<ReviewStatusProgression[]> => {
  const query = `
    SELECT
      AllowedReviewStatusId as allowedReviewStatusId,
      CurrentStatusId as currentStatusId,
      NextStatusId as nextStatusId
    FROM AllowedReviewStatus
  `

  const connection = await db();
  const result = await connection.timed_query(query, 'retrieveAllowedReviewStatusProgressions');
  return result.recordset as ReviewStatusProgression[];
}

export const deleteReview = async (tx: SqlTransaction, id: number, upn: string) => {
  const q = `
        UPDATE Review
        SET DeletedDate = GETDATE(),
            DeletedBy = @UPN
        WHERE ReviewId = @ID

        INSERT INTO ReviewStatusHistory(ReviewId, ReviewStatusId, UpdatedBy, UpdatedDate)
        SELECT
          @ID,
          (SELECT ReviewStatusId FROM ReviewStatus WHERE ActionName = 'Cancelled'),
          @UPN,
          GETDATE()
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('ID', id)
    .input('UPN', upn)
    .timed_query(q, 'deleteReview');

  return results;
};

export const insertReviewComment = async (
  tx: SqlTransaction,
  id: number,
  createdBy: string,
  comment: string,
  isMeetingMinutes = false
): Promise<void> => {
  const query = `
      INSERT INTO ReviewHRComments (DateCreated, CreatedBy, Comment)
      VALUES(GETDATE() ,@createdBy, @comment);
      INSERT INTO ReviewHRCommentsReviews (ReviewHRCommentId, ReviewId, IsMeetingMinutes)
      VALUES(SCOPE_IDENTITY(), @ID, @isMeetingMinutes);
  `;
  const connection = await tx.timed_request();
  await connection
    .input('ID', id)
    .input('createdBy', createdBy)
    .input('comment', comment)
    .input('isMeetingMinutes', isMeetingMinutes)
    .timed_query(query, 'addReviewComment');
};

export const deleteStaffReview = async (tx: SqlTransaction, staffReviewId: number, upn: string) => {
  const q = `
      UPDATE StaffReview
      SET DeletedDate = GETDATE(),
          DeletedBy = @UPN
      WHERE StaffReviewId = @StaffReviewId
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('StaffReviewId', staffReviewId)
    .input('UPN', upn)
    .timed_query(q, 'deleteStaffReview');
  return result.rowsAffected.length > 0;
};

export const insertStaffReview = async (
  tx: SqlTransaction,
  createdBy: string,
  staffId: number,
  nextReviewDate: Date,
  previousStaffReviewId: number,
  nextTypeId: number,
  holdReason: string = undefined,
  onHoldBy: string = undefined,
  PlacedOnHoldDate: Date = undefined
) => {
  const q = `
    INSERT INTO StaffReview(CreatedDate, CreatedBy, StaffId, NextReviewDate, PreviousStaffReviewId, NextFeedbackTypeId, HoldReason, OnHoldBy, PlacedOnHoldDate)
    VALUES(GETDATE(), @CreatedBy, @StaffId, @NextReviewDate, @PreviousStaffReviewId, @NextTypeId, @HoldReason, @OnHoldBy, @PlacedOnHoldDate)

    SELECT SCOPE_IDENTITY() AS staffReviewId
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('CreatedBy', createdBy)
    .input('StaffId', staffId)
    .input('NextReviewDate', nextReviewDate)
    .input('PreviousStaffReviewId', previousStaffReviewId)
    .input('NextTypeId', nextTypeId)
    .input('HoldReason', holdReason)
    .input('OnHoldBy', onHoldBy)
    .input('PlacedOnHoldDate', PlacedOnHoldDate)
    .timed_query(q, 'insertStaffReview');
  return (result.recordset as { staffReviewId: number }[])[0].staffReviewId;
};

export const retrieveActiveReviewIdForStaff = async (db: () => Promise<SqlRequest>, staffId: number) => {
  const query = `
    WITH InProgressReviews AS (
      SELECT
        ReviewId,
        Reviewee,
        UpdatedDate AS ActiveFrom,
        LEAD(UpdatedDate, 1, '9999-12-31') OVER (PARTITION BY Reviewee ORDER BY UpdatedDate) AS ActiveTo,
        ReviewStatusId
      FROM ReviewWithActiveStatus rwas
      WHERE ReviewStatusId NOT IN (SELECT ReviewStatusId FROM ReviewStatus WHERE Description IN ('Archived', 'Cancelled'))
    )
    SELECT
      ipr.ReviewId as reviewId,
      ipr.Reviewee as reviewee,
      ipr.ActiveFrom AS lastUpdatedAt
    FROM InProgressReviews ipr
  INNER JOIN DecoratedStaff ds ON ipr.Reviewee = ds.UserPrincipleName
    WHERE GETDATE() BETWEEN ActiveFrom AND ActiveTo
    AND ds.StaffId = @StaffId
  `;

  const connection = await db();
  const result = await connection.input('StaffId', staffId).timed_query(query, 'retrieveActiveReviewIdForStaff');
  return result.recordset[0]?.['reviewId'] as number;
}

export const retrieveCurrentStaffReviewIdForStaff = async (db: () => Promise<SqlRequest>, staffId: number) => {
  const query = `
    WITH StaffReviewIdsWithActiveDates AS (
      SELECT
        StaffReviewId,
        CreatedDate AS ActiveFrom,
        LEAD(CreatedDate, 1, '9999-12-31') OVER (PARTITION BY StaffId ORDER BY CreatedDate) AS ActiveTo,
        StaffId
      FROM StaffReview
    )
    SELECT StaffReviewId
    FROM StaffReviewIdsWithActiveDates
    WHERE GETDATE() BETWEEN ActiveFrom AND ActiveTo
    AND StaffId = @StaffId
  `;

  const connection = await db();
  const result = await connection.input('StaffId', staffId).timed_query(query, 'retrieveCurrentStaffReviewIdForStaff');
  return result.recordset[0]?.['StaffReviewId'] as number;
}

export const createStaffDepartmentStaffReview = async (tx: SqlTransaction, staffReviewId: number, staffDepartmentId: number): Promise<{
  staffDepartmentStaffReviewId: number,
  staffDepartmentId: number,
  staffReviewId: number
}> => {
  const query = `
      INSERT INTO StaffDepartmentStaffReview (StaffDepartmentId, StaffReviewId)
      OUTPUT
        INSERTED.StaffDepartmentStaffReviewId as staffDepartmentStaffReviewId,
        INSERTED.StaffDepartmentId as staffDepartmentId,
        INSERTED.StaffReviewId as staffReviewId
      VALUES (@staffDepartmentId, @staffReviewId)
   `

  const connection = await tx.timed_request();
  const result = await connection
    .input('staffReviewId', staffReviewId)
    .input('staffDepartmentId', staffDepartmentId)
    .timed_query(query, 'createStaffDepartmentStaffReview');

  return result.recordset[0] as {
    staffDepartmentStaffReviewId: number,
    staffDepartmentId: number,
    staffReviewId: number
  };
}

export const retrieveFeedbackAssignmentTemplateByName = async (db: () => Promise<SqlRequest>, templateName: string): Promise<FeedbackAssignmentTemplate> => {
  const query = `
    SELECT
      FeedbackAssignmentTemplateId as feedbackAssignmentTemplateId,
      TemplateName as templateName,
      SubjectLineTemplate as subjectLineTemplate,
      TextContentTemplate as textContentTemplate,
      UrlTemplate as urlTemplate,
      TitleTemplate as titleTemplate,
      ManualFeedbackAssignment as manualFeedbackAssignment,
      IncludeInManagerEmail as includeInManagerEmail,
      RequiresSelfReview as requiresSelfReview,
      ExclusiveToReviewer as exclusiveToReviewer,
      RequiresFeedback as requiresFeedback,
      IsReview as isReview
    FROM FeedbackAssignmentTemplate
    WHERE TemplateName = @TemplateName
  `

  const connection = await db();
  const result = await connection.input('TemplateName', templateName).timed_query(query, 'retrieveFeedbackAssignmentTemplateByName');
  return result.recordset[0] as FeedbackAssignmentTemplate;
}

export const retrieveActiveReviewIdByTemplateNameForStaffMember = async (db: () => Promise<SqlRequest>, upn: string, templateName: string): Promise<number> => {
  const query = `
    SELECT
      ReviewId as reviewId
    FROM ReviewWithActiveStatus
    WHERE TemplateId = (SELECT FeedbackAssignmentTemplateId FROM FeedbackAssignmentTemplate WHERE TemplateName = @TemplateName)
      AND Reviewee = @UPN
      AND ReviewStatusId NOT IN (SELECT ReviewStatusId FROM ReviewStatus WHERE Description IN ('Archived', 'Cancelled'))
  `

  const connection = await db();
  const result = await connection.input('TemplateName', templateName).input('UPN', upn).timed_query(query, 'retrieveActiveReviewIdByTemplateNameForStaffMember');
  const reviewId = result.recordset[0]?.['reviewId'];
  if (reviewId) {
    return reviewId;
  } else {
    throw new Error(`No active review for template ${templateName} for staff member ${upn}`);
  }
}

export const retrieveReviewAudit = async (db: () => Promise<SqlRequest>, reviewId: number, actionTypes: string[] | undefined, pagination: Pagination, users?: string[]): Promise<{ reviewAuditRecords: ReviewAudit[]; auditRecordsTotalCount: number }> => {
  const query = `
    SELECT
      rd.ReviewId as reviewId,
      rd.AuditType as auditType,
      rd.ActionTime as actionTime,
      rd.ActionUser as actionUser,
      rd.AuditDescription as auditDescription,
      COALESCE(s.displayName, rd.ActionUser) as actionUserDisplayName,
      COUNT(*) OVER() AS auditRecordsTotalCount
    FROM dbo.ReviewAuditDetail(@ReviewId) rd
    LEFT JOIN Staff s ON rd.ActionUser = s.UserPrincipleName
    WHERE (@ActionTypes IS NULL OR rd.AuditType IN (SELECT value FROM STRING_SPLIT(@ActionTypes, ',')))
      AND (@Users IS NULL OR rd.ActionUser IN (SELECT value FROM STRING_SPLIT(@Users, ',')))
    ORDER BY rd.ActionTime DESC
    OFFSET (@PageNumber * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY
  `;

  const pageNumber = Math.floor(pagination.startIndex / pagination.pageLength);
  const pageSize = pagination.pageLength;

  const connection = await db();
  const result = await connection
    .input('ReviewId', reviewId)
    .input('ActionTypes', actionTypes?.join(','))
    .input('PageNumber', pageNumber)
    .input('PageSize', pageSize)
    .input('Users', users?.join(','))
    .timed_query(query, 'retrieveReviewAudit');
  const auditRecordsWithCount = result.recordset as (ReviewAudit & { auditRecordsTotalCount: number })[];
  const totalCount = auditRecordsWithCount[0]?.auditRecordsTotalCount ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const auditRecords = auditRecordsWithCount.map(({ auditRecordsTotalCount: _, ...auditRecord }) => auditRecord) as ReviewAudit[];
  return { reviewAuditRecords: auditRecords, auditRecordsTotalCount: totalCount };
}

export const retrieveActiveFeedbackAssignmentIdsForStaff = async (db: () => Promise<SqlRequest>, staffId: number): Promise<number[]> => {
  const query = `
    SELECT fawas.FeedbackAssignmentID as feedbackAssignmentId
    FROM FeedbackAssignmentsWithActiveStatus fawas
    INNER JOIN FeedbackAssignmentStatus fas ON fawas.FeedbackAssignmentStatusId = fas.FeedbackAssignmentStatusId
    INNER JOIN Staff s ON fawas.Reviewer = s.UserPrincipleName AND s.StaffId = @StaffId
    WHERE fas.StatusDescription IN ('New', 'Viewed', 'Started', 'Saved for Later')
  `;

  const connection = await db();
  const result = await connection.input('StaffId', staffId).timed_query(query, 'retrieveFeedbackAssignmentIdsForStaff');
  return (result.recordset as { feedbackAssignmentId: number }[]).map(row => row.feedbackAssignmentId);
}

export const retrieveFeedbackAssignmentRetractionReasons = async (db: () => Promise<SqlRequest>): Promise<FeedbackAssignmentRetractionReason[]> => {
  const query = `
    SELECT RetractionReasonId as retractionReasonId, RetractionReason as retractionReason
    FROM FeedbackRetractionReason
    WHERE DeletedDate IS NULL
  `;

  const connection = await db();
  const result = await connection.timed_query(query, 'retrieveFeedbackAssignmentRetractionReasons');
  return (result.recordset as FeedbackAssignmentRetractionReason[]);
}

export const retrieveReviewIdBasedOnFeedbackAssignmentId = async (dbOrTx: (() => Promise<SqlRequest>) | SqlTransaction, feedbackAssignmentId): Promise<{ reviewId: number }> => {
  const q = `
      SELECT  fa.ReviewId
      FROM FeedbackAssignments fa
      WHERE fa.FeedbackAssignmentID=@feedbackAssignmentId
  `;

  let connection: SqlRequest;
  if (isSqlTransaction(dbOrTx)) {
    connection = await dbOrTx.timed_request();
  } else {
    connection = await dbOrTx();
  }

  const result = await connection
    .input('feedbackAssignmentId', feedbackAssignmentId)
    .timed_query(q, 'retrieveReviewIdBasedOnFeedbackAssignmentId');
  return fixCase(result.recordset)[0] as { reviewId: number };
};