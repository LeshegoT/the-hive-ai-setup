const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  getSurveyAssignees,
  getTextResponses,
  getLookupResponses,
  getTrueFalseResponses,
  getSingleOptionResponses,
  getSelectedOption,
  createQuestion,
  createOption,
  createSurvey,
  linkQuestionToSurvey,
  assignSurvey,
} = require('../../queries/survey.queries');
const {
  describeTable,
  modifyColumnsForLookup,
  selectById,
} = require('../../queries/generate.queries');
const { withTransaction } = require('../../shared/db');

const SINGLE_OPTION_QUESTION_ID = 2;
const ASSIGNED_STATUS_ID = 1;

router.get(
  '/survey/:surveyId/responses',
  handle_errors(async (req, res) => {
    const usersWithResponses = [];
    const surveyId = req.params.surveyId;
    const users = await getSurveyAssignees(surveyId);
    for (const user of users) {
      user.textResponses = await getTextResponses(user.assigneeUpn, surveyId);
      user.trueFalseResponses = await getTrueFalseResponses(
        user.assigneeUpn,
        surveyId
      );

      const unmappedLookupResponses = await getLookupResponses(
        user.assigneeUpn,
        surveyId
      );
      const unmappedOptionResponses = await getSingleOptionResponses(
        user.assigneeUpn,
        surveyId
      );
      user.lookupResponses = await mapLookupResponses(unmappedLookupResponses);
      user.optionResponses = await mapOptionResponses(unmappedOptionResponses);

      usersWithResponses.push(user);
    }
    res.json(usersWithResponses);
  })
);

async function mapLookupResponses(lookupResponses) {
  const mappedLookupResponses = [];
  let mappedResponse;
  for (const lookupResponse of lookupResponses) {
    mappedResponse = lookupResponse;
    const tableDescription = await describeTable(lookupResponse.lookupTableName);

    const newTableDescription = await modifyColumnsForLookup(
      tableDescription,
      'optionId',
      'optionDescription'
    );
    mappedResponse.lookupValue = await selectById(
      lookupResponse.lookupTableName,
      newTableDescription,
      lookupResponse.response
    );
    mappedLookupResponses.push(mappedResponse);
  }
  return mappedLookupResponses;
}

async function mapOptionResponses(optionResponses) {
  const mappedOptionResponses = [];
  let mappedResponse;
  for (const optionResponse of optionResponses) {
    mappedResponse = optionResponse;
    const optionQuestionId = optionResponse.response;
    mappedResponse.optionValue = await getSelectedOption(optionQuestionId);
    mappedOptionResponses.push(mappedResponse);
  }
  return mappedOptionResponses;
}

router.post(
  '/survey',
  handle_errors(async (req, res) => {
    try {
      const assignedByUpn = res.locals.upn;
      const surveyName = req.body.surveyName;
      const assignees = req.body.assignees;
      const questions = req.body.questions;

      await withTransaction(async (tx) => {
        const surveyId = await createSurvey(tx, surveyName);

        for (const question of questions) {
          const { questionText, questionTypeId, sortingOrder } = question;
          const userSettingId = question.userSettingId;
          const options = question.options;

          const questionId = await createQuestion(
            tx,
            questionText,
            questionTypeId,
            userSettingId
          );
          await linkQuestionToSurvey(tx, surveyId, questionId, sortingOrder);
          if (questionTypeId == SINGLE_OPTION_QUESTION_ID) {
            for (const option of options) {
              await createOption(
                tx,
                questionId,
                option.optionDescription,
                option.sortingOrder
              );
            }
          }
        }

        for (const assignee of assignees) {
          await assignSurvey(
            tx,
            assignee.upn,
            assignee.deadline,
            assignedByUpn,
            surveyId,
            ASSIGNED_STATUS_ID
          );
        }
      });
      res.status(201).send();
    } catch {
      res.status(400).send();
    }
  })
);

module.exports = router;
