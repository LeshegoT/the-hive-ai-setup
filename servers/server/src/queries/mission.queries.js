const { db, withTransaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const single_mission = async (missionId) => {
  const query = `
    select TOP(1)
      m.MissionId,
      m.Name,
      m.Description,
      m.Link,
      m.QuestId,
      m.SortOrder,
      m.MissionTypeId,
      mt.Name as Type,
      m.DateCompleted,
      m.Deleted,
      mc.CourseId,
      sqm.SideQuestId,
      HeroUserPrincipleName,
      ml.LevelUpId,
      mtct.ContentTypeId AS ContentMediaTypeId
    from Missions m
    inner join Quests q
      on m.QuestId = q.QuestId
    inner join MissionTypes mt
      on mt.MissionTypeId = m.MissionTypeId
    left outer join MissionCourses mc
      on m.MissionId = mc.MissionId
    left outer join MissionLevelUps ml
      on m.MissionId = ml.MissionId
    left outer join SideQuestMissions sqm
      on m.MissionId = sqm.MissionId
    left join MissionTypeContentType mtct
      on m.MissionTypeId = mtct.MissionTypeId
    where m.MissionId = @MissionId
  `;

  const connection = await db();
  const result = await connection
    .input('MissionId', missionId)
    .timed_query(query, 'single_mission');

  return fixCase(result.recordset);
};

const user_missions = async (upn) => {
  const query = `
  WITH activeQuest AS (
    SELECT Top 1* FROM Quests
    WHERE HeroUserPrincipleName = @UPN
      AND [Status] = 'in-progress'
  ),
  questMissions AS (
    SELECT Missions.*, (SELECT HeroUserPrincipleName FROM activeQuest) AS HeroUserPrincipleName FROM Missions
    WHERE Missions.QuestId = (SELECT QuestId FROM activeQuest)
  )
  SELECT qm.MissionId,
    Name,
    Description,
    Link,
    qm.QuestId,
    SortOrder,
    qm.MissionTypeId,
    CASE
      WHEN mc.CourseId > 0 THEN uc.DateCompleted
      ELSE qm.DateCompleted
    END AS DateCompleted,
    Deleted,
    mc.CourseId,
    sqm.SideQuestId,
    HeroUserPrincipleName,
    ml.LevelUpId,
    mtct.ContentTypeId AS ContentMediaTypeId
  FROM questMissions qm
  LEFT JOIN MissionCourses mc
    on qm.MissionId = mc.MissionId
  LEFT JOIN (
    SELECT * FROM UserCourses WHERE UserPrincipleName = @UPN
  ) uc ON uc.CourseId = mc.CourseId
  LEFT JOIN MissionLevelUps ml
    on qm.MissionId = ml.MissionId
  LEFT JOIN SideQuestMissions sqm
    on qm.MissionId = sqm.MissionId
  LEFT JOIN MissionTypeContentType mtct
    on qm.MissionTypeId = mtct.MissionTypeId
  ORDER BY SortOrder
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'user_missions');

  return fixCase(result.recordset);
};

const quest_missions = async (questId) => {
  const query = `
    select
      m.MissionId,
      m.Name,
      m.Description,
      m.Link,
      m.QuestId,
      m.SortOrder,
      m.MissionTypeId,
      mt.Name as Type,
      m.DateCompleted,
      m.Deleted,
      mc.CourseId,
      sqm.SideQuestId,
      HeroUserPrincipleName,
      ml.LevelUpId,
      mtct.ContentTypeId AS ContentMediaTypeId
    from Missions m
    inner join Quests q
      on m.QuestId = q.QuestId
    inner join MissionTypes mt
      on mt.MissionTypeId = m.MissionTypeId
    left outer join MissionCourses mc
      on m.MissionId = mc.MissionId
    left outer join MissionLevelUps ml
      on m.MissionId = ml.MissionId
    left outer join SideQuestMissions sqm
      on m.MissionId = sqm.MissionId
    left join MissionTypeContentType mtct
      on m.MissionTypeId = mtct.MissionTypeId
    where m.QuestId = @QuestId
    and Deleted = 0
    order by SortOrder
  `;

  const connection = await db();
  const result = await connection
    .input('QuestId', questId)
    .timed_query(query, 'quest_missions');

  return fixCase(result.recordset);
};

const create_missions = async (tx, missions, questId) => {
  const request = await tx.timed_request();

  for (const m of missions) {
    const q = `
    INSERT INTO Missions
      (
        Description,
        QuestId,
        SortOrder,
        Link,
        MissionTypeId,
        Name,
        Deleted
      )
    VALUES
      (
        @Description,
        @QuestId,
        @SortOrder,
        @Link,
        @MissionTypeId,
        @Name,
        0
      )

      Select @@IDENTITY as missionId
    `;
    const result = await request
      .input('Description', m.description)
      .input('QuestId', questId)
      .input('SortOrder', m.sortOrder)
      .input('Link', m.link)
      .input('MissionTypeId', m.type.missionTypeId)
      .input('Name', m.name)
      .timed_query(q, 'create_missions');

    const missionId = result.recordset[0].missionId;

    if (m.missionTypeId === 1) {
      await create_mission_course(request, missionId, m.courseId);
    }
    if (m.missionTypeId === 11) {
      await create_mission_level_up(request, missionId, m.levelUpId);
    }
    if (m.type.sideQuestMission && m.sideQuestId > 0) {
      await create_sideQuest_mission(request, missionId, m.sideQuestId);
    }

    if (m.completed) {
      await update_mission_completed(request, missionId);
    }
  }
};

const create_mission_course = async (tx, missionId, courseId) => {
  const q = `
    insert into MissionCourses (MissionId, CourseId)
    values
    (@MissionId, @CourseId)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('MissionId', missionId)
    .input('CourseId', courseId)
    .timed_query(q, 'create_mission_course');
};

const create_mission_level_up = async (tx, missionId, levelUpId) => {
  const q = `
    insert into MissionLevelUps (MissionId, levelUpId)
    values
    (@MissionId, @LevelUpId)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('MissionId', missionId)
    .input('LevelUpId', levelUpId)
    .timed_query(q, 'create_mission_level_up');
};

const create_sideQuest_mission = async (tx, missionId, sideQuestId) => {
  const q = `
    insert into SideQuestMissions (MissionId, SideQuestId)
    values
    (@MissionId, @SideQuestId)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('MissionId', missionId)
    .input('SideQuestId', sideQuestId)
    .timed_query(q, 'create_sideQuest_mission');
};

const update_missions = async (tx, missions) => {
  for await (const m of missions) {
    let request = await tx.timed_request();
    let q = `
      update Missions
      set
        Name = @Name,
        Description = @Description,
        Link = @Link,
        SortOrder = @SortOrder,
        Deleted = @Deleted
      where MissionId = @MissionId`;

    await request
      .input('Name', m.name)
      .input('Description', m.description)
      .input('Link', m.link)
      .input('SortOrder', m.sortOrder)
      .input('MissionId', m.missionId)
      .input('Deleted', m.deleted)
      .timed_query(q, 'update_missions');

    request = await tx.timed_request();
    if (m.missionTypeId === 1) {
      q = `
        update MissionCourses
        set CourseId = @CourseId
        where MissionId = @MissionId
      `;

      await request
        .input('MissionId', m.missionId)
        .input('CourseId', m.courseId)
        .timed_query(q, 'update_missions_courses');
    }
    if (m.missionTypeId === 11) {
      q = `
        update MissionLevelUps
        set LevelUpId = @LevelUpId
        where MissionId = @MissionId
      `;

      await request
        .input('MissionId', m.missionId)
        .input('LevelUpId', m.levelUpId)
        .timed_query(q, 'update_missions_level_ups');
    }

    if (m.type.sideQuestMission) {
      q = `
        update SideQuestMissions
        set SideQuestId = @SideQuestId
        where MissionId = @MissionId
      `;

      await request
        .input('MissionId', m.missionId)
        .input('SideQuestId', m.sideQuestId)
        .timed_query(q, 'update_sideQuest_courses');
    }
  }
};

const find_incomplete_course_mission = async (courseId, upn) => {
  const query = `
    select m.MissionId
    from Missions m
    inner join MissionCourses mc on m.MissionId = mc.MissionId and mc.CourseId = @CourseId
    inner join Quests q on m.QuestId = q.QuestId and q.HeroUserPrincipleName = @UPN
    where m.DateCompleted is null
  `;

  const connection = await db();
  const result = await connection
    .input('CourseId', courseId)
    .input('UPN', upn)
    .timed_query(query, 'find_incomplete_course_mission');
  const mission = fixCase(result.recordset)[0];

  return mission;
};

const complete_mission = async (missionId) => {
  const result = await withTransaction((tx) =>
    update_mission_completed(tx, missionId)
  );
  return result;
};

const update_mission_completed = async (tx, missionId) => {
  const query = `
    IF EXISTS(SELECT * FROM Missions WHERE MissionId = @MissionId)
    BEGIN
      UPDATE Missions
      SET DateCompleted = GETDATE()
      Where MissionId = @MissionId
    END
    SELECT TOP 1 * FROM Missions WHERE MissionId = @MissionId
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('MissionId', missionId)
    .timed_query(query, 'update_mission_completed');
  return fixCase(result.recordset)[0];
};

const completed_missions_by_type = async (upn, mission_type_code) => {
  const query = `
    select
      m.MissionId,
      m.Name,
      m.Description,
      m.Link,
      m.QuestId,
      m.SortOrder,
      m.MissionTypeId,
      m.DateCompleted,
      m.Deleted
    from Missions m
      inner join Quests q
        on q.QuestId = m.QuestId
      inner join MissionTypes mt
        on m.MissionTypeId = mt.MissionTypeId
      left outer join Points p
        on p.LinkId = m.MissionId
        and q.HeroUserPrincipleName = p.UserPrincipleName
        and p.DeletedBy is null
    where q.HeroUserPrincipleName = @UPN
      and mt.Code = @Code
      and m.DateCompleted is not null
      and p.PointId is null
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .input('Code', mission_type_code)
    .timed_query(query, 'completed_missions_by_type');

  return fixCase(result.recordset);
};

/*
  This query selects certain unbounded datasets. It may be necessary
  in future to relook at this query if there are performance
  implications. - Jason, 2020-01-22
*/
const complete_level_up_missions = async () => {
  const query = `
    WITH
      UserLevelUpCourses(UserPrincipleName, MissionId, LevelUpId, CourseId) AS
      (
        SELECT HeroUserPrincipleName, m.MissionId, ml.LevelUpId, l.CourseId
        FROM Missions as m
        INNER JOIN Quests as q
        ON m.QuestId = q.QuestId
        INNER JOIN MissionLevelUps as ml
        ON m.MissionId = ml.MissionId
        INNER JOIN LevelUpCourses as l
        ON ml.LevelUpId = l.LevelUpId
        WHERE m.DateCompleted IS NULL
        GROUP BY HeroUserPrincipleName, m.MissionId, ml.LevelUpId, l.CourseId
      ),

      UserCompletedCourses(UserPrincipleName, CourseId) AS
      (
        SELECT UserPrincipleName, CourseId
        FROM UserCourses
        WHERE DateCompleted IS NOT NULL
      ),

      UserCompletedLevelUpCourses(UserPrincipleName, MissionId, LevelUpId, NumCoursesCompleted) AS
      (
        SELECT ul.UserPrincipleName, ul.MissionId, ul.LevelUpId, COUNT(uc.CourseId)
        FROM UserLevelUpCourses AS ul
        INNER JOIN UserCompletedCourses AS uc
        ON ul.UserPrincipleName = uc.UserPrincipleName AND ul.CourseId = uc.CourseId
        GROUP BY ul.UserPrincipleName, ul.MissionId, ul.LevelUpId
      ),

      CoursesPerLevelUp(LevelUpId, NumCourses) AS
      (
        SELECT LevelUpId, COUNT(CourseId)
        FROM LevelUpCourses
        GROUP BY LevelUpId
      ),

      CompletedCourseMissionIds(MissionId)
      AS
      (
        SELECT u.MissionId
        FROM UserCompletedLevelUpCourses AS u
        INNER JOIN CoursesPerLevelUp AS c
        ON u.LevelUpId = c.LevelUpId
        WHERE u.NumCoursesCompleted = c.NumCourses
      ),

      UserLevelUpActivities(UserPrincipleName, MissionId, LevelUpId, LevelUpActivityId) AS
      (
        SELECT HeroUserPrincipleName, m.MissionId, ml.LevelUpId, l.LevelUpActivityId
        FROM Missions as m
        INNER JOIN Quests as q
        ON m.QuestId = q.QuestId
        INNER JOIN MissionLevelUps as ml
        ON m.MissionId = ml.MissionId
        INNER JOIN LevelUpActivities as l
        ON ml.LevelUpId = l.LevelUpId
        WHERE m.DateCompleted IS NULL
        GROUP BY HeroUserPrincipleName, m.MissionId, ml.LevelUpId, l.LevelUpActivityId
      ),

      UserAttendedLevelUpActivities(UserPrincipleName, MissionId, LevelUpId, NumActivitiesAttended) AS
      (
        SELECT u.UserPrincipleName, u.MissionId, u.LevelUpId, COUNT(l.LevelUpActivityAttendeeId)
        FROM UserLevelUpActivities AS u
        INNER JOIN LevelUpActivityAttendees AS l
        ON u.UserPrincipleName = l.UserPrincipleName AND u.LevelUpActivityId = l.LevelUpActivityId
        GROUP BY u.UserPrincipleName, u.MissionId, u.LevelUpId
      ),

      ActivitiesPerLevelUp(LevelUpId, NumActivities) AS
      (
        SELECT LevelUpId, COUNT(LevelUpActivityId)
        FROM LevelUpActivities
        GROUP BY LevelUpId
      ),

      CompletedActivityMissionIds(MissionId)
      AS
      (
        SELECT u.MissionId
        FROM UserAttendedLevelUpActivities AS u
        INNER JOIN ActivitiesPerLevelUp AS a
        ON u.LevelUpId = a.LevelUpId
        WHERE u.NumActivitiesAttended >= a.NumActivities
      ),

      CompletedLevelUpMissionIds(MissionId) AS
      (
        SELECT cc.MissionId
        FROM CompletedCourseMissionIds AS cc
        INNER JOIN CompletedActivityMissionIds AS ca
        ON cc.MissionId = ca.MissionId
      )

    UPDATE Missions
    SET DateCompleted = GETDATE()
    WHERE MissionId IN (SELECT MissionId FROM CompletedLevelUpMissionIds)
  `;

  const connection = await db();
  await connection.timed_query(query);
};

const course_mission_needing_award = async () => {
  const query = `
    select TOP(1)
      m.MissionId,
      q.HeroUserPrincipleName,
      c.Name,
      c.CourseId
    from Missions m
    inner join Quests q on m.QuestId = q.QuestId
    inner join MissionCourses mc on m.MissionId = mc.MissionId
    inner join Courses c on mc.CourseId = c.CourseId
    left outer join MissionClaims cl on m.MissionId = cl.MissionId
    where m.DateCompleted is not null and MissionClaimId is null and m.Deleted = 0
    order by m.MissionId
  `;

  const connection = await db();
  const result = await connection.timed_query(
    query,
    'course_mission_needing_award'
  );
  const mission = fixCase(result.recordset)[0];

  return mission;
};

const course_mission_awarded = async (upn, courseId) => {
  const query = `
    select
      ClaimPartId,
      HeroUserPrincipleName,
      CourseId
    from MissionClaims claim
    inner join MissionCourses course on claim.MissionId = course.MissionId
    inner join Missions m on claim.MissionId = m.MissionId
    inner join Quests q on m.QuestId = q.QuestId
    where HeroUserPrincipleName = @UPN
    and CourseId = @CourseId
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .input('CourseId', courseId)
    .timed_query(query, 'course_mission_awarded');
  const award = fixCase(result.recordset)[0];

  return award;
};

const incomplete_course_missions = async () => {
  const query = `
    select TOP(1)
      m.MissionId,
      q.HeroUserPrincipleName,
      mc.CourseId
    from Missions m
    inner join Quests q on m.QuestId = q.QuestId
    inner join MissionCourses mc on m.MissionId = mc.MissionId
    inner join UserCourses uc on mc.CourseId = uc.CourseId and q.HeroUserPrincipleName = uc.UserPrincipleName
    where m.DateCompleted is null and uc.DateCompleted is not null
    order by m.MissionId
  `;

  const connection = await db();
  const result = await connection.timed_query(
    query,
    'incomplete_course_missions'
  );
  const mission = fixCase(result.recordset)[0];

  return mission;
};

const create_mission = async (tx, mission, questId) => {
  const q = `
    INSERT INTO Missions
      (
        Description,
        QuestId,
        SortOrder,
        Link,
        MissionTypeId,
        Name,
        Deleted
      )
    VALUES
      (
        @Description,
        @QuestId,
        @SortOrder,
        @Link,
        @MissionTypeId,
        @Name,
        0
      )

      Select @@IDENTITY as missionId
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('Description', mission.description)
    .input('QuestId', questId)
    .input('SortOrder', mission.sortOrder)
    .input('Link', mission.link)
    .input('MissionTypeId', mission.type.missionTypeId)
    .input('Name', mission.name)
    .timed_query(q, 'create_mission');

  const missionId = result.recordset[0].missionId;

  if (mission.missionTypeId === 1) {
    await create_mission_course(tx, missionId, mission.courseId);
  }
  if (mission.missionTypeId === 11) {
    await create_mission_level_up(tx, missionId, mission.levelUpId);
  }
  if (mission.type.sideQuestMission && mission.sideQuestId > 0) {
    await create_sideQuest_mission(tx, missionId, mission.sideQuestId);
  }

  if (mission.completed) {
    await update_mission_completed(tx, missionId);
  }
};

const update_mission = async (tx, mission) => {
  const q = `
    update Missions
    set
      Name = @Name,
      Description = @Description,
      Link = @Link,
      SortOrder = @SortOrder,
      Deleted = @Deleted
    where MissionId = @MissionId
  `;

  const connection = await tx.timed_request();
  await connection
    .input('Name', mission.name)
    .input('Description', mission.description)
    .input('Link', mission.link)
    .input('SortOrder', mission.sortOrder)
    .input('MissionId', mission.missionId)
    .input('Deleted', mission.deleted)
    .timed_query(q, 'update_mission');

  if (mission.missionTypeId === 1) await update_missions_courses(tx, mission);

  if (mission.missionTypeId === 11)
    await update_missions_level_ups(tx, mission);

  if (mission.type.sideQuestMission)
    await update_sideQuest_courses(tx, mission);
};

const update_missions_courses = async (tx, mission) => {
  q = `
    update MissionCourses
    set CourseId = @CourseId
    where MissionId = @MissionId
  `;

  const connection = await tx.timed_request();
  await connection
    .input('MissionId', mission.missionId)
    .input('CourseId', mission.courseId)
    .timed_query(q, 'update_missions_courses');
};

const update_missions_level_ups = async (tx, mission) => {
  q = `
    update MissionLevelUps
    set LevelUpId = @LevelUpId
    where MissionId = @MissionId
  `;

  const connection = await tx.timed_request();
  await connection
    .input('MissionId', mission.missionId)
    .input('LevelUpId', mission.levelUpId)
    .timed_query(q, 'update_missions_level_ups');
};

const update_sideQuest_courses = async (tx, mission) => {
  q = `
    update SideQuestMissions
    set SideQuestId = @SideQuestId
    where MissionId = @MissionId
  `;

  const connection = await tx.timed_request();
  await connection
    .input('MissionId', mission.missionId)
    .input('SideQuestId', mission.sideQuestId)
    .timed_query(q, 'update_sideQuest_courses');
};

module.exports = {
  single_mission,
  user_missions,
  quest_missions,
  update_missions,
  find_incomplete_course_mission,
  complete_mission,
  create_missions,
  completed_missions_by_type,
  complete_level_up_missions,
  course_mission_needing_award,
  course_mission_awarded,
  incomplete_course_missions,
  create_mission,
  update_mission,
};
