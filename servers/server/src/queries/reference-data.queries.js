const { db } = require('../shared/db');
const { logger } = require('@the-hive/lib-core');

const fixCase = require('../shared/fix-case');

const { all_logins_for_today } = require('./login.queries');

const cache = {};

const snakeify = (s) => s.replace(/([a-zA-Z])(?=[A-Z])/g, '$1_').toLowerCase();

const query = async (name) => {
  if (!cache[name]) {
    const connection = await db();

    const result = await connection.timed_query(
      `select * from ${name}`,
      `all_${snakeify(name)}`
    );
    cache[name] = fixCase(result.recordset);

    setTimeout(() => {
      logger.info(`Timing out the reference data cache for ${name}.`);
      cache[name] = null;
    }, 1 * 5 /*m*/ * 60 /*s*/ * 1000 /*ms*/);
  }
  return cache[name];
};

const all_guide_details = async (status) => {
  const name = 'GuideDetails';
  if (!cache[name]) {
    const connection = await db();
    const q = `
      SELECT
      t.UserPrincipleName,
      t.Specialisations,
      p.LastGuideActivityDate
      FROM
      (
        SELECT 
          UserPrincipleName,
          string_agg(name, ', ') AS Specialisations
        FROM GuideSpecialisations AS gs
        INNER JOIN Specialisations s on gs.SpecialisationId = s.SpecialisationId
        INNER JOIN GuideSpecialisationStatus gss ON gss.GuideSpecialisationStatusId = gs.GuideSpecialisationStatusId
        WHERE gss.StatusDescription = @status
        GROUP BY UserPrincipleName
      ) AS t
      LEFT OUTER JOIN Profiles AS p on t.UserPrincipleName = p.UserPrincipleName
    `;

    const result = await connection
      .input('status', status)
      .timed_query(q, 'all-guide-details');
    cache[name] = fixCase(result.recordset);

    setTimeout(() => {
      logger.info(`Timing out the reference data cache for ${name}.`);
      cache[name] = null;
    }, 1 * 5 /*m*/ * 60 /*s*/ * 1000 /*ms*/);
  }

  return cache[name];
};

let cachePromise;
const cacheLogins = async () => {
  const name = 'Logins';
  if (!cachePromise) {
    cachePromise = all_logins_for_today();
    cachePromise.then((loginsArray) => {
      cache[name] = loginsArray;
    });
  }
  return cachePromise;
};

const check_login = async (upn) => {
  const name = 'Logins';
  const logins = await cacheLogins();

  if (logins.some((login) => login.heroUserPrincipleName === upn)) {
    return true;
  }

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  cache[name].push({ heroUserPrincipleName: upn, loginDate: date });
  return false;
};

const clearLoginCache = () => {
  const name = 'Logins';
  logger.info(`Timing out the reference data cache for ${name}.`);
  cachePromise = undefined;
  cache[name] = null;
};

const all_message_types = async () => {
  const name = 'MessageTypes';
  if (!cache[name]) {
    const connection = await db();
    const q = `
      SELECT
        mt.MessageTypeId,
        mt.Description,
        mt.SelfDirected,
        mt.Icon,
        mt.Code,
        cmt.ContentMediaTypeId
      FROM MessageTypes AS mt
      LEFT JOIN MessageTypeContentMediaTypes AS mtcmt
      ON mtcmt.MessageTypeId = mt.MessageTypeId
      LEFT JOIN ContentMediaType AS cmt
      ON cmt.ContentMediaTypeId = mtcmt.ContentMediaTypeId
    `;

    const result = await connection.timed_query(q, 'all-message-types');
    cache[name] = fixCase(result.recordset);

    setTimeout(() => {
      logger.info(`Timing out the reference data cache for ${name}.`);
      cache[name] = null;
    }, 1 * 5 /*m*/ * 60 /*s*/ * 1000 /*ms*/);
  }

  return cache[name];
};

const all_mission_types = async () => query(`MissionTypes`);
const all_quest_types = async () => query(`QuestTypes`);
const all_specialisations = async () => query(`Specialisations`);
const all_levels = async () => query(`Levels`);
const all_point_types = async () => query(`PointTypes`);
const all_side_quest_types = async () => query(`SideQuestTypes`);
const all_level_up_activity_types = async () => query(`LevelUpActivityTypes`);

const point_type = async (code) => {
  const point_type = (await all_point_types()).find((type) => type.code === code);

  return {
    ...point_type,
    points: Number(point_type.points),
  };
};

module.exports = {
  all_mission_types,
  all_quest_types,
  all_specialisations,
  all_levels,
  all_point_types,
  all_message_types,
  all_side_quest_types,
  all_level_up_activity_types,
  point_type,
  all_guide_details,
  check_login,
  clearLoginCache,
};
