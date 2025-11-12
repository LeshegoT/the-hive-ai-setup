const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  get_prescribed_course_progress,
  update_prescribed_course_status,
  insert_user_courses,
} = require('../queries/prescribed-course.queries');

const {
  insert_user_interaction,
  get_interaction_type,
} = require('../queries/user-interactions.queries');

const { scorePoints } = require('../shared/scorePoints');
const { withTransaction } = require('../shared/db');

module.exports = router.post(
  '/completePrescribedCourse',
  handle_errors(async (req, res) => {
    const { upn, courseId } = req.body;

    const progress = await get_prescribed_course_progress(upn, courseId);

    if (progress.completedSections < progress.requiredSections) {
      res.status(400).json({
        message: `All required sections must be completed to complete a course!`,
      });
      return;
    }

    let course;
    await withTransaction(async (tx) => {
      await completeCourse(tx, upn, courseId);
      course = await update_prescribed_course_status(
        tx,
        upn,
        courseId,
        'completed'
      );
    });

    if (course) {
      res.json(course);
    } else {
      res.status(500).json({
        message: `Complete course failed!`,
      });
    }
  })
);

const completeCourse = async (tx, upn, courseId) => {
  const typeID = await get_interaction_type(tx, 'course');

  const userInteractionID = await insert_user_interaction(tx, upn, typeID);

  await insert_user_courses(tx, courseId, userInteractionID);

  await scorePoints(tx, upn, 'course', userInteractionID);
};
