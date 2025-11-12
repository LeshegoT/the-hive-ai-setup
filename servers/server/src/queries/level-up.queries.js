const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const { groupItems } = require('../shared/group-items');
const { restrict_content } = require('./groups.queries');
const {
  DeleteExistingRestrictions,
  InsertRestrictions,
} = require('./restrictions.queries');

const RESTRICTION_TYPE_ID = 3;

const all_permitted_levelups = async (upn) => {
  const q = `
    with LevelUpDates (LevelUpId, StartDate, EndDate)
    as
    (
      select
        LevelUpId,
        MIN(ActivityDate) as StartDate,
        MAX(ActivityDate) as EndDate
      from LevelUpActivities
      group by LevelUpId
    ),
    PermittedLevelUpIds
    as
    (
          -- Uninion restricted LevelUps that a user has directly and those that they have as part of a group
          SELECT TypeKeyId as LevelUpId, permission = 'permitted' FROM ContentRestrictions
          WHERE RestrictionTypeId = 3 AND UPN = @UPN
          UNION
          SELECT TypeKeyId as SideQuestId, permission = 'permitted' FROM
          (
            (SELECT * FROM ContentRestrictions WHERE RestrictionTypeId = 3 AND GroupName IS NOT NULL) gr --group restrictions
            INNER JOIN
            (SELECT GroupName FROM Groups where MemberUserPrincipleName = @UPN) ug --user groups
            ON gr.GroupName = ug.GroupName
          )
    )

    select
      l.LevelUpId,
      l.Name,
      l.Description,
      l.Icon,
      d.StartDate,
      d.EndDate,
      lc.CourseId
    from LevelUps l
      inner join LevelUpDates d on l.LevelUpId = d.LevelUpId
      left outer join LevelUpCourses lc on l.LevelUpId = lc.LevelUpId
      left outer join PermittedLevelUpIds pl on l.LevelUpId = pl.LevelUpId
    WHERE Restricted = 0 OR permission = 'permitted'
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'all_permitted_levelups');
  const levelUps = groupItems(
    fixCase(results.recordset),
    'levelUpId',
    'courseId'
  );

  return levelUps;
};

const all_levelups = async () => {
  const q = `
    with LevelUpDates (LevelUpId, StartDate, EndDate)
    as
    (
      select
        LevelUpId,
        MIN(ActivityDate) as StartDate,
        MAX(DATEADD (MINUTE, DurationInMinutes, ActivityDate)) as EndDate
      from LevelUpActivities
      group by LevelUpId
    )
    select
      l.LevelUpId,
      l.Name,
      l.Description,
      l.Icon,
      d.StartDate,
      d.EndDate,
      lc.CourseId,
      count(laa.LevelUpActivityAttendeeId) as TotalAttendees
    from LevelUps l
      inner join LevelUpActivities la on la.LevelUpId = l.LevelUpId
      left join LevelUpActivityAttendees laa on laa.LevelUpActivityId = la.LevelUpActivityId
      inner join LevelUpDates d on l.LevelUpId = d.LevelUpId
      left outer join LevelUpCourses lc on l.LevelUpId = lc.LevelUpId
    group by
      l.LevelUpId,
      l.Name,
      l.Description,
      l.Icon,
      d.StartDate,
      d.EndDate,
      lc.CourseId
  `;

  const request = await db();
  const results = await request.timed_query(q, 'all_levelups');
  const levelUps = groupItems(
    fixCase(results.recordset),
    'levelUpId',
    'courseId'
  );

  return levelUps;
};

const single_levelup = async (levelUpId) => {
  const q = `
    with LevelUpDates (LevelUpId, StartDate, EndDate)
    as
    (
      select
        LevelUpId,
        MIN(ActivityDate) as StartDate,
        MAX(DATEADD (MINUTE, DurationInMinutes, ActivityDate)) as EndDate
      from LevelUpActivities
      group by LevelUpId
    )

    select
      l.LevelUpId,
      l.Name,
      l.Description,
      l.Icon,
      d.StartDate,
      d.EndDate
    from LevelUps l
      inner join LevelUpDates d on l.LevelUpId = d.LevelUpId
    where l.LevelUpId = @LevelUpId
  `;

  const request = await db();
  const results = await request
    .input('LevelUpId', levelUpId)
    .timed_query(q, 'single_levelup');
  const levelUps = fixCase(results.recordset);

  return levelUps[0];
};

const level_up_activities = async () => {
  const q = `
    select
      a.LevelUpId,
      a.LevelUpActivityTypeId,
      a.ActivityDate,
      a.DurationInMinutes,
      a.LevelUpActivityId,
      al.LevelUpActivityLinkId,
      alt.Name,
      al.Link
    from LevelUpActivities a
    left outer join LevelUpActivityLinks al on a.LevelUpActivityId = al.LevelUpActivityId
    left outer join LevelUpActivityLinkTypes alt on al.LevelUpActivityLinkTypeId = alt.LevelUpActivityLinkTypeId
    order by LevelUpId, ActivityDate
  `;

  const request = await db();
  let results = await request.timed_query(q, 'level_up_activities');

  results = activities_with_link_and_time(fixCase(results.recordset));

  return results;
};

const activities_with_link_and_time = (activities) => {
  const working = activities.reduce((group, current) => {
    const isNow = is_now(current.activityDate, current.durationInMinutes);

    const activity = group[current.levelUpActivityId] || {
      levelUpId: current.levelUpId,
      levelUpActivityTypeId: current.levelUpActivityTypeId,
      activityDate: current.activityDate,
      durationInMinutes: current.durationInMinutes,
      levelUpActivityId: current.levelUpActivityId,
      links: [],
      isNow,
    };

    if (current.levelUpActivityLinkId) {
      activity.links = [
        ...activity.links,
        { name: current.name, link: current.link },
      ];
    }

    group[current.levelUpActivityId] = activity;

    return group;
  }, {});

  return Object.values(working);
};

const activities_for_level_up = async (levelUpId) => {
  const q = `
    select
      LevelUpActivityId,
      t.Name as LevelUpActivityType,
      t.LevelUpActivityTypeId,
      ActivityDate,
      DurationInMinutes
    from LevelUpActivities a
    inner join LevelUpActivityTypes t on a.LevelUpActivityTypeId = t.LevelUpActivityTypeId
    where LevelUpId = @LevelUpId
    order by ActivityDate
  `;

  const request = await db();
  const results = await request
    .input('LevelUpId', levelUpId)
    .timed_query(q, 'level_up_activities');

  return fixCase(results.recordset);
};

const level_up_users = async (id) => {
  const q = `
    SELECT u.LevelUpId, lower(u.UPN) AS upn, s.BBDUserName, s.DisplayName, s.JobTitle, s.Office
    FROM UserLevelUps u
    LEFT JOIN DecoratedStaff s ON lower(u.UPN) = lower(s.UserPrincipleName)
    WHERE u.LevelUpId = @Id
    ORDER BY u.UPN ASC
  `;

  const request = await db();
  const results = await request.input('Id', id).timed_query(q, 'level_up_users');

  return fixCase(results.recordset);
};

const level_up_courses = async (id) => {
  const q = `
    select c.CourseId, Name
    from LevelUpCourses luc
    inner join Courses c on luc.CourseId = c.CourseId
    where LevelUpId = @Id
  `;

  const request = await db();
  const results = await request
    .input('Id', id)
    .timed_query(q, 'level_up_courses');

  return fixCase(results.recordset);
};

const level_up_users_count = async () => {
  const q = `
    select
      LevelUpId,
      Count(1) AS UserCount
    from UserLevelUps
    group by LevelUpId
  `;

  const request = await db();
  const results = await request.timed_query(q, 'level_up_users');

  return fixCase(results.recordset);
};

const user_level_ups = async (upn) => {
  const q = `
  select LevelUpId
  from UserLevelUps
  where UPN = @UPN
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'user_level_ups');

  return fixCase(results.recordset);
};

