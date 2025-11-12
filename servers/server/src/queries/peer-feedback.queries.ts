import { SqlTransaction } from "@the-hive/lib-db";
import { FeedbackAssignmentStatus, FeedbackProvidersRequest } from "@the-hive/lib-reviews-shared";

const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const { parseIfSetElseDefault } = require('@the-hive/lib-core');
const { ReviewsLogic } = require('@the-hive/lib-reviews-logic');

const FeedbackAssignmentNudgeOverdueDaysLimit = parseIfSetElseDefault(
  'FEEDBACK_ASSIGNMENT_NUDGE_OVERDUE_DAYS_LIMIT',
  42
);
let startingReviewStatus,
  cancelReviewStatus,
  deletedAssignmentStatusId,
  feedbackAssignmentAllowedProgressions,
  retractedAssignmentStatusId;
const lastSavedDateMap = {};

const reviewsLogic = new ReviewsLogic(db);

const retrieveStaffHistory = async (upn) => {
  const query = `
    SELECT StaffId,
        UPN,
       StaffStatus,
       EmploymentDate,
       DisplayName,
       StaffReviewId,
       NextReviewDate,
       NextFeedbackTypeId,
       ScheduledType,
       HRRep,
       Scheduled,
       HoldReason,
       ReviewId,
       ReviewType,
       ReviewDue,
       description
    FROM StaffMemberReviewHistory SMRH
    WHERE SMRH.UPN=@UPN
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(query, 'StaffMemberReviewHistory');
  return fixCase(results.recordset);
};

const getUPN = async (staffId) => {
  const query = `
    SELECT UserPrincipleName
    FROM Staff
    WHERE StaffId = @StaffId
  `;

  const request = await db();
  const results = await request
    .input('StaffId', staffId)
    .timed_query(query, 'getUPN');
  return fixCase(results.recordset)[0]?.userPrincipleName;
}

const getNewStatusId = async () => {
  const query = `
    SELECT FAS.FeedbackAssignmentStatusId
    FROM FeedbackAssignmentStatus FAS
    WHERE NOT EXISTS (
      SELECT 1
      FROM AllowedStatus ALS
      WHERE ALS.ToStatusId = FAS.FeedbackAssignmentStatusId
    );
  `;

  const request = await db();
  const results = await request.timed_query(query, 'getNewStatusId');
  return fixCase(results.recordset)[0];
};

const getStatusIdByDescription = async (statusDescription) => {
  const query = `
    SELECT FeedbackAssignmentStatusId
    FROM FeedbackAssignmentStatus
    WHERE StatusDescription=@StatusDescription
  `;

  const request = await db();
  const results = await request
    .input('StatusDescription', statusDescription)
    .timed_query(query, 'getStatusIdByDescription');

  if (results.recordset.length === 0) {
    throw new Error(`Could not find '${statusDescription}' status.`);
  } else {
    return fixCase(results.recordset);
  }
};

const getfeedbackAllowedProgressions = async () => {
  const query = `
    SELECT FromStatusId, ToStatusId
    FROM AllowedStatus
  `;

  const request = await db();
  const results = await request.timed_query(
    query,
    'getfeedbackAllowedProgressions'
  );
  return fixCase(results.recordset);
};

const structuredFeedbacksWithRetractedReasons = (feedbacks) => {
  const result = [];
  feedbacks.forEach((f) => {
    const feedbacksInRes = result.find((r) => r.messageId === f.messageId);
    if (!feedbacksInRes) {
      result.push({
        messageId: f.messageId,
        text: f.text,
        createdby: f.createdByUserPrincipleName,
        createdDate: f.creationDate,
        retractionReason: f.retractionReason,
        deletedby: f.deletedBy,
        deletedate: f.deletedDate,
        reply: f.reply,
        tags: [
          {
            rating: f.tagRating,
            name: f.tagName,
          },
        ],
      });
    } else {
      feedbacksInRes.tags.push({
        rating: f.tagRating,
        name: f.tagName,
      });
    }
  });
  return result;
};

const structuredMessagesWithTags = (messages) => {
  const result = [];
  messages.forEach((m) => {
    if (m.tagId) {
      const messageInRes = result.find((r) => r.messageId === m.messageId);
      if (!messageInRes) {
        result.push({
          messageId: m.messageId,
          type: m.messageType,
          by: m.createdByUserPrincipleName,
          about: m.heroUserPrincipleName,
          createdAt: m.creationDate,
          comment:
            m.feedbackAssignmentId == null
              ? [{ type: 'General Comment', text: m.text }]
              : structureFeedbackComments(messages, m.feedbackAssignmentId),
          reply: m.reply,
          published: m.published,
          tags: [
            {
              rating: m.tagRating,
              name: m.tagName,
            },
          ],
        });
      } else {
        messageInRes.tags.push({
          rating: m.tagRating,
          name: m.tagName,
        });
      }
    }
  });
  return result;
};

const structureFeedbackComments = (comments: Array<{
    feedbackAssignmentId: number;
    tagId: number;
    text: string;
  }>, 
  feedbackAssignment: number
): Array<{
  type: string;
  text: string;
}> => {
  const structuredComments = comments.filter((message) => message.feedbackAssignmentId == feedbackAssignment)
    .map((message) => {
      if (message.tagId) {
        return {...message, type: 'Positive Comment'};
      } else {
        return {...message, type: 'Constructive Comment'};
      }
    });

  if (structuredComments.length == 1) {
    structuredComments[0].type = 'General Comment';
  }

  return structuredComments;
};

const addEmployeeFeedback = async (tx, about, by, createdAt, comment) => {
  const query = `
    INSERT INTO Messages
      (MessageTypeId,HeroUserPrincipleName,CreatedByUserPrincipleName,CreationDate,Text)
    VALUES
      (15,LOWER(@About),LOWER(@By),@CreatedAt,@Comment);

     SELECT scope_identity() AS  MessageId;
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('By', by)
    .input('About', about)
    .input('CreatedAt', createdAt)
    .input('Comment', comment)
    .timed_query(query, 'addEmployeeFeedback');

  return result.recordset[0].MessageId;
};

const addFeedbackTags = async (tx, messageId, tagId, rating) => {
  const query = `
    INSERT INTO FeedbackTags (MessageId,TagId,TagRating)
    VALUES (@MessageId,@TagId,@Rating);
  `;

  const connection = await tx.timed_request();
  await connection
    .input('MessageId', messageId)
    .input('TagId', tagId)
    .input('Rating', rating)
    .timed_query(query, 'addFeedbackTags');
};

const allTags = async () => {
  const query = `
    select TagId, TagName, TagDescription, AutoDisplay
    from Tags
  `;

  const request = await db();
  const results = await request.timed_query(query, 'allTags');
  return fixCase(results.recordset);
};

const allFeedbackTemplates = async () => {
  const query = `
    SELECT fa.FeedbackAssignmentTemplateId,
    fa.TemplateName,
    fa.SubjectLineTemplate,
    fa.TextContentTemplate,
    fa.UrlTemplate,
    fa.TitleTemplate,
    fa.ManualFeedbackAssignment,
    fa.RequiresSelfReview,
    fa.IncludeStaffReport,
    fa.IncludeExecReport
    FROM FeedbackAssignmentTemplate fa
    WHERE fa.TemplateName != 'Default Template'
  `;

  const request = await db();
  const results = await request.timed_query(query, 'allFeedbackTemplates');
  return fixCase(results.recordset);
};

const retrieveFeedbackTemplate = async (templateName) => {
  const query = `
    SELECT fa.FeedbackAssignmentTemplateId,
      fa.TemplateName,
      fa.SubjectLineTemplate,
      fa.TextContentTemplate,
      fa.UrlTemplate,
      fa.TitleTemplate,
      fa.ManualFeedbackAssignment,
      fa.RequiresSelfReview
      FROM FeedbackAssignmentTemplate fa
    WHERE fa.TemplateName = @TemplateName
  `;

  const connection = await db();
  const results = await connection
    .input('TemplateName', templateName)
    .timed_query(query, 'retrieveFeedbackTemplate');

  return fixCase(results.recordset)[0];
};

const allFeedback = async () => {
  const query = `
    WITH MsgType AS (
      SELECT m.MessageId, CASE
          WHEN (m.MessageId IN (SELECT fa.MessageId FROM [FeedbackAssignments] fa
                              WHERE fa.MessageId = m.MessageId) )
              THEN 'assigned'
              ELSE 'voluntary'
          END
      AS 'MessageType'
      FROM Messages m
      WHERE m.DeletedDate IS NULL
    )
    Select m.MessageId, msgt.MessageType, m.HeroUserPrincipleName, m.CreatedByUserPrincipleName, m.CreationDate, m.Text, Code,  FeedbackTagId, t.TagId , TagRating, TagName from Messages m
      INNER Join MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
      INNER JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
      INNER JOIN Tags t ON t.TagId = ft.TagId
      INNER JOIN MsgType msgt ON msgt.MessageId = m.MessageId
      Order by m.CreationDate desc
  `;

  const request = await db();
  const results = await request.timed_query(query, 'allFeedback');
  const messages = structuredMessagesWithTags(fixCase(results.recordset));
  return messages;
};

const allRevieweePublishedFeedbackMessages = async (upn, createdByUPN) => {
  const q = `
      WITH UPNMessages AS(
          SELECT m.MessageId, m.HeroUserPrincipleName,  m.CreatedByUserPrincipleName, m.CreationDate, m.Text, m.Reply, m.Published, Code, FeedbackTagId, t.TagId , TagRating, TagName
          FROM Messages m
              INNER JOIN MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
              LEFT JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
              LEFT JOIN Tags t ON t.TagId = ft.TagId
          WHERE m.DeletedDate IS NULL AND HeroUserPrincipleName = @UPN AND (Published = 1 OR CreatedByUserPrincipleName = @CreatedByUPN)
      ),
      VoluntaryMessages AS(
          SELECT um.* , 'voluntary' AS MessageType, NULL AS feedbackAssignmentId
          FROM UPNMessages um
          WHERE MessageId NOT IN (
                  SELECT fa.MessageId
                  FROM FeedbackAssignments fa
                  WHERE fa.MessageId = um.MessageId OR fa.ConstructiveMessageId = um.MessageId
              )
      ),
      AssignedMessages AS
      (
          SELECT um.*, 'assigned' AS MessageType, fa.feedbackAssignmentId
          FROM UPNMessages um
              INNER JOIN FeedbackAssignments fa ON fa.MessageId = um.MessageId OR fa.ConstructiveMessageId = um.MessageId
              INNER JOIN Review r ON r.ReviewId = fa.ReviewId AND ( r.DueDate < GETDATE() OR fa.Reviewer = @CreatedByUPN)
      )
      (
            SELECT *
            FROM VoluntaryMessages
        UNION
            SELECT *
            FROM AssignedMessages
      )
      ORDER BY CreationDate desc
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .input('CreatedByUPN', createdByUPN)
    .timed_query(q, 'allRevieweePublishedFeedbackMessages');
  const messages = structuredMessagesWithTags(fixCase(results.recordset));
  return messages;
};

const allPrincipleFeedbackMessages = async (upn, createdByUPN) => {
  const q = `
    SELECT m.MessageId, m.HeroUserPrincipleName,  m.CreatedByUserPrincipleName, m.CreationDate, m.Text, m.Reply, m.Published, Code, FeedbackTagId, t.TagId , TagRating, TagName, 'voluntary' AS MessageType, NULL AS feedbackAssignmentId
    FROM Messages m
        INNER JOIN MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
        LEFT JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
        LEFT JOIN Tags t ON t.TagId = ft.TagId
    WHERE m.DeletedDate IS NULL AND HeroUserPrincipleName = @UPN
        AND m.MessageId NOT IN (
          SELECT m.MessageId
          FROM FeedbackAssignments fa
            INNER JOIN Messages m ON m.MessageId = fa.MessageId OR fa.ConstructiveMessageId = m.MessageId
        )
    ORDER BY CreationDate desc
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .input('CreatedByUPN', createdByUPN)
    .timed_query(q, 'allRevieweePublishedFeedbackMessages');
  const messages = structuredMessagesWithTags(fixCase(results.recordset));
  return messages;
};

const allRevieweeFeedbackMessages = async (upn) => {
  const q = `
    WITH MsgType AS (
      SELECT m.MessageId, CASE
          WHEN (m.MessageId IN (SELECT fa.MessageId FROM [FeedbackAssignments] fa
                              WHERE fa.MessageId = m.MessageId) )
              THEN 'assigned'
              ELSE 'voluntary'
          END
      AS 'MessageType'
      FROM Messages m
      WHERE m.DeletedDate IS NULL
    )
    SELECT m.MessageId, msgt.MessageType, m.HeroUserPrincipleName, m.CreatedByUserPrincipleName, m.CreationDate, m.Text, Code,  FeedbackTagId, t.TagId , TagRating, TagName
    FROM Messages m
      INNER JOIN MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
      INNER JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
      INNER JOIN Tags t ON t.TagId = ft.TagId
      INNER JOIN MsgType msgt ON msgt.MessageId = m.MessageId
    WHERE HeroUserPrincipleName = @UPN AND m.AssignedSelfFeedBack = 0
    ORDER BY m.CreationDate desc
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(q, 'allRevieweeFeedbackMessages');
  const message = structuredMessagesWithTags(fixCase(results.recordset));

  return message;
};

const allRevieweeVoluntaryFeedbackMessages = async (upn) => {
  const q = `
    WITH MsgType AS (
      SELECT m.MessageId, CASE
          WHEN EXISTS (SELECT fa.MessageId FROM [FeedbackAssignments] fa
                              WHERE fa.MessageId = m.MessageId OR fa.ConstructiveMessageId = m.MessageId)
              THEN 'assigned'
              ELSE 'voluntary'
          END
      AS 'MessageType'
      FROM Messages m
      WHERE m.DeletedDate IS NULL
    )
    SELECT m.MessageId, msgt.MessageType, m.HeroUserPrincipleName, s.DisplayName AS CreatedByUserPrincipleName, m.CreationDate, m.Text, Code,  FeedbackTagId, t.TagId , TagRating, TagName
   FROM Messages m
      INNER JOIN MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
      INNER JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
      INNER JOIN Tags t ON t.TagId = ft.TagId
      INNER JOIN MsgType msgt ON msgt.MessageId = m.MessageId AND msgt.MessageType = 'voluntary'
      INNER JOIN Staff s ON s.UserPrincipleName =  m.createdByUserPrincipleName
    WHERE m.HeroUserPrincipleName = @UPN
    ORDER BY m.CreationDate desc
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(q, 'allRevieweeVoluntaryFeedbackMessages');
  const message = structuredMessagesWithTags(fixCase(results.recordset));

  return message;
};

