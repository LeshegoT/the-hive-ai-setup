const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { send, readImage, isEmailAllowed } = require('../shared/email');
const { buildErrorObject } = require('../shared/error-handling');
const {
  getFeedbackAssignmentTemplate,
  getAssignmentsDueInAWeekOrOnTheDay,
  getOverdueAssignments,
  getSoonToBeOverdueInternalAssignments,
  getCurrentDayAssignmentNudges,
} = require('../queries/peer-feedback.queries');
const queue = require('../shared/queue');
const { prepareFeedbackEmailContent } = require('../shared/peer-feedback');
const {
  retrieveOverdueFeedbackAssignment,
  retrieveDisplayName,
} = require('../queries/review.queries');
const {
  getUserTimeZone,
  post,
  postEmail,
  patch,
} = require('../shared/graph-api');
const { prepareTemplateFromFile } = require('../shared/html-template');
const { buildRelativeURL } = require('../shared/url');
const {
  getEventTemplateDetail,
} = require('../queries/calendar-events.queries');
const { withTransaction } = require('../shared/db');
const { describeTable, insert } = require('../queries/generate.queries');
const {
  getActiveDirectoryProfile,
} = require('../shared/active-directory-profile');
const { prependEnvironment } = require('@the-hive/lib-core');
const {
  createReviewWithAssignments,
  insertIntoReviewCommunication,
  REVIEW_COMMUNICATION_TYPE_CALENDAR_EVENT,
  REVIEW_COMMUNICATION_TYPE_REVIEWER_EMAIL,
  REVIEW_COMMUNICATION_REASON_SYSTEM_NUDGE,
} = require('../shared/review');
const { generateInternalServerMessage } = require('@the-hive/lib-core');
const { sendFeedbackProvidersRequest  } = require('../shared/send-feedback-providers-request');
const { retrieveDetailsForFeedbackProvidersRequestReminders } = require('../queries/peer-feedback.queries');
const { parseIfSetElseDefault } = require('@the-hive/lib-core');
const FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED = parseIfSetElseDefault('FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED', false);

router.post(
  '/feedback-assignments',
  handle_errors(async (req, res) => {
    try {
      await withTransaction(async (tx) => {
        const emailRequest = await prepareFeedbackEmailContent(
          tx,
          req.body.feedbackAssignmentId
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
          clientEmail,
        } = emailRequest;
        await send(from, to, subject, context, message, url, {
          callToAction,
          image,
          templateFile,
          clientEmail,
        });
        await insertIntoReviewCommunication(
          tx,
          req.body.feedbackAssignmentId,
          'the-hive@bbd.co.za',
          to,
          new Date(),
          REVIEW_COMMUNICATION_TYPE_REVIEWER_EMAIL,
          REVIEW_COMMUNICATION_REASON_SYSTEM_NUDGE
        );
      });
      res.status(201).send();
    } catch (error) {
      res.status(500).send(JSON.stringify(buildErrorObject(error)));
    }
  })
);

router.post('/send-feedback-providers-request-reminders',
  handle_errors(async (req, res) => {
    try {
      const { details, typeOfCommunication } = req.body;
      const wasEmailSent = await sendFeedbackProvidersRequest(details, typeOfCommunication);
      if (wasEmailSent) {
        res.status(200).send();
      } else {
        res.status(200).json({message: "Failed to send feedback providers request reminders."});
      }
    } catch (error) {
      res.status(200).json(generateInternalServerMessage('sending feedback providers request reminders',error));
    }
  })
);

router.post('/schedule-feedback-providers-request-reminders',
  handle_errors(async (req, res) => {
    try {
      const feedbackReminderDetails = await retrieveDetailsForFeedbackProvidersRequestReminders();
      let notSent = 0;
      const errors = [];
      if(FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED){
        if (feedbackReminderDetails.length > 0){
          for (const reminderDetails of feedbackReminderDetails) {
            try{
              const data = {
                details: reminderDetails,
                typeOfCommunication: REVIEW_COMMUNICATION_REASON_SYSTEM_NUDGE
              }

              await queue.enqueue('feedback-providers-request', data);
            } catch(error) {
              notSent++;
              errors.push(error);
            }
          }

          res.status(200).json({ response: generateBulkEmailResponse(notSent, errors, feedbackReminderDetails.length) });
        } else {
          res.status(200).json({ message: 'No emails to send out today.' });
        }

      } else {
        res.status(200).json({ message: 'FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED flag not set. No emails send out today.' });
      }
    } catch (error) {
      res.status(200).json(generateInternalServerMessage('sending feedback providers request reminders',error));
    }

  })
)

