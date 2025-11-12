import { parseIfSetElseDefault } from '@the-hive/lib-core';
import { StaffLogic } from '@the-hive/lib-staff-logic';
import { db } from '../shared/db';
import fixCase from '../shared/fix-case';
import { groupBy } from '../shared/mapping';

const FEEDBACK_ASSIGNMENT_NUDGE_OVERDUE_DAYS_LIMIT = parseIfSetElseDefault(
  'FEEDBACK_ASSIGNMENT_NUDGE_OVERDUE_DAYS_LIMIT',
  42
);

const FEEDBACK_ASSIGNMENT_NUDGE_OVERDUE_DAYS_UPPER_LIMIT =
  parseIfSetElseDefault(
    'FEEDBACK_ASSIGNMENT_NUDGE_OVERDUE_DAYS_UPPER_LIMIT',
    14
  );

const structuredOutstandingReviewFeedbackAssignments = async (upn) => {
  const assignments = await retrieveOutstandingUPNFeedbackAssignments(upn);
  const result = await structuredAssignments(assignments);

  if (result) {
    const today = new Date();
    const extractor = (obj) =>
      today.getTime() - new Date(obj.dueBy).getTime() > 0
        ? 'Overdue'
        : obj.type;
    const groupedResult = groupBy(result, extractor, true);

    return groupedResult;
  } else {
    return [];
  }
};

const structuredOutstandingReviewFeedbackAssignment = async (upn) => {
  const assignments = await retrieveOutstandingUPNFeedbackAssignments(upn);
  const result = await structuredAssignments(assignments);

  if (result.length > 0) {
    return result[0];
  } else {
    return undefined;
  }
};

const structuredAssignments = async (assignments) => {
  const result = await Promise.all(
    assignments.map(async (assignment) => {
      return {
        status: assignment.status,
        assignmentId: assignment.assignmentId,
        reviewee: {
          upn: assignment.upn,
          displayName: assignment.displayName,
        },
        reviewer: assignment.reviewer,
        dueBy: assignment.dueBy,
        type: assignment.templateName,
        isReview: assignment.isReview,
      };
    })
  );

  return result;
};

const structuredReviewSurvey = async (assignmentId, upn) => {
  const assignment = await retrieveFeedbackAssignment(assignmentId);
  const type = await determineReviewType(assignment.upn, upn);
  const review = await retrieveReviewByAssignmentId(assignmentId);
  const reviewCreationDate = new Date(review.dateCreated);
  const surveyId = await retrieveSurveyId(assignment.templateId, type);
  const surveyQuestions = await structureSurveyQuestions(surveyId.id, reviewCreationDate);

  const survey = {
    id: surveyId.id,
    questions: surveyQuestions,
  };
  return survey;
};

const retrieveReviewByAssignmentId = async (assignmentId) => {
  const query = `
    SELECT
      r.ReviewId as reviewId,
      r.DateCreated as dateCreated,
      r.CreatedBy as createdBy,
      r.DueDate as dueDate,
      r.TemplateId as templateId,
      r.Reviewee as reviewee
    FROM Review r
    INNER JOIN FeedbackAssignments fa ON r.ReviewId = fa.ReviewId
    WHERE fa.FeedbackAssignmentID = @AssignmentId;
  `;

  const connection = await db();
  const result = await connection
    .input('AssignmentId', assignmentId)
    .timed_query(query, 'retrieveReviewByAssignmentId');
  return fixCase(result.recordset)[0];
}

const assignmentQuestionIds = async (assignmentId, upn) => {
  const assignment = await retrieveFeedbackAssignment(assignmentId);
  const type = await determineReviewType(assignment.upn, upn);
  const review = await retrieveReviewByAssignmentId(assignmentId);
  const reviewCreationDate = new Date(review.dateCreated);
  const surveyId = await retrieveSurveyId(assignment.templateId, type);

  const questionIds = await surveyQuestionIds(surveyId.id, reviewCreationDate);
  return questionIds.map(questionId => questionId.reviewSurveyQuestionId);
}

const surveyQuestionIds = async (surveyId, reviewCreationDate) => {
  const q = `
    SELECT ReviewSurveyQuestionId FROM ReviewSurveyQuestion
    WHERE ReviewSurveyVersionId = (
      SELECT ReviewSurveyVersionId FROM dbo.ActiveReviewSurveyVersionForDate(@ReviewCreationDate)
      WHERE ReviewSurveyId = @SurveyId
    )
    AND DeletedDate IS NULL
  `;

  const connection = await db();
  const result = await connection
    .input('SurveyId', surveyId)
    .input('ReviewCreationDate', reviewCreationDate)
    .timed_query(q, 'surveyQuestionIds');
  return fixCase(result.recordset);
}

const structureSurveyQuestions = async (id, reviewCreationDate) => {
  const questions = await retrieveSurveyQuestions(id, reviewCreationDate);

  const result = await Promise.all(
    await questions.map(async (question) => {
      const ratingScale =
        question.type == 'extended-rating' || question.type == 'rating-only'
          ? await retrieveSurveyQuestionScale(question.id)
          : undefined;

      return {
        id: question.id,
        type: question.type,
        name: question.name,
        question: question.question,
        displayOrder: question.displayOrder,
        scale: ratingScale,
      };
    })
  );
  return result;
};

const structuredReviewReport = async (
  review,
  anonymous = false,
  levelupFrom = null,
  levelupTo = null,
  voluntaryFrom = null,
  voluntaryTo = null
) => {
  const reviewResponse = await structuredReviewRelatedFeedback(review, anonymous);
  let levelUpData = [];
  let voluntaryData = [];

  if (levelupFrom && levelupTo) {
    levelUpData = await structuredLevelupRelatedFeedback(
      review,
      levelupFrom,
      levelupTo,
      anonymous
    );
  }

  if (voluntaryFrom && voluntaryTo) {
    voluntaryData = await voluntaryFeedbackMessagesInRange(
      review.reviewee,
      voluntaryFrom,
      voluntaryTo
    );
    voluntaryData = await structuredTaggedFeedback(
      review,
      voluntaryData,
      anonymous
    );
  }

   const staffLogic = new StaffLogic(db);
   const additionalInfo = await staffLogic.getAdditionalInfo(review.reviewee);

  const result = {
    review: review,
    response: sortReviewFeedbackBySelfReviewFirst(
      reviewResponse,
      review.reviewee
    ),
    levelup: sortReviewFeedbackBySelfReviewFirst(levelUpData, review.reviewee),
    voluntary: sortReviewFeedbackBySelfReviewFirst(
      voluntaryData,
      review.reviewee
    ),
    flag: additionalInfo?.flag,
  };

  return result;
};

const sortReviewFeedbackBySelfReviewFirst = (reviews, reviewee) => {
  return reviews.sort((a, b) => {
    if (a.reviewer.upn.toLowerCase() == reviewee.toLowerCase()) {
      return -1;
    } else if (b.reviewer.upn.toLowerCase() == reviewee.toLowerCase()) {
      return 1;
    } else {
      return 0;
    }
  });
};

const structuredReviewRelatedFeedback = async (review, anonymous?) => {
  let result = [];

  let taggedFeedback = await getTaggedFeedback(review);
  let surveyFeedback = await getSurveyFeedback(review);

  taggedFeedback = await structuredTaggedFeedback(
    review,
    taggedFeedback,
    anonymous
  );
  result = result.concat(taggedFeedback);

  surveyFeedback = await structuredSurveyFeedback(surveyFeedback, anonymous);
  result = result.concat(surveyFeedback);

  return result;
};

