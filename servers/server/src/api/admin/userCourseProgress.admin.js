const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { users_course_progress, resetUserCourseProgress } = require('../../queries/course.queries');
const { withTransaction } = require('../../shared/db');
const { update_profile_for_user } = require('../../queries/point.queries')

router.get(
  '/userCourseProgress',
  handle_errors(async (req, res) => {
    const progress = await users_course_progress();
    res.json(progress);
  })
);

router.patch(
  '/userCourseProgress',
  handle_errors(async (req, res) => {
    const upn = req.body.upn;
    const courseId = req.body.courseId;
    if (upn && courseId) {
      await withTransaction(async (tx) => {
        await resetUserCourseProgress(
          tx,
          res.locals.upn,
          upn,
          courseId,
        );
        await update_profile_for_user(tx, upn);
      });
      res.status(200).send();
    }
    else {
      res.status(422).json({
        message: "A courseId and upn are required to reset the user's progress!",
      });
    }
  })
)

module.exports = router;
