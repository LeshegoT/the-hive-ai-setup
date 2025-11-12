const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { send } = require('../shared/email');
const { buildErrorObject } = require('../shared/error-handling');
const { all_courses } = require('../queries/course.queries');
const { user_completed_course } = require('../queries/prescribed-course.queries');

router.post(
  `/course-emails`,
  handle_errors(async (req, res) => {
    if (req.body.upn) {
      try {
        const allowSend = await checkIfCourseCompleted(
          req.body.upn,
          req.body.courseId
        );
        if (allowSend) {
          const emailRequest = await preparePrescribedCoursesEmailContent(
            req.body.upn,
            req.body.courseId,
            req.body.dueDate
          );
          const {
            from,
            to,
            subject,
            context,
            message,
            url,
            callToAction,
            image,
            templateFile,
          } = emailRequest;
          await send(from, to, subject, context, message, url, {
            callToAction,
            image,
            templateFile,
          });
        }
        res.status(201).send();
      } catch (error) {
        res.status(500).send(JSON.stringify(buildErrorObject(error)));
      }
    } else {
      res.status(400).send(JSON.stringify({ message: 'upn required' }));
    }
  })
);

async function preparePrescribedCoursesEmailContent(upn, courseId, dueDate) {
  const receiver = upn;
  const deadline = dueDate;

  const { name: courseName, code: courseCode } = (await all_courses()).filter(
    (course) => course.courseId == courseId
  )[0];

  const host = process.env.REDIRECT_URI + '/course/' + courseCode;

  const dueDateFormatted = new Date(deadline).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const titleTemplate = `The <b style='color:#C72026'>${courseName}</b> course has been assigned to you!`;
  const subjectLineTemplate = `Training: ${courseName}`;
  const textContentTemplate = `<p>Please complete it before <b>${dueDateFormatted}</b>.<br/><br/>For any questions, contact:<br/> 
        <a href='mailto:hr@bbdsoftware.com' style='color:#C72026;font-weight:700;'>hr@bbdsoftware.com</a></p>`;

  const subject = subjectLineTemplate;
  const title = titleTemplate;
  const textContent = textContentTemplate;
  const templateFile = 'feedback-email.html.hbs';
  const image = 'peer';

  return {
    from: 'the-hive@bbd.co.za',
    to: receiver,
    subject,
    context: title,
    message: textContent,
    url: host,
    callToAction: 'Start Course',
    image,
    templateFile,
  };
}

async function checkIfCourseCompleted(upn, courseId) {
  const courseCompleted = await user_completed_course(upn, courseId);
  return !courseCompleted;
}

module.exports = router;
