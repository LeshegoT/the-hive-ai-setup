import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";

export const retrieveReviewDeletedRetractReason = async (db: () => Promise<SqlRequest>): Promise<number> => {
  const query = `
        SELECT RetractionReasonID,RetractionReason
        FROM FeedbackRetractionReason
        WHERE RetractionReason = @RetractionReason;    
    `;
  const connection = await db();
  const result = await connection
    .input('RetractionReason', 'Review Deleted')
    .timed_query(query, 'retrieveReviewDeletedRetractReason');

  return result.recordset[0]['RetractionReasonID'];
};

export const deleteReviewFeedbackMessages = async (tx: SqlTransaction, db: () => Promise<SqlRequest>, id: number, upn: string) => {
  const reviewDeletedRetractReason = await retrieveReviewDeletedRetractReason(db);

  const q = `
        UPDATE Messages
        SET DeletedBy = @UPN ,
            DeletedDate = GETDATE(),
            DeletedReason = @DeletedReason
        WHERE MessageId IN (
          SELECT MessageId FROM FeedbackAssignments WHERE ReviewId = @ID
        )
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('ID', id)
    .input('UPN', upn)
    .input('DeletedReason', reviewDeletedRetractReason)
    .timed_query(q, 'deleteReviewFeedbackMessages');

  return results;
};

export const insertDeletedFeedbackAssignmentStatus = async (tx: SqlTransaction, reviewId: number, upn: string) => {
  const query = `
    INSERT INTO FeedbackAssignmentStatusHistory (FeedbackAssignmentID, FeedbackAssignmentStatusId, UpdateDate, UpdatedBy)
    SELECT 
      FeedbackAssignmentId, 
      (SELECT FeedbackAssignmentStatusId FROM FeedbackAssignmentStatus WHERE StatusDescription=@StatusDescription), 
      GETDATE(), 
      @UpdatedBy
    FROM FeedbackAssignments
    WHERE ReviewId = @ReviewId;
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('ReviewId', reviewId)
    .input('UpdatedBy', upn)
    .input('StatusDescription', 'Deleted')
    .timed_query(query, 'insertDeletedFeedbackAssignmentStatus');
  return result;
};

export const deleteReviewFeedbackAssignments = async (tx: SqlTransaction, id: number, upn: string) => {
  const q = `
        UPDATE FeedbackAssignments
        SET DeletedDate =  GETDATE() ,
            DeletedBy = @UPN
        WHERE ReviewId = @ID ;
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('ID', id)
    .input('UPN', upn)
    .timed_query(q, 'deleteReviewFeedbackAssignments');
  await insertDeletedFeedbackAssignmentStatus(tx, id, upn);
  return results;
};

export const createReviewCommunicationReviewLink = async (tx: SqlTransaction, reviewId: number, reviewCommunicationId: number): Promise<boolean> => {
  const query = `
    INSERT INTO ReviewCommunicationReviewLink (ReviewId, ReviewCommunicationId)
    VALUES (@ReviewId, @ReviewCommunicationId);
  `;
  const connection = await tx.timed_request();
  const result = await connection
    .input('ReviewId', reviewId)
    .input('ReviewCommunicationId', reviewCommunicationId)
    .timed_query(query, 'createReviewCommunicationReviewLink');
  return result.rowsAffected.length > 0;
};

export const hasFeedbackProvidersRequestEmailBeenSentForReviewToday = async (db: () => Promise<SqlRequest>,reviewId: number): Promise<boolean> => {
  const query = `
    SELECT 1
    FROM ReviewCommunication rc
    INNER JOIN Staff managerDetails ON managerDetails.UserPrincipleName = rc.NudgedTo
    INNER JOIN ReviewCommunicationReviewLink rl ON rc.ReviewCommunicationId = rl.ReviewCommunicationId
    WHERE rl.reviewId =  @ReviewId
      AND CAST(rc.NudgedDate AS DATE) >= CAST(GETDATE() AS DATE)
      AND rc.ReviewCommunicationTypeId = (SELECT rct.ReviewCommunicationTypeId FROM ReviewCommunicationType rct WHERE rct.Type = 'Feedback Providers Request e-mail')
      AND managerDetails.UserPrincipleName = rc.NudgedTo
  `;

  const connection = await db();
  const result = await connection.input('ReviewId', reviewId).timed_query(query, 'hasFeedbackProvidersRequestEmailBeenSentForReviewToday');
  return result.recordset.length > 0;
}