router.post('/send-outstanding-feedback-email', async (req, res) => {
  try {
    const assignmentsByManager = await retrieveOverdueFeedbackAssignment();
    const templateFile = 'overdue-feedback-email.html.hbs';
    const title =
      'Your team members have   <b style="color:#C72026">outstanding reviews</b>:<br>';
    for (const [managerEmail, assignments] of Object.entries(
      assignmentsByManager
    )) {
      const managerName = await retrieveDisplayName(managerEmail);
      const displayName = managerName.displayName;
      let textContent = `<p style="font-size:12pt">Dear ${displayName},</p><p style="font-size:12pt">Please encourage your team to complete their outstanding reviews. Here are the details:</p><table width='100%' cellspacing='8' cellpadding='4' style="font-size:12pt">
          <thead>
            <tr style='color:#C72026; padding-bottom:20px'>
              <th style='text-align: left;'>Your team member</th>
              <th style='text-align: left'>To provide feedback about</th>
              <th style='text-align: left; padding-left: 20px;'>For &nbsp;(review type)</th>
              <th style='text-align: left'>No later than</th>
            </tr>
          </thead>
          <tbody>`;
      for (const assignment of assignments) {
        const dueDate = new Date(assignment.deadline).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const employeeFullName = await retrieveDisplayName(assignment.reviewer);
        const reviewee = await retrieveDisplayName(assignment.reviewee);
        textContent += `<tr style='padding-bottom:10px'>
                          <td>${
                            employeeFullName.displayName
                          }&nbsp;(<a href="mailto:${
          assignment.reviewer
        }?subject=${getSubject(assignment, reviewee)}">${
          assignment.reviewer
        }</a>)</td>
                          <td>${reviewee.displayName}</td>
                          <td style='padding-left: 20px;'>${
                            assignment.templateName
                          } &nbsp;Review</td>
                          <td>${dueDate}</td></tr>`;
      }
      textContent +=
        '</tbody></table><p>Thank you for your attention to this matter.</p>';
      const emailRequest = {
        from: 'the-hive@bbd.co.za',
        to: managerEmail,
        subject: 'Outstanding Feedback Assignments',
        context: title,
        message: textContent,
      };
      const { from, to, subject, context, message } = emailRequest;
      await send(from, to, subject, context, message, null, {
        templateFile,
        image: 'peer',
        showCallToAction: false,
      });
    }
    res.status(201).send();
  } catch (error) {
    // We are intentionally sending a success response code to prevent the Azure function from retrying
    // and causing team leads to receive multiple emails
    logger.error({message: "Outstanding feedback email failed", error});
    res.status(200).send();
  }
});

function getSubject(assignment, reviewee) {
  if (assignment.reviewer === assignment.reviewee) {
    return 'Please urgently complete your self-review';
  } else {
    return `Please urgently provide your review feedback for ${reviewee.displayName}`;
  }
}

const filterNudgedAssignments = async (emailsToBeSent) => {
  const filteredAssignments = [];
  for (const assignment of emailsToBeSent) {
    const assignmentNudgesToday = await getCurrentDayAssignmentNudges(
      assignment.feedbackAssignmentID
    );
    if (assignmentNudgesToday.length === 0) {
      filteredAssignments.push(assignment);
    }
  }
  return filteredAssignments;
};

function generateBulkEmailResponse(notSent, errors, emailsToBeSentLength){
  const currentDate = new Date();
  const message = `${emailsToBeSentLength} emails were compiled to be sent out on ${currentDate} however, ${notSent} was not sent due to bad data. ${errors}`;
  return {
    message,
    errors,
  };
}

router.post(
  '/assignment/nudges',
  handle_errors(async (req, res) => {
    const assignmentsDue = await getAssignmentsDueInAWeekOrOnTheDay();
    let overdueAssignments = [];
    const monday = 1;
    const currentDate = new Date();
    let notSent = 0;
    const errors = [];

    if (currentDate.getDay() == monday) {
      overdueAssignments = await getOverdueAssignments();
    }

    const emailsToBeSent = [...assignmentsDue, ...overdueAssignments];

    const assignmentsNotNudgedToday = await filterNudgedAssignments(
      emailsToBeSent
    );

    if (assignmentsNotNudgedToday.length > 0) {
      for (const assignment of assignmentsNotNudgedToday) {
        try {
          const templateId = assignment.feedbackAssignmentTemplateID;
          const feedbackAssignmentTemplate = await getFeedbackAssignmentTemplate(
            templateId
          );
          const data = {
            reviewee: assignment.reviewee,
            reviewer: assignment.reviewer,
            feedbackAssignmentTemplate: feedbackAssignmentTemplate,
            feedbackAssignmentId: assignment.feedbackAssignmentID,
          };

          await queue.enqueue('assignment-queue', data);
        } catch (error) {
          notSent++;
          errors.push(error);
        }
      }


      res.status(200).json({ response: generateBulkEmailResponse(notSent, errors, emailsToBeSent.length) });
    } else {
      res.status(200).json({ message: 'No emails to send out today.' });
    }
  })
);

