const { logger } = require('@the-hive/lib-core');
const { post, get, patch } = require('./graph-api');
const {
  level_up_activity_by_id,
  set_event_id_for_level_up,
} = require('../queries/event.queries');
const { getActiveDirectoryProfile } = require('./active-directory-profile');
const showdown = require('showdown');
const converter = new showdown.Converter({ tables: true });
const { prependEnvironment } = require('@the-hive/lib-core');

const createBodyFromEvent = async (event, isUpdate = false) => {
  const startDate = new Date(event.date);
  const endDate = new Date(event.date);
  if (event.durationInMinutes) {
    endDate.setMinutes(endDate.getMinutes() + event.durationInMinutes);
  }
  const reminderTime = 2 * 1440; //2 days

  let links = ``;
  event.links.forEach((link) => {
    links += `<a href="${link.link}">    ${link.name}   </a>`;
  });

  const subject = prependEnvironment(`${event.name} // ${event.typeName}`);
  const body = {
    subject: subject,
    body: {
      contentType: 'HTML',
      content: `
            <h1>${event.name} // ${event.typeName}</h1>
            <p>${event.description}</p>
            <h3>
                ${links}
            </h3>
            <h4>About this course:</h4>
            <p>${converter.makeHtml(event.typeDescription)}</p>`,
    },
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'UTC',
    },
    location: {
      displayName: 'BBD',
    },
    isReminderOn: true,
    reminderMinutesBeforeStart: reminderTime,
  };

  if (!isUpdate)
    body.attendees = [
      {
        type: 'optional',
        emailAddress: {
          address: 'atcteam@bbd.co.za',
          name: 'ATC',
        },
      },
    ];

  return body;
};

const createCalendarEvent = async (id) => {
  const events = await level_up_activity_by_id(id);

  await Promise.all(events.map(async (event) => {
    try {
      const body = await createBodyFromEvent(event);
      logger.info('Creating event.');

      const response = await post('/users/the-hive@bbd.co.za/events', body);
      await set_event_id_for_level_up(event.id, response.id);

      logger.info(`Event successfully created.`);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }));
};

const updateCalendarEvent = async (event) => {
  try {
    const body = await createBodyFromEvent(event, true);

    await patch('/users/the-hive@bbd.co.za/events/' + event.eventId, body);
  } catch (error) {
    logger.error(error);

    throw error;
  }
};

const inviteUserToEvent = async (eventId, userPrincipleName) => {
  const response = await get('/users/the-hive@bbd.co.za/events/' + eventId);

  const { profile } = await getActiveDirectoryProfile(userPrincipleName);

  if(!(profile?.error) ){
  try {
    const body = {
      attendees: [
        ...response.attendees,
        {
          type: 'required',
          emailAddress: {
            address: userPrincipleName,
            name: profile.givenName,
          },
        },
      ],
    };

    await patch('/users/the-hive@bbd.co.za/events/' + eventId, body);
  } catch (error) {
    logger.error(error);

    throw error;
  }
  }else{
    logger.error(`Failed to get user profile for ${userPrincipleName}`);
  }
};

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
  inviteUserToEvent,
};