const all_reviewee_feedback_messages_bar_graph_visualisation = async (upn) => {
  const q = `
  WITH Msgs AS (
    Select m.AssignedSelfFeedBack, m.messageId, Code from Messages m
      Inner Join MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId
      Where mt.Code = 'feedback' AND  HeroUserPrincipleName = @UPN AND m.AssignedSelfFeedBack = 0 AND m.DeletedDate IS NULL
  ),
  MsgTags AS(
      SELECT  Msgs.messageId , TagRating, TagName FROM Msgs INNER JOIN FeedbackTags ft ON ft.MessageId = Msgs.MessageId INNER JOIN Tags t ON t.TagId = ft.TagId
  ),
    MsgCounter AS(
    SELECT Count(Distinct MsgTags.messageId) AS ReviewCount FROM MsgTags
  )
  SELECT AVG(Cast(MsgTags.TagRating AS FLOAT)) AS TagRating , MsgTags.TagName , MsgCounter.ReviewCount AS ReviewCount FROM MsgTags, MsgCounter
  GROUP BY MsgTags.TagName , MsgCounter.ReviewCount
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(q, 'all_reviewee_feedback_messages_bar_graph_visualisation');
  const message = fixCase(results.recordset);

  return message;
};

const allRevieweeAssignedFeedbackMessages = async (upn) => {
  const q = `
        SELECT m.MessageId, m.HeroUserPrincipleName, IsNull(s.DisplayName, fa.reviewer) AS CreatedByUserPrincipleName,
        m.CreationDate, m.Text ,sq.Question, sa.Answer, fat.TemplateName , ft.FeedbackTagId, t.TagId , ft.TagRating, t.TagName, fa.FeedbackDeadline, r.ReviewId, fa.feedbackAssignmentID AS feedbackAssignmentId, r.DueDate, rs.Description AS Status
        FROM Messages m
                  LEFT JOIN SelfReviewAnswers sa  ON m.MessageId = sa.MessageId
                  LEFT JOIN SelfReviewQuestions sq  ON sa.QuestionId = sq.QuestionID
                  INNER JOIN FeedbackAssignments fa  ON m.MessageId = fa.MessageId OR m.MessageId = fa.ConstructiveMessageId
                  INNER JOIN ReviewWithActiveStatus r ON r.ReviewId = fa.ReviewId
                  INNER JOIN ReviewStatus rs ON r.ReviewStatusId = rs.ReviewStatusId
                  INNER JOIN FeedbackAssignmentTemplate fat ON r.TemplateId = fat.FeedbackAssignmentTemplateId
                  INNER Join MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
                  LEFT JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
                  LEFT JOIN Tags t ON t.TagId = ft.TagId
                  LEFT JOIN Staff s ON s.UserPrincipleName =  m.createdByUserPrincipleName
        WHERE m.HeroUserPrincipleName = @UPN AND m.DeletedDate IS NULL
        ORDER BY m.CreationDate desc
    `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(q, 'allRevieweeAssignedFeedbackMessages');
  const message = fixCase(results.recordset);

  return message;
};

const removeAssignedFeedback = async (
  tx,
  feedbackAssignmentId,
  upn,
  retractionReasonId
) => {
  if (!deletedAssignmentStatusId) {
    deletedAssignmentStatusId = await getStatusIdByDescription('Deleted');
    if (deletedAssignmentStatusId[0]?.feedbackAssignmentStatusId) {
      deletedAssignmentStatusId =
        deletedAssignmentStatusId[0].feedbackAssignmentStatusId;
    } else {
      throw new Error(
        `Could not fetch status ID for deletion for assignment ${feedbackAssignmentId}`
      );
    }
  }
  const isAllowed = await isAssignmentProgressionAllowed(
    tx,
    feedbackAssignmentId,
    deletedAssignmentStatusId
  );
  if (isAllowed) {
    const q = `
        UPDATE FeedbackAssignments
        SET DeletedDate =  GETDATE() ,
            DeletedBy = @UPN,
            RetractionReasonId = @RetractionReasonId
        WHERE FeedbackAssignmentID = @ID
    `;

    const connection = await tx.timed_request();
    const results = await connection
      .input('ID', feedbackAssignmentId)
      .input('UPN', upn)
      .input('RetractionReasonId', retractionReasonId)
      .timed_query(q, 'removeAssignedFeedback');
    await insertStatusHistory(
      tx,
      feedbackAssignmentId,
      deletedAssignmentStatusId,
      upn
    );
    return results;
  } else {
    throw new Error(
      `Deletion not allowed for the feedback assignment ${feedbackAssignmentId}`
    );
  }
};

const retractFeedbackAssignment = async (tx, id, upn, retractedId, dueDate) => {
  if (!retractedAssignmentStatusId) {
    retractedAssignmentStatusId = await getStatusIdByDescription('Retracted');
    if (retractedAssignmentStatusId[0]?.feedbackAssignmentStatusId) {
      retractedAssignmentStatusId =
        retractedAssignmentStatusId[0].feedbackAssignmentStatusId;
    } else {
      throw new Error(
        `Could not fetch status ID for deletion for assignment ${id}`
      );
    }
  }
  const isAllowed = await isAssignmentProgressionAllowed(
    tx,
    id,
    retractedAssignmentStatusId
  );
  if (isAllowed) {
    const q = `
        UPDATE FeedbackAssignments
        SET DeletedDate =  GETDATE() ,
            DeletedBy = @UPN,
            RetractionReasonId = @RetractedId
        WHERE FeedbackAssignmentID = @ID

        INSERT INTO FeedbackAssignments(Reviewer, ReviewId, ClientEmail, AssignedBy, FeedbackDeadline)
        VALUES((SELECT Reviewer FROM FeedbackAssignments WHERE FeedbackAssignmentId= @ID),
              (SELECT ReviewId FROM FeedbackAssignments WHERE FeedbackAssignmentId= @ID),
              (SELECT ClientEmail FROM FeedbackAssignments WHERE FeedbackAssignmentId= @ID),
               @UPN,
               @DueDate)

        SELECT scope_identity() FeedbackAssignmentId
    `;

    const connection = await tx.timed_request();
    const results = await connection
      .input('ID', id)
      .input('UPN', upn)
      .input('RetractedId', retractedId)
      .input('DueDate', dueDate)
      .timed_query(q, 'retractFeedbackAssignment');

    const newAssignmentStatusId = (await getStatusIdByDescription('New'))[0]
      .feedbackAssignmentStatusId;
    const newFeedbackAssignmentId = results.recordset[0].FeedbackAssignmentId;

    await insertStatusHistory(
      tx,
      newFeedbackAssignmentId,
      newAssignmentStatusId,
      upn
    );
    await insertStatusHistory(tx, id, retractedAssignmentStatusId, upn);
    return fixCase(results.recordset);
  } else {
    throw new Error(`Retraction not allowed for the feedback assignment ${id}`);
  }
};

const get_feedbacks_assigned_to_user = async (upn) => {
  const query = `
    SELECT r.reviewee, f.reviewer, f.assignedBy, f.feedbackDeadline, f.messageId, f.feedbackAssignmentId , ft.templateName, ft.feedbackAssignmentTemplateId AS templateId, s.displayName
    FROM FeedbackAssignments f
      INNER JOIN Review r ON r.ReviewId = f.ReviewId
      INNER JOIN feedbackAssignmentTemplate ft ON ft.feedbackAssignmentTemplateId = r.TemplateId
      LEFT join Staff s On s.userPrincipleName = r.reviewee
    WHERE f.Reviewer =  @UPN  AND f.DeletedDate IS NULL AND f.messageId IS NULL
    ORDER BY f.feedbackDeadline
  `;

  const connection = await db();
  const assignedFeedbacks = await connection
    .input('UPN', upn)
    .timed_query(query, 'get_feedbacks_assigned_to_user');
  const results = fixCase(assignedFeedbacks.recordset);
  return results;
};

const assignFeedbackMessageId = async (tx, assignmentId, messageId) => {
  const query = `
    UPDATE FeedbackAssignments
    SET MessageId = @MessageId
    WHERE FeedbackAssignmentId = @AssignmentId
  `;

  const connection = await tx.timed_request();
  await connection
    .input('AssignmentId', assignmentId)
    .input('MessageId', messageId)
    .timed_query(query, 'assignFeedbackMessageId');
};

const assignFeedbackConstructiveMessageId = async (
  tx,
  assignmentId,
  messageId
) => {
  const query = `
    UPDATE FeedbackAssignments
    SET ConstructiveMessageId = @MessageId
    WHERE FeedbackAssignmentId = @AssignmentId
  `;

  const connection = await tx.timed_request();
  await connection
    .input('AssignmentId', assignmentId)
    .input('MessageId', messageId)
    .timed_query(query, 'assignFeedbackConstructiveMessageId');
};

const get_user_display_name = async (upn) => {
  const query = `SELECT displayName from Staff where userPrincipleName = @UPN`;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'get_user_display_name');
  return result.recordset[0].displayName;
};

const getSelfReviewQuestions = async (template) => {
  const query = `
  SELECT QuestionId, Question
  FROM SelfReviewQuestions
  WHERE FeedbackAssignmentTemplateId = @Template AND DeletedDate IS NULL`;

  const connection = await db();
  const results = await connection
    .input('Template', template)
    .timed_query(query, 'getSelfReviewQuestions');
  return fixCase(results.recordset);
};

const addAssignedFeedbackAnswers = async (
  tx,
  messageId,
  questionId,
  answer
) => {
  const query = `
    INSERT INTO SelfReviewAnswers
      (MessageId,QuestionId,Answer)
    VALUES
      (@MessageId,@QuestionId,@Answer);
  `;

  const connection = await tx.timed_request();
  await connection
    .input('MessageId', messageId)
    .input('QuestionId', questionId)
    .input('Answer', answer)
    .timed_query(query, 'addAssignedFeedbackAnswers');
};

const retrieveOutstandingFeedbackForReviewer = async (reviewer) => {
  const query = `
  SELECT fa.feedbackAssignmentID, r.reviewee, fa.reviewer, fa.assignedBy, fa.feedbackDeadline
  FROM FeedbackAssignments fa
    INNER JOIN Review r ON r.ReviewId = fa.ReviewId
  WHERE Reviewer = @reviewer AND MessageID IS NULL`;

  const connection = await db();
  const result = await connection
    .input('reviewer', reviewer)
    .timed_query(query, 'retrieveOutstandingFeedbackForReviewer');

  return result.recordset;
};

const addNewLevelUpFeedbackAssignment = async (
  tx,
  levelUpId,
  feedbackAssignmentId
) => {
  const query = `
  INSERT INTO LevelUpFeedbackAssignments
      (FeedbackAssignmentID,LevelUpId)
    VALUES
      (@feedbackAssignmentId,@levelUpId)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('feedbackAssignmentId', feedbackAssignmentId)
    .input('levelUpId', levelUpId)
    .timed_query(query, 'addNewLevelUpFeedbackAssignment');
};

const addOrUpdateFeedbackAssignments = async (
  tx,
  reviewer,
  assignedBy,
  feedbackDeadline,
  reviewId,
  assignmentStatusId,
  clientEmail = undefined
) => {
  const query = `
  DECLARE @FeedbackAssignmentId INTEGER = (SELECT FeedbackAssignmentId FROM FeedbackAssignments WHERE ReviewId=@reviewID AND LOWER(Reviewer) = LOWER(@reviewer) AND DeletedBy is NULL);
  IF (@FeedbackAssignmentId IS NULL)
      BEGIN
      INSERT INTO FeedbackAssignments ( Reviewer, AssignedBy, FeedbackDeadline, MessageId,  reviewId, ClientEmail )
          VALUES (@reviewer, @assignedBy, @feedbackDeadline, Null, @reviewID, @clientEmail)
          SELECT SCOPE_IDENTITY() AS FeedbackAssignmentID
      END
  ELSE
      BEGIN
          UPDATE FeedbackAssignments
          SET ClientEmail = @clientEmail
          WHERE FeedbackAssignmentID = @FeedbackAssignmentId
          SELECT @FeedbackAssignmentId AS FeedbackAssignmentID
      END`;

  try {
    const connection = await tx.timed_request();
    let result = await connection
      .input('reviewer', reviewer)
      .input('assignedBy', assignedBy)
      .input('feedbackDeadline', feedbackDeadline)
      .input('reviewID', reviewId)
      .input('clientEmail', clientEmail)
      .timed_query(query, 'addOrUpdateFeedbackAssignments');
    result = fixCase(result.recordset);

    if (result && result.length > 0 && result[0].feedbackAssignmentID) {
      await insertStatusHistory(
        tx,
        result[0].feedbackAssignmentID,
        assignmentStatusId,
        assignedBy
      );
    } else {
      throw new Error(`Could not create assignment for the review ${reviewId}`);
    }

    return result[0].feedbackAssignmentID;
  } catch (error) {
    throw new Error(`Could not create assignment for the review ${reviewId}`,{cause:error});
  }
};

