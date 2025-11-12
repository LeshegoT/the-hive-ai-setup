const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const level_up_activity_by_id = async (id) => {
  const q = `
        select TOP 1
            lua.LevelUpActivityId as id,
            lu.Name,
            lu.Description,
            lua.EventId,
            lua.ActivityDate as date,
            luat.Name as typeName,
            luat.Description as typeDescription,
            lua.DurationInMinutes
        from LevelUpActivities lua
            inner join LevelUps lu ON lua.LevelUpId = lu.LevelUpId
            inner join LevelUpActivityTypes luat ON lua.LevelUpActivityTypeId = luat.LevelUpActivityTypeId
        where lua.LevelUpActivityId = @Id
    `;

  const request = await db();
  let results = await request
    .input('Id', id)
    .timed_query(q, 'level_up_activity_by_id');

  results = await attach_links_to_activity(results);

  return fixCase(results);
};

const level_ups_without_event_id = async () => {
  const q = `
        select top 10
            lua.LevelUpActivityId as id,
            lu.Name,
            lu.Description,
            lua.EventId,
            lua.ActivityDate as date,
            luat.Name as typeName,
            luat.Description as typeDescription,
            lua.DurationInMinutes
        from LevelUpActivities lua
            inner join LevelUps lu ON lua.LevelUpId = lu.LevelUpId
            inner join LevelUpActivityTypes luat ON lua.LevelUpActivityTypeId = luat.LevelUpActivityTypeId
        where EventId IS NULL
        and lua.ActivityDate > getDate()
        order by lua.ActivityDate asc
    `;

  const request = await db();
  let results = await request.timed_query(q, 'level_ups_without_event_id');

  results = await attach_links_to_activity(results);

  return fixCase(results);
};

const level_ups_that_have_event_id = async () => {
  const q = `
        select
            lua.LevelUpActivityId as id,
            lu.Name,
            lu.Description,
            lua.EventId,
            lua.ActivityDate as date,
            luat.Name as typeName,
            luat.Description as typeDescription,
            lua.DurationInMinutes
        from LevelUpActivities lua
            inner join LevelUps lu ON lua.LevelUpId = lu.LevelUpId
            inner join LevelUpActivityTypes luat ON lua.LevelUpActivityTypeId = luat.LevelUpActivityTypeId
        where EventId IS NOT NULL
        and lua.ActivityDate > getDate()
    `;

  const request = await db();
  let results = await request.timed_query(q, 'level_ups_that_have_event_id');

  results = await attach_links_to_activity(results);

  return fixCase(results);
};

const attach_links_to_activity = async (results) => {
  const resultsWithLink = await Promise.all(
    results.recordset.map(async (result) => {
      const links = await get_level_up_activity_links(result.id);
      return { ...result, links: links };
    })
  );
  return resultsWithLink;
};

const get_level_up_activity_links = async (id) => {
  const q = `
        select
            Name,
            Link
        from LevelUpActivityLinks lual
            left outer join LevelUpActivityLinkTypes lualt On lual.LevelUpActivityLinkTypeId = lualt.LevelUpActivityLinkTypeId
        where lual.LevelUpActivityId = @Id
    `;

  const request = await db();
  const results = await request
    .input('Id', id)
    .timed_query(q, 'get_level_up_activity_links');

  return fixCase(results.recordset);
};

const set_event_id_for_level_up = async (id, eventId) => {
  const q = `
        UPDATE LevelUpActivities
        SET EventId = @eventID
        where LevelUpActivityId = @Id
    `;

  const request = await db();
  await request
    .input('Id', id)
    .input('eventId', eventId)
    .timed_query(q, 'set_event_id_for_level_up');
};

module.exports = {
  level_up_activity_by_id,
  level_ups_without_event_id,
  level_ups_that_have_event_id,
  set_event_id_for_level_up,
};
