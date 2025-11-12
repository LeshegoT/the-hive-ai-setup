const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const getIncompleteSurveyAssignmentsForUser = async (upn) => {
  const q = `
    SELECT a.SurveyAssignmentId, a.SurveyId, a.Deadline, a.AssignedBy, s.SurveyName, sas.StatusName
    FROM SurveyAssignment a
    INNER JOIN Survey s 
    ON a.SurveyId = s.SurveyId AND s.DeletedBy IS NULL
    INNER JOIN SurveyAssignmentStatus sas
    ON sas.SurveyAssignmentStatusId = a.SurveyAssignmentStatusId AND sas.StatusName != 'Completed'
    WHERE a.AssigneeUPN = @UPN AND a.DeletedBy IS NULL
    `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'getIncompleteSurveyAssignmentsForUser');

  return fixCase(results.recordset);
};

const getQuestionsForSurvey = async (surveyId, upn) => {
  const q = `
    SELECT sq.SurveyQuestionId, sq.QuestionText, qt.SurveyQuestionTypeId, qt.TypeDescription, ql.SortingOrder, us.Value AS preferredResponse, ut.LookupTableName
    FROM SurveyQuestion sq
    INNER JOIN SurveyQuestionLink ql
    ON sq.SurveyQuestionId = ql.SurveyQuestionId
    INNER JOIN Survey s
    ON ql.SurveyId = s.SurveyId
    INNER JOIN SurveyQuestionType qt
    ON qt.SurveyQuestionTypeId = sq.SurveyQuestionTypeId
    LEFT JOIN UserSettingsType ut
    ON ut.UserSettingsTypeId = sq.UserSettingsTypeId
    LEFT JOIN UserSettings us
    ON us.UserSettingsTypeId = ut.UserSettingsTypeId AND us.UserPrincipleName = @UPN
    WHERE s.SurveyId = @SurveyId 
    ORDER BY ql.SortingOrder
    `;

  const request = await db();
  const results = await request
    .input('SurveyId', surveyId)
    .input('UPN', upn)
    .timed_query(q, 'getQuestionsForSurvey');

  return fixCase(results.recordset);
};

const linkResponse = async (tx, assignmentId, questionId) => {
  const q = `
    INSERT INTO SurveyResponse(SurveyQuestionId, SurveyAssignmentId)
    VALUES(@QuestionId, @AssignmentId)

    SELECT SCOPE_IDENTITY() AS SurveyResponseId
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('AssignmentId', assignmentId)
    .input('QuestionId', questionId)
    .timed_query(q, 'linkResponse');

  return fixCase(results.recordset)[0];
};

const createTextResponse = async (tx, surveyResponseId, responseText) => {
  const q = `
    INSERT INTO TextResponse
    VALUES(@SurveyResponseId, @ResponseText)
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('SurveyResponseId', surveyResponseId)
    .input('ResponseText', responseText)
    .timed_query(q, 'createTextResponse');

  return results;
};

const createLookupResponse = async (tx, surveyResponseId, responseText) => {
  const q = `
    INSERT INTO LookupResponse
    VALUES(@SurveyResponseId, @ResponseText)
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('SurveyResponseId', surveyResponseId)
    .input('ResponseText', responseText)
    .timed_query(q, 'createLookupResponse');

  return results;
};

const createTrueFalseResponse = async (tx, surveyResponseId, responseText) => {
  const q = `
    INSERT INTO TrueFalseResponse
    VALUES(@SurveyResponseId, @ResponseText)
  `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('SurveyResponseId', surveyResponseId)
    .input('ResponseText', responseText)
    .timed_query(q, 'createTrueFalseResponse;');

  return results;
};

const createOptionResponse = async (tx, surveyResponseId, responseText) => {
  const q = `
      INSERT INTO SingleOptionResponse
      VALUES(@SurveyResponseId, @ResponseText)
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('SurveyResponseId', surveyResponseId)
    .input('ResponseText', responseText)
    .timed_query(q, 'createOptionResponse');

  return results;
};

const getTextResponses = async (upn, surveyId) => {
  const q = `
      SELECT sq.SurveyQuestionId, sq.QuestionText, r.Response, ql.SortingOrder, sq.SurveyQuestionTypeId
      FROM Survey s
      INNER JOIN SurveyAssignment a
      ON a.AssigneeUpn = @UPN AND s.SurveyId = a.SurveyId
      INNER JOIN SurveyResponse sr
      ON a.SurveyAssignmentId = sr.SurveyAssignmentId
      INNER JOIN TextResponse r
      ON r.SurveyResponseId = sr.SurveyResponseId 
      INNER JOIN SurveyQuestion sq
      ON sr.SurveyQuestionId = sq.SurveyQuestionId
      INNER JOIN SurveyQuestionLink ql
      ON sq.SurveyQuestionId = ql.SurveyQuestionId
      WHERE s.SurveyId = @SurveyId
    `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .input('SurveyId', surveyId)
    .timed_query(q, 'getTextResponses');

  return fixCase(results.recordset);
};