const user_level_up_activities = async (upn) => {
  const q = `
  select LevelUpActivityId
  from LevelUpActivityAttendees
  where UserPrincipleName = @UPN
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'user_level_up_activies');

  return fixCase(results.recordset);
};

const level_up_register = async (upn, levelUpId) => {
  const q = `
    insert into UserLevelUps
      (UPN, LevelUpId, DateRegistered)
    values
      (LOWER(@UPN), @LevelUpId, getDate())
  `;

  const request = await db();
  await request
    .input('UPN', upn)
    .input('LevelUpId', levelUpId)
    .timed_query(q, 'level_up_register');
};

const level_up_activities_to_allocate_points = async (upn, activityCode) => {
  const query = `
    WITH
      LevelUpActivityPoints(UserPrincipleName, LevelUpActivityAttendeeId) AS
      (
        SELECT UserPrincipleName, LinkId
        FROM Points AS p
        WHERE PointTypeId =
          (
            SELECT PointTypeId
            FROM PointTypes
            WHERE Code = @ACTIVITY_CODE
          )
          AND p.DeletedBy IS NULL
      )

      SELECT l.UserPrincipleName, pt.PointTypeId, l.DateCompleted, pt.Points, l.LevelUpActivityAttendeeId
      FROM LevelUpActivityAttendees l
      LEFT JOIN LevelUpActivityPoints p
      ON l.LevelUpActivityAttendeeId = p.LevelUpActivityAttendeeId
      INNER JOIN PointTypes AS pt
      ON pt.PointTypeId =
        (
          SELECT PointTypeId
          FROM PointTypes
          WHERE Code = @ACTIVITY_CODE
        )
      WHERE p.LevelUpActivityAttendeeId IS NULL AND l.UserPrincipleName = @UPN
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .input('ACTIVITY_CODE', activityCode)
    .timed_query(query, 'level_up_activities_to_allocate_points');

  return fixCase(results.recordset);
};