const checkAndMarkFeedbackAssignment = async (
  tx: SqlTransaction,
  assignmentId: number,
  statusDescription: FeedbackAssignmentStatus,
  upn: string
) => {
  let statusId = await getStatusIdByDescription(statusDescription);
  if (statusId[0]?.feedbackAssignmentStatusId) {
    statusId = statusId[0].feedbackAssignmentStatusId;
  } else {
    throw new Error(`Could not find the feedback assignment status ID for the status ${statusDescription} when trying to update feedback assignment ${assignmentId}`);
  }

  const isAllowed = await isAssignmentProgressionAllowed(
    tx,
    assignmentId,
    statusId
  );
  const savedToday = await checkLastSavedForLater(assignmentId);
  if (isAllowed && !savedToday) {
    await insertStatusHistory(tx, assignmentId, statusId, upn);
  } else if (!isAllowed) {
    throw new Error(
      `Cannot set status to '${statusDescription}' for assignment ${assignmentId}. Progression is not allowed at this time.`
    );
  }
};

const insertStatusHistory = async (
  tx,
  feedbackAssignmentID,
  feedbackStatusId,
  updatedBy
) => {
  const query = `
    INSERT INTO FeedbackAssignmentStatusHistory (FeedbackAssignmentID, FeedbackAssignmentStatusId, UpdateDate, UpdatedBy)
    VALUES (@FeedbackAssignmentID, @StatusId, GETDATE(), @UpdatedBy);
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('FeedbackAssignmentID', feedbackAssignmentID)
    .input('StatusId', feedbackStatusId)
    .input('UpdatedBy', updatedBy)
    .timed_query(query, 'insertStatusHistory');

  return result;
};

const addGuestReviewer = async (tx, feedbackAssignmentId, UUID) => {
  const query = `INSERT INTO GuestFeedbackAssignment (FeedbackAssignmentId, UUID )
  VALUES (@FeedbackAssignmentId, @UUID);`;
  try {
    const connection = await tx.timed_request();
    await connection
      .input('feedbackAssignmentId', feedbackAssignmentId)
      .input('UUID', UUID)
      .timed_query(query, 'addGuestReviewer');
  } catch (e) {
    console.error('There is an error with one of the inputs', e);
  }
};

const getFeedbackAssignments = async (assignedBy) => {
  const query = `
  SELECT fa.FeedbackAssignmentID, r.Reviewee, fa.Reviewer, fa.AssignedBy, fa.FeedbackDeadline, fa.MessageID
  FROM FeedbackAssignments fa
    INNER JOIN Review r ON r.ReviewId = fa.ReviewId
  WHERE AssignedBy = @assignedBy AND DeletedDate IS NULL`;

  const connection = await db();
  const result = await connection
    .input('AssignedBy', assignedBy)
    .timed_query(query, 'getFeedbackAssignments');

  return result.recordset;
};

const retrieveFeedbackAssignmentDetailsForNudge = async (
  tx,
  feedbackAssignmentId
) => {
  const query = `
  SELECT fa.FeedbackAssignmentID, st.DisplayName AS RevieweeName, r.Reviewee, fa.Reviewer, fa.AssignedBy,  fa.FeedbackDeadline, r.TemplateId, fat.TemplateName, fat.TitleTemplate, fat.SubjectLineTemplate, fat.TextContentTemplate, fat.UrlTemplate, fa.ClientEmail, fat.IsReview
  FROM FeedbackAssignments fa
    INNER JOIN Review r ON r.ReviewId = fa.ReviewId
    inner join FeedbackAssignmentTemplate FAT on FAT.FeedbackAssignmentTemplateId = r.TemplateId
    INNER JOIN Staff st ON r.Reviewee = st.UserPrincipleName
  WHERE FeedbackAssignmentID = @feedbackAssignmentId `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('FeedbackAssignmentID', feedbackAssignmentId)
    .timed_query(query, 'retrieveFeedbackAssignmentDetailsForNudge');

  if (result.recordset && result.recordset[0]) {
    return fixCase(result.recordset)[0];
  } else {
    throw new Error(
      `Could not retreive nudge detail for assignment ${feedbackAssignmentId}`
    );
  }
};

const getOutstandingFeedback = async (upn) => {
  const query = `SELECT r.reviewee, fa.reviewer, fa.assignedBy, fa.feedbackDeadline, fa.messageId
               FROM FeedbackAssignments fa
                INNER JOIN Review r ON r.ReviewId = fa.ReviewId
               WHERE r.Reviewee = @UPN
                     AND fa.MessageId IS NULL
                     AND fa.DeletedDate IS NULL`;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'getOutstandingFeedback');

  return result.recordset;
};

const allFeedbackAssignments = async (
  page,
  size,
  status,
  dueBy,
  template,
  assignedBy,
  general
) => {
  const query = `
  With Assignments AS(
    SELECT fa.FeedbackAssignmentId, fa.AssignedBy, fa.feedbackDeadline AS dueBy , IIF(fa.messageId IS NULL , 'Pending', 'Completed') AS [status], r.reviewee, fa.reviewer, fat.TemplateName AS template
    FROM FeedbackAssignments fa
      INNER JOIN Review r ON r.ReviewId = fa.ReviewId
      INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateID = r.TemplateId
    WHERE fa.DeletedDate IS NULL
  )
  SELECT  overallCount = COUNT(*) OVER(), Assignments.FeedbackAssignmentId, Assignments.AssignedBy, Assignments.dueBy , Assignments.status, Assignments.reviewee, Assignments.reviewer, Assignments.template
  FROM Assignments
  WHERE     (@status IS NULL OR LOWER(Assignments.status) = LOWER(@status)  )
        AND (@assignedBy IS NULL OR LOWER(Assignments.assignedBy) = LOWER(@assignedBy) )
        AND (@template IS NULL OR LOWER(Assignments.template) = LOWER(@template) )
        AND (@general IS NULL
                OR (LOWER(Assignments.reviewee) LIKE '%' + LOWER(@general) + '%')
                OR (LOWER(Assignments.reviewer) LIKE '%' + LOWER(@general) + '%')
                OR (@assignedBy IS NULL AND LOWER(Assignments.assignedBy) LIKE '%' + LOWER(@general) + '%')
             )
        AND (@dueBy IS NULL
                OR ( @dueBy = 'week' AND (Assignments.dueBy BETWEEN CONVERT(DATE, GETDATE()) AND CONVERT(DATE, DATEADD(d, 7, GETDATE()))) )
                OR ( @dueBy = 'month' AND (Assignments.dueBy BETWEEN CONVERT(DATE, GETDATE()) AND CONVERT(DATE, DATEADD(m, 1, GETDATE()))) )
                OR ( @dueBy = 'halfyear' AND (Assignments.dueBy BETWEEN CONVERT(DATE, GETDATE()) AND CONVERT(DATE, DATEADD(m, 6, GETDATE()))) )
                OR ( @dueBy = 'overdue' AND (Assignments.dueBy <  GETDATE()))
             )
  ORDER BY Assignments.dueBy
  OFFSET (( (cast(@page as int)) - 1)*  (cast(@size as int))) ROWS FETCH NEXT  (cast(@size as int)) ROWS ONLY`;

  const request = await db();
  const results = await request
    .input('page', page)
    .input('size', size)
    .input('status', status)
    .input('dueBy', dueBy)
    .input('template', template)
    .input('assignedBy', assignedBy)
    .input('general', general)
    .timed_query(query, 'allFeedbackAssignments');
  return fixCase(results.recordset);
};

const getExternalFeedbackAssignment = async (uuid) => {
  const query = `
  SELECT  fa.FeedbackAssignmentID,
          r.Reviewee,
          fa.Reviewer,
          fa.AssignedBy,
          fa.FeedbackDeadline,
          fa.MessageID,
          fat.FeedbackAssignmentTemplateID,
          fat.TemplateName
  FROM GuestFeedbackAssignment gfa
    inner join FeedbackAssignments fa on gfa.FeedbackAssignmentId=fa.FeedbackAssignmentID AND fa.DeletedDate IS NULL
    INNER JOIN Review r ON r.ReviewId = fa.ReviewId
    INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateID = r.TemplateId
  WHERE gfa.uuid = @uuid`;

  const request = await db();
  let result = await request
    .input('uuid', uuid)
    .timed_query(query, 'getExternalFeedbackAssignment');
  result = fixCase(result.recordset);
  return result[0];
};

const getFeedbackAssignment = async (id) => {
  const query = `
  SELECT  fa.FeedbackAssignmentID,
          r.Reviewee,
          fa.Reviewer,
          fa.AssignedBy,
          fa.FeedbackDeadline,
           fa.MessageID,
           fat.FeedbackAssignmentTemplateID,
           fat.TemplateName
  FROM FeedbackAssignments fa
    INNER JOIN Review r ON r.ReviewId = fa.ReviewId
    INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateID = r.TemplateId
  WHERE fa.FeedbackAssignmentID = @id AND fa.DeletedDate IS NULL`;

  const request = await db();
  let result = await request
    .input('id', id)
    .timed_query(query, 'getFeedbackAssignment');
  result = fixCase(result.recordset);

  return result[0];
};

const getFeedbackAssignmentLevelUpDetails = async (feedbackAssignmentId) => {
  const query = `
  SELECT lu.LevelUpID, lu.Name AS LevelUpName
  FROM LevelUpFeedbackAssignments fa
  INNER JOIN LevelUps lu
  ON fa.LevelUpId = lu.LevelUpId
  WHERE fa.FeedbackAssignmentID = @feedbackAssignmentId`;

  const request = await db();
  let result = await request
    .input('feedbackAssignmentId', feedbackAssignmentId)
    .timed_query(query, 'getFeedbackAssignmentLevelUpDetails');
  result = fixCase(result.recordset);

  return result[0];
};

const get_users_with_same_manager = async (upn) => {
  const query = `
 WITH staff_department_data AS(
      SELECT st.StaffId, st.BBDUserName, st.UserPrincipleName, st.DisplayName, st.JobTitle, st.Office, st.StaffStatus, st.LastReview, sd.StaffDepartmentId, sd.Department, sd.Manager, sd.StartDate
      FROM DecoratedStaff st
          INNER JOIN StaffDepartment sd ON sd.StaffId = st.StaffId AND sd.StaffDepartmentId IN
          (
                  SELECT TOP 1 StaffDepartmentId
                  FROM StaffDepartment
                  WHERE staffId = st.staffId
                  ORDER BY StartDate DESC
          )
  ),
  department_data AS (
      SELECT Manager, Department,
          SUM(
              CASE WHEN (StaffStatus = 'active' OR StaffStatus = 'onboarding') THEN 1 ELSE 0 END
          ) AS active_staff_in_team,
          SUM(
              CASE WHEN (StaffStatus = 'pending-delete' OR StaffStatus = 'terminated') THEN 1 ELSE 0 END
          ) AS inactive_staff_int_team
      FROM staff_department_data
      GROUP BY Manager, Department
  ),
  team_members
  AS
  (
        SELECT d.Manager,
              d.Department,
              d.active_staff_in_team,
              d.inactive_staff_int_team,
              s.StaffId,
              s.BBDUserName,
              s.UserPrincipleName,
              s.DisplayName	,
              s.JobTitle,
              s.Office,
              s.StaffStatus
      FROM department_data d
      INNER JOIN staff_department_data s ON d.Manager=s.manager AND d.department = s.department AND s.StaffStatus='active'
  ),
  upnManager
  AS
  (
        SELECT st.UserPrincipleName , st.Department, st.Manager , st.DisplayName
          FROM staff_department_data st
          WHERE st.UserPrincipleName=@UPN
  ),
  upnTeamMembers
  AS
  (
      SELECT m.UserPrincipleName, m.Department, m.DisplayName
      FROM team_members m
          INNER JOIN upnManager u ON u.manager=m.manager AND m.department LIKE concat(u.Department, '%')
  ),
   managerData AS(
      SELECT st.UserPrincipleName , st.Department, st.Manager , st.DisplayName
          FROM staff_department_data st
      INNER JOIN upnManager um ON um.Manager = st.UserPrincipleName
  )
  (
          SELECT ut.UserPrincipleName , ut.Department, ut.DisplayName
          FROM upnTeamMembers ut
      UNION
          SELECT um.UserPrincipleName , um.Department, um.DisplayName
          FROM managerData um
  )
      ORDER BY UserPrincipleName ASC
    `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(query, 'get_users_with_same_manager');
  const teamMembers = fixCase(results.recordset);
  return teamMembers;
};

const assignedFeedbackSelfIndication = async (tx, messageId) => {
  const query = `
    UPDATE Messages SET AssignedSelfFeedback = 1
    WHERE  MessageId = @MessageId
  `;

  const connection = await tx.timed_request();
  await connection
    .input('MessageId', messageId)
    .timed_query(query, 'assignedFeedbackIndication');
};

const getFeedbackAssignmentTemplate = async (id) => {
  const query = `
  SELECT FeedbackAssignmentTemplateId AS id,TemplateName, TitleTemplate, SubjectLineTemplate, TextContentTemplate, UrlTemplate, RequiresFeedback
  FROM FeedbackAssignmentTemplate
  WHERE FeedbackAssignmentTemplateId = @id
  `;

  const connection = await db();
  const result = await connection
    .input('id', id)
    .timed_query(query, 'getFeedbackAssignmentTemplate');
  const assignmentTemplate = fixCase(result.recordset);
  return assignmentTemplate[0];
};

const getSyndicateIdeaTeamMembers = async (syndicateId) => {
  const query = `
  SELECT si.SyndicateIdeaId, si.Title AS TeamName, tm.UserPrincipleName
  FROM SyndicateIdeas si
  INNER JOIN TeamMemberships tm
  ON si.SyndicateIdeaId = tm.SyndicateIdeaId
  WHERE si.SyndicateIdeaId = @syndicateId`;
  const connection = await db();
  const result = await connection
    .input('syndicateId', syndicateId)
    .timed_query(query, 'getSyndicateIdeaTeamMembers');
  if (result == undefined) {
    throw new Error('undefined');
  }

  return fixCase(result.recordset);
};

const getAssignmentsDueInAWeekOrOnTheDay = async () => {
  const query = `
  SELECT fa.FeedbackAssignmentID, r.Reviewee, fa.Reviewer, fa.AssignedBy, fa.FeedbackDeadline, fa.MessageID, fat.FeedbackAssignmentTemplateID, DATEDIFF(day, GETDATE(), fa.FeedbackDeadline) AS DaysUntilAssignmentIsDue
  FROM FeedbackAssignments fa
    INNER JOIN Review r ON r.ReviewId = fa.ReviewId
    INNER JOIN FeedbackAssignmentTemplate fat ON r.TemplateId = fat.FeedbackAssignmentTemplateId
  WHERE fa.MessageID IS NULL AND fa.DeletedDate IS NULL AND r.DeletedDate IS NULL
        AND NOT EXISTS (select 1 from FeedbackResponse fr where fr.feedbackAssignmentId = fa.feedbackAssignmentID AND fr.DeletedDate IS NULL)
        AND (DATEDIFF(day, CAST(GETDATE() AS DATE), CAST(fa.feedbackDeadline AS DATE)) = 7 OR DATEDIFF(day, CAST(GETDATE() AS DATE), CAST(fa.feedbackDeadline AS DATE)) = 0)
  `;

  const connection = await db();
  const result = await connection.timed_query(
    query,
    'getAssignmentsDueInAWeekOrOnTheDay'
  );
  return fixCase(result.recordset);
};

const getSoonToBeOverdueInternalAssignments = async () => {
  const query = `
  SELECT
    fa.Reviewer,
    fa.FeedbackAssignmentID,
    fa.FeedbackDeadline,
    r.Reviewee,
    fa.ClientEmail
  FROM FeedbackAssignments fa
    INNER JOIN Review r ON r.ReviewId = fa.ReviewId
  WHERE
    fa.MessageID IS NULL
    AND fa.DeletedDate IS NULL
    AND r.DeletedDate IS NULL
    AND NOT EXISTS
      (
        select
          1
        from
          FeedbackResponse fr
        where
          fr.FeedbackAssignmentId = fa.FeedbackAssignmentID
          AND fr.DeletedDate IS NULL
      )
    AND fa.reviewer NOT IN
      (
        SELECT DISTINCT
          CEA.UPN
        FROM
          CalendarEventAttendees CEA
          INNER JOIN CalendarEvents CE ON CEA.CalendarEventId = CE.CalendarEventId
          INNER JOIN CalendarEventTemplate CT ON CE.CalendarEventTemplateId = CT.CalendarEventTemplateId
        WHERE
          CT.CalendarEventTypeId = 1
          AND (DATEDIFF(day, GETDATE(), CE.StartDateTime) BETWEEN 0 and 7)
      )
    AND NOT EXISTS
      (
        SELECT 1
        FROM
          GuestFeedbackAssignment gfas
        WHERE
          gfas.FeedbackAssignmentID = fa.FeedbackAssignmentID
      )
    AND (DATEDIFF(day, GETDATE(), fa.FeedbackDeadline) BETWEEN 0 and 7)
  ORDER BY
    fa.reviewer, r.reviewId
  `;

  const request = await db();
  const result = await request.timed_query(
    query,
    'getSoonToBeOverdueInternalAssignments'
  );
  return fixCase(result.recordset);
};

const getOverdueAssignments = async () => {
  const query = `
  SELECT fa.FeedbackAssignmentID, r.Reviewee, fa.Reviewer, fa.AssignedBy, fa.FeedbackDeadline, fa.MessageID, fat.FeedbackAssignmentTemplateID, DATEDIFF(day, GETDATE(), fa.feedbackDeadline) AS DaysUntilAssignmentIsDue
  FROM FeedbackAssignments fa
      INNER JOIN Review r ON r.ReviewId = fa.ReviewId
      INNER JOIN FeedbackAssignmentTemplate fat ON r.TemplateId = fat.FeedbackAssignmentTemplateId
  WHERE MessageID IS NULL
        AND fa.DeletedDate IS NULL
        AND r.DeletedDate IS NULL
        AND ( DATEDIFF(day, GETDATE() , feedbackDeadline) BETWEEN @OverdueLimit AND -1)
        AND fa.FeedbackAssignmentID NOT IN (SELECT FeedbackAssignmentID FROM GuestFeedbackAssignment )
        AND NOT EXISTS (select 1 from FeedbackResponse fr where fr.feedbackAssignmentId = fa.feedbackAssignmentID AND fr.DeletedDate IS NULL)
  `;

  const connection = await db();
  const result = await connection
    .input('OverdueLimit', -FeedbackAssignmentNudgeOverdueDaysLimit)
    .timed_query(query, 'getOverdueAssignments');
  return fixCase(result.recordset);
};

const createNewFeedbackTemplate = async (
  templateName,
  subjectLineTemplate,
  textContentTemplate,
  urlTemplate,
  titleTemplate,
  manualFeedbackAssignment
) => {
  const q = `
    INSERT INTO FeedbackAssignmentTemplate (TemplateName, SubjectLineTemplate, TextContentTemplate, UrlTemplate, TitleTemplate, ManualFeedbackAssignment)
    VALUES (@name, @subject, @content, @url, @title, @manualFeedbackAssignment)
    SELECT SCOPE_IDENTITY() AS  templateId;
    `;

  try {
    const connection = await db();
    const result = await connection
      .input('name', templateName)
      .input('subject', subjectLineTemplate)
      .input('content', textContentTemplate)
      .input('url', urlTemplate)
      .input('title', titleTemplate)
      .input('manualFeedbackAssignment', manualFeedbackAssignment)
      .timed_query(q, 'createNewFeedbackTemplate');

    return result.recordset[0].templateId;
  } catch (e) {
    console.error('There is an error with one of the inputs.', e);
  }
};

const updateFeedbackTemplate = async (
  templateName,
  subjectLineTemplate,
  textContentTemplate,
  urlTemplate,
  titleTemplate,
  manualFeedbackAssignment,
  id
) => {
  const q = `
    UPDATE FeedbackAssignmentTemplate
    SET
      TemplateName = @templateName,
      SubjectLineTemplate = @templateSubject,
      TextContentTemplate = @templateContent,
      UrlTemplate = @urlTemplate,
      TitleTemplate = @templateTitle,
      ManualFeedbackAssignment = @manualFeedbackAssignment
    WHERE FeedbackAssignmentTemplateId = @id
  `;
  try {
    const connection = await db();
    await connection
      .input('id', id)
      .input('templateName', templateName)
      .input('templateSubject', subjectLineTemplate)
      .input('templateContent', textContentTemplate)
      .input('urlTemplate', urlTemplate)
      .input('templateTitle', titleTemplate)
      .input('ManualFeedbackAssignment', manualFeedbackAssignment)
      .timed_query(q, 'updateFeedbackTemplate');
  } catch (e) {
    console.error('There is an error with one of the inputs.', e);
  }
};

const removeFeedbackTemplateQuestion = async (tx, id, upn) => {
  const q = `
      UPDATE SelfReviewQuestions
      SET DeletedBy = @UPN ,
          DeletedDate = GETDATE()
      WHERE QuestionId = @ID
    `;

  try {
    const connection = await tx.timed_request();
    await connection
      .input('ID', id)
      .input('UPN', upn)
      .timed_query(q, 'removeFeedbackTemplateQuestion');
  } catch (e) {
    console.error('There is an error updating the template questions', e);
  }
};

const addFeedbackTemplateQuestion = async (tx, id, question) => {
  const q = `
      INSERT INTO SelfReviewQuestions (FeedbackAssignmentTemplateId, Question)
      VALUES (@id, @question)
    `;

  try {
    const connection = await tx.timed_request();
    await connection
      .input('question', question)
      .input('id', id)
      .timed_query(q, 'addFeedbackTemplateQuestion');
  } catch (e) {
    console.error('There is an error updating the template questions', e);
  }
};

const getOutstandingLevelUpFeedbackAssignments = async (
  levelUpId,
  reviewer,
  reviewee
) => {
  const q = `
    SELECT fa.Reviewer, r.Reviewee, fa.FeedbackAssignmentID, fa.MessageId, lfa.LevelUpId
    FROM FeedbackAssignments fa
      INNER JOIN Review r ON r.ReviewId = fa.ReviewId
      INNER JOIN LevelUpFeedbackAssignments lfa on lfa.FeedbackAssignmentID = fa.FeedbackAssignmentID
    WHERE lfa.LevelUpID = @levelUpId AND MessageId IS NULL AND fa.Reviewer = @reviewer AND r.Reviewee = @reviewee
  `;

  const connection = await db();
  const result = await connection
    .input('reviewee', reviewee)
    .input('reviewer', reviewer)
    .input('levelUpId', levelUpId)
    .timed_query(q, 'getAllOutstandingLevelUpFeedbackAssignments');
  return fixCase(result.recordset);
};

const getLevelUpFeedbackAssignments = async (levelUpId) => {
  const q = `
      SELECT l.FeedbackAssignmentID, l.LevelUpID , r.reviewId , r.ReviewId , r.Reviewee , fa.Reviewer
      FROM LevelUpFeedbackAssignments l
        INNER JOIN FeedbackAssignments fa ON fa.FeedbackAssignmentID = l.FeedbackAssignmentID
        INNER JOIN Review r ON r.ReviewId = fa.ReviewId
      WHERE LevelUpID = @LevelUpId
    `;

  const connection = await db();
  const result = await connection
    .input('levelUpId', levelUpId)
    .timed_query(q, 'getLevelUpFeedbackAssignments');

  return fixCase(result.recordset);
};

const getGuestReviewerUuid = async (tx, feedbackAssignmentId) => {
  const query = `
  SELECT UUID
  FROM GuestFeedbackAssignment
  WHERE FeedbackAssignmentId = @feedbackAssignmentId
  `;
  const connection = await tx.timed_request();
  let result = await connection
    .input('feedbackAssignmentId', feedbackAssignmentId)
    .timed_query(query, 'getGuestReviewerUuid');

  result = fixCase(result.recordset);
  if (result[0] == undefined) {
    return undefined;
  }

  return result[0].uUID;
};
const findReviewerInStaff = async (reviewer) => {
  const query = `
  SELECT UserPrincipleName
  FROM Staff
  WHERE UserPrincipleName = @reviewer`;
  const connection = await db();
  let result = await connection
    .input('reviewer', reviewer)
    .timed_query(query, 'findReviewerInStaff');
  result = fixCase(result.recordset);
  return result[0];
};

const findReviewerForFeedbackAssignment = async (feedbackAssignmentId) => {
  const query = `
  SELECT Reviewer
  FROM FeedbackAssignments fa
  WHERE FeedbackAssignmentID = @feedbackAssignmentId`;
  const connection = await db();
  let result = await connection
    .input('feedbackAssignmentId', feedbackAssignmentId)
    .timed_query(query, 'findReviewerForFeedbackAssignment');
  result = fixCase(result.recordset);
  return result[0].reviewer;
};

const removeFeedbackMessage = async (tx, id, reason, upn) => {
  const q = `
      UPDATE Messages
      SET DeletedBy = @UPN ,
          DeletedDate = GETDATE(),
          DeletedReason = @Reason
      WHERE MessageId = @ID
    `;

  const connection = await tx.timed_request();
  await connection
    .input('ID', id)
    .input('UPN', upn)
    .input('Reason', reason)
    .timed_query(q, 'removeFeedbackMessage');
};

const resetFeedbackMessageAssigned = async (tx, id) => {
  const q = `
      UPDATE FeedbackAssignments
      SET MessageId = NULL, ConstructiveMessageId = NULL
      WHERE MessageId = @ID
    `;

  const connection = await tx.timed_request();
  await connection
    .input('ID', id)
    .timed_query(q, 'resetFeedbackMessageAssigned');
};

const getCurrentDayAssignmentNudges = async (id) => {
  const query = `
      SELECT rc.ReviewCommunicationId, rc.NudgedBy, rc.NudgedTo, rc.NudgedDate
      FROM ReviewCommunication rc
      INNER JOIN ReviewCommunicationFeedbackAssignments rcf on rcf.ReviewCommunicationId = rc.ReviewCommunicationId
      WHERE rcf.FeedbackAssignmentId = @ID AND CAST(rc.NudgedDate AS DATE) = CAST(GETDATE() AS DATE)
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(query, 'getCurrentDayAssignmentNudges');
  return fixCase(result.recordset);
};