const getLookupResponses = async (upn, surveyId) => {
  const q = `
      SELECT sq.SurveyQuestionId, sq.QuestionText, r.Response, ql.SortingOrder, sq.SurveyQuestionTypeId, ut.lookupTableName
      FROM Survey s
      INNER JOIN SurveyAssignment a
      ON a.AssigneeUpn = @UPN AND s.SurveyId = a.SurveyId
      INNER JOIN SurveyResponse sr
      ON a.SurveyAssignmentId = sr.SurveyAssignmentId
      INNER JOIN LookupResponse r
      ON r.SurveyResponseId = sr.SurveyResponseId 
      INNER JOIN SurveyQuestion sq
      ON sr.SurveyQuestionId = sq.SurveyQuestionId
      INNER JOIN SurveyQuestionLink ql
      ON sq.SurveyQuestionId = ql.SurveyQuestionId
      INNER JOIN UserSettingsType ut
      ON ut.UserSettingsTypeId = sq.UserSettingsTypeId
      INNER JOIN UserSettings us
      ON us.UserSettingsTypeId = ut.UserSettingsTypeId 
      WHERE s.SurveyId = @SurveyId
    `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .input('SurveyId', surveyId)
    .timed_query(q, 'getLookupResponses');

  return fixCase(results.recordset);
};

const getSingleOptionResponses = async (upn, surveyId) => {
  const q = `
      SELECT sq.SurveyQuestionId, sq.QuestionText, r.OptionQuestionId AS response, ql.SortingOrder, sq.SurveyQuestionTypeId
      FROM Survey s
      INNER JOIN SurveyAssignment a
      ON a.AssigneeUpn = @UPN AND s.SurveyId = a.SurveyId
      INNER JOIN SurveyResponse sr
      ON a.SurveyAssignmentId = sr.SurveyAssignmentId
      INNER JOIN SingleOptionResponse r
      ON r.SurveyResponseId = sr.SurveyResponseId 
      INNER JOIN SurveyQuestion sq
      ON sr.SurveyQuestionId = sq.SurveyQuestionId
      INNER JOIN SurveyQuestionLink ql
      ON sq.SurveyQuestionId = ql.SurveyQuestionId
      WHERE s.SurveyId = @SurveyId
    `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .input('SurveyId', surveyId)
    .timed_query(q, 'getSingleOptionResponses');

  return fixCase(results.recordset);
};

const getTrueFalseResponses = async (upn, surveyId) => {
  const q = `
      SELECT sq.SurveyQuestionId, sq.QuestionText, r.Response, ql.SortingOrder, sq.SurveyQuestionTypeId
      FROM Survey s
      INNER JOIN SurveyAssignment a
      ON a.AssigneeUpn = @UPN AND s.SurveyId = a.SurveyId
      INNER JOIN SurveyResponse sr
      ON a.SurveyAssignmentId = sr.SurveyAssignmentId
      INNER JOIN TrueFalseResponse r
      ON r.SurveyResponseId = sr.SurveyResponseId 
      INNER JOIN SurveyQuestion sq
      ON sr.SurveyQuestionId = sq.SurveyQuestionId
      INNER JOIN SurveyQuestionLink ql
      ON sq.SurveyQuestionId = ql.SurveyQuestionId 
      WHERE s.SurveyId = @SurveyId
    `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .input('SurveyId', surveyId)
    .timed_query(q, 'getTrueFalseResponses');

  return fixCase(results.recordset);
};

const getOptionsForQuestion = async (questionId) => {
  const q = `
      SELECT OptionQuestionId, OptionDescription, SortingOrder
      FROM OptionQuestion
      WHERE SurveyQuestionId = @QuestionId
      ORDER BY SortingOrder
    `;

  const request = await db();
  const results = await request
    .input('QuestionId', questionId)
    .timed_query(q, 'getOptionsForQuestion');

  return fixCase(results.recordset);
};

const getSelectedOption = async (optionQuestionId) => {
  const q = `
      SELECT OptionDescription, SortingOrder
      FROM OptionQuestion
      WHERE OptionQuestionId = @OptionQuestionId
    `;

  const request = await db();
  const results = await request
    .input('OptionQuestionId', optionQuestionId)
    .timed_query(q, ' getSelectedOption');

  return fixCase(results.recordset);
};