const get_activity = async (tx, levelUpActivityId) => {
  const q = `
      select *
      from LevelUpActivities
      where LevelUpActivityId = @LevelUpActivityId
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('LevelUpActivityId', levelUpActivityId)
    .timed_query(q, 'get_activity');

  return fixCase(results.recordset)[0];
};

const get_activity_attendee = async (tx, upn, levelUpActivityId) => {
  const q = `
      select *
      from LevelUpActivityAttendees
      where LevelUpActivityId = @LevelUpActivityId
      and UserPrincipleName = @UPN
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('LevelUpActivityId', levelUpActivityId)
    .input('UPN', upn)
    .timed_query(q, 'get_activity_attendee');

  return fixCase(results.recordset);
};

const insert_activity_attendee = async (tx, upn, levelUpActivityId) => {
  const q = `
      insert into LevelUpActivityAttendees
        (UserPrincipleName, LevelUpActivityId, DateCompleted)
      values
        (LOWER(@UPN), @LevelUpActivityId, getDate())
    `;

  const connection = await tx.timed_request();
  await connection
    .input('UPN', upn)
    .input('LevelUpActivityId', levelUpActivityId)
    .timed_query(q, 'insert_activity_attendee');
};

const is_now = (activityDate, durationInMinutes) => {
  const startTime = activityDate.getTime();
  const duration = durationInMinutes * 60 * 1000;
  const endTime = startTime + duration;
  const now = new Date().getTime();

  return now > startTime && now < endTime;
};

const level_up_activity = async (activityId) => {
  const q = `
    select lu.Name as LevelUpName, luat.Name as ActivityName, lua.ActivityDate, lua.DurationInMinutes, lu.LevelUpId from LevelUpActivities as lua
    inner join LevelUps as lu
    on lua.LevelUpId = lu.LevelUpId
    inner join LevelUpActivityTypes as luat
    on lua.LevelUpActivityTypeId = luat.LevelUpActivityTypeId
    where LevelUpActivityId = @ActivityId
  `;

  const request = await db();
  const results = await request
    .input('ActivityId', activityId)
    .timed_query(q, 'level_up_activity');

  return fixCase(results.recordset)[0];
};