const structuredTaggedFeedback = async (review, taggedFeedback, anonymous?) => {
  const TAGGED_FEEDBACK_MAX_SCORE = 5;
  const result = [];
  let selfReviewAnswers = undefined;

  const selfReview = taggedFeedback.find(
    (f) => f.createdByUserPrincipleName == review.reviewee
  );
  if (selfReview && selfReview.feedbackAssignmentId) {
    selfReviewAnswers = (
      await getTaggedFeedbackAnswers(selfReview.feedbackAssignmentId)
    ).map((q) => ({
      question: { name: q.question, displayOrder: q.questionId },
      generalComment: q.answer,
    }));
  }

  taggedFeedback.map((feedback) => {
    const inResult = result.find(
      (f) =>
        f.feedbackAssignmentId == feedback.feedbackAssignmentId ||
        (!feedback.feedbackAssignmentId && f.messageId == feedback.messageId)
    );

    if (!inResult) {
      const feedbackAssignmentRelatedResponse = taggedFeedback.filter(
        (f) =>
          f.feedbackAssignmentId == feedback.feedbackAssignmentId ||
          (!feedback.feedbackAssignmentId && f.messageId == feedback.messageId)
      );
      let feedbackAssignmentRelatedTags;

      if (feedback.feedbackAssignmentId) {
        feedbackAssignmentRelatedTags = feedbackAssignmentRelatedResponse
          .map((f) => ({
            name: f.tagName,
            score: f.tagRating,
            total: TAGGED_FEEDBACK_MAX_SCORE,
          }))
          .filter((f) => f.name != null);
      } else {
        feedbackAssignmentRelatedTags = [
          ...new Map(
            feedbackAssignmentRelatedResponse
              .map((f) => ({
                name: f.tagName,
                score: f.tagRating,
                total: TAGGED_FEEDBACK_MAX_SCORE,
              }))
              .map((item) => [item['name'], item])
          ).values(),
        ];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const feedbackAssignmentRelatedComments: any[] = [
        ...new Map(
          feedbackAssignmentRelatedResponse
            .map((f) => ({ type: f.commentType, text: f.text }))
            .map((item) => [item['type'], item])
        ).values(),
      ];

      result.push({
        feedbackAssignmentId: feedback.feedbackAssignmentId,
        reviewer: anonymizeReviewer(
          feedback.createdByUserPrincipleName,
          feedback.reviewerDisplayName,
          feedback.anonymous && anonymous
        ),
        createdAt: feedback.creationDate,
        tags: feedbackAssignmentRelatedTags,
        positiveComment: feedbackAssignmentRelatedComments.find(
          (c) => c.type == 'positiveComment'
        )?.text,
        constructiveComment: feedbackAssignmentRelatedComments.find(
          (c) => c.type == 'constructiveComment'
        )?.text,
        discussionPoints:
          review.reviewee == feedback.createdByUserPrincipleName
            ? selfReviewAnswers
            : undefined,
        messageId: feedback.feedbackAssignmentId
          ? undefined
          : feedback.messageId,
        anonymous: feedback.anonymous,
      });
    }
  });

  return result;
};

const structuredSurveyFeedback = async (surveyFeedback, anonymous) => {
  const result = [];

  surveyFeedback.map((feedback) => {
    const inResult = result.find(
      (f) => f.feedbackAssignmentId == feedback.feedbackAssignmentId
    );

    if (!inResult) {
      const feedbackAssignmentRelatedResponse = surveyFeedback.filter(
        (f) => f.feedbackAssignmentId == feedback.feedbackAssignmentId
      );

      const structuredFeedback = feedbackAssignmentRelatedResponse.map((f) => ({
        question: { name: f.name, displayOrder: f.displayOrder, type: f.type },
        rating: f.rating
          ? { score: f.rating, description: f.description, total: f.total }
          : undefined,
        positiveComment: f.positiveComment,
        constructiveComment: f.constructiveComment,
        generalComment: f.generalComment,
      }));

      result.push({
        feedbackAssignmentId: feedback.feedbackAssignmentId,
        reviewer: anonymizeReviewer(
          feedback.reviewerUPN,
          feedback.reviewerDisplayName,
          feedback.anonymous && anonymous
        ),
        createdAt: feedback.creationDate,
        feedback: structuredFeedback.filter(
          (f) => f.question.type != 'standard-answer'
        ),
        discussionPoints: structuredFeedback.filter(
          (f) => f.question.type == 'standard-answer'
        ),
        anonymous: feedback.anonymous,
      });
    }
  });

  return result;
};

const structuredLevelupRelatedFeedback = async (
  review,
  levelupFrom,
  levelupTo,
  anonymous
) => {
  let result = [];
  const levelUpTemplateID = 4;

  let taggedLevelupFeedback = await retrieveTemplateTaggedReviewsInRange(
    levelUpTemplateID,
    review.reviewee,
    levelupFrom,
    levelupTo
  );
  taggedLevelupFeedback = await structuredTaggedFeedback(
    review,
    taggedLevelupFeedback,
    anonymous
  );

  let surveyLevelupFeedback = await retrieveTemplateSurveyReviewsInRange(
    levelUpTemplateID,
    review.reviewee,
    levelupFrom,
    levelupTo
  );
  surveyLevelupFeedback = await structuredSurveyFeedback(
    surveyLevelupFeedback,
    anonymous
  );

  result = result.concat(taggedLevelupFeedback);
  result = result.concat(surveyLevelupFeedback);

  return result;
};

const structuredUserFeedback = async (upn) => {
  const userReviews = await getAllReviewsForReviewee(upn);

  const assignedReviewFeedback = await Promise.all(
    await userReviews.map(async (review) => {
      const reviewResponses = await structuredReviewRelatedFeedback(review);

      return {
        review: {
          reviewId: review.reviewId,
          reviewee: review.reviewee,
          createdAt: review.dateCreated,
          assignedBy: {
            upn: review.hrRep,
            displayName: review.hrRepDisplayName,
          },
          dueDate: review.dueDate,
          status: review.reviewStatus,
          template: review.template,
        },
        reviewResponses,
      };
    })
  );

  let voluntaryFeedback = await voluntaryFeedbackMessagesInRange(upn);
  voluntaryFeedback = await structuredTaggedFeedback(
    { reviewee: upn },
    voluntaryFeedback
  );

  const result = {
    reviewee: upn,
    assigned: assignedReviewFeedback.sort(
      (a, b) => b.review.dueDate.getTime() - a.review.dueDate.getTime()
    ),
    voluntary: voluntaryFeedback.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    ),
  };

  return result;
};

const anonymizeReviewer = (UPN, DisplayName, anonymous) => {
  if (anonymous) {
    return { displayName: 'Anonymous', upn: 'Anonymous' };
  } else {
    return { displayName: DisplayName, upn: UPN };
  }
};

const retrieveReview = async (id) => {
  const q = `
      SELECT  r.ReviewId, r.DateCreated AS DateCreated , r.CreatedBy , r.DueDate AS DueDate , rs.Description  , rs.ReviewStatusId , r.Reviewee, s.DisplayName , fat.TemplateName AS template,
      r.UpdatedDate
      FROM ReviewWithActiveStatus r
        INNER JOIN ReviewStatus rs ON rs.ReviewStatusId = r.ReviewStatusId
        INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateID = r.TemplateId
        INNER JOIN Staff s ON s.UserPrincipleName = r.Reviewee
      WHERE r.ReviewId = @ID AND r.DeletedDate IS NULL
     ORDER BY r.DueDate
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(q, 'retrieveReview');
  return fixCase(result.recordset)[0];
};

const getTaggedFeedback = async (review) => {
  const q = `
   SELECT  fa.feedbackAssignmentId, m.MessageId, m.HeroUserPrincipleName, IsNull(s.DisplayName, fa.reviewer) AS reviewerDisplayName , m.CreatedByUserPrincipleName, fa.anonymous,
          m.CreationDate, m.Text, Code,  FeedbackTagId, t.TagId , TagRating, TagName ,
          Case WHEN (
            fa.MessageId = m.MessageId
          )THEN 'positiveComment'
          ELSE 'constructiveComment'
          END
          AS [commentType]
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
  const result = await connection
    .input('ID', review.reviewId)
    .timed_query(q, 'getTaggedFeedback');

  return fixCase(result.recordset);
};