const getAssignmentAllowedStatusProgressions = async () => {
  const query = `
      SELECT fasFrom.StatusDescription AS FromStatus, fasTo.StatusDescription AS ToStatus
      FROM AllowedStatus als
      INNER JOIN FeedbackAssignmentStatus fasFrom
      ON als.FromStatusId = fasFrom.FeedbackAssignmentStatusId
      INNER JOIN FeedbackAssignmentStatus fasTo
      ON als.ToStatusId = fasTo.FeedbackAssignmentStatusId
  `;

  const connection = await db();
  const result = await connection.timed_query(
    query,
    'getAssignmentAllowedStatusProgressions'
  );
  return fixCase(result.recordset);
};

const getDefaultTemplateVariables = async () => {
  const q = `
  SELECT tv.VariableOption AS [Option] , tv.VariableValue AS [Value]
  FROM TemplateVariables tv
    INNER JOIN FeedbackTemplateVariables ftv ON ftv.TemplateVariableId = tv.TemplateVariableId
    INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId =  ftv.TemplateId
  WHERE fat.TemplateName = 'Default Template'
`;

  const connection = await db();
  const result = await connection.timed_query(q, 'getDefaultTemplateVariables');

  return fixCase(result.recordset);
};

const getTemplateVariables = async (template) => {
  const q = `
  SELECT tv.VariableOption AS [Option] , tv.VariableValue AS [Value]
  FROM TemplateVariables tv
    INNER JOIN FeedbackTemplateVariables ftv ON ftv.TemplateVariableId = tv.TemplateVariableId
    INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId =  ftv.TemplateId
  WHERE ftv.TemplateId = @template
`;

  const connection = await db();
  const result = await connection
    .input('template', template)
    .timed_query(q, 'getTemplateVariables');

  return fixCase(result.recordset);
};
const allUPNFeedbackMessagesSince = async (upn, createdSince) => {
  const q = `
    SELECT ISNULL(s.DisplayName, 'Client Feedback') AS UserPrincipleName , m.CreationDate
    FROM Messages m
      LEFT JOIN Staff s ON s.UserPrincipleName = m.CreatedByUserPrincipleName
    WHERE m.HeroUserPrincipleName = @UPN AND DateDiff(dd, CAST(m.CreationDate AS DATE) , @createdSince) < 0 AND m.CreatedByUserPrincipleName != @UPN
    ORDER BY m.CreationDate desc
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .input('createdSince', createdSince)
    .timed_query(q, 'allUPNFeedbackMessagesSince');
  return fixCase(results.recordset);
};

const findFeedbackWithoutSentimentPrediction = async (predictionVersion) => {
  const q = `
   select m.MessageId, m.text
    from Messages m
    where messagetypeid=15
    and not exists (
       select 1 from FeedbackPredictions p
        where p.messageid=m.messageid
        and p.PredictionVersion=@PREDICTION_VERSION
    )
  `;

  const connection = await db();
  const results = await connection
    .input('PREDICTION_VERSION', predictionVersion)
    .timed_query(q, 'feedback-without-sentiment-prediction');
  return fixCase(results.recordset);
};

const storeFeedbackSentimentPrediction = async (
  feedback,
  predictionVersion,
  predictionData
) => {
  if (predictionData && predictionData.length && predictionData.length == 2) {
    const q = `
    INSERT INTO FeedbackPredictions (
        PredictionDate,
        PredictionVersion,
        MessageId,
        PositiveSentimentPrediction,
        NegativeSentimentPrediction,
        IsPositive
    ) values (
        GetDate(),
        @PREDICTION_VERSION,
        @MESSAGE_ID,
        @POSITIVE_PREDICTION,
        @NEGATIVE_PREDICTION,
        @IS_POSITIVE
    )
  `;

    const positivePrediction = predictionData[0] < predictionData[1];

    const connection = await db();
    const results = await connection
      .input('PREDICTION_VERSION', predictionVersion)
      .input('MESSAGE_ID', feedback.messageId)
      .input('POSITIVE_PREDICTION', predictionData[1])
      .input('NEGATIVE_PREDICTION', predictionData[0])
      .input('IS_POSITIVE', positivePrediction)
      .timed_query(q, 'store-feedback-tag-rating-prediction');
    return { inserted: results.rowsAffected[0] };
  } else {
    throw new Error('Prediction data for sentiment analysis is invalid');
  }
};

const findFeedbackTagsWithoutRatingPrediction = async (predictionVersion) => {
  const q = `
    select ft.FeedbackTagId, t.tagId, t.tagName , m.text
      from FeedbackTags ft
      inner join Tags t on ft.tagId=t.tagId
      left join Messages m on m.messageid=ft.messageid
      where not exists (
        select 1 from FeedbackTagPredictions ftp
          where ftp.FeedbackTagId=ft.FeedbackTagId
          and ftp.PredictionVersion=@PREDICTION_VERSION
      )
      and m.text is not null
  `;

  const connection = await db();
  const results = await connection
    .input('PREDICTION_VERSION', predictionVersion)
    .timed_query(q, 'feedback-tags-without-rating-prediction');
  return fixCase(results.recordset);
};

const storeFeedbackTagPrediction = async (
  feedbackTag,
  predictionVersion,
  predictionData
) => {
  if (predictionData && predictionData.length && predictionData.length == 5) {
    const q = `
    INSERT INTO FeedbackTagPredictions (
        PredictionDate,
        PredictionVersion,
        FeedbackTagId,
        OneStarPrediction,
        TwoStarPrediction,
        ThreeStarPrediction,
        FourStarPrediction,
        FiveStarPrediction,
        PredictedRating
    ) values (
        GetDate(),
        @PREDICTION_VERSION,
        @FEEDBACK_TAG_ID,
        @ONE_STAR,
        @TWO_STAR,
        @THREE_STAR,
        @FOUR_STAR,
        @FIVE_STAR,
        @PREDICTED_RATING
    )
  `;

    const predictedRatingValue = predictionData.reduce(
      (a, b) => Math.max(a, b),
      0
    );
    const predictedRatingIndex = predictionData.indexOf(predictedRatingValue) + 1;
    const connection = await db();
    const results = await connection
      .input('PREDICTION_VERSION', predictionVersion)
      .input('FEEDBACK_TAG_ID', feedbackTag.feedbackTagId)
      .input('ONE_STAR', predictionData[0])
      .input('TWO_STAR', predictionData[1])
      .input('THREE_STAR', predictionData[2])
      .input('FOUR_STAR', predictionData[3])
      .input('FIVE_STAR', predictionData[4])
      .input('PREDICTED_RATING', predictedRatingIndex)
      .timed_query(q, 'store-feedback-tag-rating-prediction');
    return { inserted: results.rowsAffected[0] };
  } else {
    throw new Error('Prediction data for tag rating is invalid');
  }
};

const retrieveFilteredReviews = async (
  page,
  size,
  status,
  hrRep,
  from,
  to,
  general,
  archived
) => {
  const q = `
    WITH Reviews AS(
      SELECT  r.ReviewId, r.Reviewee, s.DisplayName, FORMAT (r.DateCreated, 'yyyy/MM/dd') as DateCreated , r.CreatedBy , FORMAT (r.DueDate, 'yyyy/MM/dd') as DueDate   , rs.Description  , rs.ReviewStatusId , fat.FeedbackAssignmentTemplateId, fat.TemplateName,
      r.UpdatedDate
      FROM ReviewWithActiveStatus r
        INNER JOIN ReviewStatus rs ON rs.ReviewStatusId = r.ReviewStatusId
        INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId = r.TemplateId
        INNER JOIN Staff s ON s.UserPrincipleName=r.Reviewee
      WHERE r.DeletedDate IS NULL
    )
    SELECT COUNT(*) OVER() as overallCount, ReviewId,  Reviews.Reviewee , Reviews.DateCreated, Reviews.CreatedBy, Reviews.DueDate , Reviews.Description AS status  , Reviews.ReviewStatusId, Reviews.FeedbackAssignmentTemplateId, Reviews.TemplateName
    FROM Reviews
    WHERE
        (@status IS NULL OR Reviews.ReviewStatusId = @status  )
        AND (@HrRep IS NULL OR LOWER(Reviews.HrRep) = LOWER(@HrRep) )
        AND (@general IS NULL
                 OR (LOWER(Reviews.Reviewee) LIKE '%' + LOWER(@general) + '%')
                 OR (LOWER(Reviews.TemplateName) LIKE '%' + LOWER(@general) + '%')
                 OR (@HrRep IS NULL AND LOWER(Reviews.HrRep) LIKE '%' + LOWER(@general) + '%')
              )
        AND (@from IS NULL
                OR ( CONVERT(DATE,Reviews.DueDate) BETWEEN CONVERT(DATE, @from) AND CONVERT(DATE, @to ) )
            )
        AND ((@archived IS NULL AND Reviews.ReviewStatusId IN (12, 13))
          OR @archived = CASE
            WHEN Reviews.ReviewStatusId IN (12, 13) THEN 1
            ELSE 0
          END
        )
     ORDER BY Reviews.DueDate
     OFFSET (( (cast(@page as int)) - 1)*  (cast(@size as int))) ROWS FETCH NEXT  (cast(@size as int)) ROWS ONLY
  `;

  const connection = await db();
  const result = await connection
    .input('page', page)
    .input('size', size)
    .input('status', status)
    .input('HrRep', hrRep)
    .input('from', from)
    .input('to', to)
    .input('general', general)
    .input('archived', archived)
    .timed_query(q, 'retrieveFilteredReviews');
  return fixCase(result.recordset);
};

const getReview = async (id) => {
  const q = `
      SELECT
        r.ReviewId,
        r.DateCreated AS DateCreated,
        r.CreatedBy,
        r.DueDate AS DueDate,
        rs.Description,
        rs.ReviewStatusId,
        r.Reviewee,
        swad.DisplayName,
        fat.TemplateName AS template,
        r.UpdatedDate,
        fat.ExclusiveToReviewer,
        fat.RequiresFeedback,
        swad.Manager
      FROM ReviewWithActiveStatus r
        INNER JOIN ReviewStatus rs ON rs.ReviewStatusId = r.ReviewStatusId
        INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateID = r.TemplateId
        INNER JOIN StaffWithActiveDepartment swad ON swad.UserPrincipleName = r.Reviewee
      WHERE r.ReviewId = @ID AND r.DeletedDate IS NULL
      AND swad.StaffStatus <> 'terminated'
     ORDER BY r.DueDate
  `;

  const connection = await db();
  const result = await connection.input('ID', id).timed_query(q, 'getReview');
  return fixCase(result.recordset)[0];
};

const updateStatusOfReviewBasedOnFeedbackAssignments = async (
  tx,
  reviewId,
  updatedBy
) => {
  const q = `
    SELECT
    rwas.ReviewId AS reviewId,
    rwas.ReviewStatusId as reviewStatusId,
    CASE
      WHEN NOT EXISTS (
        SELECT 1
        FROM FeedbackAssignmentsWithActiveStatus fawas
        WHERE fawas.ReviewId = rwas.ReviewId
        AND fawas.FeedbackAssignmentStatusId NOT IN (
          SELECT FeedbackAssignmentStatusId
          FROM FeedbackAssignmentStatus fas
          WHERE fas.StatusDescription IN ('Completed', 'Retracted', 'Deleted')
        )
      )
      THEN  (SELECT rs.reviewStatusId
        FROM ReviewStatus rs
        WHERE rs.Description IN ('Feedback Completed'))
      WHEN EXISTS (
        SELECT 1
        FROM FeedbackAssignmentsWithActiveStatus fawas
        WHERE fawas.ReviewId = rwas.ReviewId
        AND fawas.FeedbackAssignmentStatusId IN (
          SELECT FeedbackAssignmentStatusId
          FROM FeedbackAssignmentStatus fas
          WHERE fas.StatusDescription IN ('Started', 'Saved for Later')
        )
      )
      THEN  (SELECT rs.reviewStatusId
        FROM ReviewStatus rs
        WHERE rs.Description IN ('Feedback In Progress'))
      WHEN NOT EXISTS (
        SELECT 1
        FROM FeedbackAssignmentsWithActiveStatus fawas
        WHERE fawas.ReviewId = rwas.ReviewId
        AND fawas.FeedbackAssignmentStatusId NOT IN (
          SELECT FeedbackAssignmentStatusId
          FROM FeedbackAssignmentStatus fas
          WHERE fas.StatusDescription IN ('New', 'Viewed', 'Retracted', 'Deleted')
        )
      )
      THEN  (SELECT rs.reviewStatusId
        FROM ReviewStatus rs
        WHERE rs.Description IN ('Reviewers Assigned'))
      ELSE NULL
    END AS expectedStatusId
    FROM ReviewWithActiveStatus rwas
    WHERE rwas.ReviewId = @reviewId
  `;

  const connection = await tx.timed_request();;
  const result = await connection.input('reviewId', reviewId)
                  .input('updatedBy', updatedBy)
                  .timed_query(q, 'updateStatusOfReviewBasedOnFeedbackAssignments');

  if(result && result.recordset[0] && result.recordset[0].expectedStatusId && result.recordset[0].expectedStatusId !== result.recordset[0].reviewStatusId) {
    const reviewId = result.recordset[0].reviewId;
    const expectedStatusId = result.recordset[0].expectedStatusId;
    await updateReviewStatus(tx, reviewId, expectedStatusId, updatedBy);
  } else {
    // No update to the review status is needed
  }
  return;
};

const updateReviewStatus = async (tx, reviewId, newStatusId, createdBy) => {
  const q = `
    INSERT INTO ReviewStatusHistory(ReviewId, ReviewStatusId, UpdatedBy, UpdatedDate)
    VALUES (@ReviewId, @NewStatusId, @CreatedBy, GETDATE())
  `;
  const connection = await tx.timed_request();
  const result = await connection
    .input('ReviewId', reviewId)
    .input('NewStatusId', newStatusId)
    .input('CreatedBy', createdBy)
    .timed_query(q, 'updateReviewStatus');
  return result;
};

const allReviewAssignments = async (id) => {
  const q = `
      SELECT fa.FeedbackAssignmentId, fa.AssignedBy, fa.feedbackDeadline AS dueBy , IIF(fa.messageId IS NULL , 'Pending', 'Completed') AS [status], r.reviewee, fa.reviewer, fat.TemplateName AS template , fat.FeedbackAssignmentTemplateId As TemplateId
      FROM FeedbackAssignments fa
        INNER JOIN  Review r ON r.ReviewId = fa.ReviewId
        INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateID = r.TemplateID
      WHERE r.ReviewId = @ID AND fa.DeletedDate IS NULL
      ORDER BY fa.feedbackDeadline
`;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(q, 'allReviewAssignments');

  return fixCase(result.recordset);
};

const updateStaffReviewDeadline = async (tx, id, reviewDeadline) => {
  const query = `
  UPDATE StaffReview
  SET NextReviewDate = @reviewDeadline
  WHERE StaffReviewId = @ID`;

  const connection = await tx.timed_request();
  await connection
    .input('reviewDeadline', reviewDeadline)
    .input('ID', id)
    .timed_query(query, 'updateStaffReviewDeadline');
};

const getPreviousReviewId = async (id) => {
  const query = `
  SELECT ReviewId
  FROM StaffReview
  WHERE StaffReviewId = (SELECT PreviousStaffReviewId
  FROM StaffReview
  WHERE StaffReviewId = @ID)
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(query, 'getPreviousReviewId');
  return fixCase(result.recordset)[0];
};

