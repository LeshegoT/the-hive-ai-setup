const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  all_permitted_courses,
  get_section_questions,
  get_completed_courses,
  checkForCourseCompletionDate,
  complete_course,
  checkIfUserRegistered,
  register_user,
} = require('../queries/course.queries');
const { withTransaction } = require('../shared/db');

const { BlobServiceClient } = require('@azure/storage-blob');

router.get(
  '/courses',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;
    const courses = await all_permitted_courses(upn);

    res.json(courses);
  })
);

router.get(
  '/getSectionQuestions/:sectionId',
  handle_errors(async (req, res) => {
    const sectionIds = req.params.sectionId.split(',');
    const results = [];
    for (const sectionId of sectionIds) {
      const questionsForSection = await get_section_questions(sectionId);
      results.push({ sectionId, questions: questionsForSection });
    }
    res.json(results);
  })
);

router.get(
  '/getCompletedCourses',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;
    const result = await get_completed_courses(upn);
    res.json(result);
  })
);

router.get(
  '/pathToCourses/:courseRoute',
  handle_errors(async (req, res) => {
    const path = await fetchPathToCourses(req.params.courseRoute);
    res.json(path);
  })
);

router.get(
  '/coursePrefix',
  handle_errors(async (req, res) => {
    const path = await fetchCoursePrefix();
    res.json(path);
  })
);

router.post(
  '/course/:CourseId/completion-date',
  handle_errors(async (req, res) => {
    const courseId = req.params.CourseId;
    const upn = res.locals.upn;
    const mustUpdate = await checkForCourseCompletionDate(upn, courseId);

    if (mustUpdate) {
      await complete_course(courseId, upn);
      res.status(201).send();
    } else {
      res.status(200).send();
    }
  })
);

router.post(
  '/course/:CourseId/registration',
  handle_errors(async (req, res) => {
    const courseId = req.params.CourseId;
    const upn = res.locals.upn;
    const registered = await checkIfUserRegistered(upn, courseId);

    if (!registered) {
      withTransaction((tx) => register_user(tx, upn, courseId));
      res.status(201).send();
    } else {
      res.status(200).send();
    }
  })
);

async function fetchPathToCourses(courseRoute) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient('courses');
  const coursePaths = [];
  for await (const blob of containerClient.listBlobsFlat()) {
    if (
      (courseRoute == 'old-community-site' &&
        blob.name.includes(courseRoute) &&
        blob.name.includes('.md')) ||
      (!blob.name.includes('old-community-site') &&
        blob.name.includes(courseRoute) &&
        blob.name.includes('.md'))
    ) {
      const tmp = {
        path: blob.name,
      };
      coursePaths.push(tmp);
    }
  }
  return coursePaths;
}

async function fetchCoursePrefix() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient('courses');
  const coursePrefix = [];
  for await (const blob of containerClient.listBlobsFlat()) {
    if (
      !coursePrefix.includes(blob.name.substring(0, blob.name.indexOf('/'))) &&
      blob.name.substring(0, blob.name.indexOf('/'))
    ) {
      coursePrefix.push(blob.name.substring(0, blob.name.indexOf('/')));
    }
  }
  return coursePrefix;
}

module.exports = router;
