const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const {
  create_mission,
  update_mission,
} = require('./mission.queries');
const { check_avatar, create_user_avatar } = require('./avatar.queries');
const { insert_part } = require('./part.queries');

const hero_quests = async (upn) => {
  const query = `

    WITH heroQuests as (
        select *
        from Quests
        where GuideUserPrincipleName = @UPN
    ),
    questDetails as (
      Select *
      from heroQuests q
      inner join Profiles p on q.HeroUserPrincipleName = p.UserPrincipleName
    ),
    TotalMissions as (
      Select qd.QuestId, COUNT(qd.QuestId) as totalMissions
      from questDetails qd
      inner join Missions m on qd.QuestId = m.QuestId
      Group by qd.QuestId
    ),
    completedMissions as (
      Select qd.QuestId, COUNT(qd.QuestId) as completedMissions
      from questDetails qd
      inner join Missions m on qd.QuestId = m.QuestId
      where DateCompleted IS NOT NULL
      Group by qd.QuestId
    )
    Select
      qd.QuestId,
      HeroUserPrincipleName,
      GuideUserPrincipleName,
      QuestTypeId,
      SpecialisationId,
      Goal,
      StartDate,
      EndDate,
      Status,
      LastHeroActivityDate as LastActive,
      isnull(totalMissions,0) as totalMissions,
      isnull(completedMissions,0) as completedMissions
    from questDetails qd
    left Join TotalMissions t on qd.QuestId = t.QuestId
    left join completedMissions c on qd.QuestId = c.QuestId
    order by Status desc, EndDate desc, HeroUserPrincipleName
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'hero_quests');

  return fixCase(result.recordset);
};

const all_quests_for_hero = async (upn) => {
  const query = `
    select
      q.QuestId,
      q.HeroUserPrincipleName,
      q.GuideUserPrincipleName,
      s.SpecialisationId,
      s.Name as Specialisation,
      q.Goal,
      q.StartDate,
      q.EndDate,
      q.Status,
      qt.Name as Level
    from Quests q
    inner join Specialisations s on s.SpecialisationId = q.SpecialisationId
    inner join QuestTypes qt on qt.QuestTypeId = q.QuestTypeId
    where q.HeroUserPrincipleName = @UPN
    order by Status desc, EndDate desc
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'all_quests_for_hero');

  return fixCase(result.recordset);
};

const hero_quest = async (hero, guide) => {
  const query = `
    select TOP(1) *
    from Quests
    where GuideUserPrincipleName = @Guide
    and HeroUserPrincipleName = @Hero
    and Status = 'in-progress'
  `;

  const connection = await db();
  const result = await connection
    .input('Guide', guide)
    .input('Hero', hero)
    .timed_query(query, 'hero_quest');

  return fixCase(result.recordset)[0];
};

const user_quest = async (upn) => {
  const query = `
    select *
    from Quests
    where HeroUserPrincipleName = @UPN
    and Status = 'in-progress'
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'user_quest');

  return fixCase(result.recordset)[0]; //there should only ever be one
};

const old_user_quests = async (upn) => {
  const query = `
    select *
    from Quests
    where HeroUserPrincipleName = @UPN
    and Status <> 'in-progress'
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'user_quest');

  return fixCase(result.recordset);
};

const update_quest = async (
  tx,
  questId,
  goal,
  endDate,
  newMissions,
  existingMissions
) => {
  await update_query(tx, questId, goal, endDate);

  for (const mission of newMissions) {
    await create_mission(tx, mission, questId);
  }

  for (const mission of existingMissions) {
    await update_mission(tx, mission);
  }
};

const update_query = async (tx, questId, goal, endDate) => {
  const query = `
      update Quests
      set
        Goal = @Goal,
        EndDate = @EndDate
      where QuestId = @QuestId
    `;

  const request = await tx.timed_request();
  await request
    .input('QuestId', questId)
    .input('Goal', goal)
    .input('EndDate', endDate)
    .timed_query(query, 'update_quest');
};

const create_quest = async (
  tx,
  heroUserPrincipleName,
  guideUserPrincipleName,
  specialisationId,
  goal,
  startDate,
  endDate,
  missions
) => {
  const questTypeId = 1;
  const quest = await insert_quest(
    tx,
    heroUserPrincipleName,
    guideUserPrincipleName,
    questTypeId,
    specialisationId,
    goal,
    startDate,
    endDate
  );

  for (const mission of missions) {
    await create_mission(tx, mission, quest.questId);
  }

  let avatar = await check_avatar(tx, heroUserPrincipleName);

  if (!avatar) {
    avatar = await create_user_avatar(tx, heroUserPrincipleName);
    let request = await tx.timed_request();
    await insert_part(
      request,
      heroUserPrincipleName,
      6,
      'left',
      'Creating your first quest'
    );
    request = await tx.timed_request();
    await insert_part(
      request,
      heroUserPrincipleName,
      15,
      'right',
      'Customising your avatar'
    );
  }

  return { quest, avatar };
};