const updateReviewRepresentative = async (tx, reviewId, hrRep, updatedBy) => {
  const query = `
  INSERT INTO ReviewHrRepHistory (ReviewId, HrRep, UpdatedBy, UpdatedAt)
  VALUES (@ReviewId, @HrRep, @UpdatedBy, GETDATE())
  `;

  const connection = await tx.timed_request();
  await connection
    .input('HrRep', hrRep)
    .input('ReviewId', reviewId)
    .input('UpdatedBy', updatedBy)
    .timed_query(query, 'updateReviewRepresentative');
};

const addTemporaryReviewHrRep = async (tx, reviewId, tempHrRep, tempHrRepEndDate, updatedBy) => {
  const query = `
    INSERT INTO ReviewHrRepHistory(ReviewId, HrRep, UpdatedBy, UpdatedAt)
    SELECT ReviewId, HrRep, @UpdatedBy, @TemporaryHrEndDate
    FROM ReviewWithActiveStatus
    WHERE
        ReviewId = @ReviewID;

    INSERT INTO ReviewHrRepHistory (ReviewId, HrRep, UpdatedBy, UpdatedAt)
    VALUES (@ReviewId, @TemporaryHrRep, @UpdatedBy, GETDATE());
  `;

  const request = await tx.timed_request();
  await request
    .input('ReviewID', reviewId)
    .input('TemporaryHrRep', tempHrRep)
    .input('TemporaryHrEndDate', tempHrRepEndDate)
    .input('UpdatedBy', updatedBy)
    .timed_query(query, 'addTemporaryReviewHrRep');
}

