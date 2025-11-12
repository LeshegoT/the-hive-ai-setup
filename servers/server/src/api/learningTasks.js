const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { user_learning_tasks } = require('../queries/learning-task.queries');

module.exports = router.get(
  '/learningTasks/:userPrincipleName',
  handle_errors(async (req, res) => {
    const { userPrincipleName } = req.params;

    const learningTasks = await user_learning_tasks(userPrincipleName);

    res.json(learningTasks);
  })
);