const insert_quest = async (
  tx,
  heroUserPrincipleName,
  guideUserPrincipleName,
  questTypeId,
  specialisationId,
  goal,
  startDate,
  endDate
) => {
  const q = `
  INSERT INTO Quests
      (
        HeroUserPrincipleName,
        GuideUserPrincipleName,
        QuestTypeId,
        SpecialisationId,
        Goal,
        StartDate,
        EndDate,
        Status
      )
    VALUES
      (
        LOWER(@HeroUserPrincipleName),
        LOWER(@GuideUserPrincipleName),
        @QuestTypeId,
        @SpecialisationId,
        @Goal,
        @StartDate,
        @EndDate,
        'in-progress'
      )

      select *
      from Quests
      where QuestId = @@IDENTITY
  `;

  const request = await tx.timed_request();

  const result = await request
    .input('HeroUserPrincipleName', heroUserPrincipleName)
    .input('GuideUserPrincipleName', guideUserPrincipleName)
    .input('QuestTypeId', questTypeId)
    .input('SpecialisationId', specialisationId)
    .input('Goal', goal)
    .input('StartDate', startDate)
    .input('EndDate', endDate)
    .timed_query(q, 'create_quest');
  const quest = fixCase(result.recordset)[0];

  return quest;
};

const single_quest = async (questId, upn) => {
  const query = `
    select *
    from Quests
    where QuestId = @QuestId
    and (HeroUserPrincipleName = @UPN or GuideUserPrincipleName = @UPN)
  `;

  const connection = await db();
  const result = await connection
    .input('QuestId', questId)
    .input('UPN', upn)
    .timed_query(query, 'single_quest');
  const quest = fixCase(result.recordset)[0];

  return quest;
};

const all_quests_query = `
  WITH ranked_quests AS (
    SELECT q.*, ROW_NUMBER() OVER (PARTITION BY HeroUserPrincipleName ORDER BY QuestId DESC) AS rn
    FROM Quests AS q
  )

  select
    q.QuestId,
    q.HeroUserPrincipleName,
    q.GuideUserPrincipleName,
    s.SpecialisationId,
    s.Name as Specialisation,
    q.Goal,
	c.Text as Comment,
    q.StartDate,
    q.EndDate,
    q.Status,
    p.LastHeroActivityDate,
    p.PointsTotal
  from ranked_quests q
  inner join Specialisations s on s.SpecialisationId = q.SpecialisationId
  left outer join Profiles p on p.UserPrincipleName = q.HeroUserPrincipleName
  left outer join AdminQuestComments c on c.QuestId = q.QuestId
  where rn = 1
`;

const all_quests = async () => {
  const connection = await db();
  const result = await connection.timed_query(all_quests_query, 'all_quests');
  const quests = fixCase(result.recordset);

  return quests;
};

const guide_hero_quests = async (upn, status) => {
  const q = `${all_quests_query} and q.GuideUserPrincipleName = @UPN and q.Status = @Status`;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .input('Status', status)
    .timed_query(q, 'all_quests');
  const quests = fixCase(result.recordset);

  return quests;
};

const unassigned_quests = async () => {
  const query = `
    select
      q.QuestId,
      q.HeroUserPrincipleName,
      s.SpecialisationId,
      s.Name as Specialisation,
      q.Goal,
      q.StartDate,
      q.EndDate
    from Quests q
    inner join Specialisations s on s.SpecialisationId = q.SpecialisationId
    where EndDate > getDate()
     and GuideUserPrincipleName is null
  `;

  const connection = await db();
  const result = await connection.timed_query(query, 'unassigned_quests');
  const quests = fixCase(result.recordset);

  return quests;
};

const set_quest_status = async (tx, questId, status) => {
  const query = `
    Update Quests
    SET Status = @QuestStatus
    where QuestId = @QuestId

    Select *
    From Quests
    where QuestId = @QuestId
  `;

  const request = await tx.timed_request();
  const result = await request
    .input('QuestStatus', status)
    .input('QuestId', questId)
    .timed_query(query, 'set_quest_status');
  const quest = fixCase(result.recordset);
  return quest;
};