const getSurveyFeedback = async (review) => {
  const q = `
  WITH FeedbackResponses AS (
    SELECT fa.FeedbackAssignmentID AS FeedbackAssignmentId, fa.Reviewer, fa.FeedbackDeadline, fr.CreationDate , q.ReviewSurveyQuestionId, q.Name , q.ReviewQuestionTypeId, qt.Type, fr.FeedbackResponseId , q.DisplayOrder, fa.Anonymous
    FROM FeedbackAssignments fa
    INNER JOIN FeedbackResponse fr ON  fr.FeedbackAssignmentId = fa.feedbackAssignmentId AND fr.DeletedDate IS NULL
    INNER JOIN ReviewSurveyQuestion q ON q.ReviewSurveyQuestionId = fr.ReviewSurveyQuestionId
    INNER JOIN ReviewQuestionType qt ON qt.ReviewQuestionTypeId = q.ReviewQuestionTypeId
    WHERE fa.ReviewId = @ID
  ),
  RatedResponses AS(
    SELECT r.FeedbackResponseId, s.Rating , s.Description
    FROM FeedbackResponses r
      INNER JOIN FeedbackResponseRating fr ON fr.FeedbackResponseId = r.FeedbackResponseId
      INNER JOIN ReviewSurveyScale s ON s.ReviewSurveyQuestionId = r.ReviewSurveyQuestionId AND fr.Rating = s.Rating
  ),
  RatedResponseTotals AS(
    SELECT s.ReviewSurveyQuestionId, max(s.Rating) AS Total
    FROM ReviewSurveyScale s
        INNER JOIN FeedbackResponses r ON r.ReviewSurveyQuestionId = s.ReviewSurveyQuestionId
    GROUP BY s.ReviewSurveyQuestionId

  )
  SELECT r.FeedbackAssignmentId, r.Anonymous, r.Reviewer AS ReviewerUPN , IsNull(s.DisplayName, r.Reviewer) AS ReviewerDisplayName , r.FeedbackDeadline, r.DisplayOrder, r.[Type], r.Name,  r.CreationDate , rr.Rating, t.Total , rr.[Description] , dc.PositiveComment, dc.ConstructiveComment, sc.GeneralComment
  FROM FeedbackResponses r
      JOIN FeedbackAssignments fa ON fa.FeedbackAssignmentId = r.FeedbackAssignmentId
      LEFT JOIN RatedResponses rr ON rr.FeedbackResponseId = r.FeedbackResponseId
      LEFT JOIN FeedbackResponseDoubleComment dc ON dc.FeedbackResponseId = r.FeedbackResponseId
      LEFT JOIN FeedbackResponseSingleComment sc ON sc.FeedbackResponseId = r.FeedbackResponseId
      LEFT JOIN RatedResponseTotals t ON t.ReviewSurveyQuestionId = r.ReviewSurveyQuestionId
      LEFT JOIN Staff s ON s.UserPrincipleName = r.Reviewer
  WHERE fa.DeletedBy IS NULL
  ORDER BY r.DisplayOrder

  `;

  const connection = await db();
  const result = await connection
    .input('ID', review.reviewId)
    .input('UPN', review.reviewee)
    .timed_query(q, 'getSurveyFeedback');

  return fixCase(result.recordset);
};

const getTaggedFeedbackAnswers = async (id) => {
  const query = `
    SELECT sq.QuestionId , sq.Question, sa.Answer
    FROM SelfReviewAnswers sa
        INNER JOIN SelfReviewQuestions sq ON sa.QuestionId = sq.QuestionID
        INNER JOIN FeedbackAssignments fa ON fa.MessageId = sa.MessageId AND fa.FeedbackAssignmentId = @ID
    ORDER BY sq.QuestionId asc
  `;

  const connection = await db();
  const results = await connection
    .input('ID', id)
    .timed_query(query, 'getTaggedFeedbackAnswers');
  return fixCase(results.recordset);
};

const retrieveOutstandingUPNFeedbackAssignments = async (upn) => {
  const q = `
    SELECT fa.FeedbackAssignmentID AS AssignmentId , LOWER(r.Reviewee) AS upn, s.DisplayName, fa.FeedbackDeadline AS DueBy , r.TemplateId, ft.TemplateName, ft.IsReview
      FROM FeedbackAssignments fa
          INNER JOIN Review r ON r.ReviewId = fa.ReviewId
          INNER JOIN Staff s ON LOWER(s.UserPrincipleName) = LOWER(r.Reviewee)
          INNER JOIN FeedbackAssignmentTemplate ft ON ft.FeedbackAssignmentTemplateId = r.TemplateId
      WHERE r.DeletedDate IS NULL
          AND fa.DeletedDate IS NULL
            AND fa.Reviewer = @UPN
            AND  fa.MessageId IS NULL AND NOT EXISTS (select 1 from FeedbackResponse fr where fr.feedbackAssignmentId = fa.feedbackAssignmentID AND fr.DeletedDate IS NULL)
    ORDER BY fa.FeedbackDeadline ASC

  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'retrieveOutstandingUPNFeedbackAssignments');
  return fixCase(result.recordset);
};

const retrieveAssignmentStatus = async (id) => {
  const q = `
    WITH Assignments AS
    (
        SELECT fa.FeedbackAssignmentId, fa.MessageId
        FROM FeedbackAssignments fa
        WHERE fa.FeedbackAssignmentId = @ID AND fa.DeletedDate IS NULL
    )
    SELECT (CASE
                WHEN a.MessageId IS NULL AND NOT EXISTS
                (
                  SELECT 1
                  FROM FeedbackResponse fr
                  WHERE fr.feedbackAssignmentId = a.feedbackAssignmentID AND fr.DeletedDate IS NULL
                )
                THEN 'Pending'
                ELSE 'Completed'
            END
            ) AS [status]
    FROM Assignments a
  `;
  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(q, 'retrieveAssignmentStatus');
  return fixCase(result.recordset)[0];
};

const retrieveOverdueFeedbackAssignment = async () => {
  const q = `
    SELECT ManagerEmail, Reviewer, FeedbackAssignmentID, FeedbackDeadline, TemplateName, Reviewee
      FROM ActiveFeedbackAssignmentsWithManagerEmails
    WHERE (DATEDIFF(day, GETDATE(), FeedbackDeadline) BETWEEN -@OverdueLimit AND @OverdueUpperLimit)
  `;
  const connection = await db();
  const result = await connection
    .input('OverdueLimit', FEEDBACK_ASSIGNMENT_NUDGE_OVERDUE_DAYS_LIMIT)
    .input(
      'OverdueUpperLimit',
      FEEDBACK_ASSIGNMENT_NUDGE_OVERDUE_DAYS_UPPER_LIMIT
    )
    .timed_query(q, 'retrieveOverdueFeedbackAssignment');

  const feedbackAssignmentsByManager = {};
  for (const row of fixCase(result.recordset)) {
    const {
      managerEmail,
      reviewer,
      feedbackAssignmentId,
      feedbackDeadline,
      templateName,
      reviewee,
    } = row;
    if (!feedbackAssignmentsByManager[managerEmail]) {
      feedbackAssignmentsByManager[managerEmail] = [];
    }
    feedbackAssignmentsByManager[managerEmail].push({
      reviewer: reviewer,
      feedbackAssignmentId: feedbackAssignmentId,
      deadline: feedbackDeadline,
      templateName: templateName,
      reviewee: reviewee,
    });
  }
  return feedbackAssignmentsByManager;
};

const retrieveDisplayName = async (email) => {
  const q = `
      SELECT DisplayName
      FROM Staff
      WHERE UserPrincipleName = @Email
  `;

  const connection = await db();
  const result = await connection
    .input('Email', email)
    .timed_query(q, 'retrieveDisplayName');
  return fixCase(result.recordset)[0];
};

const retrieveFeedbackAssignment = async (id) => {
  const q = `
    SELECT fa.FeedbackAssignmentID AS AssignmentId, LOWER(fa.Reviewer) AS reviewer, LOWER(r.Reviewee) AS upn, s.DisplayName, fa.FeedbackDeadline AS DueBy , r.TemplateId
    FROM FeedbackAssignments fa
        INNER JOIN Review r ON r.ReviewId = fa.ReviewId
        INNER JOIN Staff s ON LOWER(s.UserPrincipleName) = LOWER(r.Reviewee)
    WHERE fa.FeedbackAssignmentID = @ID
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(q, 'retrieveFeedbackAssignment');
  return fixCase(result.recordset)[0];
};

const determineReviewType = async (reviewee, reviewer) => {
  let type;
  if (reviewee.toLowerCase() == reviewer.toLowerCase()) {
    type = 'self';
  } else {
    const q = `
        SELECT
        CASE WHEN EXISTS (SELECT 1 FROM Staff WHERE UserPrincipleName = LOWER(@Reviewer))
            THEN 'peer'
            ELSE 'client'
        END AS type
    `;

    const connection = await db();
    const result = await connection
      .input('Reviewee', reviewee)
      .input('Reviewer', reviewer)
      .timed_query(q, 'determineReviewType');
    type = result.recordset.length != 0 ? result.recordset[0]['type'] : 'peer';
  }

  return type;
};

const retrieveSurveyId = async (templateId, type) => {
  const q = `
    SELECT rs.ReviewSurveyId AS Id
    FROM ReviewSurvey rs
        INNER JOIN ReviewTemplateSurvey rt ON rt.ReviewSurveyId = rs.ReviewSurveyId AND rt.ReviewTemplateId = @TemplateId AND rt.DeletedDate IS NULL
        INNER JOIN ReviewSurveyType  st ON st.ReviewSurveyTypeId = rs.TypeId AND st.Type = @Type
  `;

  const connection = await db();
  const result = await connection
    .input('TemplateId', templateId)
    .input('Type', type)
    .timed_query(q, 'retrieveSurvey');
  return fixCase(result.recordset)[0];
};

