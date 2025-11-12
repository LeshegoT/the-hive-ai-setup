const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { user_assigned_courses } = require('../queries/prescribed-course.queries');

module.exports = router.get(
  '/userPrescribedCourses',
  handle_errors(async (req, res) => {
    const courses = await user_assigned_courses(req.query.upn);

    res.json(courses);
  })
);