const getReviewComments = async (id) => {
  const query = `
      SELECT rc.DateCreated AS DateCreated, s.DisplayName AS CreatedBy, rc.Comment
      FROM ReviewHRComments rc
        INNER JOIN Staff s ON s.UserPrincipleName = rc.CreatedBy
        INNER JOIN ReviewHRCommentsReviews rcr ON rcr.ReviewHRCommentId=rc.ReviewHRCommentId
      WHERE rcr.ReviewId = @ID
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(query, 'getReviewComments');
  return fixCase(result.recordset);
};

const retrieveReviewMeetingMinutesAttendees = async (reviewMeetingMinutesId) => {
  const query = `
    SELECT ReviewMeetingMinutesAttendeeId, Attendee AS AttendeeUPN, ReviewMeetingMinutesId
    FROM ReviewMeetingMinutesAttendees
    WHERE ReviewMeetingMinutesId = @reviewMeetingMinutesId
      AND DeletedAt IS NULL
      AND DeletedBy IS NULL
  `;

  const connection = await db();
  const result = await connection
    .input('reviewMeetingMinutesId', reviewMeetingMinutesId)
    .timed_query(query, 'retrieveReviewMeetingMinutesAttendees');
  return fixCase(result.recordset);
};

const getReviewMeetingMinutes = async (id) => {
  const query = `
      SELECT ReviewMeetingMinutesId, CreatedAt, CreatedBy, MeetingTimeslot, Notes, ReviewId
      FROM ReviewMeetingMinutes
      WHERE ReviewId = @ID
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(query, 'getReviewMeetingMinutes');
  const meetingMinutes = fixCase(result.recordset)[0];
  if (meetingMinutes) {
    const meetingAttendees = await retrieveReviewMeetingMinutesAttendees(
      meetingMinutes.reviewMeetingMinutesId
    );
    meetingMinutes.meetingAttendees = meetingAttendees;
    return meetingMinutes;
  } else {
    return undefined;
  }
};

const deleteMeetingMinutesAttendees = async (
  tx,
  reviewMeetingMinutesId,
  removedAttendeesUpns,
  updatedByUpn
) => {
  const query = `
    WITH
      UpnsToMarkAsRemoved AS (
        SELECT value AS Attendee FROM STRING_SPLIT(@removedAttendeesUpns, ',')
      )
      UPDATE ReviewMeetingMinutesAttendees
      SET DeletedAt = GETDATE(), DeletedBy = @updatedByUpn
      FROM ReviewMeetingMinutesAttendees rmma
      WHERE rmma.ReviewMeetingMinutesId = @reviewMeetingMinutesId
        AND rmma.Attendee IN (SELECT Attendee FROM UpnsToMarkAsRemoved)
        AND rmma.DeletedAt IS NULL
        AND rmma.DeletedBy IS NULL
  `;

  const connection = await tx.timed_request();
  await connection
    .input('reviewMeetingMinutesId', reviewMeetingMinutesId)
    .input('updatedByUpn', updatedByUpn)
    .input('removedAttendeesUpns', removedAttendeesUpns.join(","))
    .timed_query(query, 'deleteMeetingMinutesAttendees');
}

const insertMeetingMinutesAttendees = async (
  tx,
  reviewMeetingMinutesId,
  attendeesUpns,
  updatedByUpn
) => {
  const query = `
    WITH
      UpnsToInsert AS (
        SELECT VALUE AS Attendee FROM STRING_SPLIT(@attendeesUpns, ',')
      )
      INSERT INTO ReviewMeetingMinutesAttendees (Attendee, ReviewMeetingMinutesId, AddedAt, AddedBy)
      SELECT Attendee, @reviewMeetingMinutesId, GETDATE(), @updatedByUpn
      FROM UpnsToInsert
  `;

  const connection = await tx.timed_request();
  await connection
    .input('reviewMeetingMinutesId', reviewMeetingMinutesId)
    .input('updatedByUpn', updatedByUpn)
    .input('attendeesUpns', attendeesUpns.join(","))
    .timed_query(query, 'insertMeetingMinutesAttendees');
}

const addReviewMeetingMinutesAttendee = async (
  tx,
  meetingAttendees,
  reviewMeetingMinutesId
) => {
  for (let i = 0; i < meetingAttendees.length; ++i) {
    const query = `
      INSERT INTO ReviewMeetingMinutesAttendees (Attendee, ReviewMeetingMinutesId)
      SELECT @attendee, @reviewMeetingMinutesId
      WHERE NOT EXISTS (
        SELECT Attendee
        FROM ReviewMeetingMinutesAttendees
        WHERE Attendee = @attendee AND ReviewMeetingMinutesId = @reviewMeetingMinutesId
      );
    `;

    const connection = await tx.timed_request();
    await connection
      .input(`attendee`, meetingAttendees[i].attendeeUPN)
      .input(`reviewMeetingMinutesId`, reviewMeetingMinutesId)
      .timed_query(query, 'addReviewMeetingMinutesAttendee');
  }
};

const addOrUpdateReviewNotes = async (tx, meetingMinutes) => {
  const query = `
    IF EXISTS (SELECT 1 FROM ReviewMeetingMinutes WHERE ReviewId=@ReviewId)
    BEGIN
      UPDATE ReviewMeetingMinutes
      SET MeetingTimeslot = @MeetingTimeslot, Notes = @Notes
      OUTPUT INSERTED.ReviewMeetingMinutesId
      WHERE ReviewId = @ReviewId;
    END
    ELSE
      BEGIN
        INSERT INTO ReviewMeetingMinutes (CreatedAt, CreatedBy, MeetingTimeslot, Notes, ReviewId)
        VALUES (GETDATE(), @CreatedBy, @MeetingTimeslot, @Notes, @ReviewId);

        SELECT SCOPE_IDENTITY() AS ReviewMeetingMinutesId;
      END
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('CreatedBy', meetingMinutes.createdBy)
    .input('MeetingTimeslot', meetingMinutes.meetingTimeslot)
    .input('Notes', meetingMinutes.notes)
    .input('ReviewId', meetingMinutes.reviewId)
    .timed_query(query, 'addOrUpdateReviewNotes');

  const reviewMeetingMinutesId = results.recordset[0].ReviewMeetingMinutesId;
  return reviewMeetingMinutesId;
};

const deleteActiveFeedbackAssignments = async (tx, reviewId, upn) => {
  const deletedAssignmentStatusId = (
    await getStatusIdByDescription('Deleted')
  )[0].feedbackAssignmentStatusId;
  const retractedAssignmentStatusId = (
    await getStatusIdByDescription('Retracted')
  )[0].feedbackAssignmentStatusId;
  const completedAssignmentStatusId = (
    await getStatusIdByDescription('Completed')
  )[0].feedbackAssignmentStatusId;

  const query = `
    INSERT INTO FeedbackAssignmentStatusHistory (FeedbackAssignmentID, FeedbackAssignmentStatusId, UpdateDate, UpdatedBy)
    SELECT FeedbackAssignmentId, @DeletedStatusId, GETDATE(), @UpdatedBy
    FROM FeedbackAssignmentsWithActiveStatus
    WHERE ReviewId = @ReviewId AND FeedbackAssignmentStatusId NOT IN (
      @DeletedStatusId, @RetractedStatusId, @CompletedStatusId
    )

    UPDATE fa
    SET DeletedDate = GETDATE(),
        DeletedBy = @UpdatedBy
    FROM FeedbackAssignments AS fa
    INNER JOIN FeedbackAssignmentsWithActiveStatus AS fawas
        ON fawas.FeedbackAssignmentID=fa.FeedbackAssignmentID
    WHERE fa.ReviewId = @ReviewId AND fawas.FeedbackAssignmentStatusId NOT IN (
        @DeletedStatusId, @RetractedStatusId, @CompletedStatusId
    )
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('ReviewId', reviewId)
    .input('DeletedStatusId', deletedAssignmentStatusId)
    .input('RetractedStatusId', retractedAssignmentStatusId)
    .input('CompletedStatusId', completedAssignmentStatusId)
    .input('UpdatedBy', upn)
    .timed_query(query, 'deleteActiveFeedbackAssignments');
  return result;
};

const isAssignmentProgressionAllowed = async (tx, assignmentId, nextStatusId) => {
  const currentStatusId = await retrieveCurrentStatus(tx, assignmentId);
  if (!feedbackAssignmentAllowedProgressions) {
    feedbackAssignmentAllowedProgressions =
      await getfeedbackAllowedProgressions();
  }
  const isAllowed = feedbackAssignmentAllowedProgressions.some(
    (progression) =>
      progression.fromStatusId === currentStatusId &&
      progression.toStatusId === nextStatusId
  );
  return isAllowed;
};

const retrieveCurrentStatus = async (tx, assignmentId) => {
  const query = `
    SELECT FeedbackAssignmentStatusId
    FROM FeedbackAssignmentsWithActiveStatus
    WHERE FeedbackAssignmentID = @AssignmentId
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('AssignmentId', assignmentId)
    .timed_query(query, 'retrieveCurrentStatus');
  return result.recordset[0].FeedbackAssignmentStatusId;
};

const findConstructiveMessageRelatedToPositiveMessage = async (id) => {
  const q = `
        SELECT ConstructiveMessageId AS id
        FROM FeedbackAssignments
        WHERE MessageId = @ID
    `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(q, 'findConstructiveMessageRelatedToPositiveMessage');

  return result.recordset[0];
};

const createReview = async (
  tx,
  hrRep,
  upn,
  dueDate,
  reviewee,
  template,
  reviewStatusId
) => {
  const q = `
    DECLARE @ReviewId INT;

    INSERT INTO Review (DateCreated, CreatedBy, DueDate, Reviewee, TemplateId)
    VALUES ( GETDATE() , LOWER(@HrRep), @DueDate, @Reviewee, @Template)

    SET @ReviewId = scope_identity();

    INSERT INTO ReviewHrRepHistory (ReviewId, HrRep, UpdatedBy, UpdatedAt)
    VALUES (@ReviewId, @HrRep, LOWER(@UPN), GETDATE());

    INSERT INTO ReviewStatusHistory (ReviewId, ReviewStatusId, UpdatedBy)
    VALUES (@ReviewId, @ReviewStatusId, LOWER(@UPN))

    SELECT @ReviewId AS ReviewId;
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('HrRep', hrRep.toLowerCase())
    .input('UPN', upn.toLowerCase())
    .input('DueDate', dueDate)
    .input('Reviewee', reviewee)
    .input('Template', template)
    .input('ReviewStatusId', reviewStatusId)
    .timed_query(q, 'createReview');

  return fixCase(results.recordset)[0].reviewId;
};