const retrieveSurveyQuestions = async (id, reviewCreationDate) => {
  const q = `
    SELECT q.ReviewSurveyQuestionId AS id , q.Name, q.Question, q.DisplayOrder , t.type
    FROM ReviewSurveyQuestion q
        INNER JOIN ReviewQuestionType t ON t.ReviewQuestionTypeId = q.ReviewQuestionTypeId
    WHERE q.ReviewSurveyVersionId = (
      SELECT ReviewSurveyVersionId FROM dbo.ActiveReviewSurveyVersionForDate(@ReviewCreationDate)
      WHERE ReviewSurveyId = @ID
    )
    AND q.DeletedDate IS NULL
    ORDER BY q.DisplayOrder
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .input('ReviewCreationDate', reviewCreationDate)
    .timed_query(q, 'retrieveSurveyQuestions');
  return fixCase(result.recordset);
};

const retrieveSurveyQuestionScale = async (id) => {
  const q = `
    SELECT s.Rating, s.Description
    FROM ReviewSurveyScale  s
    WHERE s.ReviewSurveyQuestionId = @ID
    ORDER BY s.Rating DESC
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(q, 'retrieveSurveyQuestionScale');
  return fixCase(result.recordset);
};

const addDoubleCommentAnswer = async (tx, responseId, answer) => {
  const q = `
    INSERT INTO FeedbackResponseDoubleComment(FeedbackResponseId, PositiveComment, ConstructiveComment)
    VALUES (@ResponseID, @PositiveComment, @ConstructiveComment)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('ResponseID', responseId)
    .input('PositiveComment', answer.positiveComment)
    .input('ConstructiveComment', answer.constructiveComment)
    .timed_query(q, 'addDoubleCommentAnswer');
};

const addRatingAnswer = async (tx, responseId, answer) => {
  const q = `
    INSERT INTO FeedbackResponseRating(FeedbackResponseId, Rating)
    VALUES (@ResponseID, @Rating)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('ResponseID', responseId)
    .input('Rating', answer.rating.rating)
    .timed_query(q, 'addRatingAnswer');
};

const addSingleCommentAnswer = async (tx, responseId, answer) => {
  const q = `
    INSERT INTO FeedbackResponseSingleComment(FeedbackResponseId, GeneralComment)
    VALUES (@ResponseID, @GeneralComment)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('ResponseID', responseId)
    .input('GeneralComment', answer.generalComment)
    .timed_query(q, 'addSingleCommentAnswer');
};

const insertFeedbackResponse = async (
  tx,
  assignmentId,
  surveyQuestionId
) => {
  const q = `
    INSERT INTO FeedbackResponse( FeedbackAssignmentId, ReviewSurveyQuestionId, CreationDate)
    VALUES(@AssignmentID, @SurveyQuestionID, GETDATE())

    SELECT scope_identity() FeedbackResponseId

  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('AssignmentID', assignmentId)
    .input('SurveyQuestionID', surveyQuestionId)
    .timed_query(q, 'insertFeedbackResponse');

  return result.recordset[0].FeedbackResponseId;
};

const retrieveFeedbackAssignmentAssignedToUpn = async (id, upn) => {
  const q = `
    SELECT fa.FeedbackAssignmentID AS AssignmentId , LOWER(r.Reviewee) AS upn, s.DisplayName, fa.FeedbackDeadline AS DueBy , r.TemplateId, fat.TemplateName,
      fas.StatusDescription AS [status]
    FROM FeedbackAssignmentsWithActiveStatus fa
        INNER JOIN Review r ON r.ReviewId = fa.ReviewId
        INNER JOIN Staff s ON LOWER(s.UserPrincipleName) = LOWER(r.Reviewee)
        INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId = r.TemplateId
        INNER JOIN FeedbackAssignmentStatus fas ON fas.FeedbackAssignmentStatusId = fa.FeedbackAssignmentStatusId
    WHERE fa.Reviewer = @UPN AND fa.FeedbackAssignmentID = @ID
    ORDER BY fa.FeedbackDeadline ASC`;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .input('ID', id)
    .timed_query(q, 'retrieveFeedbackAssignmentAssignedToUpn');
  return structuredAssignments(fixCase(result.recordset));
};

const retrieveOutstandingFeedbackAssignment = async (id, upn) => {
  const q = `
    SELECT fa.FeedbackAssignmentID AS AssignmentId , LOWER(r.Reviewee) AS upn, s.DisplayName, fa.FeedbackDeadline AS DueBy , r.TemplateId, fat.TemplateName
    FROM FeedbackAssignments fa
        INNER JOIN Review r ON r.ReviewId = fa.ReviewId
        INNER JOIN Staff s ON LOWER(s.UserPrincipleName) = LOWER(r.Reviewee)
        INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId = r.TemplateId
    WHERE r.DeletedDate IS NULL  AND fa.DeletedDate IS NULL
          AND fa.Reviewer = @UPN AND fa.FeedbackAssignmentID = @ID
          AND  fa.MessageId IS NULL AND NOT EXISTS (select 1 from FeedbackResponse fr where fr.feedbackAssignmentId = fa.feedbackAssignmentID AND fr.DeletedDate IS NULL)
    ORDER BY fa.FeedbackDeadline ASC`;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .input('ID', id)
    .timed_query(q, 'retrieveOutstandingFeedbackAssignment');
  return structuredAssignments(fixCase(result.recordset));
};

const retrieveFilteredReviews = async (
  page,
  size,
  status,
  hrRep,
  from,
  to,
  selectedReviewTypeIds,
  general,
  archived,
  selectedStatusIds
) => {
  const q = `
  WITH SelectedReviewStatuses AS (
    SELECT CAST(value AS INT) AS ReviewStatusId
    FROM STRING_SPLIT(@selectedStatusIds, ',')
  ),
  SelectedReviewTypes AS (
    SELECT CAST(value as INT) AS ReviewTypeId
    FROM STRING_SPLIT(@selectedReviewTypeIds, ',')
  ),
  Reviews AS(
    SELECT
      r.ReviewId,
      r.Reviewee,
      s.DisplayName,
      FORMAT (r.DateCreated, 'yyyy/MM/dd') as DateCreated,
      r.HrRep,
      FORMAT (r.DueDate, 'yyyy/MM/dd') as DueDate,
      rs.Description,
      rs.ReviewStatusId,
      fat.FeedbackAssignmentTemplateId,
      fat.TemplateName,
      fat.ManualFeedbackAssignment,
      r.UpdatedDate,
      s.StaffId
    FROM ReviewWithActiveStatus r
      INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId = r.TemplateId
      LEFT JOIN ReviewStatus rs ON rs.ReviewStatusId = r.ReviewStatusId
      INNER JOIN Staff s ON s.UserPrincipleName=r.Reviewee
    WHERE r.DeletedDate IS NULL
    AND (@selectedReviewTypeIds IS NULL OR (fat.FeedbackAssignmentTemplateId IN (SELECT ReviewTypeId FROM SelectedReviewTypes)))
  )
  SELECT
    COUNT(*) OVER() as overallCount,
    ReviewId,
    Reviews.Reviewee,
    Reviews.DateCreated,
    Reviews.HrRep,
    Reviews.DueDate,
    Reviews.Description AS status,
    Reviews.ReviewStatusId,
    Reviews.FeedbackAssignmentTemplateId,
    Reviews.TemplateName,
    Reviews.ManualFeedbackAssignment,
    Reviews.StaffId,
    Reviews.DisplayName
  FROM Reviews
  WHERE
      (@selectedStatusIds IS NULL OR Reviews.ReviewStatusId IN (SELECT ReviewStatusId FROM SelectedReviewStatuses))
      AND (@HrRep IS NULL OR LOWER(Reviews.HrRep) = LOWER(@HrRep))
      AND (
        @general IS NULL
        OR (LOWER(Reviews.Reviewee) LIKE '%' + LOWER(@general) + '%')
        OR (LOWER(Reviews.TemplateName) LIKE '%' + LOWER(@general) + '%')
        OR (@HrRep IS NULL AND LOWER(Reviews.HrRep) LIKE '%' + LOWER(@general) + '%')
      )
      AND (
        @from IS NULL
        OR (CONVERT(DATE,Reviews.DueDate) BETWEEN CONVERT(DATE, @from) AND CONVERT(DATE, @to ))
        )
         AND (@archived = 'true' OR Reviews.ReviewStatusId NOT IN (
          SELECT ReviewStatusId FROM ReviewStatus WHERE Description IN ('Archived', 'Cancelled')
          ))
  ORDER BY Reviews.DueDate
  OFFSET (((cast(@page as int)) - 1) * (cast(@size as int)))
  ROWS FETCH NEXT (cast(@size as int)) ROWS ONLY
  `;

  const connection = await db();
  const result = await connection
    .input('page', page)
    .input('size', size)
    .input('status', status)
    .input('HrRep', hrRep)
    .input('from', from)
    .input('to', to)
    .input('selectedReviewTypeIds', selectedReviewTypeIds)
    .input('general', general)
    .input('archived', archived)
    .input('selectedStatusIds', selectedStatusIds)
    .timed_query(q, 'retrieveFilteredReviews');
  return fixCase(result.recordset);
};

