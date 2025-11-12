const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { course_progress } = require('../queries/prescribed-course.queries');

module.exports = router.get(
  '/userPrescribedCoursesProgress',
  handle_errors(async (req, res) => {
    const progress = await course_progress();

    res.json(progress);
  })
);
