let router = require('express').Router();
let { handle_errors } = require('../../core/async-handler');
let {
  getGuestAssignment,
  addVacApplication,
  structuredReviewSurvey,
  addDoubleCommentAnswer,
  addRatingAnswer,
  addSingleCommentAnswer,
  insertFeedbackResponse,
  getGuestRecentlyCompletedAssignment,
  structuredGuestReviewDetails,
  getStatusIdByDescription,
  isAssignmentProgressionAllowed,
  findReviewByAssignment,
  findReviewStatusIdByActionName,
  getReviewStatusId,
  updateReviewStatus,
  insertStatusHistory,
  checkAndMarkFeedbackAssignment,
  getReviewIdBasedOnFeedbackAssignmentId,
  updateStatusOfReviewBasedOnFeedbackAssignments,
  getReviewAllowedProgressions,
  countFeedbackAssignmentsForReview,
  getGuestFeedbackAssignmentStatusAndReviewee
} = require('../queries/guestFeedback.queries');
const { BlobServiceClient, } = require('@azure/storage-blob');
const { randomUUID } = require('crypto');

let { logger } = require('../../core/logger');
let fetch = require('node-fetch');
let { withTransaction } = require('../db');
const { isProduction } = require("@the-hive/lib-core")

const multer = require('multer');
const { log } = require('console');
const upload = multer();

const QUESTION_TYPE_RATING_ONLY = 'rating-only';
const QUESTION_TYPE_EXTENDED_RATING = 'extended-rating';
const QUESTION_TYPE_STANDARD_ANSWER = 'standard-answer';
const SECTION_TYPE_COMBINED_DISCUSSION = 'discussion';

const CONTAINER_NAME = 'peer-feedback-saved';
const ALLOWED_FEEDBACK_STATUS_UPDATES = ['Viewed', 'Started'];

router.get("/config.json", (_req, res) => {
  res.json({
    PRODUCTION: isProduction(),
  })
});

router.get(
  '/survey',
  handle_errors(async (req, res) => {
     try {
       let externalAssignmentId = req.query.id;

       if (externalAssignmentId) {
         let survey = await structuredReviewSurvey(externalAssignmentId);

         res.json(survey);
       } else {
         throw new Error('Invalid Assignment ID');
       }
     } catch (error) {
       res.status(404).send(error);
     }
  })
);

router.get(
  '/external/:id',
  handle_errors(async (req, res) => {
    let externalId = req.params.id;
    let guestReview = await isValidGuestReview(externalId) ;

    if ( guestReview.valid) {
      logger.warn(`Valid Access ID: ${externalId}`);
    } else {
      logger.warn(`Invalid Access ID: ${externalId}`);
    }

    res.json(guestReview);
  })
);

router.get(
  '/external/:id/status',
  handle_errors(async (req, res) => {
    let externalId = req.params.id;
    let guestReview = await getGuestFeedbackAssignmentStatusAndReviewee(externalId);

    if (guestReview) {
      res.json(guestReview);
    } else {
      res.status(404).json({ message: "We could not find this feedback assignment. Please double check you have the correct link." })
    }

  })
);

const isValidGuestReview = async (id) => {
  let result = await structuredGuestReviewDetails(id);
  if(result == undefined || result.reviewee == undefined ){
    return { valid: false, reviewee: undefined, reason: 'denied' , assignment: undefined};
  }
  else if (result.guestReview == undefined) {
    return { valid: false, reviewee: result.reviewee, reason: 'done' , assignment: undefined};
  } else {
    return { valid: true, reviewee: result.reviewee, assignment: result.guestReview };
  }
}

router.post(
  '/external/:id',
  handle_errors(async (req, res) => {
    let externalId = req.params.id;
    let token = req.body.recaptcha;

    let secret =  process.env.RECAPTCHA_SECRET;
    let url = 'https://www.google.com/recaptcha/api/siteverify?secret=' + secret + '&response=' + token;
    var headerData = {
      Accept: '*/*',
      'Cache-Control': 'no-cache',
      'Accept-Encoding': 'gzip, deflate',
      Connection: 'keep-alive',
    };

    const request = {
      method: 'post',
      headers: headerData,
    };

    let validation = await fetch(url, request).then((httpResponse) => httpResponse.json());

    if (validation.success) {
      try {
        let answers = req.body.review.answers;
        if (answers) {
          let parameters = await getGuestAssignment(externalId);

          await withTransaction(async (tx) => {
            await insertReviewAnswers(tx, parameters.feedbackAssignmentID, answers, parameters.reviewer);
          });

          res.status(201).send();
        } else {
          throw new Error('Invalid request body received');
        }
      } catch (error) {
        res.status(400).send(error);
      }
    } else {
      res.status(401).send();
    }
  })
);

