let { db } = require('../db');
let fixCase = require('../shared/fix-case');

const REVIEW_TYPE = 'client';
const lastSavedDateMap = {};

let feedbackAssignmentAllowedProgressions;

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

let structuredReviewSurvey = async (assignmentId) => {
  let assignment = await retrieveFeedbackAssignment(assignmentId);
  const review = await retrieveReviewByAssignmentId(assignmentId);
  const reviewCreationDate = new Date(review.dateCreated);
  let surveyId = await retrieveSurveyId(assignment.templateId, REVIEW_TYPE, reviewCreationDate);
  let surveyQuestions = await structureSurveyQuestions(surveyId.id, reviewCreationDate);


  let survey = {
    id: surveyId.id,
    questions: surveyQuestions,
    reviewee: assignment.revieweeDisplayName,
    deadline: assignment.FeedbackDeadline,
    feedbackType: assignment.TemplateName,
  };

  return survey;
};

let structureSurveyQuestions = async (id, reviewCreationDate) => {
  let questions = await retrieveSurveyQuestions(id, reviewCreationDate);

  let result = await Promise.all(
    await questions.map(async (question) => {
      let ratingScale =
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

let structuredGuestReviewDetails = async (assignmentId) => {
  let assignment = await retrieveFeedbackAssignment(assignmentId);
  let review = await getGuestAssignment(assignmentId);

  let details = {
    reviewee: assignment?.revieweeDisplayName,
    guestReview: review,
  };

  return details;
};

const getGuestFeedbackAssignmentStatusAndReviewee = async (id) => {
  const q = `
    SELECT s.DisplayName AS reviewee, fas.StatusDescription AS [status] FROM FeedbackAssignmentsWithActiveStatus fa
    INNER JOIN FeedbackAssignmentStatus fas ON fas.FeedbackAssignmentStatusId = fa.FeedbackAssignmentStatusId
      INNER JOIN GuestFeedbackAssignment g ON g.FeedbackAssignmentId = fa.FeedbackAssignmentId AND g.UUID = @ID
      INNER JOIN Review r ON r.ReviewId = fa.ReviewId
      INNER JOIN Staff s ON LOWER(s.UserPrincipleName) = LOWER(r.Reviewee)
  `;

  const connection = await db();
  const result = await connection.input('ID', id).timed_query(q, 'getGuestFeedbackAssignmentStatusAndReviewee');
  return result.recordset[0];
}

let retrieveFeedbackAssignment = async (id) => {
  let q = `
    SELECT fa.feedbackAssignmentID AS assignmentId , LOWER(r.reviewee) AS upn, s.displayName AS revieweeDisplayName, fa.feedbackDeadline AS dueBy , r.templateId, fa.FeedbackDeadline, fat.TemplateName
    FROM FeedbackAssignments fa
        INNER JOIN GuestFeedbackAssignment g ON g.FeedbackAssignmentId = fa.FeedbackAssignmentId AND g.UUID = @ID
        INNER JOIN Review r ON r.ReviewId = fa.ReviewId
        INNER JOIN FeedbackAssignmentTemplate fat ON r.templateId = fat.FeedbackAssignmentTemplateId
        INNER JOIN Staff s ON LOWER(s.UserPrincipleName) = LOWER(r.Reviewee)
    WHERE fa.DeletedDate IS NULL
  `;

  let connection = await db();
  let result = await connection.input('ID', id).timed_query(q, 'retrieveFeedbackAssignment');
  return result.recordset[0];
};

let retrieveSurveyId = async (templateId, type) => {
  let q = `
    SELECT rs.ReviewSurveyId AS id
    FROM ReviewSurvey rs
        INNER JOIN ReviewTemplateSurvey rt ON rt.ReviewSurveyId = rs.ReviewSurveyId AND rt.ReviewTemplateId = @TemplateId AND rt.DeletedDate IS NULL
        INNER JOIN ReviewSurveyType  st ON st.ReviewSurveyTypeId = rs.TypeId AND st.Type = @Type
  `;

  let connection = await db();
  let result = await connection.input('TemplateId', templateId).input('Type', type).timed_query(q, 'retrieveSurvey');
  return result.recordset[0];
};

let retrieveSurveyQuestions = async (id, reviewCreationDate) => {
  let q = `
    SELECT q.ReviewSurveyQuestionId AS id , q.name, q.question, q.displayOrder , t.type
    FROM ReviewSurveyQuestion q
        INNER JOIN ReviewQuestionType t ON t.ReviewQuestionTypeId = q.ReviewQuestionTypeId
    WHERE q.ReviewSurveyVersionId = (
      SELECT ReviewSurveyVersionId FROM dbo.ActiveReviewSurveyVersionForDate(@ReviewCreationDate)
      WHERE ReviewSurveyId = @ID
    )
    AND q.DeletedDate IS NULL
  `;

  let connection = await db();
  let result = await connection
    .input('ID', id)
    .input('ReviewCreationDate', reviewCreationDate)
    .timed_query(q, 'retrieveSurveyQuestions');
  return result.recordset;
};

let retrieveSurveyQuestionScale = async (id) => {
  let q = `
    SELECT s.rating, s.description
    FROM ReviewSurveyScale  s
    WHERE s.ReviewSurveyQuestionId = @ID
    ORDER BY s.Rating DESC
  `;

  let connection = await db();
  let result = await connection.input('ID', id).timed_query(q, 'retrieveSurveyQuestionScale');
  return result.recordset;
};


const getGuestAssignment = async (id) => {
  let query = `SELECT g.feedbackAssignmentID , f.reviewer, r.reviewee, f.feedbackDeadline AS dueBy , r.templateID as template , f.messageId
              FROM GuestFeedbackAssignment AS g
                  INNER JOIN FeedbackAssignments f ON f.FeedbackAssignmentID = g.FeedbackAssignmentID AND f.DeletedDate IS NULL AND f.MessageId IS NULL
                  INNER JOIN Review r ON r.ReviewId = f.ReviewId AND r.DeletedDate IS NULL
              WHERE g.UUID = @ID AND NOT EXISTS (select 1 from FeedbackResponse fr where fr.feedbackAssignmentId = f.feedbackAssignmentID AND fr.DeletedDate IS NULL)`;

  let request = await db();
  let results = await request.input('ID', id).timed_query(query, 'getGuestAssignment');
  return results.recordset[0];
};

const getGuestRecentlyCompletedAssignment = async (id) => {
  let query = `SELECT g.feedbackAssignmentID , f.reviewer, r.reviewee, f.feedbackDeadline AS dueBy , r.templateID as template , f.messageId
              FROM GuestFeedbackAssignment AS g
                  INNER JOIN FeedbackAssignments f ON f.FeedbackAssignmentID = g.FeedbackAssignmentID AND f.DeletedDate IS NULL AND f.MessageId IS NULL
                  INNER JOIN Review r ON r.ReviewId = f.ReviewId AND r.DeletedDate IS NULL
              WHERE g.UUID = @ID AND EXISTS (select 1 from FeedbackResponse fr where fr.feedbackAssignmentId = f.feedbackAssignmentID AND fr.DeletedDate IS NULL AND CAST(fr.CreationDate AS DATE) = CAST(GETDATE() AS DATE))`;

  let request = await db();
  let results = await request.input('ID', id).timed_query(query, 'getGuestAssignment');
  return results.recordset[0];
};

/* to be moved to another file */
const addVacApplication = async (application, cv, transcript) => {
  const { name, idNumber, email, phone, university, degree } = application;
  const query = `
    Insert into VacWorkApplications (Name,IdNumber, Email, Phone, University, Degree, ApplicationDate, CV, Transcript)
    values (@Name,@IdNumber, @Email, @Phone, @University, @Degree, GETDATE(), @CV, @Transcript)
  `;
  const request = await db();
  await request
    .input('Name', name)
    .input('IdNumber', idNumber)
    .input('Email', email)
    .input('Phone', phone)
    .input('University', university)
    .input('Degree', degree)
    .input('CV', cv)
    .input('Transcript', transcript)
    .timed_query(query, 'addVacApplication');
};

let addDoubleCommentAnswer = async (tx, responseId, answer) => {
  let q = `
    INSERT INTO FeedbackResponseDoubleComment(FeedbackResponseId, PositiveComment, ConstructiveComment)
    VALUES (@ResponseID, @PositiveComment, @ConstructiveComment)
  `;

  let connection = await tx.timed_request();
  await connection
    .input('ResponseID', responseId)
    .input('PositiveComment', answer.positiveComment)
    .input('ConstructiveComment', answer.constructiveComment)
    .timed_query(q, 'addDoubleCommentAnswer');
};

let addRatingAnswer = async (tx, responseId, answer) => {
  let q = `
    INSERT INTO FeedbackResponseRating(FeedbackResponseId, Rating)
    VALUES (@ResponseID, @Rating)
  `;

  let connection = await tx.timed_request();
  await connection
    .input('ResponseID', responseId)
    .input('Rating', answer.rating.rating)
    .timed_query(q, 'addRatingAnswer');
};

let addSingleCommentAnswer = async (tx, responseId, answer) => {
  let q = `
    INSERT INTO FeedbackResponseSingleComment(FeedbackResponseId, GeneralComment)
    VALUES (@ResponseID, @GeneralComment)
  `;

  let connection = await tx.timed_request();
  await connection
    .input('ResponseID', responseId)
    .input('GeneralComment', answer.generalComment)
    .timed_query(q, 'addSingleCommentAnswer');
};

let insertFeedbackResponse = async (tx, assignmentId, surveyQuestionId) => {
  let q = `
    INSERT INTO FeedbackResponse( FeedbackAssignmentId, ReviewSurveyQuestionId, CreationDate)
    VALUES(@AssignmentID, @SurveyQuestionID, GETDATE())

    SELECT scope_identity() FeedbackResponseId

  `;

  let connection = await tx.timed_request();
  let result = await connection
    .input('AssignmentID', assignmentId)
    .input('SurveyQuestionID', surveyQuestionId)
    .timed_query(q, 'insertFeedbackResponse');

  return result.recordset[0].FeedbackResponseId;
};

const getStatusIdByDescription = async (statusDescription) => {
  let query = `
    SELECT FeedbackAssignmentStatusId as feedbackAssignmentStatusId
    FROM FeedbackAssignmentStatus as feedbackAssignmentStatus
    WHERE StatusDescription=@StatusDescription
  `;

  let request = await db();
  const result = await request
    .input('StatusDescription', statusDescription)
    .timed_query(query, 'getStatusIdByDescription');

  return result.recordset;
};

let retrieveCurrentStatus = async (tx, assignmentId) => {
  let query = `
    SELECT FeedbackAssignmentStatusId
    FROM FeedbackAssignmentStatusHistory
    WHERE FeedbackAssignmentID = @AssignmentId
    ORDER BY UpdateDate DESC
    OFFSET 0 ROWS FETCH FIRST 1 ROW ONLY;
  `;

  let connection = await tx.timed_request();
  let result = await connection.input('AssignmentId', assignmentId).timed_query(query, 'retrieveCurrentStatus');
  return result.recordset[0].FeedbackAssignmentStatusId;
};

const getfeedbackAllowedProgressions = async () => {
  let query = `
    SELECT FromStatusId as fromStatusId, ToStatusId as toStatusId
    FROM AllowedStatus
  `;

  let request = await db();
  let results = await request.timed_query(query, 'getfeedbackAllowedProgressions');
  return results.recordset;
};

let isAssignmentProgressionAllowed = async (tx, assignmentId, nextStatusId) => {
  let currentStatusId = await retrieveCurrentStatus(tx, assignmentId);
  if (!feedbackAssignmentAllowedProgressions) {
    feedbackAssignmentAllowedProgressions = await getfeedbackAllowedProgressions();
  }
  const isAllowed = feedbackAssignmentAllowedProgressions.some(
    (progression) => progression.fromStatusId === currentStatusId && progression.toStatusId === nextStatusId
  );
  return isAllowed;
};

const insertStatusHistory = async (tx, feedbackAssignmentID, feedbackStatusId, updatedBy) => {
  let query = `
    INSERT INTO FeedbackAssignmentStatusHistory (FeedbackAssignmentID, FeedbackAssignmentStatusId, UpdateDate, UpdatedBy)
    VALUES (@FeedbackAssignmentID, @StatusId, GETDATE(), @UpdatedBy);
  `;

  let connection = await tx.timed_request();
  let result = await connection
    .input('FeedbackAssignmentID', feedbackAssignmentID)
    .input('StatusId', feedbackStatusId)
    .input('UpdatedBy', updatedBy)
    .timed_query(query, 'insertStatusHistory');

  return result;
};

const checkAndMarkFeedbackAssignment = async (tx, assignmentId, statusDescription, upn) => {
  let statusId = await getStatusIdByDescription(statusDescription);
  if (statusId[0]?.feedbackAssignmentStatusId) {
    statusId = statusId[0].feedbackAssignmentStatusId;
  } else {
    throw new Error(`Could not fetch status ID for assignment ${assignmentId}`);
  }

  let isAllowed = await isAssignmentProgressionAllowed(tx, assignmentId, statusId);
  let savedToday = await checkLastSavedForLater(assignmentId);
  if (isAllowed && !savedToday) {
    await insertStatusHistory(tx, assignmentId, statusId, upn);
  } else if (!isAllowed) {
    throw new Error(
      `Cannot set status to '${statusDescription}' for assignment ${assignmentId}. Progression is not allowed at this time.`
    );
  }
};

const getReviewIdBasedOnFeedbackAssignmentId = async (feedbackAssignmentId) => {
  let q = `
      SELECT  fa.ReviewId
      FROM FeedbackAssignments fa
      WHERE fa.FeedbackAssignmentID=@feedbackAssignmentId
  `;

  let connection = await db();
  let result = await connection.input('feedbackAssignmentId', feedbackAssignmentId).timed_query(q, 'getReviewIdBasedOnFeedbackAssignmentId');
  return fixCase(result.recordset)[0];
};

const updateStatusOfReviewBasedOnFeedbackAssignments = async (tx, reviewId, updatedBy) => {
  let q = `
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

  let connection = await tx.timed_request();;
  let result = await connection.input('reviewId', reviewId)
                  .input('updatedBy', updatedBy)
                  .timed_query(q, 'updateStatusOfReviewBasedOnFeedbackAssignments');

  if(result && result[0] && result[0].expectedStatusId && result[0].expectedStatusId !== result[0].reviewStatusId) {
    const reviewId = result[0].reviewId;
    const expectedStatusId = result[0].expectedStatusId;
    await updateReviewStatus(tx, reviewId, expectedStatusId, updatedBy);
  } else {
    // No update to the review status is needed
  }
  return;
};

const findReviewByAssignment = async (assignmentId) => {
  let q = `
    SELECT ReviewId AS reviewId
    FROM FeedbackAssignments
    WHERE FeedbackAssignmentId = @AssignmentId
  `;
  let connection = await db();
  let result = await connection.input('AssignmentId', assignmentId).timed_query(q, 'findReviewByAssignment');
  return result.recordset[0];
};

const findReviewStatusIdByActionName = async (actionName) => {
  let q = `
    SELECT ReviewStatusId AS reviewStatusId
    FROM ReviewStatus
    WHERE ActionName = @ActionName
  `;
  let connection = await db();
  let result = await connection.input('ActionName', actionName).timed_query(q, 'findStatusIdByActionName');
  return result.recordset[0];
};

const getReviewStatusId = async (reviewId) => {
  let q = `
    SELECT ReviewStatusId AS reviewStatusId
    FROM ReviewWithActiveStatus
    WHERE ReviewId = @ReviewId
  `;
  let connection = await db();
  let result = await connection.input('ReviewId', reviewId).timed_query(q, 'getReviewStatusId');
  return result.recordset[0];
};

const updateReviewStatus = async (tx, reviewId, newStatusId, createdBy) => {
  let q = `
    INSERT INTO ReviewStatusHistory(ReviewId, ReviewStatusId, UpdatedBy, UpdatedDate)
    VALUES (@ReviewId, @NewStatusId, @CreatedBy, GETDATE())
  `;
  let connection = await tx.timed_request();
  let result = await connection
    .input('ReviewId', reviewId)
    .input('NewStatusId', newStatusId)
    .input('CreatedBy', createdBy)
    .timed_query(q, 'updateReviewStatus');
  return result.recordset;
};

const getReviewAllowedProgressions = async (currentStatusId) => {
  let q = `
    SELECT NextStatusId AS nextStatusId
    FROM AllowedReviewStatus
    WHERE CurrentStatusId = @CurrentStatusId
  `;
  let connection = await db();
  let result = await connection.input('CurrentStatusId', currentStatusId).timed_query(q, 'getAllowedProgressions');
  return result.recordset;
};

const countFeedbackAssignmentsForReview = async (tx, reviewId) => {
  const completedStatusDescription = "Completed";
  const retractedStatusDescription = "Retracted";
  const deletedStatusDescription = "Deleted";

  let q = `
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

  let connection = await tx.timed_request();
  let result = await connection
    .input('ReviewId', reviewId)
    .input('CompletedStatusDescription', completedStatusDescription)
    .input('RetractedStatusDescription', retractedStatusDescription)
    .input('DeletedStatusDescription', deletedStatusDescription)
    .timed_query(q, 'countFeedbackAssignmentsForReview');
  return result.recordset[0];
}

const checkLastSavedForLater = async (assignmentId) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  if (!lastSavedDateMap.hasOwnProperty(assignmentId) || lastSavedDateMap[assignmentId] < currentDate) {
    await getLastSavedDate(assignmentId);
    await checkAndClearDateStorage(currentDate);
  }

  const lastSavedForLater = lastSavedDateMap[assignmentId];
  return currentDate < lastSavedForLater;
};

const getLastSavedDate = async (assignmentId) => {
  let q = `
    SELECT UpdateDate as updateDate
    FROM FeedbackAssignmentsWithActiveStatus
    WHERE FeedbackAssignmentID = @AssignmentId AND FeedbackAssignmentStatusId = 4;
  `;
  let connection = await db();
  let result = await connection.input('AssignmentId', assignmentId).timed_query(q, 'getLastSavedDate');

  if (result.recordset.length > 0) {
    return lastSavedDateMap[assignmentId] = result.recordset[0]["updateDate"];
  } else {
    return null;
  }
};

const checkAndClearDateStorage = async (currentDate) => {
  for (const assignmentId in lastSavedDateMap) {
    if (lastSavedDateMap.hasOwnProperty(assignmentId)) {
      const savedDate = lastSavedDateMap[assignmentId];
      if (savedDate < currentDate) {
        delete lastSavedDateMap[assignmentId];
      }
    }
  }
}

module.exports = {
  getGuestAssignment,
  addVacApplication,
  structuredReviewSurvey,
  addDoubleCommentAnswer,
  addRatingAnswer,
  addSingleCommentAnswer,
  insertFeedbackResponse,
  getGuestRecentlyCompletedAssignment,
  structuredGuestReviewDetails,
  getStatusIdByDescription,
  retrieveCurrentStatus,
  isAssignmentProgressionAllowed,
  insertStatusHistory,
  checkAndMarkFeedbackAssignment,
  getReviewIdBasedOnFeedbackAssignmentId,
  updateStatusOfReviewBasedOnFeedbackAssignments,
  findReviewByAssignment,
  findReviewStatusIdByActionName,
  getReviewStatusId,
  updateReviewStatus,
  getReviewAllowedProgressions,
  countFeedbackAssignmentsForReview,
  checkLastSavedForLater,
  getLastSavedDate,
  checkAndClearDateStorage,
  getGuestFeedbackAssignmentStatusAndReviewee,
};
