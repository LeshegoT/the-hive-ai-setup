const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  all_questions,
  all_answers,
  current_user_answers,
  insert_answers,
} = require('../queries/question.queries');

router.get(
  '/questions',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;

    const questions = await all_questions();
    const answers = await all_answers();
    const user = await current_user_answers(upn);
    console.log(user);

    res.json({ questions, answers, user });
  })
);

router.post(
  '/answerQuestions',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    await insert_answers(upn, req.body.answeredQuestions);
    res.status(204).send();
  })
);

module.exports = router;