const allReviewAssignments = async (id) => {
  const q = `
  WITH Assignments AS (
    SELECT fa.FeedbackAssignmentId, fa.AssignedBy, a.CreatedAt, fa.feedbackDeadline AS DueBy, r.Reviewee, s.DisplayName, fa.Reviewer, fat.TemplateName AS Template,
      fat.FeedbackAssignmentTemplateId As TemplateId , fa.MessageId, fa.ClientEmail, fa.FeedbackAssignmentStatusId
      ,r.CreatedBy, fa.UpdateDate, r.HrRep,  sa.DisplayName AS AssignedByDisplayName
    FROM FeedbackAssignmentsWithActiveStatus fa
      INNER JOIN FeedbackAssignments a ON a.FeedbackAssignmentId = fa.FeedbackAssignmentId
      INNER JOIN ReviewWithActiveStatus r ON r.ReviewId = fa.ReviewId
      INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateID = r.TemplateID
      LEFT JOIN Staff s ON s.UserPrincipleName = fa.Reviewer
      LEFT JOIN Staff sa ON sa.UserPrincipleName = fa.AssignedBy
    WHERE r.ReviewId = @ID AND fa.DeletedDate IS NULL
  )

  SELECT a.FeedbackAssignmentId,
    a.AssignedBy,
    a.CreatedAt,
    a.DueBy,
    a.Reviewee,
    COALESCE(a.DisplayName, a.Reviewer) AS DisplayName,
    a.Reviewer,
    a.Template,
    a.TemplateId,
    a.MessageId,
    a.ClientEmail,
    a.CreatedBy,
    a.UpdateDate,
    a.HrRep,
    COALESCE(a.AssignedByDisplayName, a.AssignedBy) AS AssignedByDisplayName,
    (SELECT StatusDescription FROM FeedbackAssignmentStatus
      WHERE FeedbackAssignmentStatusId = a.FeedbackAssignmentStatusId
  ) AS [status],
    COALESCE(fanc.HRNudges, 0) as hrNudges,
    COALESCE(fanc.SystemNudges, 0) as systemNudges
  FROM Assignments a
  LEFT JOIN FeedbackAssignmentNudgeCount fanc ON fanc.FeedbackAssignmentId = a.FeedbackAssignmentId
  ORDER BY a.dueBy
`;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(q, 'allReviewAssignments');

  return fixCase(result.recordset);
};

const updateClientEmail = async (id, email) => {
  const q = `
    UPDATE FeedbackAssignments
    SET ClientEmail = @email
    WHERE FeedbackAssignmentId = @ID
  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .input('email', email)
    .timed_query(q, 'updateClientEmail');
  return result;
};

const retrieveTemplateTaggedReviewsInRange = async (id, upn, from, to) => {
  const q = `
        SELECT  fa.feedbackAssignmentId, fa.anonymous, m.MessageId, m.HeroUserPrincipleName, IsNull(s.DisplayName, fa.reviewer) AS reviewerDisplayName , m.CreatedByUserPrincipleName,
          m.CreationDate, m.Text, Code,  FeedbackTagId, t.TagId , TagRating, TagName ,
          Case WHEN (
            fa.MessageId = m.MessageId
          )THEN 'positiveComment'
          ELSE 'constructiveComment'
          END
          AS [commentType]
        FROM Messages m
          INNER JOIN FeedbackAssignments fa ON  ( m.MessageId = fa.MessageId OR m.MessageId = fa.ConstructiveMessageId)
          INNER JOIN Review r ON r.ReviewId = fa.ReviewId AND r.TemplateId = @ID
          INNER JOIN MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
          LEFT JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
          LEFT JOIN Tags t ON t.TagId = ft.TagId
          LEFT JOIN Staff s ON s.UserPrincipleName =  m.CreatedByUserPrincipleName
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
    .timed_query(q, 'retrieveTemplateTaggedReviewsInRange');
  return fixCase(result.recordset);
};

const retrieveTemplateSurveyReviewsInRange = async (id, upn, from, to) => {
  const q = `
  WITH FeedbackResponses AS (
    SELECT fa.FeedbackAssignmentID AS FeedbackAssignmentId, fa.Reviewer, fa.FeedbackDeadline, fr.CreationDate , q.ReviewSurveyQuestionId, q.Name , q.ReviewQuestionTypeId, qt.Type, fr.FeedbackResponseId , q.DisplayOrder
    FROM FeedbackAssignments fa
    INNER JOIN FeedbackResponse fr ON  fr.FeedbackAssignmentId = fa.feedbackAssignmentId
    INNER JOIN ReviewSurveyQuestion q ON q.ReviewSurveyQuestionId = fr.ReviewSurveyQuestionId
    INNER JOIN ReviewSurvey rs ON rs.ReviewSurveyId = q.ReviewSurveyId
    INNER JOIN ReviewTemplateSurvey rt ON rt.ReviewSurveyId = rs.ReviewSurveyId AND rt.ReviewTemplateId = @ID
    INNER JOIN ReviewQuestionType qt ON qt.ReviewQuestionTypeId = q.ReviewQuestionTypeId
    INNER JOIN Review r ON  r.ReviewId = fa.ReviewId
    WHERE fr.DeletedDate IS NULL
          AND (CONVERT(DATE, fr.CreationDate) BETWEEN CONVERT(DATE, @FROM) AND CONVERT(DATE, @TO ) )
          AND r.Reviewee = @UPN
  ),
  RatedResponses AS(
    SELECT r.FeedbackResponseId, s.Rating , s.Description
    FROM FeedbackResponses r
      INNER JOIN FeedbackResponseRating fr ON fr.FeedbackResponseId = r.FeedbackResponseId
      INNER JOIN ReviewSurveyScale s ON s.ReviewSurveyQuestionId = r.ReviewSurveyQuestionId AND fr.Rating = s.Rating
  ),
  RatedResponseTotals AS(
    SELECT s.ReviewSurveyQuestionId, max(s.Rating) AS Total
    FROM ReviewSurveyScale s
        INNER JOIN FeedbackResponses r ON r.ReviewSurveyQuestionId = s.ReviewSurveyQuestionId
    GROUP BY s.ReviewSurveyQuestionId

  )
  SELECT r.FeedbackAssignmentId, r.Reviewer AS ReviewerUPN , s.DisplayName AS ReviewerDisplayName , r.FeedbackDeadline, r.DisplayOrder, r.[Type], r.Name,  r.CreationDate , rr.Rating, t.Total , rr.[Description] , dc.PositiveComment, dc.ConstructiveComment, sc.GeneralComment
  FROM FeedbackResponses r
      LEFT JOIN RatedResponses rr ON rr.FeedbackResponseId = r.FeedbackResponseId
      LEFT JOIN FeedbackResponseDoubleComment dc ON dc.FeedbackResponseId = r.FeedbackResponseId
      LEFT JOIN FeedbackResponseSingleComment sc ON sc.FeedbackResponseId = r.FeedbackResponseId
      LEFT JOIN RatedResponseTotals t ON t.ReviewSurveyQuestionId = r.ReviewSurveyQuestionId
      INNER JOIN Staff s ON s.UserPrincipleName = r.Reviewer

  `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .input('UPN', upn)
    .input('FROM', from)
    .input('TO', to)
    .timed_query(q, 'retrieveTemplateSurveyReviewsInRange');
  return fixCase(result.recordset);
};

