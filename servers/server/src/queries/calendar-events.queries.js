const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const updateEventStatus = async (tx, calendarEventId, upn, accepted) => {
  const q = `
    UPDATE CalendarEventAttendees
    SET
        Accepted = @Accepted
    WHERE
        CalendarEventId = @CalendarEventId
        AND UPN = @UPN
  `;

  const request = await tx.timed_request();
  await request
    .input('UPN', upn)
    .input('CalendarEventId', calendarEventId)
    .input('Accepted', accepted)
    .timed_query(q, 'updateEventStatus');
};

const getEventTemplateDetail = async (calendarEventTemplateId) => {
  const q = `
    SELECT
        CT.Subject,
        CT.Body,
        CT.CallToAction,
        CEC.Mandatory,
        CT.SurveyId,
        CET.Online
    FROM
        CalendarEventTemplate CT
        INNER JOIN CalendarEventType CET ON CT.CalendarEventTypeId = CET.CalendarEventTypeId
        INNER JOIN CalendarEventCategory CEC ON CET.CalendarEventCategoryId = CEC.CalendarEventCategoryId
    WHERE
        CalendarEventTemplateId = @CalendarEventTemplateId
  `;

  const request = await db();
  const result = await request
    .input('CalendarEventTemplateId', calendarEventTemplateId)
    .timed_query(q, 'getEventTemplateDetail');

  if (result.recordset.length === 1) {
    return fixCase(result.recordset)[0];
  } else {
    throw new Error(
      `Could not retrieve template for template ID ${calendarEventTemplateId}`
    );
  }
};

const getEvents = async (page, size, upn, filters) => {
  const request = await db();

  const { accepted, office, type, template, category } = filters;
  let { startDate, endDate } = filters;

  startDate = startDate ?? new Date();
  endDate =
    endDate ??
    addDaysToDate(
      startDate,
      parseInt(process.env.CALENDAR_EVENTS_DEFAULT_SEARCH_DAYS)
    );

  const q = `
        SELECT
            overallCount = COUNT(*) OVER(),
            CE.CalendarEventId,
            CT.Subject as Template,
            CET.EventType,
            CEC.EventCategory,
            CET.Online,
            O.OfficeName,
            CE.StartDateTime,
            CE.DurationInMinutes
        FROM CalendarEvents AS CE
            INNER JOIN CalendarEventTemplate CT ON (@EventTemplateId IS NULL OR CT.CalendarEventTemplateId = @EventTemplateId) AND CE.CalendarEventTemplateId = CT.CalendarEventTemplateId
            INNER JOIN CalendarEventType CET ON (@EventTypeId IS NULL OR CET.CalendarEventTypeId=@EventTypeId) AND CT.CalendarEventTypeId = CET.CalendarEventTypeId
            INNER JOIN Offices O ON (@OfficeId IS NULL OR O.OfficeId=@OfficeId) AND CET.OfficeId = O.OfficeId
            INNER JOIN CalendarEventCategory CEC ON (@EventCategoryId IS NULL OR CEC.CalendarEventCategoryId=@EventCategoryId) AND CET.CalendarEventCategoryId = CEC.CalendarEventCategoryId
            Inner JOIN CalendarEventAttendees CEA ON CE.CalendarEventId = CEA.CalendarEventId
        WHERE
            @EndDate >= CE.StartDateTime
            AND @StartDate <= DATEADD(minute, CE.DurationInMinutes, CE.StartDateTime)
            AND (@OfficeId IS NULL OR CET.OfficeId = @OfficeId)
            AND (@EventTemplateId IS NULL OR CT.CalendarEventTemplateId = @EventTemplateId)
            AND (@EventTypeId IS NULL OR CT.CalendarEventTypeId = @EventTypeId)
            AND (@EventCategoryId IS NULL OR CET.CalendarEventCategoryId = @EventCategoryId)
            AND (@Accepted is null OR CEA.Accepted=@Accepted)
            AND (@Accepted is null OR CEA.UPN=@UPN)
        GROUP BY
            CE.CalendarEventId,
            CT.Subject,
            CET.EventType,
            CEC.EventCategory,
            CET.Online,
            O.OfficeName,
            CE.StartDateTime,
            CE.DurationInMinutes
        ORDER BY
            CE.CalendarEventId
        OFFSET
            (( (cast(@Page as int)) - 1) * (cast(@Size as int))) ROWS
        FETCH NEXT
            (cast(@Size as int)) ROWS ONLY
  `;

  const results = await request
    .input('StartDate', startDate)
    .input('EndDate', endDate)
    .input('UPN', upn)
    .input('Accepted', accepted)
    .input('OfficeId', office)
    .input('EventTemplateId', template)
    .input('EventTypeId', type)
    .input('EventCategoryId', category)
    .input('Page', page)
    .input('Size', size)
    .timed_query(q, 'getEvents');

  return fixCase(results.recordset);
};

const getEventById = async (eventId) => {
  const q = `
    SELECT
        CE.CalendarEventId,
        CT.Subject as Template,
        CET.EventType,
        CEC.EventCategory,
        CET.Online,
        O.OfficeName,
        CE.StartDateTime,
        CE.DurationInMinutes
    FROM CalendarEvents AS CE
        INNER JOIN CalendarEventTemplate CT ON CE.CalendarEventTemplateId = CT.CalendarEventTemplateId
        INNER JOIN CalendarEventType CET ON CT.CalendarEventTypeId = CET.CalendarEventTypeId
        INNER JOIN Offices O ON CET.OfficeId = O.OfficeId
        INNER JOIN CalendarEventCategory CEC ON CET.CalendarEventCategoryId = CEC.CalendarEventCategoryId
    WHERE
        CE.CalendarEventId = @EventId
  `;

  const request = await db();
  const results = await request
    .input('EventId', eventId)
    .timed_query(q, 'getEventById');

  return fixCase(results.recordset);
};

const getEventAttendees = async (eventId) => {
  const q = `
    SELECT
		    CalendarEventAttendeeId,
        CalendarEventId,
        UPN,
        Accepted
    FROM
        CalendarEventAttendees
    WHERE
        CalendarEventId = @EventId
  `;

  const request = await db();
  const results = await request
    .input('EventId', eventId)
    .timed_query(q, 'getEventAttendees');

  return fixCase(results.recordset);
};

const addDaysToDate = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

module.exports = {
  updateEventStatus,
  getEventTemplateDetail,
  getEvents,
  getEventById,
  getEventAttendees,
};