router.post(
  '/soon-to-be-overdue-assignment',
  handle_errors(async (_req, res) => {
    try {
      const soonToBeOverdueAssignments =
        await getSoonToBeOverdueInternalAssignments();

      if (soonToBeOverdueAssignments.length > 0) {
        const assignmentsMap = new Map();

        for (const soonToBeOverdueAssignment of soonToBeOverdueAssignments) {
          const {
            reviewer,
            feedbackAssignmentID,
            reviewee,
            feedbackDeadline,
            clientEmail,
          } = soonToBeOverdueAssignment;
          if (!assignmentsMap.has(reviewer)) {
            assignmentsMap.set(reviewer, [
              {
                feedbackAssignmentId: feedbackAssignmentID,
                reviewee: reviewee,
                feedbackDeadline: feedbackDeadline,
                clientEmail: clientEmail,
              },
            ]);
          } else {
            assignmentsMap.get(reviewer).push({
              feedbackAssignmentId: feedbackAssignmentID,
              reviewee: reviewee,
              feedbackDeadline: feedbackDeadline,
              clientEmail: clientEmail,
            });
          }
        }

        const assignments = Array.from(
          assignmentsMap,
          ([reviewer, reviewerData]) => ({
            reviewer: reviewer,
            reviewerData: reviewerData,
          })
        );

        const calendarEventTemplateId =
          process.env.REMINDER_FOR_REVIEW_TEMPLATE_ID;
        const { subject, body, callToAction, online } =
          await getEventTemplateDetail(calendarEventTemplateId);
        for (const assignment of assignments) {
          await queue.enqueue('soon-overdue-feedback-calendar-event-queue', {
            assignment,
            calendarEventTemplateId,
            subject,
            body,
            callToAction,
            online,
          });
        }
      } else {
        await sendMailToATCTeam('No events to create today');
      }
    } catch (error) {
      await sendMailToATCTeam(error.message);
    }
    res.send('Successful');
  })
);

router.post(
  '/soon-to-be-overdue-assignment/event',
  handle_errors(async (req, res) => {
    await withTransaction(async (tx) => {
      const durationInMinutes = 15;
      const isReminderOn = true;
      const reminderMinutesBeforeStart = 15;
      const eventHour = 12;
      const eventMinute = 30;

      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 1);

      const startDateTime = `${eventDate.toLocaleDateString(
        'en-CA'
      )}T${eventHour}:${eventMinute}:00`;
      const endDateTime = `${eventDate.toLocaleDateString(
        'en-CA'
      )}T${eventHour}:${eventMinute + durationInMinutes}:00`;

      const imageData = {
        name: 'review.jpg',
        type: 'image/jpeg',
        altText: 'BBD Software Development - Code is our Art',
      };

      const {
        assignment,
        calendarEventTemplateId,
        subject,
        body,
        callToAction,
        online,
      } = req.body;
      const { reviewer, reviewerData } = assignment;
      const clientEmail = (await isEmailAllowed(clientEmail))
        ? reviewerData.clientEmail
        : undefined;
      try {
        const eventContent = await prepareContent(
          body,
          callToAction,
          reviewer,
          reviewerData,
          imageData
        );

        const graphAPIId = await createCalendarEvent(
          subject,
          eventContent,
          imageData,
          startDateTime,
          endDateTime,
          reviewer,
          online,
          isReminderOn,
          reminderMinutesBeforeStart
        );
        await insertCalendarEvent(
          tx,
          calendarEventTemplateId,
          graphAPIId,
          startDateTime,
          durationInMinutes,
          reviewer,
          clientEmail,
          'the-hive@bbd.co.za'
        );
        for (const { feedbackAssignmentId } of reviewerData) {
          await insertIntoReviewCommunication(
            tx,
            feedbackAssignmentId,
            'the-hive@bbd.co.za',
            reviewer,
            new Date(),
            REVIEW_COMMUNICATION_TYPE_CALENDAR_EVENT,
            REVIEW_COMMUNICATION_REASON_SYSTEM_NUDGE
          );
        }
      } catch (error) {
        await sendMailToATCTeam(
          `Failed to create the soon to be overdue feedback event for reviewer: ${reviewer}, error: ${error.message}`
        );
      }
    });
    res.status(200).send();
  })
);