const reviewPeerMessages = async (id, upn) => {
  const q = `
        SELECT fa.feedbackAssignmentId, m.MessageId, m.HeroUserPrincipleName, IsNull(s.DisplayName, fa.reviewer) AS CreatedByUserPrincipleName, m.CreationDate, m.Text, Code,  FeedbackTagId, t.TagId , TagRating, TagName
        FROM Messages m
          INNER JOIN FeedbackAssignments fa ON  ( m.MessageId = fa.MessageId OR m.MessageId = fa.ConstructiveMessageId) AND fa.ReviewId = @ID
          INNER JOIN MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
          LEFT JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
          LEFT JOIN Tags t ON t.TagId = ft.TagId
          LEFT JOIN Staff s ON s.UserPrincipleName =  m.CreatedByUserPrincipleName
        WHERE m.DeletedDate IS NULL
        ORDER BY m.CreationDate desc
  `;

  const connection = await db();
  const results = await connection
    .input('ID', id)
    .input('UPN', upn)
    .timed_query(q, 'reviewPeerMessages');
  const message = structuredMessagesWithTags(fixCase(results.recordset));

  return message;
};

const reviewSelfMessages = async (id, upn) => {
  const q = `
    WITH FeedbackMessages AS (
        SELECT m.MessageId, m.HeroUserPrincipleName, m.CreationDate, m.Text , s.DisplayName AS CreatedByUserPrincipleName
        FROM Messages m
            INNER Join MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
            INNER JOIN Staff s ON s.UserPrincipleName =  m.createdByUserPrincipleName
        WHERE m.CreatedByUserPrincipleName = @UPN AND m.DeletedDate IS NULL
    ),
    Assignments AS(
        SELECT fa.FeedbackDeadline , fm.MessageId, fm.HeroUserPrincipleName, fm.CreationDate, fm.Text , fm.CreatedByUserPrincipleName , fa.feedbackAssignmentId
        FROM FeedbackAssignments fa
            INNER JOIN FeedbackMessages fm ON (fm.MessageId = fa.MessageId OR fm.MessageId = fa.ConstructiveMessageId) AND fa.ReviewId = @ID
    ),
    Answer AS(
      SELECT sq.Question, sa.Answer, sa.MessageId
        FROM SelfReviewAnswers sa
        LEFT JOIN SelfReviewQuestions sq ON sa.QuestionId = sq.QuestionID
    )
    SELECT  a.FeedbackDeadline , a.MessageId, a.HeroUserPrincipleName, a.CreationDate, a.Text , a.CreatedByUserPrincipleName, sa.Question, sa.Answer
        FROM Assignments a
            LEFT JOIN Answer sa ON a.MessageId = sa.MessageId
        ORDER BY a.CreationDate desc
  `;

  const connection = await db();
  const results = await connection
    .input('ID', id)
    .input('UPN', upn)
    .timed_query(q, 'reviewSelfMessages');
  const message = fixCase(results.recordset);

  return message;
};

const retrieveAllReviewStatusAndAllowedProgressions = async () => {
  const q = `
  select
    s.ReviewStatusId as CurrentStatusId,
    s.Description,
    s.ActionName,
    a.NextStatusId
  from
    ReviewStatus s
    left join AllowedReviewStatus a on a.CurrentStatusId = s.ReviewStatusId
 `;

  const connection = await db();
  const result = await connection.timed_query(
    q,
    'retrieveAllReviewStatusAndAllowedProgressions'
  );
  return fixCase(result.recordset);
};

const retrieveStartingReviewStatus = async () => {
  if (!startingReviewStatus) {
    const q = `
      SELECT DISTINCT
        s.ReviewStatusId,
        s.Description
      FROM
        AllowedReviewStatus a
        INNER JOIN ReviewStatus s ON a.CurrentStatusId = s.ReviewStatusId
        LEFT JOIN AllowedReviewStatus b ON a.CurrentStatusId = b.NextStatusId
      WHERE
        b.NextStatusId IS NULL;
  `;
    const connection = await db();
    const result = await connection.timed_query(
      q,
      'retrieveStartingReviewStatus'
    );
    startingReviewStatus = fixCase(result.recordset)[0];
  }
  return startingReviewStatus;
};

const retrieveCancelReviewStatus = async () => {
  if (!cancelReviewStatus) {
    const { reviewStatusId } = await retrieveStartingReviewStatus();
    const q = `
        SELECT
          s.ReviewStatusId, s.Description
        FROM
          AllowedReviewStatus a
          INNER JOIN ReviewStatus s on a.NextStatusId = s.ReviewStatusId
        WHERE
          CurrentStatusId = @NewStatusId
          AND NextStatusId IN (
            SELECT
              NextStatusId
            FROM
              AllowedReviewStatus
            GROUP BY
              NextStatusId
            HAVING
              COUNT(NextStatusId) > 1
          )
      `;
    const connection = await db();
    const result = await connection
      .input('NewStatusId', reviewStatusId)
      .timed_query(q, 'retrieveCancelReviewStatus');
    cancelReviewStatus = fixCase(result.recordset)[0];
  }
  return cancelReviewStatus;
};

const retrieveTemplateReviewsInRange = async (id, upn, from, to) => {
  const q = `
        SELECT m.MessageId, m.HeroUserPrincipleName, s.DisplayName AS CreatedByUserPrincipleName, m.CreationDate, m.Text, Code,  FeedbackTagId, t.TagId , TagRating, TagName
        FROM Messages m
          INNER JOIN FeedbackAssignments fa ON  m.MessageId = fa.MessageId
          INNER JOIN Review r ON r.ReviewId = fa.ReviewId AND r.TemplateId = @ID
          INNER JOIN MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
          INNER JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
          INNER JOIN Tags t ON t.TagId = ft.TagId
          INNER JOIN Staff s ON s.UserPrincipleName =  m.CreatedByUserPrincipleName
        WHERE m.DeletedDate IS NULL
              AND m.HeroUserPrincipleName = @UPN
              AND ( CONVERT(DATE, m.CreationDate) BETWEEN CONVERT(DATE, @FROM) AND CONVERT(DATE, @TO ) )
        ORDER BY m.CreationDate desc
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .input('UPN', upn)
    .input('FROM', from)
    .input('TO', to)
    .timed_query(q, 'retrieveTemplateReviewsInRange');
  return structuredMessagesWithTags(fixCase(result.recordset));
};

const voluntaryFeedbackMessagesInRange = async (upn, from, to) => {
  const q = `
   SELECT m.MessageId, m.HeroUserPrincipleName, s.DisplayName AS CreatedByUserPrincipleName, m.CreationDate, m.Text, Code,  FeedbackTagId, t.TagId , TagRating, TagName
   FROM Messages m
      LEFT JOIN FeedbackAssignments fat ON m.MessageId = fat.MessageId
      INNER JOIN MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
      INNER JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
      INNER JOIN Tags t ON t.TagId = ft.TagId
      INNER JOIN Staff s ON s.UserPrincipleName =  m.createdByUserPrincipleName
    WHERE m.DeletedDate IS NULL
          AND m.HeroUserPrincipleName = @UPN
          AND fat.MessageId IS NULL
          AND ( CONVERT(DATE, m.CreationDate) BETWEEN CONVERT(DATE, @FROM) AND CONVERT(DATE, @TO ) )
    ORDER BY m.CreationDate desc
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .input('FROM', from)
    .input('TO', to)
    .timed_query(q, 'voluntaryFeedbackMessagesInRange');
  const message = structuredMessagesWithTags(fixCase(results.recordset));

  return message;
};

const allDeletedFeedback = async () => {
  const query = `
 SELECT m.MessageId,m.CreatedByUserPrincipleName,m.CreationDate,m.DeletedReason,m.DeletedBy,m.DeletedDate,m.Reply, m.Text,f.TagRating,t.TagName,retractionReason
 FROM Messages m
 INNER JOIN FeedbackTags f ON m.MessageId= f.MessageId
 INNER JOIN Tags t ON t.TagId= f.TagId
 INNER JOIN FeedbackRetractionReason r ON m.DeletedReason=r.RetractionReasonID
 WHERE m.DeletedDate IS NOT NULL AND m.MessageTypeId=15
  `;

  const request = await db();
  const results = await request.timed_query(query, 'allDeletedFeedback');
  const messages = structuredFeedbacksWithRetractedReasons(
    fixCase(results.recordset)
  );
  return messages;
};

const archiveReview = async (tx, id, archived, upn) => {
  const actionName = archived ? 'Archived' : 'ReviewFinalized';
  const statusId = (await reviewsLogic.getStatusIdByActionName(actionName)).reviewStatusId;

  const q = `
   UPDATE Review
   SET Archived = @Archived
   WHERE ReviewId = @ID

  INSERT INTO ReviewStatusHistory(ReviewId, ReviewStatusId, UpdatedBy, UpdatedDate)
  VALUES(@ID, @StatusId, @UPN, GETDATE())

  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('ID', id)
    .input('Archived', archived)
    .input('UPN', upn)
    .input('StatusId', statusId)
    .timed_query(q, 'archiveReview');
  return result;
};

const updateUpcomingReviewType = async (
  tx,
  staffReviewId,
  nextFeedbackTypeId
) => {
  const updateReviewTypeQuery = `UPDATE StaffReview SET NextFeedbackTypeId= @NextFeedbackTypeId WHERE StaffReviewId = @StaffReviewId`;
  const connection = await tx.timed_request();
  await connection
    .input('StaffReviewId', staffReviewId)
    .input('NextFeedbackTypeId', nextFeedbackTypeId)
    .timed_query(updateReviewTypeQuery);
};

const addUpcomingReviewComment = async (
  tx,
  staffReviewId,
  createdBy,
  comment
) => {
  const query = `
  INSERT INTO ReviewHRComments (DateCreated, CreatedBy, Comment)
  VALUES (GETDATE(), @createdBy, @comment);

  INSERT INTO ReviewHRCommentsStaffReview (ReviewHRCommentId, StaffReviewId)
  VALUES (SCOPE_IDENTITY(), @ID);
  `;
  const connection = await tx.timed_request();
  await connection
    .input('ID', staffReviewId)
    .input('createdBy', createdBy)
    .input('comment', comment)
    .timed_query(query, 'addUpcomingReviewComment');
};

const getUpcomingReviewComments = async (staffReviewId) => {
  const query = `
      SELECT rc.DateCreated AS DateCreated, s.DisplayName AS CreatedBy, rc.Comment
      FROM ReviewHRComments rc
        INNER JOIN Staff s ON s.UserPrincipleName = rc.CreatedBy
        INNER JOIN ReviewHRCommentsStaffReview rcr ON rcr.ReviewHRCommentId=rc.ReviewHRCommentId
      WHERE rcr.StaffReviewId = @ID
  `;

  const connection = await db();
  const result = await connection
    .input('ID', staffReviewId)
    .timed_query(query, 'getReviewStaffComments');
  return fixCase(result.recordset);
};

const checkLastSavedForLater = async (assignmentId) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  if (
    !Object.hasOwn(lastSavedDateMap,assignmentId) ||
    lastSavedDateMap[assignmentId] < currentDate
  ) {
    await getLastSavedDate(assignmentId);
    await checkAndClearDateStorage(currentDate);
  }

  const lastSavedForLater = lastSavedDateMap[assignmentId];
  return currentDate < lastSavedForLater;
};

const getLastSavedDate = async (assignmentId) => {
  const q = `
    SELECT UpdateDate as updateDate
    FROM FeedbackAssignmentsWithActiveStatus
    WHERE FeedbackAssignmentID = @AssignmentId AND FeedbackAssignmentStatusId = 4;
  `;
  const connection = await db();
  const result = await connection
    .input('AssignmentId', assignmentId)
    .timed_query(q, 'getLastSavedDate');

  if (result.recordset.length > 0) {
    return (lastSavedDateMap[assignmentId] = result.recordset[0]['updateDate']);
  } else {
    return null;
  }
};

const checkAndClearDateStorage = async (currentDate) => {
  for (const assignmentId in lastSavedDateMap) {
    if (Object.hasOwn(lastSavedDateMap,assignmentId)) {
      const savedDate = lastSavedDateMap[assignmentId];
      if (savedDate < currentDate) {
        delete lastSavedDateMap[assignmentId];
      }
    }
  }
};

const addStaffMemberComment = async (tx, staffId, createdBy, comment) => {
  const query = `
    INSERT INTO ReviewHRComments (DateCreated, CreatedBy, Comment)
    VALUES (GETDATE(), @createdBy, @comment);

    INSERT INTO ReviewHRCommentsStaff (ReviewHRCommentId, StaffId)
    VALUES (SCOPE_IDENTITY(), @staffID);
  `;
  const connection = await tx.timed_request();
  await connection
    .input('staffID', staffId)
    .input('createdBy', createdBy)
    .input('comment', comment)
    .timed_query(query, 'addStaffMemberComment');
};

const deleteStaffMemberComment = async (staffMemberCommentId, upn) => {
  const query = `
    UPDATE ReviewHRCommentsStaff
    SET DeletedAt = GETDATE(),
        DeletedBy = @Upn
    WHERE ReviewHrCommentsStaffId = @StaffMemberCommentId
  `;

  const connection = await db();
  await connection
    .input('StaffMemberCommentId', staffMemberCommentId)
    .input('Upn', upn)
    .timed_query(query, 'deleteStaffMemberComment');
}

const getStaffMemberComments = async (staffId) => {
  const query = `
    SELECT s.StaffId, rc.ReviewHRCommentId, rhrcs.ReviewHrCommentsStaffId, rc.DateCreated AS DateCreated, s.DisplayName AS CreatedBy, rc.Comment
    FROM ReviewHRComments rc
    INNER JOIN Staff s ON s.UserPrincipleName = rc.CreatedBy
    INNER JOIN ReviewHRCommentsStaff rhrcs ON rhrcs.ReviewHRCommentId=rc.ReviewHRCommentId AND rhrcs.DeletedAt IS NULL
    WHERE rhrcs.StaffId = @staffId
  `;

  const connection = await db();
  const result = await connection
    .input('staffId', staffId)
    .timed_query(query, 'getStaffMemberComments');
  return fixCase(result.recordset);
};

const getAllStaffReviewComments = async (upn) => {
  const query = `
    SELECT
      smrh.StaffReviewId,
      rhrcom.ReviewHRCommentId,
      rhsr.ReviewHrCommentsStaffReviewId,
      rhrcom.Comment,
      s.DisplayName as CreatedBy,
      rhrcom.DateCreated
    FROM StaffMemberReviewHistory smrh
    LEFT JOIN ReviewHRCommentsStaffReview rhsr ON rhsr.StaffReviewId = smrh.StaffReviewId
    LEFT JOIN ReviewHRComments rhrcom ON rhrcom.ReviewHRCommentId = rhsr.ReviewHRCommentId
    LEFT JOIN Staff s ON s.UserPrincipleName = rhrcom.CreatedBy
    WHERE smrh.UPN = @UPN AND rhrcom.Comment IS NOT NULL
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'getAllStaffReviewComments');
  return fixCase(result.recordset);
};

