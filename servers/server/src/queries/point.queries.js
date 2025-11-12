const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const insert_points = async (tx, upn, points_array) => {
  const q = `
        insert into Points
        (
            UserPrincipleName,
            PointTypeId,
            CreatedDate,
            Points,
            LinkId
        )
        values
        (
            LOWER(@UPN),
            @PointTypeId,
            isnull(@CreatedDate, getdate()),
            @Points,
            @LinkId
        )
    `;

  for (const points of points_array) {
    const request = await tx.timed_request();

    await request
      .input('UPN', upn)
      .input('PointTypeId', points.pointTypeId)
      .input('Points', points.points)
      .input('LinkId', points.linkId)
      .input('CreatedDate', points.createdDate)
      .timed_query(q, 'insert_points');
  }
};

const all_points_for_hero = async (upn) => {
  const q = `
    select p.PointTypeId, p.CreatedDate, p.Points, pt.Description
    from Points p
      inner join PointTypes pt
        on pt.PointTypeId = p.PointTypeId
    where p.UserPrincipleName = @UPN
    and p.Points is not null
    and p.DeletedBy is null
  `;

  const request = await db();
  const result = await request.input('UPN', upn).timed_query(q, 'all_points');

  return fixCase(result.recordset);
};

const last_month_points = async (upn) => {
  const q = `
    select ISNULL(SUM (p.Points), 0) as Total
    from Points p
    where p.UserPrincipleName = @UPN
    and p.CreatedDate > DATEADD(month, -1, GETDATE())
    and p.DeletedBy is null
  `;
  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'last_month_points');

  return fixCase(result.recordset);
};

const update_points_total = async (tx, upn, points) => {
  const q = `
    if not exists (select * from Profiles where UserPrincipleName = @UPN)
    begin
      insert into Profiles
      (
        UserPrincipleName,
        PointsTotal,
        CreatedDate,
        LastUpdatedDate,
        LastHeroActivityDate,
        LastGuideActivityDate
      )
      values
      (
        LOWER(@UPN),
        @Points,
        getdate(),
        getdate(),
        getdate(),
        '01-Aug-2019'
      )
    end
    else
    begin
      update dbo.Profiles
      set PointsTotal = @Points,
          LastUpdatedDate = getdate()
      where UserPrincipleName = @UPN
    end
  `;

  const request = await tx.timed_request();

  await request
    .input('UPN', upn)
    .input('Points', points)
    .timed_query(q, 'update_points_total');
};

