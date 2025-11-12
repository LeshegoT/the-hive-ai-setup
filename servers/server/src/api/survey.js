const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  describeTable,
  select,
  modifyColumnsForLookup,
  selectById,
} = require('../queries/generate.queries');
const {
  getQuestionsForSurvey,
  createTextResponse,
  createLookupResponse,
  createTrueFalseResponse,
  getOptionsForQuestion,
  createOptionResponse,
  getIncompleteSurveyAssignmentsForUser,
  updateAssignmentStatus,
  linkResponse,
  getLookUpTableName,
} = require('../queries/survey.queries');
const { withTransaction } = require('../shared/db');

const TEXT_QUESTION_ID = 1;
const LOOKUP_QUESTION_ID = 3;
const TRUE_FALSE_QUESTION_ID = 4;
const SINGLE_OPTION_QUESTION_ID = 2;
const COMPLETE_STATUS_ID = 2;

router.get(
  '/surveyAssignments',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;
    const surveys = await getIncompleteSurveyAssignmentsForUser(upn);
    res.json(surveys);
  })
);

router.get(
  '/survey/:surveyId/questions',
  handle_errors(async (req, res) => {
    try {
      const upn = res.locals.upn;
      const questions = await getQuestionsForSurvey(req.params.surveyId, upn);
      for (const question of questions) {
        if (question.lookupTableName) {
          const tableDescription = await describeTable(question.lookupTableName);
          const newDescription = await modifyColumnsForLookup(
            tableDescription,
            'optionQuestionId',
            'optionDescription'
          );
          question.options = await select(
            question.lookupTableName,
            newDescription
          );
        }
        if (question.surveyQuestionTypeId == 2) {
          question.options = await getOptionsForQuestion(
            question.surveyQuestionId
          );
        }
      }
      res.json(questions);
    } catch (err) {
      res.status(400).send(err.message);
    }
  })
);

router.post(
  '/surveyAssignment/:surveyAssignmentId',
  handle_errors(async (req, res) => {
    try {
      const assignmentId = req.params.surveyAssignmentId;
      const responses = req.body;
      await withTransaction(async (tx) => {
        for (const response of responses) {
          const { questionId, questionTypeId, responseText } = response;
          const surveyResponseId = (
            await linkResponse(tx, assignmentId, questionId)
          ).surveyResponseId;
          switch (questionTypeId) {
            case TEXT_QUESTION_ID:
              await createTextResponse(tx, surveyResponseId, responseText);
              break;
            case LOOKUP_QUESTION_ID: {
              await insertLookupResponse(
                tx,
                responseText,
                questionId,
                surveyResponseId
              );
              break;
            }
            case TRUE_FALSE_QUESTION_ID: {
              await insertTrueFalseResponse(tx, surveyResponseId, responseText);
              break;
            }
            case SINGLE_OPTION_QUESTION_ID: {
              await insertSingleOptionResponse(
                tx,
                surveyResponseId,
                responseText
              );
              break;
            }
            default:
              throw new Error('Invalid QuestionType Id');
          }
        }
        await updateAssignmentStatus(tx, assignmentId, COMPLETE_STATUS_ID);
      });
      res.status(201).send();
    } catch (err) {
      res.status(400).send(err.message);
    }
  })
);

async function insertLookupResponse(
  tx,
  responseText,
  questionId,
  surveyResponseId
) {
  const numberResponse = parseInt(responseText);
  if (!isNaN(numberResponse)) {
    const lookupTableName = (await getLookUpTableName(tx, questionId))
      .lookupTableName;
    const tableDescription = await describeTable(lookupTableName);
    const results = await selectById(
      lookupTableName,
      tableDescription,
      numberResponse
    );
    if (results.length > 0) {
      await createLookupResponse(tx, surveyResponseId, numberResponse);
    } else {
      throw new Error(
        'Lookup response Id does not match any responses in the lookup table'
      );
    }
  } else {
    throw new Error('Lookup response Id must be an integer');
  }
}

async function insertTrueFalseResponse(tx, surveyResponseId, responseText) {
  const numberResponse = parseInt(responseText);
  if (numberResponse == 1 || numberResponse == 0) {
    await createTrueFalseResponse(tx, surveyResponseId, numberResponse);
  } else {
    throw new Error('Invalid true/false response');
  }
}

async function insertSingleOptionResponse(tx, surveyResponseId, responseText) {
  const numberResponse = parseInt(responseText);
  if (!isNaN(numberResponse)) {
    const tableDescription = await describeTable('OptionQuestion');
    const results = await selectById(
      'OptionQuestion',
      tableDescription,
      numberResponse
    );
    if (results.length > 0) {
      await createOptionResponse(tx, surveyResponseId, numberResponse);
    } else {
      throw new Error(
        'Single option response Id does not match any responses in the options table'
      );
    }
  } else {
    throw new Error('Single option response Id must be an integer');
  }
}

module.exports = router;
