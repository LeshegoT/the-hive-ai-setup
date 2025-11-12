const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  create_course,
  update_course_everything,
  delete_course,
  count_user_assignedcourse,
  count_user_mission,
  count_course_message,
  count_content_restrictions,
  count_user_registered_for_course,
  all_courses,
} = require('../../queries/course.queries');

router.get(
  '/allCourses',
  handle_errors(async (req, res) => {
    const courses = await all_courses();

    res.json(courses);
  })
);
router.post(
  '/createCourse',
  handle_errors(async (req, res) => {
    await create_course(req.body);
    res.status(204).send();
  })
);
router.post(
  '/updateCourse',
  handle_errors(async (req, res) => {
    const course = req.body;

    await update_course_everything(course);

    res.status(201).send();
  })
);
router.get(
  '/course/:id/assigned/count',
  handle_errors(async (req, res) => {
    const id = req.params.id;
    const countCourseUsers = await count_user_assignedcourse(id);
    res.json(countCourseUsers);
  })
);
router.get(
  '/course/:id/registered/count',
  handle_errors(async (req, res) => {
    const id = req.params.id;
    const countCourseUsers = await count_user_registered_for_course(id);
    res.json(countCourseUsers);
  })
);
router.get(
  '/countCourseMission/:id',
  handle_errors(async (req, res) => {
    const id = req.params.id;
    const countCourseMission = await count_user_mission(id);
    res.json(countCourseMission);
  })
);
router.get(
  '/course/:id/message/count',
  handle_errors(async (req, res) => {
    const id = req.params.id;
    const countCourseMessage = await count_course_message(id);
    res.json(countCourseMessage);
  })
);
router.get(
  '/course/:id/restrictions/count',
  handle_errors(async (req, res) => {
    const courseId = req.params.id;
    const countContentRestrictions = await count_content_restrictions(courseId);
    res.json(countContentRestrictions);
  })
);
router.delete(
  '/course/:id',
  handle_errors(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await delete_course(id);
    if (success) {
      res.status(204).send();
    } else {
      res.status(403).send();
    }
  })
);
module.exports = router;