const voluntaryFeedbackMessagesInRange = async (upn, from = null, to = null) => {
  const q = `
   SELECT m.MessageId, m.HeroUserPrincipleName, IsNull(s.DisplayName,  m.CreatedByUserPrincipleName) AS reviewerDisplayName , m.CreatedByUserPrincipleName,  m.CreationDate, m.Text, Code,  FeedbackTagId, t.TagId , TagRating, TagName , 'positiveComment' AS commentType
   FROM Messages m
      LEFT JOIN FeedbackAssignments fat ON m.MessageId = fat.MessageId
      INNER JOIN MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId AND mt.Code = 'feedback'
      INNER JOIN FeedbackTags ft ON ft.MessageId = m.MessageId
      INNER JOIN Tags t ON t.TagId = ft.TagId
      INNER JOIN Staff s ON s.UserPrincipleName =  m.createdByUserPrincipleName
    WHERE m.DeletedDate IS NULL
          AND m.HeroUserPrincipleName = @UPN
          AND fat.MessageId IS NULL
          AND ((@FROM IS NULL AND @TO IS NULL) OR CONVERT(DATE, m.CreationDate) BETWEEN CONVERT(DATE, @FROM) AND CONVERT(DATE, @TO ) )
    ORDER BY m.CreationDate desc
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .input('FROM', from)
    .input('TO', to)
    .timed_query(q, 'voluntaryFeedbackMessagesInRange');
  const message = fixCase(results.recordset);

  return message;
};

const getAllReviewsForReviewee = async (upn) => {
  const q = `
   SELECT
    r.ReviewId,
    r.Reviewee,
    r.DateCreated,
    r.HrRep,
    s.DisplayName AS HrRepDisplayName,
    r.DueDate,
    rs.Description AS ReviewStatus,
    fat.TemplateName AS Template,
   r.UpdatedDate
   FROM ReviewWithActiveStatus r
    INNER JOIN ReviewStatus rs ON rs.ReviewStatusId = r.ReviewStatusId
    INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId = r.TemplateId
    LEFT JOIN Staff s ON s.UserPrincipleName = r.HrRep
   WHERE r.DeletedDate IS NULL AND LOWER(r.Reviewee) = LOWER(@UPN)
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(q, 'getAllReviewsForReviewee');
  return fixCase(results.recordset);
};

const updateFeedbackAssignmentAnonymousIndication = async (
  tx,
  assignmentId,
  anonymous
) => {
  const q = `
    UPDATE FeedbackAssignments
    SET Anonymous = @Anonymous
    WHERE FeedbackAssignmentId = @ID
  `;

  const connection = await tx.timed_request();
  await connection
    .input('ID', assignmentId)
    .input('Anonymous', anonymous)
    .timed_query(q, 'updateFeedbackAssignmentAnonymousIndication');
};

const getScheduledReviewsForToday = async () => {
  const q = `
    SELECT s.ReviewScheduleId , s.ProgrammeName ,s.TemplateId , s.ScheduleDate , s.DueDate
      FROM ReviewSchedule s
      WHERE s.DeletedDate IS NULL AND CAST(s.ScheduleDate AS DATE) <= CAST(GETDATE() AS DATE)
            AND s.ReviewScheduleId NOT IN (SELECT ScheduleId FROM ScheduledReview)
  `;

  const connection = await db();
  const results = await connection.timed_query(q, 'getScheduledReviewsForToday');
  const message = fixCase(results.recordset);
  return message;
};

const getProgrammeUsersRequiringScheduledReview = async (name, id) => {
  const q = `
    SELECT pu.UPN
    FROM Programmes p
    INNER JOIN ProgrammeUsers pu ON p.ProgrammeID = pu.ProgrammeID and DropOffDate is null
    WHERE p.Name LIKE  @Name
      AND pu.UPN NOT IN (
                 SELECT r.Reviewee
                 FROM Review r
                     INNER JOIN ScheduledReview sr ON r.ReviewId = sr.ReviewId AND sr.ScheduleId = @ScheduleId
             )
  `;

  const connection = await db();
  const result = await connection
    .input('Name', name)
    .input('ScheduleId', id)
    .timed_query(q, 'getProgrammeUsersRequiringScheduledReview');
  return fixCase(result.recordset);
};

const insertScheduledReviewLinking = async (tx, scheduleID, reviewID) => {
  const q = `
    INSERT INTO ScheduledReview (ScheduleId, ReviewId)
    VALUES(@ScheduleID, @ReviewID)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('ScheduleID', scheduleID)
    .input('ReviewID', reviewID)
    .timed_query(q, 'insertScheduledReviewLinking');
};

const scheduledReviewEntry = async (scheduleID, reviewee) => {
  const q = `
    SELECT sr.ScheduledReviewId, r.ReviewId, sr.ScheduleId, r.DateCreated, r.Reviewee
    FROM ScheduledReview sr
      INNER JOIN Review r ON r.ReviewId = sr.ReviewId AND r.Reviewee = @Reviewee
     WHERE sr.ScheduleId = @ScheduleID
  `;

  const connection = await db();
  const result = await connection
    .input('ScheduleID', scheduleID)
    .input('Reviewee', reviewee)
    .timed_query(q, 'scheduledReviewEntry');

  return fixCase(result.recordset);
};

const insertReportDownload = async (
  tx,
  upn,
  reviewId,
  levelUpsIncluded,
  voluntaryFeedbackIncluded
) => {
  const q = `
      INSERT INTO ReportDownloadHistory (UserPrincipleName, ReviewId, LevelUpsIncluded, VoluntaryFeedbackIncluded, DownloadedDate)
      VALUES ( @UPN, @ReviewId, @LevelUpsIncluded, @VoluntaryFeedbackIncluded, GETDATE())
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('UPN', upn)
    .input('ReviewId', reviewId)
    .input('LevelUpsIncluded', levelUpsIncluded)
    .input('VoluntaryFeedbackIncluded', voluntaryFeedbackIncluded)
    .timed_query(q, 'insertReportDownload');

  return results.recordset;
};

const getReviewsByStatus = async (
  statusId,
  selectedDate,
  searchText,
  selectedReviewTypeIds,
  hrRep
) => {
  const q = `
   WITH selectedStaff as (
        SELECT s.StaffId,
               s.UserPrincipleName,
               s.EmploymentDate,
               s.BBDUserName,
               s.DisplayName,
               s.JobTitle
        FROM DecoratedStaff s
        WHERE (@SearchText IS NULL OR
                (LOWER(s.UserPrincipleName) LIKE '%' + LOWER(@SearchText) + '%') OR
                (LOWER(s.DisplayName) LIKE '%' + LOWER(@SearchText) + '%')
              )
            AND s.StaffStatus <> 'terminated'
    ),
    SelectedReviewTypes AS (
      SELECT CAST(value as INT) AS ReviewTypeId
      FROM STRING_SPLIT(@SelectedReviewTypeIds, ',')
    ),
    departments as (
        SELECT s.staffId, s.UserPrincipleName, s.EmploymentDate, sdpt.Department, s.BBDUserName, sdpt.Manager, s.DisplayName, s.JobTitle
                             FROM selectedStaff s
                             inner join (SELECT sdt.StaffId, sdt.Department, sdt.StartDate, sdt.Manager,
                                          LEAD(sdt.StartDate, 1, '9999-12-31')
                                               OVER ( PARTITION BY sdt.StaffId ORDER BY sdt.StartDate ASC ) endDate
                                   FROM StaffDepartment sdt) sdpt on s.StaffId=sdpt.StaffId
                             WHERE GETDATE() BETWEEN sdpt.StartDate AND sdpt.endDate
    ),
    ReviewsFeedbackAssignmentsStatus AS (
        SELECT
            r.ReviewId,
            CAST(
                CASE
                    WHEN COUNT(fawas.FeedbackAssignmentID) > 0 THEN 1
                    ELSE 0
                END
            AS BIT) AS HasFeedbackInProgress
        FROM ReviewWithActiveStatus r
        LEFT JOIN (
            SELECT
                ReviewId,
                FeedbackAssignmentID
            FROM FeedbackAssignmentsWithActiveStatus f
            INNER JOIN FeedbackAssignmentStatus fs
            ON fs.FeedbackAssignmentStatusId = f.FeedbackAssignmentStatusId AND fs.StatusDescription NOT IN ('Completed', 'Retracted', 'Deleted')
        ) fawas
        ON fawas.ReviewId = r.ReviewId
        WHERE r.ReviewStatusId = @StatusId
        GROUP BY r.ReviewId
    )
    SELECT sd.staffId,
           sd.UserPrincipleName,
           sd.DisplayName,
           sd.JobTitle,
           sd.EmploymentDate,
           sd.Department,
           sd.Manager,
           r.DueDate,
           r.ReviewId,
           r.ReviewStatusId,
           fat.FeedbackAssignmentTemplateId AS TypeId,
           fat.TemplateName,
           r.UpdatedDate,
           swad.staffType,
           rfas.HasFeedbackInProgress,
           r.HrRep,
           fat.ExclusiveToReviewer,
           fat.RequiresFeedback
    FROM ReviewWithActiveStatus r
    INNER JOIN departments sd ON sd.UserPrincipleName = r.Reviewee AND r.DeletedDate IS NULL AND r.HrRep = @HrRep
    INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId= r.TemplateId
      AND (@SelectedReviewTypeIds IS NULL OR fat.FeedbackAssignmentTemplateId IN (SELECT ReviewTypeId FROM SelectedReviewTypes))
    INNER JOIN StaffWithActiveDepartment swad ON sd.StaffId = swad.StaffId
    INNER JOIN ReviewsFeedbackAssignmentsStatus rfas ON rfas.ReviewId = r.ReviewId
    WHERE r.DueDate <= CONVERT(DATE, @SelectedDate)
      AND r.ReviewStatusId = @StatusId
      AND swad.StaffStatus <> 'terminated'
  `;
  const connection = await db();
  const result = await connection
    .input('StatusId', statusId)
    .input('SelectedDate', selectedDate)
    .input('SearchText', searchText)
    .input('SelectedReviewTypeIds', selectedReviewTypeIds)
    .input('HrRep', hrRep)
    .timed_query(q, 'getReviewsByStatus');
  return fixCase(result.recordset);
};

