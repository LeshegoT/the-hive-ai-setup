const router = require('express').Router();

const { handle_errors } = require('@the-hive/lib-core');
const {
  createCalendarEvent,
  updateCalendarEvent,
  inviteUserToEvent,
} = require('../../shared/event');
const queue = require('../../shared/queue');
const {
  level_ups_without_event_id,
  level_ups_that_have_event_id,
} = require('../../queries/event.queries');
const {
  all_upcomming_level_up_activities,
} = require('../../queries/user.queries');

router.post(
  '/create-events',
  handle_errors(async (req, res) => {
    const events = await level_ups_without_event_id();

    for (const event of events) {
      queue.enqueue('create-events', event);
    }

    res.send('Successful');
  })
);

router.post(
  '/create-events/:eventId',
  handle_errors(async (req, res) => {
    const response = await createCalendarEvent(req.params.eventId);

    res.send(response);
  })
);

router.post(
  '/schedule-event-updates',
  handle_errors(async (req, res) => {
    const events = await level_ups_that_have_event_id();

    for (const event of events) {
      queue.enqueue('update-events', event);
    }

    res.send('Successful');
  })
);

router.post(
  '/update-event',
  handle_errors(async (req, res) => {
    const event = req.body;

    await updateCalendarEvent(event);

    res.send('Successful');
  })
);

router.post(
  '/event-invite',
  handle_errors(async (req, res) => {
    const activityUsers = await all_upcomming_level_up_activities();

    for (const user of activityUsers) {
      queue.enqueue('event-invite', user);
    }

    res.send('Successful');
  })
);

router.post(
  '/event-invite/:eventId/:userPrincipleName',
  handle_errors(async (req, res) => {
    await inviteUserToEvent(req.params.eventId, req.params.userPrincipleName);

    res.send('Successful');
  })
);

module.exports = router;