async function prepareContent(
  body,
  callToAction,
  reviewer,
  reviewerData,
  imageData
) {
  let url;
  const totalReviewee = reviewerData.length;
  let context;
  const feedbackEmailGuideline = prepareTemplateFromFile(
    'email-templates',
    'feedback-email-guidelines.html.hbs'
  );
  let feedbackGuideline;

  if (totalReviewee === 1) {
    const reviewee = reviewerData[0].reviewee;
    const feedbackAssignmentId = reviewerData[0].feedbackAssignmentId;
    const feedbackDeadline = reviewerData[0].feedbackDeadline;

    if (reviewer === reviewee) {
      context = `Your self-review will <b style= color:#C72026> soon be overdue </b><br><br>`;
      feedbackGuideline = feedbackEmailGuideline({
        dueDate: formatDateToLocalTimezone(feedbackDeadline),
      });
    } else {
      const { displayName } = await getActiveDirectoryProfile(reviewee);
      feedbackGuideline = feedbackEmailGuideline();
      context = `Your review will <b style= color:#C72026> soon be overdue </b> for your colleagues
                <table style='font-size:16pt;border-collapse: separate; border-spacing: 20pt;'>
                  <tr style= color:#C72026;font-weight:bold;>
                    <td style='padding: 15px'> Email </td>
                    <td style='padding: 15px'> Full Name </td>
                    <td style='padding: 15px'> Due Date </td>
                  </tr>
                  <tr>
                    <td style='padding: 15px'> ${reviewee} </td>
                    <td style='padding: 15px'> ${displayName} </td>
                    <td style='padding: 15px'> ${formatDateToLocalTimezone(
                      feedbackDeadline
                    )} </td>
                  </tr>
                </table>`;
    }
    url = buildRelativeURL('hive', `peer-feedback?id=${feedbackAssignmentId}`);
  } else {
    context = `Your review will <b style= color:#C72026> soon be overdue </b> for your colleagues
              <table style='font-size:16pt;border-collapse: separate; border-spacing: 20pt;'>
                <tr style= color:#C72026;font-weight:bold;>
                  <td style='padding: 15px'> Email </td>
                  <td style='padding: 15px'> Full Name </td>
                  <td style='padding: 15px'> Due Date </td>
                </tr>`;

    for (const feedbackAssignment of reviewerData) {
      const { reviewee, feedbackDeadline } = feedbackAssignment;
      const { displayName } = await getActiveDirectoryProfile(reviewee);
      context += `<tr>
                      <td style='padding: 15px'> ${reviewee} </td>
                      <td  style='padding: 15px'> ${displayName} </td>
                      <td  style='padding: 15px'> ${formatDateToLocalTimezone(
                        feedbackDeadline
                      )} </td>
                    </tr>`;
    }
    context += '</table>';
    url = buildRelativeURL('hive', 'peer-feedback');
    feedbackGuideline = feedbackEmailGuideline();
  }

  const content = {
    context: context,
    message: body + feedbackGuideline,
    url: url,
    callToAction: callToAction,
    image: {
      name: imageData.name,
      altText: imageData.altText,
    },
  };

  const eventTemplate = prepareTemplateFromFile(
    'email-templates',
    'feedback-email.html.hbs'
  );
  return eventTemplate(content);
}

/**
 * Creates a calendar event using the provided parameters.

 *
 * @param {string} subject - The subject or title of the event.
 * @param {string} eventContent - The content or description of the event.
 * @param {object} imageData - the imageData contain information about image.
 * @param {Date} startDateTime - The start date and time of the event.
 * @param {Date} endDateTime - The end date and time of the event.
 * @param {string[]} reviewer - email address representing the attendee of the event.
 * @param {boolean} online - Specifies whether the event is online or not.
 * @param {boolean} isReminderOn - Specifies whether a reminder is enabled for the event.
 * @param {number} reminderMinutesBeforeStart - The number of minutes before the event start time when the reminder should be triggered.
 * @returns {Promise<string>} - Return Graph API ID of the created event.
 */