const insertReviewAnswers = async (tx, assignmentId, answers, upn) => {
  let completedAssignmentStatusId = (await getStatusIdByDescription('Completed'))[0].feedbackAssignmentStatusId;
  let isAllowedToComplete = await isAssignmentProgressionAllowed(tx, assignmentId, completedAssignmentStatusId);

  if (isAllowedToComplete) {
    for (let answer of answers) {
      let feedbackResponseId = await insertFeedbackResponse(tx, assignmentId, answer.id);

      switch (answer.type) {
        case QUESTION_TYPE_EXTENDED_RATING:
          await addDoubleCommentAnswer(tx, feedbackResponseId, answer);
          await addRatingAnswer(tx, feedbackResponseId, answer);
          break;
        case QUESTION_TYPE_RATING_ONLY:
          await addRatingAnswer(tx, feedbackResponseId, answer);
          break;
        case QUESTION_TYPE_STANDARD_ANSWER:
          await addSingleCommentAnswer(tx, feedbackResponseId, answer);
          break;
        case SECTION_TYPE_COMBINED_DISCUSSION:
          await addSingleCommentAnswer(tx, feedbackResponseId, answer);
          break;
        default:
          throw new Error('Invalid answer type');
      }
    }

    await insertStatusHistory(tx, assignmentId, completedAssignmentStatusId, upn);

    let reviewId = (await findReviewByAssignment(assignmentId)).reviewId;
    const allFeedbackSubmitted = await isAllReviewFeedbackSubmitted(tx, reviewId);

    if (allFeedbackSubmitted) {
      await progressReviewStatus(tx, assignmentId, 'FeedbackCompleted', upn);
    }
  } else {
    throw new Error(
      `Completion not allowed for the feedback assignment ${assignmentId}, as the review was already submitted.`
    );
  }
};

const isAllReviewFeedbackSubmitted = async (tx, reviewId) => {
  const assignmentCount = await countFeedbackAssignmentsForReview(tx, reviewId);
  return assignmentCount.completedAssignmentCount === assignmentCount.reviewAssignmentCount;
}

const progressReviewStatus = async (tx, assignmentId, nextStatusActionName, upn) => {
  let allowedToProgress = true;
  let reviewId = (await findReviewByAssignment(assignmentId)).reviewId;
  let nextStatusId = (await findReviewStatusIdByActionName(nextStatusActionName)).reviewStatusId;
  let currentStatusId = (await getReviewStatusId(reviewId)).reviewStatusId;

  if (currentStatusId != nextStatusId) {
    allowedToProgress = await checkProgression (currentStatusId, nextStatusId);
    if (allowedToProgress) {
      await updateReviewStatus(tx, reviewId, nextStatusId, upn);
    }
  }

  return allowedToProgress;
};

const checkProgression = async (currentStatusId, nextStatusId) => {
  let allowedProgressions = await getReviewAllowedProgressions(currentStatusId);
  return allowedProgressions.find((progression) => progression.nextStatusId == nextStatusId);
};

router.post('/apply', upload.array('files', 2), handle_errors(async (req, res) => {
  let { body, files } = req;

    const pdfFileSignature = '%PDF-'.split('').map(character => character.charCodeAt(0));
    for(const file of files){
      for (let i = 0; i < pdfFileSignature.length; i++) {
        if (file.buffer[i] != pdfFileSignature[i]) {
          res.status(400).json({ success: false }).send();
          return;
        }
      }
    }

    let payload = JSON.parse(body.payload);
    let application = payload.application;
    let token = payload.recaptcha;
    const cv = {
      content: files[0],
      name: randomUUID() + '.pdf',
    };
    const transcript = {
      content: files[1],
      name: randomUUID() + '.pdf',
    };

    let secret = process.env.RECAPTCHA_SECRET;
    let url = 'https://www.google.com/recaptcha/api/siteverify?secret=' + secret + '&response=' + token;
    var headerData = {
      Accept: '*/*',
      'Cache-Control': 'no-cache',
      'Accept-Encoding': 'gzip, deflate',
      Connection: 'keep-alive',
    };

    const request = {
      method: 'post',
      headers: headerData,
    };

    let validation = await fetch(url, request).then((httpResponse) => httpResponse.json());

    if (validation.success) {
      try {
        await uploadFile(cv, 'vac-work-applications/' + process.env.NODE_ENV);
        await uploadFile(transcript, 'vac-work-applications/' + process.env.NODE_ENV);
        await addVacApplication(application, cv.name, transcript.name);
      } catch (error) {
        res.status(400).json({ success: false }).send('Error uploading files. Please reload page and attempt again.');
      }

      res.status(201).json({ success: true }).send();
    } else {
      res.status(401).json({ success: false }).send('Invalid reCAPTCHA. Please try again.');
    }
})
);

const uploadFile = async (file, containerName) => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(file.name);
  await blockBlobClient.upload(file.content.buffer, file.content.size);
}

