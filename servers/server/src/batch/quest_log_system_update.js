const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  incomplete_courses,
  complete_course,
} = require('../queries/course.queries');
const {
  insert_message_no_tx,
  insert_course_message_no_tx,
} = require('../queries/message.queries');

module.exports = router.post(
  '/quest-log-system-update',
  handle_errors(async (req, res) => {
    const messageTypeId = 3; //Level up - should we get this from the DB or can we trust that it will be 3?
    const createdBy = 'System';

    const incompleteCourses = await incomplete_courses();

    for (const incomplete of incompleteCourses) {
      const { courseId, courseName, userPrincipleName } = incomplete;

      await complete_course(courseId, userPrincipleName);

      const { messageId } = await insert_message_no_tx(
        messageTypeId,
        userPrincipleName,
        createdBy,
        `${courseName} level up completed`
      );

      await insert_course_message_no_tx(messageId, courseId);
    }

    res.send('Successful');
  })
);
