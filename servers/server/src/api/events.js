const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  updateEventStatus,
  getEvents,
  getEventById,
  getEventAttendees,
} = require('../queries/calendar-events.queries');
const { withTransaction } = require('../shared/db');

router.patch(
  '/event/:calendarEventId',
  handle_errors(async (req, res) => {
    try {
      await withTransaction(async (tx) => {
        const { accepted } = req.body;
        const { calendarEventId } = req.params;
        const upn = res.locals.upn;
        await updateEventStatus(tx, calendarEventId, upn, accepted);
      });
      res.status(200).send();
    } catch (error) {
      res
        .status(400)
        .json({ message: 'Failed to Update Calendar Event', error });
    }
  })
);

router.get(
  '/events',
  handle_errors(async (req, res) => {
    try {
      const allowedProperties = new Set([
        'template',
        'office',
        'startDate',
        'endDate',
        'accepted',
        'type',
        'category',
        'page',
        'size',
      ]);
      const requestedProperties = new Set(Object.getOwnPropertyNames(req.query));

      const invalidProperties = Array.from(requestedProperties).filter(
        (property) => !allowedProperties.has(property)
      );

      if (invalidProperties.length > 0) {
        res
          .status(400)
          .json({
            message: `Request has invalid Property: ${invalidProperties}`,
          });
      } else {
        if (!req.query.page) {
          req.query.page = 1;
        }
        if (!req.query.size) {
          req.query.size = 10;
        }

        const result = await getEvents(
          req.query.page,
          req.query.size,
          res.locals.upn,
          { ...req.query }
        );

        const overallEventCount = result[0] ? result[0].overallCount : 0;
        const response = {
          pageInfo: {
            pageNumber: req.query.page,
            pageSize: req.query.size,
            resultSetSize: overallEventCount,
            totalPages: Math.ceil(overallEventCount / req.query.size),
          },
          data: result,
        };

        res.status(200).json(response);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve Events', error });
    }
  })
);

router.get(
  '/event/:eventId',
  handle_errors(async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const result = await getEventById(eventId);
      res.status(200).send(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: `Failed to retrieve Event of ${eventId}`, error });
    }
  })
);

router.get(
  '/event/:eventId/attendees',
  handle_errors(async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const result = await getEventAttendees(eventId);
      res.status(200).send(result);
    } catch (error) {
      res
        .status(500)
        .json({
          message: `Failed to retrieve Event Attendees of ${eventId}`,
          error,
        });
    }
  })
);

module.exports = router;
