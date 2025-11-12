const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { logger } = require('@the-hive/lib-core');
const {
  getFeedbackAssignment,
  getExternalFeedbackAssignment,
} = require('../../queries/peer-feedback.queries');
const { getEnvironmentName } = require('@the-hive/lib-core');
const { listFolder, deleteBlob } = require('@the-hive/lib-core');
const { postEmail } = require('../../shared/graph-api');
const HTMLEngine = require('../../shared/html-template');

const CONTAINER_NAME = 'peer-feedback-saved';

const INTERNAL_FORMAT = /^feedback-(?<key>\d+)\.json$/;
const EXTERNAL_FORMAT =
  /^feedback-(?<key>[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})\.json$/;

const EXTRACT_REVIEWER = /^.*\/(?<reviewer>.*)\/feedback-.*\.json$/;

function classifyFile(item) {
  const fileName = item.nameInFolder;
  if (INTERNAL_FORMAT.test(fileName)) {
    const key = fileName.match(INTERNAL_FORMAT)?.groups?.key;
    return { type: 'internal', assignmentId: key, blob: item };
  } else if (EXTERNAL_FORMAT.test(fileName)) {
    const key = fileName.match(EXTERNAL_FORMAT)?.groups?.key;
    return { type: 'external', assignmentToken: key, blob: item };
  } else {
    return { type: 'invalid', blob: item };
  }
}

const processors = {
  internal: {
    retrieveAssignment: (item) => getFeedbackAssignment(item.assignmentId),
  },
  external: {
    retrieveAssignment: (item) =>
      getExternalFeedbackAssignment(item.assignmentToken),
  },
  invalid: {
    retrieveAssignment: () => undefined,
  },
};

async function deleteItem(item) {
  return deleteBlob(CONTAINER_NAME, item.blob.name);
}

async function assignmentInProgress(assignment) {
  // TODO: RE - new status codes are a work in progress
  // TODO: RE - follow up on this on trello ticket https://trello.com/c/bAVFO25H
  logger.info({message:"In progress assignment checking not handled yet", assignment});
  return true;
}

function assignmentReviewerMatchesItem(assignment, item) {
  const reviewer = item.blob.name.match(EXTRACT_REVIEWER)?.groups?.reviewer;
  return assignment.reviewer.toLowerCase() === reviewer.toLowerCase();
}

async function processItem(item) {
  const assignment = await processors[item.type].retrieveAssignment(item);
  if (assignment) {
    if (!assignmentReviewerMatchesItem(assignment, item)) {
      const deleted = await deleteItem(item);
      return `Assignment file logged to incorrect user, deleted=${deleted}`;
    } else if (await assignmentInProgress(assignment)) {
      // still in progress, keep the files
      // that, is DO NOTHING
      return "Assignment still in progress, won't delete";
    } else {
      const deleted = await deleteItem(item);
      return `Assignment not in progress, deleted=${deleted}`;
    }
  } else {
    const deleted = await deleteItem(item);
    return `Assignment not found, deleted=${deleted}`;
  }
}

async function sendMail(cleanupResult) {
  const htmlTemplate = HTMLEngine.prepareTemplateFromFile(
    'email-templates',
    'in-progress-feedback-assignment-blob-cleanup.hbs'
  );
  const html = htmlTemplate(cleanupResult);

  const body = {
    message: {
      subject: `[${getEnvironmentName(
        true
      ).toUpperCase()}] - In progress feedback assignment blob cleanup result`,
      toRecipients: [
        {
          emailAddress: {
            address: 'atcteam@bbd.co.za',
          },
        },
      ],
      ccRecipients: [],
      body: {
        content: html,
        contentType: 'html',
      },
    },
  };
  return postEmail('the-hive@bbd.co.za', body);
}

router.delete(
  '/in-progress-reviews',
  handle_errors(async (req, res) => {
    const cleanupResult = { started: new Date(), items: {} };
    const { folders } = await listFolder(
      CONTAINER_NAME,
      `${getEnvironmentName(true).toLowerCase()}/`,
      true
    );
    for (const folder of folders) {
      const classifiedBlobItems = folder.items.blobs.map((item) =>
        classifyFile(item)
      );
      for (const classifiedBlobItem of classifiedBlobItems) {
        classifiedBlobItem.result = await processItem(classifiedBlobItem);
      }
      cleanupResult.items[folder.name] = classifiedBlobItems;
    }
    cleanupResult.end = new Date();
    cleanupResult.durationMinutes =
      (cleanupResult.end.getTime() - cleanupResult.started.getTime()) /
      1000 /
      60;
    await sendMail(cleanupResult);
    res.status(204).send();
  })
);

module.exports = router;