const retrieveStaffReviewsToBeCreatedAt = async (
  selectedDate,
  searchText,
  selectedReviewTypeIds,
  selectedCompanyFilter
) => {
  const q = `
    WITH selectedStaff as (
        SELECT s.StaffId,
               s.UserPrincipleName,
               s.EmploymentDate,
               s.BBDUserName,
               s.DisplayName,
               s.JobTitle
        FROM DecoratedStaff s
        WHERE (@SearchText IS NULL OR
                (LOWER(s.UserPrincipleName) LIKE '%' + LOWER(@SearchText) + '%') OR
                (LOWER(s.DisplayName) LIKE '%' + LOWER(@SearchText) + '%')
               )
            AND s.StaffStatus NOT IN ('terminated', 'pending-delete')
    ),
    SelectedReviewTypes AS (
        SELECT CAST(value as INT) AS ReviewTypeId
        FROM STRING_SPLIT(@SelectedReviewTypeIds, ',')
    ),
    departments as (
        SELECT s.DisplayName, s.staffId, s.UserPrincipleName, s.EmploymentDate, sdpt.Department, s.BBDUserName, s.JobTitle
                             FROM selectedStaff s
                             inner join (SELECT sdt.StaffId, sdt.Department, sdt.StartDate,
                                          LEAD(sdt.StartDate, 1, '9999-12-31')
                                               OVER ( PARTITION BY sdt.StaffId ORDER BY sdt.StartDate ASC ) endDate
                                   FROM StaffDepartment sdt) sdpt on s.StaffId=sdpt.StaffId
                             WHERE GETDATE() BETWEEN sdpt.StartDate AND sdpt.endDate
    )
    SELECT sd.staffId,
           sd.DisplayName,
           sd.UserPrincipleName,
           sd.JobTitle,
           sd.EmploymentDate,
           sd.Department,
           sr.NextReviewDate AS DueDate,
           sr.StaffReviewId,
           sr.HoldReason,
           sr.nextFeedbackTypeId,
           pr.NextReviewDate AS staffLastReviewDate,
           fat.TemplateName,
           sr.OnHoldBy,
           swad.staffType,
           swad.entityAbbreviation,
           sr.placedOnHoldDate
    FROM StaffReview sr
    INNER JOIN departments sd ON sr.StaffId = sd.StaffId AND (@SelectedReviewTypeIds IS NULL OR sr.nextFeedbackTypeId IN (SELECT ReviewTypeId FROM SelectedReviewTypes))
    left join StaffReview PR ON sr.PreviousStaffReviewId = PR.StaffReviewId
    LEFT JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId = sr.nextFeedbackTypeId
    INNER JOIN StaffWithActiveDepartment swad ON sd.StaffId = swad.StaffId
    WHERE DATEDIFF(MONTH, @SelectedDate, sr.NextReviewDate) <= 0
      AND sr.ReviewId IS NULL
      AND sr.Scheduled = 0
      AND (@SelectedCompanyFilter IS NULL
        OR swad.CompanyEntityId IN (SELECT VALUE FROM STRING_SPLIT(@SelectedCompanyFilter, ','))
      )
      AND sr.DeletedDate IS NULL
      AND swad.StaffStatus <> 'terminated'
  `;

  const connection = await db();
  const result = await connection
    .input('SelectedDate', selectedDate)
    .input('SearchText', searchText)
    .input('SelectedCompanyFilter', selectedCompanyFilter)
    .input('SelectedReviewTypeIds', selectedReviewTypeIds)
    .timed_query(q, 'retrieveStaffReviewsToBeCreatedAt');
  return fixCase(result.recordset);
};

const checkIfReviewExistsAlready = async (staffReviewId) => {
  const q = `
    SELECT StaffReviewId
    FROM StaffReview
    WHERE StaffReviewId = @StaffReviewId AND ReviewId IS NOT NULL
  `;
  const connection = await db();
  const result = await connection
    .input('StaffReviewId', staffReviewId)
    .timed_query(q, 'checkIfReviewExistsAlready');
  return result.recordset.length > 0 ? true : false;
};

const insertStaffReviewLinking = async (tx, staffReviewId, reviewId) => {
  const q = `
    UPDATE StaffReview
    SET ReviewId = @ReviewId, Scheduled = 0
    WHERE StaffReviewId = @StaffReviewId
  `;
  const connection = await tx.timed_request();
  await connection
    .input('StaffReviewId', staffReviewId)
    .input('ReviewID', reviewId)
    .timed_query(q, 'insertStaffReviewLinking');
};

const markUpcomingReviewAsScheduled = async (staffReviewId, hrRep) => {
  const q = `
      UPDATE StaffReview
      SET Scheduled = 1,
          HRRep = @hrRep
      WHERE StaffReviewId = @StaffReviewId
    `;

  const connection = await db();
  const results = await connection
    .input('StaffReviewId', staffReviewId)
    .input('hrRep', hrRep)
    .timed_query(q, 'markUpcomingReviewAsScheduled');
  return results.recordset;
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
  return result.recordset;
};

const getStatusDescriptionById = async (statusId) => {
  const q = `
    SELECT Description
    FROM ReviewStatus
    WHERE ReviewStatusId = @StatusId
  `;
  const connection = await db();
  const result = await connection
    .input('StatusId', statusId)
    .timed_query(q, 'getStatusDescriptionById');
  return fixCase(result.recordset)[0];
};

const findReviewByAssignment = async (assignmentId) => {
  const q = `
    SELECT ReviewId
    FROM FeedbackAssignments
    WHERE FeedbackAssignmentId = @AssignmentId
  `;
  const connection = await db();
  const result = await connection
    .input('AssignmentId', assignmentId)
    .timed_query(q, 'findReviewByAssignment');
  return fixCase(result.recordset)[0];
};

const isReviewComplete = async (tx, reviewId) => {
  const q = `
    DECLARE @Completed BIT
    SET @Completed =
    CASE WHEN
        EXISTS (
                                SELECT 1
                                FROM FeedbackAssignments fa
                                WHERE fa.ReviewId = @ReviewId AND fa.MessageId IS NULL AND fa.DeletedDate IS NULL
                                    AND NOT EXISTS (
                                                            SELECT 1
                                    FROM FeedbackResponse fr
                                    WHERE  fr.FeedbackAssignmentId = fa.FeedbackAssignmentID AND fr.DeletedDate IS NULL)
                        )
                    THEN 0
                    ELSE 1
                    END
    SELECT @Completed AS Completed
  `;
  const connection = await tx.timed_request();
  const result = await connection
    .input('ReviewId', reviewId)
    .timed_query(q, 'isReviewComplete');
  return fixCase(result.recordset)[0].completed == 0 ? false : true;
};