const level_up_activity_attendance = async (activityId) => {
  const q = `
    SELECT  a.DateCompleted, s.UserPrincipleName , s.BBDUserName AS bbdUserName, s.DisplayName, s.JobTitle, s.Office, sd.Department
    FROM LevelUpActivityAttendees a
        LEFT JOIN DecoratedStaff s ON s.UserPrincipleName = a.UserPrincipleName
        LEFT JOIN StaffDepartment sd ON s.StaffId = sd.StaffId AND
              sd.StaffDepartmentId IN (
                  SELECT TOP 1 StaffDepartmentId
                  FROM StaffDepartment
                  WHERE s.StaffId = StaffDepartment.StaffId
                  ORDER BY StartDate DESC
              )
    WHERE a.LevelUpActivityId = @ActivityId
  `;

  const request = await db();
  const results = await request
    .input('ActivityId', activityId)
    .timed_query(q, 'level_up_activity_attendance');

  return fixCase(results.recordset);
};

const consolidated_level_up_activity_attendance = async (levelUpId) => {
  const q = `
    WITH Activities AS(
        SELECT * FROM LevelUpActivities WHERE LevelUpId = @LEVELUPID
    ),
    Attendance AS (
        SELECT UserPrincipleName, ActivityDate, a.LevelUpActivityId, LevelUpId
        FROM Activities a
        LEFT JOIN LevelUpActivityAttendees att ON a.LevelUpActivityId = att.LevelUpActivityId
    )
    SELECT a.*, s.BBDUserName, s.DisplayName, s.JobTitle, s.Office, sd.Department
    FROM Attendance a
        LEFT JOIN DecoratedStaff s ON a.UserPrincipleName = s.UserPrincipleName
        LEFT JOIN StaffDepartment sd ON s.StaffId = sd.StaffId AND
            sd.StaffDepartmentId IN (
                SELECT TOP 1 StaffDepartmentId
                FROM StaffDepartment
                WHERE s.StaffId = StaffDepartment.StaffId
                ORDER BY StartDate DESC
            )
  `;

  const request = await db();
  const results = await request
    .input('LEVELUPID', levelUpId)
    .timed_query(q, 'consolidated_level_up_activity_attendance');

  return fixCase(results.recordset);
};

const level_up_activity_link_types = async () => {
  const q = `
    SELECT Code, Name
    FROM LevelUpActivityLinkTypes
  `;

  const request = await db();
  const results = await request.timed_query(q, 'level_up_activity_link_types');

  return fixCase(results.recordset);
};

const create_level_up_activity_link = async (activityLink) => {
  const q = `
    INSERT INTO LevelUpActivityLinks
    VALUES(@ActivityId, (SELECT LevelUpActivityLinkTypeId FROM LevelUpActivityLinkTypes WHERE Code=@LinkType), @Link)
  `;

  const request = await db();
  await request
    .input('ActivityId', activityLink.activityId)
    .input('LinkType', activityLink.type)
    .input('Link', activityLink.link)
    .timed_query(q, 'level_up_activity_link_types');
};