const completed_point_tasks_by_type = async (upn, type_code) => {
  const query = `
    with UserSideQuestMissions (MissionId, SideQuestId, UserSideQuestId)
    as
    (
      select m.MissionId, sqm.SideQuestId, usq.UserSideQuestId
      from Missions m
      inner join Quests q
        on m.QuestId = q.QuestId
      inner join SideQuestMissions sqm
        on m.MissionId = sqm.MissionId
      inner join UserSideQuests usq
        on sqm.SideQuestId = usq.SideQuestId
      where q.HeroUserPrincipleName = @UPN
        and usq.UPN = @UPN
    )

    select LearningTaskId, UserSideQuestId, MissionId, MIN(DateCompleted) AS DateCompleted
      from (
        select
          lt.LearningTaskId,
          null as UserSideQuestId,
          null as MissionId,
          lt.DateCompleted
        from LearningTasks lt
        inner join MessageTypes mt
          on lt.MessageTypeId = mt.MessageTypeId
        left outer join Points p
          on lt.UserPrincipleName = p.UserPrincipleName and lt.LearningTaskId = p.LinkId and p.DeletedBy is null
        left outer join PointTypes pt
          on p.PointTypeId = pt.PointTypeId and pt.Code = @Code
        where lt.UserPrincipleName = @UPN
          and mt.Code = @Code
          and lt.DateCompleted is not null
          and p.LinkId is null
        UNION ALL
      select
        null as LearningTaskId,
        usq.UserSideQuestId,
        sqm.MissionId,
        usq.DateCompleted
      from SideQuests sq
      inner join SideQuestTypes sqt
        on sq.SideQuestTypeId = sqt.SideQuestTypeId
      inner join UserSideQuests usq
        on sq.SideQuestId = usq.SideQuestId
      left outer join UserSideQuestMissions sqm
        on usq.UserSideQuestId = sqm.UserSideQuestId
      left outer join Points p
        on (usq.UserSideQuestId = p.LinkId or sqm.MissionId = p.LinkId)
        and usq.UPN = p.UserPrincipleName
        and p.DeletedBy is null
      left outer join PointTypes pt
        on p.PointTypeId = pt.PointTypeId and pt.Code = @Code
      where usq.UPN = @UPN
        and sqt.Code = @Code
        and usq.DateCompleted is not null
        and p.LinkId is null
      UNION ALL
      select
        null as LearningTaskId,
        sqm.UserSideQuestId,
        m.MissionId,
        m.DateCompleted
      from Missions m
      inner join Quests q
        on q.QuestId = m.QuestId
      inner join MissionTypes mt
        on m.MissionTypeId = mt.MissionTypeId
      left outer join UserSideQuestMissions sqm
        on m.MissionId = sqm.MissionId
      left outer join Points p
        on (sqm.UserSideQuestId = p.LinkId or m.MissionId = p.LinkId)
        and q.HeroUserPrincipleName = p.UserPrincipleName
        and p.DeletedBy is null
      left outer join PointTypes pt
        on p.PointTypeId = pt.PointTypeId and pt.Code = @Code
      where q.HeroUserPrincipleName = @UPN
        and mt.Code = @Code
        and m.DateCompleted is not null
        and p.LinkId is null
    )t
    group by LearningTaskId, UserSideQuestId, MissionId
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .input('Code', type_code)
    .timed_query(query, 'completed_point_tasks_by_type');

  return fixCase(result.recordset);
};

const get_point_type = async (tx, pointType) => {
  const q = `
    select pt.PointTypeId from PointTypes as pt where pt.Code = @PointType
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('PointType', pointType)
    .timed_query(q, 'last_month_points');

  return fixCase(result.recordset);
};

const get_point_value = async (tx, pointType) => {
  const q = `
    select pt.Points from PointTypes as pt where pt.Code = @PointType
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('PointType', pointType)
    .timed_query(q, 'last_month_points');

  return fixCase(result.recordset);
};

const score_points = async (tx, upn, pointType, multiplier, interactionID) => {
  const q = `
    declare @Type int = (select pt.PointTypeId from PointTypes as pt where pt.Code = @PointType)
    declare @Points int = (select pt.Points from PointTypes as pt where pt.Code = @PointType)

    insert into Points
      (
        UserPrincipleName,
        PointTypeId,
        CreatedDate,
        Points,
        LinkId,
        Multiplier,
        UserInteractionID
      )
      values
      (
        LOWER(@UPN),
        @Type,
        getdate(),
        (@Points * @Multiplier),
        1,
        @Multiplier,
        @UserInteractionID
      )
  `;

  const connection = await tx.timed_request();
  await connection
    .input('UPN', upn)
    .input('PointType', pointType)
    .input('Multiplier', multiplier)
    .input('UserInteractionID', interactionID)
    .timed_query(q, 'score_points');
};

const points_types = async () => {
  const q = `
    select PointTypeId, Code, Points from PointTypes
  `;

  const connection = await db();
  const result = await connection.timed_query(q, 'points_types');

  return fixCase(result.recordset);
};

const update_profile_for_user = async (tx, upn) => {
  const q = `
    update Profiles
    set PointsTotal = (select sum(Points) from Points where UserPrincipleName = @UPN and DeletedBy IS NULL)
    where UserPrincipleName = @UPN
  `;

  const connection = await tx.timed_request();
  await connection.input('UPN', upn).timed_query(q, 'update_profile_for_user');
};

module.exports = {
  insert_points,
  update_points_total,
  all_points_for_hero,
  last_month_points,
  completed_point_tasks_by_type,
  score_points,
  points_types,
  get_point_type,
  get_point_value,
  update_profile_for_user,
};