const countFeedbackAssignmentsForReview = async (tx, reviewId) => {
  const completedStatusDescription = 'Completed';
  const retractedStatusDescription = 'Retracted';
  const deletedStatusDescription = 'Deleted';

  const q = `
  SELECT
  (
    SELECT COUNT(*)
      FROM FeedbackAssignmentsWithActiveStatus
      WHERE ReviewId = @ReviewId
        AND DeletedDate IS NULL
        AND FeedbackAssignmentStatusId NOT IN (
          SELECT FeedbackAssignmentStatusId
          FROM FeedbackAssignmentStatus
          WHERE StatusDescription IN (@RetractedStatusDescription, @DeletedStatusDescription)
        )
  ) AS reviewAssignmentCount,
  (
    SELECT COUNT(*)
    FROM FeedbackAssignmentsWithActiveStatus
    WHERE ReviewId = @ReviewId
      AND DeletedDate IS NULL
      AND FeedbackAssignmentStatusId = (
        SELECT FeedbackAssignmentStatusId
        FROM FeedbackAssignmentStatus
        WHERE StatusDescription=@CompletedStatusDescription
      )
  ) AS completedAssignmentCount
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('ReviewId', reviewId)
    .input('CompletedStatusDescription', completedStatusDescription)
    .input('RetractedStatusDescription', retractedStatusDescription)
    .input('DeletedStatusDescription', deletedStatusDescription)
    .timed_query(q, 'countFeedbackAssignmentsForReview');
  return result.recordset[0];
};

const findNumberOfAssignmentsForReview = async (tx, reviewId) => {
  const q = `
    SELECT COUNT(*) AS 'AssignmentCount'
    FROM FeedbackAssignments
    WHERE ReviewId = @ReviewId
      AND DeletedDate IS NULL
  `;
  const connection = await tx.timed_request();
  const result = await connection
    .input('ReviewId', reviewId)
    .timed_query(q, 'findNumberOfAssignmentsForReview');
  return fixCase(result.recordset)[0].assignmentCount;
};

const changeReviewHoldStatus = async (holdReason, staffReviewId, upn) => {
  const q = `
    UPDATE StaffReview
    SET HoldReason = @HoldReason, OnHoldBy = @UPN, PlacedOnHoldDate = @PlacedOnHoldDate
    WHERE StaffReviewId = @StaffReviewId
  `;
  const connection = await db();
  const result = await connection
    .input('HoldReason', holdReason)
    .input('StaffReviewId', staffReviewId)
    .input('UPN', upn)
    .input('PlacedOnHoldDate', holdReason ? new Date() : undefined)
    .timed_query(q, 'changeReviewHoldStatus');
  return result.recordset;
};

const findCreatedBy = async (id) => {
  const q = `
    SELECT r.CreatedBy
    FROM Review  r
    WHERE r.ReviewId = @ID
  `;

  const connection = await db();
  const result = await connection.input('ID', id).timed_query(q, 'findCreatedBy');
  return fixCase(result.recordset);
};

const getDeletedFeedbackAssignments = async (reviewId) => {
  const q = `
    SELECT fas.ReviewId, fas.FeedbackAssignmentId, fas.Reviewer, fas.AssignedBy, fas.DeletedDate, fas.DeletedBy, s.StatusDescription
    FROM FeedbackAssignmentsWithActiveStatus fas
    INNER JOIN FeedbackAssignmentStatus s ON s.FeedbackAssignmentStatusId = fas.FeedbackAssignmentStatusId
    WHERE fas.ReviewId = @ReviewID AND fas.DeletedDate IS NOT NULL AND s.StatusDescription = 'Deleted'
  `;

  const connection = await db();
  const result = await connection
    .input('ReviewID', reviewId)
    .timed_query(q, 'getDeletedFeedbackAssignments');

  return fixCase(result.recordset);
};

const getLatestReviewId = async (staffId) => {
  const query = `
   SELECT sr.ReviewId
   FROM StaffReview sr
   INNER JOIN ReviewWithActiveStatus ras ON sr.ReviewId = ras.ReviewId
   WHERE sr.StaffId = @StaffId
   AND ras.DueDate <= CAST(GETDATE() AS DATE)
   AND ras.ReviewId NOT IN (
   SELECT ras2.ReviewId
   FROM ReviewWithActiveStatus ras2
   INNER JOIN ReviewStatus rs ON ras2.ReviewStatusId = rs.ReviewStatusId
   WHERE rs.Description = 'Cancelled')
   ORDER BY ras.DueDate DESC;
  `;
  const connection = await db();
  const result = await connection
    .input('StaffId', staffId)
    .timed_query(query, 'getPreviousStaffReviewId');
  return result.recordset.length > 0
    ? fixCase(result.recordset)[0].reviewId
    : undefined;
};

const getNumberOfReviewsBasedOnFilter = async (
  hrRepresentative,
  dueDate,
  reviewTypeIds,
  staffUpn
) => {
  const query = `
  SELECT
    [New],
    [Reviewers Requested] AS [Feedback Providers Requested],
    [Reviewers Assigned] AS [Feedback Providers Assigned],
    [Feedback In Progress] AS [Feedback in Progress],
    [Feedback Completed],
    [Report Downloaded],
    [Summary sent to STRATCO],
    [STRATCO Feedback Received],
    [Review Meeting Scheduled],
    [Finalise Salary],
    [Confirm Next Review Date]
  FROM  dbo.getNumberOfReviewsBasedOnFilter(@HrRepresentative,@DueDate,@ReviewTypeIds,@StaffUpn,GETDATE())
  `;

  const connection = await db();
  const result = await connection
    .input('HrRepresentative', hrRepresentative)
    .input('DueDate', dueDate)
    .input('ReviewTypeIds', reviewTypeIds)
    .input('StaffUpn', staffUpn)
    .timed_query(query, 'getNumberOfReviewsBasedOnFilter');

  return result.recordset.length > 0 ? result.recordset[0] : undefined;
};

const retrieveActiveReviewsByRevieweeStaffId = async (staffId) => {
  const query = `
    SELECT
        rwas.ReviewId,
        rwas.DateCreated,
        rwas.CreatedBy,
        rwas.DueDate,
        rwas.Reviewee,
        rs.ActionName AS Status
    FROM ReviewWithActiveStatus rwas
    INNER JOIN Staff s
        ON s.UserPrincipleName = rwas.Reviewee AND s.StaffId = @StaffID
    INNER JOIN ReviewStatus rs
        ON rs.ReviewStatusId = rwas.ReviewStatusId AND rs.Description  NOT IN ('Archived', 'Cancelled')
    INNER JOIN FeedbackAssignmentTemplate fat ON fat.FeedbackAssignmentTemplateId = rwas.TemplateId
    WHERE rwas.DeletedBy IS NULL AND
          rwas.DeletedDate IS NULL AND
          rwas.ReviewStatusId NOT IN (12, 13)
  `;

  const connection = await db();
  const results = await connection
    .input('StaffID', staffId)
    .timed_query(query, 'retrieveActiveReviewsByRevieweeStaffId');
  return fixCase(results.recordset);
};

export {
  addDoubleCommentAnswer,
  addRatingAnswer,
  addSingleCommentAnswer, allReviewAssignments, assignmentQuestionIds, changeReviewHoldStatus, checkIfReviewExistsAlready, countFeedbackAssignmentsForReview, determineReviewType, findCreatedBy, findNumberOfAssignmentsForReview, findReviewByAssignment, getDeletedFeedbackAssignments, getLatestReviewId, getNumberOfReviewsBasedOnFilter, getProgrammeUsersRequiringScheduledReview, getReviewsByStatus, getScheduledReviewsForToday, getStatusDescriptionById, getSurveyFeedback, getTaggedFeedback, insertFeedbackResponse, insertReportDownload, insertScheduledReviewLinking, insertStaffReviewLinking, isReviewComplete, markUpcomingReviewAsScheduled, retrieveActiveReviewsByRevieweeStaffId, retrieveAssignmentStatus, retrieveDisplayName, retrieveFeedbackAssignment, retrieveFeedbackAssignmentAssignedToUpn,
  retrieveFilteredReviews, retrieveOutstandingFeedbackAssignment, retrieveOutstandingUPNFeedbackAssignments, retrieveOverdueFeedbackAssignment, retrieveReview, retrieveStaffReviewsToBeCreatedAt, retrieveSurveyId, retrieveSurveyQuestions,
  retrieveSurveyQuestionScale, retrieveTemplateSurveyReviewsInRange, retrieveTemplateTaggedReviewsInRange, scheduledReviewEntry, structuredOutstandingReviewFeedbackAssignment, structuredOutstandingReviewFeedbackAssignments, structuredReviewReport, structuredReviewSurvey, structuredUserFeedback, updateClientEmail, updateFeedbackAssignmentAnonymousIndication, updateReviewStatus, voluntaryFeedbackMessagesInRange
};