const getAllReviewsComments = async (upn) => {
  const query = `
    SELECT
      smrh.ReviewId,
      rhrcom.ReviewHRCommentId,
      rhrc.ReviewHRCommentsReviewsId,
      rhrcom.Comment,
      s.DisplayName as CreatedBy,
      rhrcom.DateCreated
    FROM StaffMemberReviewHistory smrh
    LEFT JOIN ReviewHRCommentsReviews rhrc ON rhrc.ReviewId = smrh.ReviewId
    LEFT JOIN ReviewHRComments rhrcom ON rhrc.ReviewHRCommentId = rhrcom.ReviewHRCommentId
    LEFT JOIN Staff s ON s.UserPrincipleName = rhrcom.CreatedBy
    WHERE smrh.UPN = @UPN AND rhrcom.Comment IS NOT NULL
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'getAllReviewsComments');
  return fixCase(result.recordset);
};

const getUserBulkNudgeReviewCommunicationsForToday = async (userPrincipleName) => {
  const query = `
    SELECT
      rc.ReviewCommunicationId,
      rc.ReviewCommunicationTypeId,
      rc.NudgedBy,
      rc.NudgedTo,
      rc.NudgedDate,
      rc.ReviewCommunicationReasonId
    FROM ReviewCommunication rc
    INNER JOIN ReviewCommunicationReason rcr
    ON rcr.ReviewCommunicationReasonId = rc.ReviewCommunicationReasonId AND rcr.Reason = 'HR manual bulk nudge'
    INNER JOIN ReviewCommunicationType rct
    ON rct.ReviewCommunicationTypeId = rc.ReviewCommunicationTypeId AND rct.Type = 'Reviewer e-mail'
    WHERE
        rc.NudgedTo = @UserPrincipleName
        AND CAST(rc.NudgedDate AS DATE) = CAST(GETDATE() AS DATE);
  `;

  const connection = await db();
  const results = await connection
    .input('UserPrincipleName', userPrincipleName)
    .timed_query(query, 'getUserBulkNudgeReviewCommunicationsForToday');
  return fixCase(results.recordset);
}

const getStaffMemberLatestComment = async (staffId) => {
  const query = `
    SELECT TOP 1 s.StaffId, rc.ReviewHRCommentId, rhrcs.ReviewHrCommentsStaffId, rc.DateCreated AS DateCreated, s.DisplayName AS CreatedBy, rc.Comment
    FROM ReviewHRComments rc
    INNER JOIN Staff s ON s.UserPrincipleName = rc.CreatedBy
    INNER JOIN ReviewHRCommentsStaff rhrcs ON rhrcs.ReviewHRCommentId=rc.ReviewHRCommentId AND rhrcs.DeletedAt IS NULL
    WHERE rhrcs.StaffId = @staffId
    AND rc.DateCreated <= GETDATE()
    ORDER BY  rc.DateCreated DESC
  `;

  const connection = await db();
  const result = await connection
    .input('staffId', staffId)
    .timed_query(query, 'getStaffMemberLatestComment');

  if (result.recordset && result.recordset.length>0) {
    return fixCase(result.recordset)[0];
  }else {
    return undefined
  }
};



const getDetailsForFeedbackProvidersRequestEmail = async (reviewId: number): Promise<FeedbackProvidersRequest | undefined> => {
  const query = `
    SELECT
        swad.DisplayName AS RevieweeName,
        managerDetails.DisplayName AS ReviewerName,
        hrRepDetails.DisplayName AS HrRepName,
        rwas.HrRep AS HrRepEmail,
        swad.manager AS ReviewerEmail,
        fat.TemplateName as reviewType,
        DATENAME(month, rwas.DueDate) as reviewMonth,
        rwas.reviewId
    FROM
        ReviewWithActiveStatus rwas
    INNER JOIN
        FeedbackAssignmentTemplate fat
          ON fat.FeedbackAssignmentTemplateId = rwas.TemplateId
    INNER JOIN
        StaffWithActiveDepartment swad
          ON rwas.reviewee = swad.UserPrincipleName
    INNER JOIN
        Staff managerDetails
          ON managerDetails.UserPrincipleName = swad.Manager
    INNER JOIN
        Staff hrRepDetails
          ON rwas.HrRep = hrRepDetails.UserPrincipleName
    WHERE
        rwas.reviewid = @ReviewId
    AND swad.StaffStatus <> 'terminated'
    AND NOT EXISTS (
      SELECT 1
      FROM ReviewCommunication rc
      INNER JOIN ReviewCommunicationReviewLink rl ON rc.ReviewCommunicationId = rl.ReviewCommunicationId
      WHERE rl.reviewId =  @ReviewId
      AND CAST(rc.NudgedDate AS DATE) >= CAST(GETDATE() AS DATE)
      AND rc.ReviewCommunicationTypeId = (SELECT rct.ReviewCommunicationTypeId FROM ReviewCommunicationType rct WHERE rct.Type = 'Feedback Providers Request e-mail')
      AND managerDetails.UserPrincipleName = rc.NudgedTo
    );`

  const connection = await db();
  const result = await connection
    .input('ReviewId', reviewId)
    .timed_query(query, 'getDetailsForFeedbackProvidersRequestEmail');

  if(result.recordset && result.recordset.length>0) {
    return fixCase(result.recordset)[0] as FeedbackProvidersRequest;
  } else {
    return undefined
  }
}

const retrieveDetailsForFeedbackProvidersRequestReminders = async (): Promise<FeedbackProvidersRequest[]> => {
  const query = `
    SELECT hrd.UserPrincipleName AS HrRepEmail, hrd.DisplayName AS HrRepName,
      md.UserPrincipleName AS ReviewerEmail, md.DisplayName AS ReviewerName,
      ds.UserPrincipleName AS RevieweeEmail, ds.DisplayName AS RevieweeName,
      fat.TemplateName as reviewType,
      DATENAME(month, rwas.DueDate) as reviewMonth,
      rwas.reviewId
    FROM ReviewWithActiveStatus rwas
	  INNER JOIN FeedbackAssignmentTemplate fat
    ON fat.FeedbackAssignmentTemplateId = rwas.TemplateId
    INNER JOIN ReviewStatus rs
    ON rs.ReviewStatusId = rwas.ReviewStatusId
    AND rs.Description = 'Reviewers Requested'
    INNER JOIN DecoratedStaff ds
    ON rwas.reviewee = ds.UserPrincipleName
    INNER JOIN Staff md
    ON md.UserPrincipleName = ds.Manager
    INNER JOIN Staff hrd
    ON rwas.HrRep = hrd.UserPrincipleName
    WHERE ds.StaffStatus <> 'terminated'
    AND NOT EXISTS (
      SELECT 1
      FROM ReviewCommunication rc
      INNER JOIN Staff managerDetails ON managerDetails.UserPrincipleName = rc.NudgedTo
      INNER JOIN ReviewCommunicationReviewLink rl ON rc.ReviewCommunicationId = rl.ReviewCommunicationId
      WHERE rl.reviewId = rwas.reviewId
        AND CAST(rc.NudgedDate AS DATE) >= CAST(GETDATE() AS DATE)
        AND rc.ReviewCommunicationTypeId = (SELECT rct.ReviewCommunicationTypeId FROM ReviewCommunicationType rct WHERE rct.Type = 'Feedback Providers Request e-mail')
        AND managerDetails.UserPrincipleName = rc.NudgedTo
    )
  `;
  const connection = await db();
  const result = await connection
    .timed_query(query, 'retrieveDetailsForFeedbackProvidersRequestReminders');

    return fixCase(result.recordset) as FeedbackProvidersRequest[];
}

module.exports = {
  retrieveStaffHistory,
  archiveReview,
  voluntaryFeedbackMessagesInRange,
  retrieveTemplateReviewsInRange,
  getReview,
  updateStatusOfReviewBasedOnFeedbackAssignments,
  reviewSelfMessages,
  reviewPeerMessages,
  createReview,
  getReviewComments,
  getUPN,
  getReviewMeetingMinutes,
  retrieveReviewMeetingMinutesAttendees,
  addOrUpdateReviewNotes,
  addReviewMeetingMinutesAttendee,
  updateStaffReviewDeadline,
  getPreviousReviewId,
  retrieveFilteredReviews,
  allReviewAssignments,
  addEmployeeFeedback,
  allTags,
  addFeedbackTags,
  allRevieweePublishedFeedbackMessages,
  allPrincipleFeedbackMessages,
  get_feedbacks_assigned_to_user,
  assignFeedbackMessageId,
  get_user_display_name,
  allFeedback,
  get_users_with_same_manager,
  addAssignedFeedbackAnswers,
  addOrUpdateFeedbackAssignments,
  getFeedbackAssignments,
  getOutstandingFeedback,
  allFeedbackAssignments,
  allRevieweeFeedbackMessages,
  allRevieweeVoluntaryFeedbackMessages,
  all_reviewee_feedback_messages_bar_graph_visualisation,
  assignedFeedbackSelfIndication,
  retrieveOutstandingFeedbackForReviewer,
  allRevieweeAssignedFeedbackMessages,
  getFeedbackAssignment,
  getExternalFeedbackAssignment,
  allFeedbackTemplates,
  retrieveFeedbackTemplate,
  getFeedbackAssignmentTemplate,
  getSyndicateIdeaTeamMembers,
  getSelfReviewQuestions,
  addNewLevelUpFeedbackAssignment,
  getAssignmentsDueInAWeekOrOnTheDay,
  updateReviewRepresentative,
  getSoonToBeOverdueInternalAssignments: getSoonToBeOverdueInternalAssignments,
  getOverdueAssignments,
  retrieveFeedbackAssignmentDetailsForNudge,
  getCurrentDayAssignmentNudges,
  getAssignmentAllowedStatusProgressions,
  addGuestReviewer,
  createNewFeedbackTemplate,
  updateFeedbackTemplate,
  getOutstandingLevelUpFeedbackAssignments,
  getLevelUpFeedbackAssignments,
  removeAssignedFeedback,
  removeFeedbackMessage,
  getGuestReviewerUuid,
  findReviewerInStaff,
  findReviewerForFeedbackAssignment,
  removeFeedbackTemplateQuestion,
  addFeedbackTemplateQuestion,
  getDefaultTemplateVariables,
  getTemplateVariables,
  allUPNFeedbackMessagesSince,
  resetFeedbackMessageAssigned,
  findFeedbackWithoutSentimentPrediction,
  storeFeedbackSentimentPrediction,
  findFeedbackTagsWithoutRatingPrediction,
  storeFeedbackTagPrediction,
  allDeletedFeedback,
  assignFeedbackConstructiveMessageId,
  findConstructiveMessageRelatedToPositiveMessage,
  getFeedbackAssignmentLevelUpDetails,
  retractFeedbackAssignment,
  retrieveAllReviewStatusAndAllowedProgressions,
  retrieveStartingReviewStatus,
  retrieveCancelReviewStatus,
  getNewStatusId,
  getStatusIdByDescription,
  isAssignmentProgressionAllowed,
  insertStatusHistory,
  checkAndMarkFeedbackAssignment,
  deleteActiveFeedbackAssignments,
  addUpcomingReviewComment,
  getUpcomingReviewComments,
  updateUpcomingReviewType,
  checkLastSavedForLater,
  getLastSavedDate,
  checkAndClearDateStorage,
  addStaffMemberComment,
  getStaffMemberComments,
  getAllStaffReviewComments,
  getAllReviewsComments,
  getUserBulkNudgeReviewCommunicationsForToday,
  addTemporaryReviewHrRep,
  getStaffMemberLatestComment,
  deleteStaffMemberComment,
  getDetailsForFeedbackProvidersRequestEmail,
  retrieveDetailsForFeedbackProvidersRequestReminders,
  deleteMeetingMinutesAttendees,
  insertMeetingMinutesAttendees,
};