const updateAssignmentStatus = async (tx, assignmentId, statusId) => {
  const q = `
      UPDATE SurveyAssignment
      SET SurveyAssignmentStatusId = @StatusId
      WHERE SurveyAssignmentId = @AssignmentId
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('AssignmentId', assignmentId)
    .input('StatusId', statusId)
    .timed_query(q, 'updateAssignmentStatus');

  return results;
};

const getLookUpTableName = async (tx, questionId) => {
  const q = `
          SELECT ut.LookupTableName
          FROM SurveyQuestion sq
          JOIN UserSettingsType ut
          ON sq.UserSettingsTypeId = ut.UserSettingsTypeId
          WHERE sq.SurveyQuestionId = @QuestionId
      `;
  const connection = await tx.timed_request();
  const results = await connection
    .input('QuestionId', questionId)
    .timed_query(q, 'getLookUpTableName');

  return fixCase(results.recordset)[0];
};

const getSurveyAssignees = async (surveyId) => {
  const q = `
      SELECT a.AssigneeUpn, s.DisplayName
      FROM Survey su
      JOIN SurveyAssignment a
      ON su.SurveyId = a.SurveyId
      JOIN Staff s
      ON a.AssigneeUpn = s.UserPrincipleName
      WHERE su.SurveyId = @SurveyId
    `;

  const request = await db();
  const results = await request
    .input('SurveyId', surveyId)
    .timed_query(q, 'getSurveyAssignees');

  return fixCase(results.recordset);
};

const createQuestion = async (
  tx,
  questionText,
  questionTypeId,
  userSettingId
) => {
  let q;
  if (userSettingId) {
    q = `
      INSERT INTO SurveyQuestion
      VALUES (@QuestionTypeId, @QuestionText, @UserSettingId)
      
      SELECT SCOPE_IDENTITY() AS questionId
    `;
  } else {
    q = `
      INSERT INTO SurveyQuestion(SurveyQuestionTypeId, QuestionText)
      VALUES (@QuestionTypeId, @QuestionText)
 
      SELECT SCOPE_IDENTITY() AS questionId
    `;
  }

  const request = await tx.timed_request();
  const results = await request
    .input('QuestionText', questionText)
    .input('UserSettingId', userSettingId)
    .input('QuestionTypeId', questionTypeId)
    .timed_query(q, 'createQuestion');

  return fixCase(results.recordset)[0].questionId;
};

const createOption = async (tx, questionId, description, sortingOrder) => {
  const q = `
      INSERT INTO OptionQuestion
      VALUES(@QuestionId, @Description, @SortingOrder)
      `;
  const request = await tx.timed_request();
  const results = await request
    .input('QuestionId', questionId)
    .input('Description', description)
    .input('SortingOrder', sortingOrder)
    .timed_query(q, 'createOption');
  return results;
};

const createSurvey = async (tx, surveyName) => {
  const q = `
      INSERT INTO Survey(SurveyName)
      VALUES (@SurveyName)

      SELECT SCOPE_IDENTITY() AS surveyId
      `;

  const request = await tx.timed_request();
  const results = await request
    .input('SurveyName', surveyName)
    .timed_query(q, 'createSurvey');

  return fixCase(results.recordset)[0].surveyId;
};

const linkQuestionToSurvey = async (tx, surveyId, questionId, sortingOrder) => {
  const q = `
      INSERT INTO SurveyQuestionLink
      VALUES (@QuestionId, @SurveyId, @SortingOrder)
      `;

  const request = await tx.timed_request();
  const results = await request
    .input('SurveyId', surveyId)
    .input('QuestionId', questionId)
    .input('SortingOrder', sortingOrder)
    .timed_query(q, 'linkQuestionToSurvey');

  return results;
};

const assignSurvey = async (
  tx,
  assigneeUpn,
  deadline,
  assignedByUpn,
  surveyId,
  assignmentStatus
) => {
  const q = `
      INSERT INTO SurveyAssignment(SurveyId, AssigneeUpn, Deadline, AssignedBy, SurveyAssignmentStatusId)
      VALUES (@SurveyId, @AssigneeUpn, @Deadline, @AssignedByUpn, @AssignmentStatus)
      `;

  const request = await tx.timed_request();
  const results = await request
    .input('SurveyId', surveyId)
    .input('AssigneeUpn', assigneeUpn)
    .input('Deadline', deadline)
    .input('AssignmentStatus', assignmentStatus)
    .input('AssignedByUpn', assignedByUpn)
    .timed_query(q, 'assignSurvey');

  return results;
};

module.exports = {
  createTextResponse,
  getTextResponses,
  createLookupResponse,
  getLookupResponses,
  createTrueFalseResponse,
  getTrueFalseResponses,
  getOptionsForQuestion,
  createOptionResponse,
  getSelectedOption,
  getQuestionsForSurvey,
  getSingleOptionResponses,
  getIncompleteSurveyAssignmentsForUser,
  linkResponse,
  getLookUpTableName,
  getSurveyAssignees,
  createQuestion,
  createOption,
  createSurvey,
  linkQuestionToSurvey,
  assignSurvey,
  updateAssignmentStatus,
};
