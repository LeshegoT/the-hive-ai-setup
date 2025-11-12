const router = require('express').Router();
const apiGenerator = require('../../shared/standard-api');
const { handle_errors } = require('@the-hive/lib-core');
const { describeTable, insert } = require('../../queries/generate.queries');
const { withTransaction } = require('../../shared/db');
const { prepareTemplateFromFile } = require('../../shared/html-template');
const { buildRelativeURL } = require('../../shared/url');
const { getUserTimeZone, patch } = require('../../shared/graph-api');
const {
  getEventTemplateDetail,
} = require('../../queries/calendar-events.queries');
const { post } = require('../../shared/graph-api');
const { prependEnvironment } = require('@the-hive/lib-core');
const { readImage, isEmailAllowed } = require('../../shared/email');
const {
  addEventOrganiser,
  removeEventOrganiser,
  getEventOrganisers,
} = require('../../queries/event-organisers.queries');

apiGenerator.createStandardApiRoutes(
  router,
  '/calendar-event-template',
  'CalendarEventTemplate'
);

router.post(
  '/event',
  handle_errors(async (req, res) => {
    await withTransaction(async (tx) => {
      try {
        const upn = res.locals.upn;

        const imageData = {
          name: 'review.jpg',
          type: 'image/jpeg',
          altText: 'BBD Software Development - Code is our Art',
        };

        const {
          calendarEventTemplateId,
          startDateTime,
          durationInMinutes,
          attendees,
          isReminderOn,
          reminderMinutesBeforeStart,
        } = req.body;

        const { subject, body, callToAction, mandatory, online, surveyId } =
          await getEventTemplateDetail(calendarEventTemplateId);

        const attendeesYouCanEmail = attendees.filter((attendee) =>
          isEmailAllowed(attendee)
        );

        if (attendeesYouCanEmail.length > 0) {
          const eventContent = prepareContent(
            subject,
            body,
            imageData,
            callToAction,
            surveyId
          );
          const graphAPIId = await createCalendarEvent(
            subject,
            eventContent,
            startDateTime,
            durationInMinutes,
            online,
            attendeesYouCanEmail,
            upn,
            imageData,
            mandatory,
            {
              isReminderOn,
              reminderMinutesBeforeStart,
            }
          );
          await insertCalendarEvent(
            tx,
            calendarEventTemplateId,
            graphAPIId,
            startDateTime,
            durationInMinutes,
            attendeesYouCanEmail,
            'the-hive@bbd.co.za'
          );
        }
      } catch (error) {
        res
          .status(400)
          .json({ message: `Error while creating events ${error}` });
      }
    });
    res.status(201).send();
  })
);

function prepareContent(subject, body, imageData, callToAction, surveyId) {
  const url = buildRelativeURL('hive', `surveys?id=${surveyId}`);

  const content = {
    context: subject,
    message: body,
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

router.get('/events/organisers', async (_req, res) => {
  res.status(200).json(await getEventOrganisers());
});

router.post('/events/organisers', async (req, res) => {
  const upn = req.body.upn;
  if (upn) {
    res.status(201).json(await addEventOrganiser(upn));
  } else {
    res.status(400).json({ message: 'Please include a valid email.' });
  }
});

router.delete('/events/organisers/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (id) {
    res.status(200).json(await removeEventOrganiser(res.locals.upn, id));
  } else {
    res
      .status(400)
      .json({
        message: 'Please provide a valid id to delete the organiser by.',
      });
  }
});

/**
 * Creates a calendar event using the provided parameters.
 *
 * @param {string} subject - The subject or title of the event.
 * @param {string} eventContent - The content or description of the event.
 * @param {Date} startDateTime - The start date and time of the event.
 * @param {number} durationInMinutes - The duration of the event in minutes.
 * @param {boolean} online - Specifies whether the event is online or not.
 * @param {string[]} attendees - An array of email addresses representing the attendees of the event.
 * @param {string} upn - email address of the event organizer.
 * @param {object} imageData - the imageData contain information about image.
 * @param {string} imageData.name - name of the image.
 * @param {string} imageData.type - type of image.
 * @param {string} imageData.altText - alternative text of image.
 * @param {boolean} mandatory - Attendance is mandatory or not.
 * @param {object} [optionals] - optional parameters
 * @param {boolean} [optionals.isReminderOn] - Specifies whether a reminder is enabled for the event. (Optional)
 * @param {number} [optionals.reminderMinutesBeforeStart] - The number of minutes before the event start time when the reminder should be triggered. (Optional)
 * @returns {Promise<string>} - Return Graph API ID of the created event.
 */
async function createCalendarEvent(
  subject,
  eventContent,
  startDateTime,
  durationInMinutes,
  online,
  attendees,
  upn,
  imageData,
  mandatory,
  optionals
) {
  const start = new Date(startDateTime);
  const timeZone = await getUserTimeZone(upn);
  const end = new Date(startDateTime);
  end.setMinutes(start.getMinutes() + durationInMinutes);

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

  const eventAttendees = attendees.map((attendee) => {
    return {
      type: mandatory ? 'required' : 'optional',
      emailAddress: {
        address: attendee,
      },
    };
  });

  const eventBody = {
    subject: prependEnvironment(subject),
    body: {
      contentType: 'HTML',
      content: eventContent,
    },
    start: {
      dateTime: start.toISOString(),
      timeZone: timeZone.value,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: timeZone.value,
    },
    isOnlineMeeting: online,
  };

  if (online) {
    eventBody.onlineMeetingProvider = 'teamsForBusiness';
  }
  if (optionals.isReminderOn) {
    eventBody.isReminderOn = optionals.isReminderOn;
    eventBody.reminderMinutesBeforeStart = optionals.reminderMinutesBeforeStart;
  }

  const { id } = await post('/users/the-hive@bbd.co.za/events', eventBody);
  await post(
    `/users/the-hive@bbd.co.za/events/${id}/attachments`,
    imageAttachment
  );
  await patch(`/users/the-hive@bbd.co.za/events/${id}`, {
    attendees: eventAttendees,
  });
  return id;
}

async function insertCalendarEvent(
  tx,
  calendarEventTemplateId,
  graphAPIId,
  startDateTime,
  durationInMinutes,
  attendees,
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
  for (const upn of attendees) {
    const newAttendee = { calendarEventId, upn };
    await insert(
      tx,
      'CalendarEventAttendees',
      eventAttendeesDescription,
      newAttendee
    );
  }
}

module.exports = router;
