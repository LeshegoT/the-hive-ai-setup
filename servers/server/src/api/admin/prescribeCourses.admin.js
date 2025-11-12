const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  prescribe_courses,
  assigned_courses,
  remove_prescribed_course,
  user_not_assigned_to_course,
  user_completed_course,
} = require('../../queries/prescribed-course.queries');
const {
  getActiveDirectoryGroupMembers,
  mailingListGroupExists,
} = require('../../shared/active-directory-profile');
const queue = require('../../shared/queue');
const { withTransaction } = require('../../shared/db');

router.get(
  '/assignedCourses/:courseId',
  handle_errors(async (req, res) => {
    const assignedUsers = await assigned_courses(req.params.courseId);
    res.json(assignedUsers);
  })
);

router.get(
  '/notAssignedToCourses/:courseId',
  handle_errors(async (req, res) => {
    const notAssignedUsers = await user_not_assigned_to_course(
      req.params.courseId
    );
    res.json(notAssignedUsers);
  })
);

router.post(
  '/prescribeCoursesToUsers',
  handle_errors(async (req, res) => {
    const { upns, courseId, dueDate } = req.body;
    const listOfAllowedUpns = [];

    for (const upn of upns) {
      const isAllowedToSendEmail = await checkIfCourseCompleted(upn, courseId);
      if (isAllowedToSendEmail) listOfAllowedUpns.push(upn);
    }

    if (listOfAllowedUpns.length > 0) {
      try {
        const dbResult = await prescribeCourses(listOfAllowedUpns, courseId, dueDate);
        await queueEmails(listOfAllowedUpns, courseId, dueDate);
        return res.json(dbResult);
      }
      catch {
        return res
        .status(500)
        .json({
          message: 'Unable to save course prescriptions to database.'
        });
      }      
    } else {
      res
        .status(400)
        .json({
          message: 'All requested users have already completed the course',
        });
    }
  })
);

router.post(
  '/prescribeCoursesToMailingListUsers',
  handle_errors(async (req, res) => {
    const { addresses, courseId, dueDate } = req.body;

    const listOfAllowedUpns = [];
    const listOfInvalidMailingLists = [];

    for (const addr of addresses) {
      const addressIsValid = await mailingListGroupExists(addr);
      if (addressIsValid) {
        const groupMembers = await getActiveDirectoryGroupMembers(addr);

        for (const groupMember of groupMembers) {
          if (groupMember.userPrincipalName) {
            listOfAllowedUpns.push(groupMember.userPrincipalName);
          } else {
            //Do nothing because the group member does not have a upn.
          }
        }
      } else {
        listOfInvalidMailingLists.push(addr);
      }
    }

    if (
      listOfAllowedUpns.length > 0 &&
      listOfInvalidMailingLists.length === 0
    ) {
      try {
        const dbResult = await prescribeCourses(listOfAllowedUpns, courseId, dueDate);  
        await queueEmails(listOfAllowedUpns, courseId, dueDate);
        return res.json(dbResult);
      }
      catch {
        return res
        .status(500)
        .json({
          message: 'Unable to save course prescriptions to database.'
        });
      } 
      
    } else if (listOfInvalidMailingLists.length > 0) {
      const formattedList = listOfInvalidMailingLists.join(', ');
      return res
        .status(400)
        .json({ message: `Invalid bbd mailing alises: ${formattedList}.` });
    } else {
      return res
        .status(400)
        .json({ message: 'No users found in the mailing list.' });
    }
  })
);

async function prescribeCourses(upns, courseId, dueDate) {
  await withTransaction(
    async (tx) => prescribe_courses(tx, upns, courseId, dueDate)
  )
  return await assigned_courses(courseId);
}

async function queueEmails(upns, courseId, dueDate) {
  let emailData;
  const allUpns = upns;
  for (const upn of allUpns) {
    emailData = { upn, courseId, dueDate };
    await queue.enqueue('course-queue', emailData);
  }
}

async function checkIfCourseCompleted(upn, courseId) {
  const courseCompleted = await user_completed_course(upn, courseId);
  return !courseCompleted;
}

router.post(
  '/removePrescribed',
  handle_errors(async (req, res) => {
    const { upn, courseId } = req.body;
    await remove_prescribed_course(upn, courseId);
    const assignedUsers = await assigned_courses(courseId);
    res.json(assignedUsers);
  })
);

module.exports = router;