const finished_quests = async () => {
  const query = `
    select
      q.QuestId,
      q.HeroUserPrincipleName,
      q.GuideUserPrincipleName,
      s.SpecialisationId,
      s.Name as Specialisation,
      q.Goal,
      q.StartDate,
      q.EndDate
    from Quests q
    inner join Specialisations s on s.SpecialisationId = q.SpecialisationId
    where EndDate < getDate()
  `;

  const connection = await db();
  const result = await connection.timed_query(query, 'ended_quests');
  const quests = fixCase(result.recordset);

  return quests;
};

const admin_quest = async (questId) => {
  const query = `
    select
      q.QuestId,
      q.HeroUserPrincipleName,
      q.GuideUserPrincipleName,
      s.SpecialisationId,
      s.Name as Specialisation,
      q.Goal,
      q.StartDate,
      q.EndDate
    from Quests q
    inner join Specialisations s on s.SpecialisationId = q.SpecialisationId
    where QuestId = @QuestId
  `;

  const connection = await db();
  const result = await connection
    .input('QuestId', questId)
    .timed_query(query, 'admin_quest');
  const quest = fixCase(result.recordset)[0];

  return quest;
};

const assign_guide = async (questId, guideUserPrincipleName) => {
  const query = `
    update Quests
    set GuideUserPrincipleName = @GuideUserPrincipleName
    where QuestId = @QuestId
  `;

  const connection = await db();
  await connection
    .input('GuideUserPrincipleName', guideUserPrincipleName)
    .input('QuestId', questId)
    .timed_query(query, 'assign_guide');
};

const update_Admin_Quest_Comment = async (questId, comment) => {
  const query = `
    UPDATE AdminQuestComments
      SET Text=@Comment
      WHERE QuestId = @QuestId
    IF @@ROWCOUNT=0
      INSERT INTO AdminQuestComments( QuestId, Text)
      VALUES (@QuestId, @Comment)
  `;

  const connection = await db();
  await connection
    .input('QuestId', questId)
    .input('Comment', comment)
    .timed_query(query, 'update_Admin_Quest_Comment');
};

const overlapping_quest = async (upn, startDate) => {
  const query = `
    select TOP(1) *
    from Quests
    where HeroUserPrincipleName = @UPN
    and Status = 'in-progress'
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .input('StartDate', startDate)
    .timed_query(query, 'overlapping_quest');
  const quest = fixCase(result.recordset)[0];

  return quest;
};

const admin_edit_quest_end_date = async (questId, endDate) => {
  const query = `
      update Quests
      set
        EndDate = @EndDate
      where QuestId = @QuestId
    `;

  const connection = await db();
  await connection
    .input('QuestId', questId)
    .input('EndDate', endDate)
    .timed_query(query, 'admin_edit_quest_end_date');
};

const admin_set_quest_specialisation = async (questId, specialisationId) => {
  const query = `
      update Quests
      set
        SpecialisationId = @SpecialisationId
      where QuestId = @QuestId
    `;

  const connection = await db();
  await connection
    .input('QuestId', questId)
    .input('SpecialisationId', specialisationId)
    .timed_query(query, 'admin_set_quest_specialisation');
};

const expired_quests = async () => {
  const query = `
    Select *
    from Quests
    where EndDate < GETDATE()
    and Status = 'in-progress'
  `;

  const connection = await db();
  const result = await connection.timed_query(query, 'expired_quests');
  const quests = fixCase(result.recordset);
  return quests;
};

const updateQuestsGuide = async (
  tx,
  heroUserPrincipleName,
  guideUserPrincipleName,
  status
) => {
  const query = `
    UPDATE Quests
    SET GuideUserPrincipleName = @GuideUserPrincipleName
    WHERE HeroUserPrincipleName = @HeroUserPrincipleName AND Status = @Status
  `;

  const connection = await tx.timed_request();
  await connection
    .input('HeroUserPrincipleName', heroUserPrincipleName)
    .input('GuideUserPrincipleName', guideUserPrincipleName)
    .input('Status', status)
    .timed_query(query, 'updateQuestsGuide');
};

module.exports = {
  hero_quests,
  all_quests_for_hero,
  hero_quest,
  user_quest,
  old_user_quests,
  update_quest,
  create_quest,
  single_quest,
  all_quests,
  guide_hero_quests,
  unassigned_quests,
  set_quest_status,
  finished_quests,
  admin_quest,
  assign_guide,
  update_Admin_Quest_Comment,
  overlapping_quest,
  admin_edit_quest_end_date,
  admin_set_quest_specialisation,
  expired_quests,
  updateQuestsGuide,
};
