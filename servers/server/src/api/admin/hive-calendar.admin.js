const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { post, get } = require('../../shared/graph-api');

const createCalendarEventBody = (eventType, speakers, controller, start) => {
  const startDate = new Date(start);
  const endDate = new Date(start);
  endDate.setMinutes(endDate.getMinutes() + eventType.duration);
  const reminderTime = 1 * 24 * 60; // days

  const subject = speakers.map((speaker) => speaker.speakerName).join(', ');
  const speakerAttendees = speakers.map((speaker) => ({
    type: 'required',
    emailAddress: {
      address: `${speaker.speakerEmail}`,
    },
  }));

  const optionalAttendees = eventType.optionalEmails.map((email) => ({
    type: 'optional',
    emailAddress: {
      address: `${email}`,
    },
  }));

  const body = {
    subject: `${eventType.prefix} - ${subject}`,
    body: {
      contentType: 'HTML',
      content: ``,
    },
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'UTC',
    },
    isReminderOn: true,
    reminderMinutesBeforeStart: reminderTime,
    allowNewTimeProposals: false,
    isOnlineMeeting: eventType.online,
  };

  if (eventType.location) {
    body.location = {
      displayName: eventType.location,
    };
  }

  body.attendees = [
    ...speakerAttendees,
    {
      type: 'required',
      emailAddress: {
        address: `${controller}`,
      },
    },
    ...optionalAttendees,
  ];

  return body;
};

const EVENT_TYPES = {
  escapeRehearsal: {
    prefix: 'esc@pe rehearsal',
    duration: 60,
    online: true,
    optionalEmails: ['atcteam@bbd.co.za'],
  },
  escapeRecording: {
    prefix: 'esc@pe recording',
    duration: 120,
    online: false,
    location: 'BBD Johannesburg Office',
    optionalEmails: ['atcteam@bbd.co.za', 'marketing@bbdsoftware.com'],
  },
};

const sendEvent = async (inviteBody) => {
  try {
    const response = await post('/users/the-hive@bbd.co.za/events', inviteBody);
    return { inviteBody, status: 'success', response };
  } catch (error) {
    return { inviteBody, status: 'failure', error: error.message };
  }
};

const retrieveCalendarEventBySubjectPrefix = async (subjectPrefix) => {
  const response = await get(
    `/users/the-hive@bbd.co.za/events?$count=true&$top=250&$filter=startswith(subject,'${subjectPrefix}')`
  );
  return { totalEvents: response['@odata.count'], events: response.value };
};

const getCalendarEventsBySubjectPrefix = (subjectPrefix) => {
  return async (_req, res) => {
    try {
      const eventResponse = await retrieveCalendarEventBySubjectPrefix(
        subjectPrefix
      );
      res.status(200).json(eventResponse);
    } catch (error) {
      res.status(400).json({ message: 'could not retrieve events', error });
    }
  };
};

router.get(
  '/escape-recordings',
  handle_errors(
    getCalendarEventsBySubjectPrefix(EVENT_TYPES.escapeRecording.prefix)
  )
);

router.get(
  '/escape-rehearsals',
  handle_errors(
    getCalendarEventsBySubjectPrefix(EVENT_TYPES.escapeRehearsal.prefix)
  )
);

const postCalendarEvent = (eventType) => {
  return async (req, res) => {
    const eventRequests = req.body;
    const responses = { success: [], failed: [] };
    for (const eventRequest of eventRequests) {
      const { speakers, controller, start } = eventRequest;
      const inviteBody = createCalendarEventBody(
        eventType,
        speakers,
        controller,
        start
      );
      const result = await sendEvent(inviteBody);
      if (result.status === 'success') {
        responses.success.push(result);
      } else {
        responses.failed.push(result);
      }
    }
    if (responses.failed.length === 0) {
      res.status(200).json({ message: 'created invite', responses });
    } else {
      res
        .status(400)
        .json({ message: 'some recording event creations failed', responses });
    }
  };
};

router.post(
  '/escape-rehearsals',
  handle_errors(postCalendarEvent(EVENT_TYPES.escapeRehearsal))
);

router.post(
  '/escape-recordings',
  handle_errors(postCalendarEvent(EVENT_TYPES.escapeRecording))
);

module.exports = router;