async function createCalendarEvent(
  subject,
  eventContent,
  imageData,
  startDateTime,
  endDateTime,
  reviewer,
  online,
  isReminderOn,
  reminderMinutesBeforeStart
) {
  const timeZone = await getUserTimeZone(reviewer);

  const imageBuffer = await readImage(imageData);
  const imageBytes = imageBuffer.toString('base64');

  const imageAttachment = {
    '@odata.type': '#microsoft.graph.fileAttachment',
    contentType: imageData.type,
    name: imageData.name,
    contentId: imageData.name,
    contentBytes: imageBytes,
    IsInline: true,
  };

  const eventBody = {
    subject: prependEnvironment(subject),
    body: {
      contentType: 'HTML',
      content: eventContent,
    },
    start: {
      dateTime: startDateTime,
      timeZone: timeZone.value,
    },
    end: {
      dateTime: endDateTime,
      timeZone: timeZone.value,
    },
    isOnlineMeeting: online,
    onlineMeetingProvider: 'teamsForBusiness',
    isReminderOn: isReminderOn,
    reminderMinutesBeforeStart: reminderMinutesBeforeStart,
  };

  const eventAttendee = {
    attendees: [
      {
        type: 'required',
        emailAddress: {
          address: reviewer,
        },
      },
    ],
    hasAttachments: true,
  };

  if (clientEmail && isEmailAllowed(clientEmail)) {
    const newAttendee = {
      type: 'required',
      emailAddress: {
        address: clientEmail,
      },
    };
    eventAttendee.attendees.push(newAttendee);
  }

  const graphAPIResponse = await post(
    '/users/the-hive@bbd.co.za/events',
    eventBody
  );
  const graphAPIResponseId = graphAPIResponse.id;
  await post(
    `/users/the-hive@bbd.co.za/events/${graphAPIResponseId}/attachments`,
    imageAttachment
  );
  await patch(
    `/users/the-hive@bbd.co.za/events/${graphAPIResponseId}`,
    eventAttendee
  );

  return graphAPIResponseId;
}

async function insertCalendarEvent(
  tx,
  calendarEventTemplateId,
  graphAPIId,
  startDateTime,
  durationInMinutes,
  upn,
  clientEmail,
  createdBy
) {
  const eventDescription = await describeTable('CalendarEvents');
  const newEvent = {
    calendarEventTemplateId,
    graphAPIId,
    startDateTime,
    durationInMinutes,
    createdBy,
  };
  const calendarEventId = await insert(
    tx,
    'CalendarEvents',
    eventDescription,
    newEvent
  );

  const eventAttendeesDescription = await describeTable('CalendarEventAttendees');
  const newAttendee = { calendarEventId, upn };
  await insert(
    tx,
    'CalendarEventAttendees',
    eventAttendeesDescription,
    newAttendee
  );
  if (clientEmail && isEmailAllowed(clientEmail)) {
    const clientEmailAttendee = { calendarEventId, upn: clientEmail };
    await insert(
      tx,
      'CalendarEventAttendees',
      eventAttendeesDescription,
      clientEmailAttendee
    );
  }
}

async function sendMailToATCTeam(error) {
  const mailContent = JSON.stringify(error);
  const mailBody = {
    message: {
      subject: `Soon to be Overdue Event Creation Failed [${process.env.NODE_ENV}]`,
      toRecipients: [
        {
          emailAddress: {
            address: 'atcteam@bbd.co.za',
          },
        },
      ],
      ccRecipients: [],
      body: {
        content: mailContent,
        contentType: 'text',
      },
    },
  };
  await postEmail('the-hive@bbd.co.za', mailBody);
}

function formatDateToLocalTimezone(isoDate) {
  const date = new Date(isoDate);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const userLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  return date.toLocaleDateString(userLocale, options);
}
router.post(
  '/reviews',
  handle_errors(async (req, res) => {
    try {
      const {
        reviewee,
        reviewers,
        hrRep,
        upn,
        reviewDate,
        assignmentTemplateId,
        staffReviewId,
      } = req.body;
      await withTransaction(async (tx) => {
        await createReviewWithAssignments(
          tx,
          reviewee,
          reviewers,
          hrRep,
          upn,
          reviewDate,
          assignmentTemplateId,
          undefined,
          staffReviewId
        );
      })
      res.status(201).send();
    } catch (error) {
      res.status(500).send(JSON.stringify(buildErrorObject(error)));
    }
  })
);

module.exports = router;