const add_attendees = async (upns, activityId) => {
  const tx = await transaction();

  try {
    await tx.begin();

    for (const upn of upns) {
      const request = await tx.timed_request();

      const exists_q = `
        select *
        from LevelUpActivityAttendees
        where UserPrincipleName = @UPN
        and LevelUpActivityId = @LevelUpActivityId
      `;

      const existing = await request
        .input('UPN', upn)
        .input('LevelUpActivityId', activityId)
        .timed_query(exists_q, 'get_attendee');

      if (existing.recordset.length) continue;

      const q = `
        insert into LevelUpActivityAttendees
          (UserPrincipleName, LevelUpActivityId, DateCompleted)
        values
          (LOWER(@UPN), @LevelUpActivityId, getDate())
      `;

      await request.timed_query(q, 'add_attendees');
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const get_level_up_icons = async () => {
  const q = `
    SELECT DISTINCT Icon
    FROM LevelUps
  `;

  const connection = await db();
  const results = await connection.timed_query(q, 'get-level-up-icons');

  return fixCase(results.recordset);
};

const create_level_up = async (levelUp) => {
  const tx = await transaction();

  try {
    await tx.begin();

    const q = `
      INSERT INTO LevelUps
      VALUES(@Name, @Icon, @Description, @Link, @Restricted)

      SELECT LevelUpId
      FROM LevelUps
      WHERE LevelUpId = @@IDENTITY
    `;

    const request = await tx.request();

    const results = await request
      .input('Name', levelUp.name)
      .input('Icon', levelUp.icon)
      .input('Description', levelUp.description)
      .input('Link', levelUp.link ? levelUp.link : null)
      .input(
        'Restricted',
        !!levelUp && !!levelUp.restrictGroup && !!levelUp.restrictGroup.length
      )
      .query(q, 'create-level-up');

    let levelUpId = fixCase(results.recordset)[0];
    levelUpId = levelUpId.levelUpId;

    if (!!levelUp.restrictGroup && !!levelUp.restrictGroup.length)
      for (const group of levelUp.restrictGroup) {
        await restrict_content(
          tx,
          group.groupName,
          levelUpId,
          RESTRICTION_TYPE_ID
        );
      }

    for (const course of levelUp.courses) {
      await add_level_up_course(tx, levelUpId, course.courseId);
    }

    for (const activity of levelUp.activities) {
      await add_level_up_activity(tx, levelUpId, activity);
    }

    for (const facilitator of levelUp.facilitators) {
      await add_level_up_facilitator(tx, levelUpId, facilitator);
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const delete_level_up = async (levelUpId) => {
  const tx = await transaction();

  try {
    await tx.begin();

    await remove_level_up_courses(tx, levelUpId);

    await remove_level_up_activities(tx, levelUpId);

    await remove_level_up_facilitators(tx, levelUpId);

    const restrictions = {
      levelupId: levelUpId,
    };

    await DeleteExistingRestrictions(restrictions, tx);

    const q = `
    DELETE FROM LevelUps
    WHERE LevelUpId = @LevelUpId
    `;

    const request = tx.request();

    await request.input('LevelUpId', levelUpId).query(q, 'delete-level-up');

    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};

const update_level_up = async (levelUp) => {
  //Update level up details
  //Remove previous courses
  //Add new courses
  //Update old activities
  //Added new activites

  const tx = await transaction();

  try {
    await tx.begin();

    const q = `
    UPDATE LevelUps
    SET Name = @Name,
        Icon = @Icon,
        Description = @Description,
        Link = @Link,
        Restricted = @Restricted
    WHERE LevelUpId = @LevelUpId
    `;

    const restrictions = {
      levelupId: levelUp.levelUpId,
      restrictions: levelUp.restrictions,
    };

    const request = tx.request();

    await request
      .input('LevelUpId', levelUp.levelUpId)
      .input('Name', levelUp.name)
      .input('Icon', levelUp.icon)
      .input('Description', levelUp.description)
      .input('Link', levelUp.link ? levelUp.link : null)
      .input('Restricted', levelUp.restricted)
      .query(q, 'update-level-up');

    await remove_level_up_courses(tx, levelUp.levelUpId);
    for (const course of levelUp.courses) {
      await add_level_up_course(tx, levelUp.levelUpId, course.courseId);
    }

    //redoing restrictions
    await DeleteExistingRestrictions(restrictions, tx);
    if (levelUp.restricted) {
      await InsertRestrictions(restrictions, tx);
    }

    for (const index in levelUp.activities) {
      if (levelUp.activities[index].levelUpActivityId != null) {
        //Update
        await update_level_up_activity(tx, levelUp.activities[index]);
      } else {
        //Insert
        await add_level_up_activity(
          tx,
          levelUp.levelUpId,
          levelUp.activities[index]
        );
      }
    }

    for (const index in levelUp.removedActivities) {
      await remove_level_up_activity(tx, levelUp.removedActivities[index]);
    }

    await remove_level_up_facilitators(tx, levelUp.levelUpId);
    for (const facilitator of levelUp.facilitators) {
      await add_level_up_facilitator(tx, levelUp.levelUpId, facilitator);
    }

    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};

const add_level_up_course = async (tx, levelUpId, courseId) => {
  const q = `
    INSERT INTO LevelUpCourses
    VALUES(@LevelUpId, @CourseId)
  `;

  const request = await tx.request();
  await request
    .input('LevelUpId', levelUpId)
    .input('CourseId', courseId)
    .query(q, 'add-level-up-course');
};

const remove_level_up_courses = async (tx, levelUpId) => {
  const q = `
    DELETE FROM LevelUpCourses
    WHERE LevelUpId = @LevelUpId
  `;

  const request = await tx.request();
  await request
    .input('LevelUpId', levelUpId)
    .query(q, 'remove-level-up-courses');
};

const add_level_up_facilitator = async (tx, levelUpId, upn) => {
  const exists_q = `
    SELECT *
    FROM LevelUpFacilitators
    WHERE UserPrincipleName = @UPN
    AND LevelUpId = @LevelUpId
  `;

  const request = await tx.request();
  const existing = await request
    .input('UPN', upn)
    .input('LevelUpId', levelUpId)
    .query(exists_q, 'get_facilitator');

  if (existing.recordset.length) return;

  const q = `
    INSERT INTO LevelUpFacilitators
      (UserPrincipleName, LevelUpId)
    VALUES
      (@UPN, @LevelUpId)
  `;

  await request.query(q, 'assign_facilitators');
};

const remove_level_up_facilitators = async (tx, levelUpId) => {
  const q = `
    DELETE FROM LevelUpFacilitators
    WHERE LevelUpId = @LevelUpId
  `;

  const request = await tx.request();
  await request
    .input('LevelUpId', levelUpId)
    .query(q, 'remove-level-up-facilitators');
};

const add_level_up_activity = async (tx, levelUpId, activity) => {
  const q = `
    INSERT INTO LevelUpActivities
    VALUES(@LevelUpId, @LevelUpActivityTypeId, @ActivityDate, @DurationInMinutes, NULL)

    SELECT LevelUpActivityId
      FROM LevelUpActivities
      WHERE LevelUpActivityId = @@IDENTITY
  `;

  const request = await tx.request();
  await request
    .input('LevelUpId', levelUpId)
    .input('LevelUpActivityTypeId', activity.levelUpActivityTypeId)
    .input('ActivityDate', activity.startDate)
    .input('DurationInMinutes', activity.durationInMinutes)
    .query(q, 'add-level-up-activity');
};

const remove_level_up_activity = async (tx, activity) => {
  const q = `
    DELETE FROM LevelUpActivities
    WHERE LevelUpActivityId = @LevelUpActivityId
  `;

  const request = await tx.request();
  await request
    .input('LevelUpActivityId', activity.levelUpActivityId)
    .query(q, 'remove-level-up-activity');
};

const remove_level_up_activities = async (tx, levelUpId) => {
  const d = `
    DELETE FROM LevelUpActivities
    WHERE LevelUpId = @LevelUpId
    `;

  const request = tx.request();
  await request
    .input('LevelUpId', levelUpId)
    .query(d, 'delete-level-up-activities');
};

const update_level_up_activity = async (tx, activity) => {
  const q = `
  UPDATE LevelUpActivities
  SET ActivityDate = @ActivityDate,
      DurationInMinutes = @DurationInMinutes
  WHERE LevelUpActivityId = @LevelUpActivityId
  `;

  const request = await tx.request();
  await request
    .input('LevelUpActivityId', activity.levelUpActivityId)
    .input('ActivityDate', activity.startDate)
    .input('DurationInMinutes', activity.durationInMinutes)
    .query(q, 'add-level-up-activity');
};

const all_level_up_activity_types = async () => {
  const q = `
    SELECT *
    FROM LevelUpActivityTypes
  `;

  const connection = await db();
  const results = await connection.timed_query(q, 'get-level-up-activity-types');

  return fixCase(results.recordset);
};

const create_level_up_activity_type = async (activityType) => {
  q = `
    INSERT INTO LevelUpActivityTypes
    VALUES(@Code, @Name, @Icon, @Description)
  `;

  const connection = await db();
  await connection
    .input('Code', activityType.code)
    .input('Name', activityType.name)
    .input('Icon', activityType.icon)
    .input('Description', activityType.description)
    .timed_query(q, 'create-level-up-activity-type');
};

const level_up_activity_type_icons = async () => {
  const q = `
    SELECT DISTINCT Icon
    FROM LevelUpActivityTypes
  `;

  const connection = await db();
  const results = await connection.timed_query(
    q,
    'get-level-up-activity-type-icons'
  );
  return fixCase(results.recordset);
};

const level_up_restrictions = async (levelUpId) => {
  const q = `
    SELECT * FROM ContentRestrictions
    WHERE RestrictionTypeId = 3 AND TypeKeyId = @LevelUpId
  `;

  const connection = await db();
  const results = await connection
    .input('LevelUpId', levelUpId)
    .timed_query(q, 'level_up_restrictions');
  return fixCase(results.recordset);
};

const update_level_up_activity_type = async (levelUpAcivityType) => {
  const tx = await transaction();

  try {
    await tx.begin();

    const q = `
    UPDATE LevelUpActivityTypes
    SET Name = @Name,
        Code = @Code,
        Icon = @Icon,
        Description = @Description
    WHERE LevelUpActivityTypeId = @LevelUpActivityTypeId
    `;

    const request = tx.request();

    await request
      .input('Name', levelUpAcivityType.name)
      .input('Code', levelUpAcivityType.code)
      .input('Icon', levelUpAcivityType.icon)
      .input('Description', levelUpAcivityType.description)
      .input('LevelUpActivityTypeId', levelUpAcivityType.id)
      .query(q, 'update-level-up-activity-type');

    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};

const delete_level_up_activity_type = async (levelUpActivityTypeId) => {
  const q = `
  DELETE FROM LevelUpActivityTypes
  WHERE LevelUpActivityTypeId = @LevelUpActivityTypeId
  `;

  const tx = await transaction();

  try {
    await tx.begin();

    const request = await tx.request();

    await request
      .input('LevelUpActivityTypeId', levelUpActivityTypeId)
      .query(q, 'delete-level-up-activity-type');

    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};

const active_level_up_types = async () => {
  const q = `
    SELECT DISTINCT act.LevelUpActivityTypeId
    FROM LevelUpActivities as act
  `;

  const request = await db();
  const results = await request.timed_query(q, 'active-level-up-types');
  return fixCase(results.recordset);
};

const countLevelUpsActivityAttendees = async (levelUpId) => {
  const q = `
    SELECT
      COUNT(1) AS TotalAttendees
    FROM
      LevelUpActivityAttendees laa
      INNER JOIN LevelUpActivities la ON la.LevelUpActivityId = laa.LevelUpActivityId
      INNER JOIN LevelUps l ON l.LevelUpId = la.LevelUpId
    WHERE
      l.LevelUpId = @LevelUpId
  `;

  const connection = await db();
  const result = await connection
    .input('LevelUpId', levelUpId)
    .timed_query(q, 'countLevelUpsActivityAttendees');

  return fixCase(result.recordset)[0].totalAttendees;
};

module.exports = {
  all_levelups,
  level_up_activities,
  user_level_ups,
  user_level_up_activities,
  level_up_activity_attendance,
  level_up_register,
  level_up_users,
  level_up_users_count,
  single_levelup,
  activities_for_level_up,
  level_up_courses,
  level_up_activity,
  level_up_activities_to_allocate_points,
  all_permitted_levelups,
  level_up_activity_link_types,
  create_level_up_activity_link,
  add_attendees,
  get_level_up_icons,
  create_level_up,
  delete_level_up,
  update_level_up,
  add_level_up_course,
  add_level_up_activity,
  all_level_up_activity_types,
  create_level_up_activity_type,
  level_up_activity_type_icons,
  level_up_restrictions,
  update_level_up_activity_type,
  delete_level_up_activity_type,
  active_level_up_types,
  consolidated_level_up_activity_attendance,
  get_activity,
  get_activity_attendee,
  insert_activity_attendee,
  is_now,
  countLevelUpsActivityAttendees,
};