const getFile = async (fileName, containerName) => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  const downloadBlockBlobResponse = await blockBlobClient.download();
  const fileContent = await downloadBlockBlobResponse.readableStreamBody.readAll();
  return fileContent;
}

router.post(
  '/review/:id/action',
  handle_errors(async (req, res) => {
    try {
      const { action } = req.body;
      const guestAssignmentId = req.params.id;

      await withTransaction(async (tx) => {
        if (ALLOWED_FEEDBACK_STATUS_UPDATES.indexOf(action) === -1) {
          throw new Error('Invalid action received');
        } else {
          const reviewDetails = await structuredGuestReviewDetails(guestAssignmentId);
          const { reviewer, feedbackAssignmentID } = reviewDetails.guestReview;

          await checkAndMarkFeedbackAssignment(tx, feedbackAssignmentID, action, reviewer);
          const {reviewId} = await getReviewIdBasedOnFeedbackAssignmentId(feedbackAssignmentID);
          await updateStatusOfReviewBasedOnFeedbackAssignments(tx, reviewId, reviewer);

        }
      });
      res.status(204).send();
    } catch (e) {
      res.status(400).send(e);
    }
  })
);



router.post(
  '/review/progress/:id',
  handle_errors(async (req, res) => {
    try {
      let { assignmentId: guestAssignmentId, surveyId, answers } = req.body;

      await withTransaction(async (tx) => {
        if (answers && guestAssignmentId && surveyId) {
          const reviewDetails = await structuredGuestReviewDetails(guestAssignmentId);
          const { reviewer: activeUPN, feedbackAssignmentID } = reviewDetails.guestReview;

          if (answers.length > 0) {
            await checkAndMarkFeedbackAssignment(tx, feedbackAssignmentID, 'Saved For Later', activeUPN);
            const {reviewId} = await getReviewIdBasedOnFeedbackAssignmentId(feedbackAssignmentID);
            await updateStatusOfReviewBasedOnFeedbackAssignments(tx, reviewId, activeUPN);
          }

          let assignment = (await isValidGuestReview(guestAssignmentId)).assignment;

          if (assignment === undefined) {
            throw new Error('User does not have access to this review');
          } else {
            await storeReviewFeedbackProcess(req.body, guestAssignmentId, assignment.reviewer);
          }


        } else {
          throw new Error('Invalid request body received');
        }
      });

      res.status(201).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.get(
  '/review/progress/:id',
  handle_errors(async (req, res) => {
    try {
      let assignmentId = req.params.id;
      let assignment = (await isValidGuestReview(assignmentId)).assignment;

       if (assignment === undefined) {
          throw new Error('User does not have access to this review');
        } else {
          let reviewProgress = await retrieveReviewFeedbackProcess(assignmentId, assignment.reviewer);
          res.json(reviewProgress);
        }

    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.delete(
  '/review/progress/:id',
  handle_errors(async (req, res) => {
    try {
      let assignmentId = req.params.id;
      let assignment = await getGuestRecentlyCompletedAssignment(assignmentId);

      if (assignment === undefined) {
        throw new Error('User does not have access to this review');
      } else {
         await removeReviewFeedbackProcess(assignmentId, assignment.reviewer);
        const {reviewId} = await getReviewIdBasedOnFeedbackAssignmentId(assignmentId);
        await updateStatusOfReviewBasedOnFeedbackAssignments(tx, reviewId, assignment.reviewer);
      }

      res.status(201).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

async function storeReviewFeedbackProcess(progress, assignmentId, reviewer) {
  const newFile = getUrl(assignmentId, reviewer);
  const fileContent = JSON.stringify(progress);

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(newFile);

  await blockBlobClient.upload(fileContent, fileContent.length);
}

async function retrieveReviewFeedbackProcess(assignmentId, reviewer) {
  const file = getUrl(assignmentId, reviewer);
  const content = await fetchBlobData(CONTAINER_NAME, file);
  if(content){
    return JSON.parse(content);
  } else {
    return {};
  }
}

async function removeReviewFeedbackProcess(assignmentId, reviewer) {
  const file = getUrl(assignmentId, reviewer);

  // include: Delete the base blob and all of its snapshots.
  // only: Delete only the blob's snapshots and not the blob itself.
  const options = {
    deleteSnapshots: 'include',
  };

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(file);

  await blockBlobClient.deleteIfExists(options);
}

function getUrl(assignmentId, reviewer) {
  let env = process.env.NODE_ENV;
  return `${env}/${reviewer}/feedback-${assignmentId}.json`;
}


async function fetchBlobData(containerName, blobName) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Azure storage connection string not set');
  }
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Get blob content from position 0 to the end
  // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
  // In browsers, get downloaded data by accessing downloadBlockBlobResponse.blobBody
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  if(await blockBlobClient.exists()){
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    return await streamToString(downloadBlockBlobResponse.readableStreamBody);
  } else {
    return undefined;
  }
}

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}



module.exports = router;
