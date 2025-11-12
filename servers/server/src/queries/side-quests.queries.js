const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const { restrict_content } = require('./groups.queries');
const {
  DeleteExistingRestrictions,
  InsertRestrictions,
} = require('./restrictions.queries');

const RESTRICTION_TYPE_ID = 4;

const all_side_quests = async (filtered = true) => {
  let q = `
    SELECT 
      sq.SideQuestId AS Id, 
      sq.SideQuestTypeId,
      sq.Name, 
      sq.Link,
      sq.StartDate,
      sq.ExternalEvent,
      sq.RegistrationRequired,
      sq.Description,
      sq.Venue,
      sq.YouTubeKey,
      t.Description AS TypeDescription,
      t.Code,
      t.Icon,
      t.Name AS TypeName
    from SideQuests sq
    INNER JOIN SideQuestTypes t ON t.SideQuestTypeId = sq.SideQuestTypeId
  `;

  if (filtered) {
    q += `
    WHERE StartDate >= GETDATE()
    ORDER BY StartDate ASC
    `;
  } else {
    /*Do not set the filtering condition*/
  }

  const request = await db();
  const results = await request.timed_query(q, 'all_side_quests');
  const sideQuests = fixCase(results.recordset);

  return sideQuests;
};
const count_sidequest_mission = async (sideQuestId) => {
  const q = `
    SELECT count(*) AS CountSideQuestMission FROM SideQuestMissions
    WHERE SideQuestId = @sideQuestId
  `;
  const connection = await db();
  const results = await connection
    .input('SideQuestId', sideQuestId)
    .timed_query(q, 'sidequest_mission');
  return results.recordset[0].CountSideQuestMission;
};
const available_side_quests = async (upn) => {
  const q = `
    With allSideQuests as 
    (
      SELECT
        sq.SideQuestId as Id,
        sq.SideQuestTypeId,
        sq.Name, 
        sq.Link,
        sq.StartDate,
        sq.ExternalEvent,
        sq.RegistrationRequired,
        sq.Restricted,
        sq.Description,
        sq.Venue,
        sq.YouTubeKey,
        t.Description as TypeDescription,
        t.Code,
        t.Icon,
        t.Name as TypeName
        from SideQuests sq
        inner join SideQuestTypes t on t.SideQuestTypeId = sq.SideQuestTypeId
    )
    Select * 
    from allSideQuests Where Restricted = 0
    UNION
    Select  
      sq.Id,
      sq.SideQuestTypeId,
      sq.Name, 
      sq.Link,
      sq.StartDate,
      sq.ExternalEvent,
      sq.RegistrationRequired,
      sq.Restricted,
      sq.Description,
      sq.Venue,
      sq.YouTubeKey,
      sq.TypeDescription,
      sq.Code,
      sq.Icon,
      sq.TypeName 
    FROM allSideQuests sq
      INNER JOIN (
        -- Uninion restricted sideQuests that a user has directly and those that they have as part of a group		
        SELECT TypeKeyId as SideQuestId FROM ContentRestrictions
        WHERE RestrictionTypeId = 4 AND UPN = @UPN
        UNION 
        SELECT TypeKeyId as SideQuestId FROM 
        (
          (SELECT * FROM ContentRestrictions WHERE RestrictionTypeId = 4 AND GroupName IS NOT NULL) gr --group restrictions
          INNER JOIN 
          (SELECT GroupName FROM Groups where MemberUserPrincipleName = @UPN) ug --user groups
          ON gr.GroupName = ug.GroupName
        )
      ) ps
      ON sq.id = ps.SideQuestId
    `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(q, 'available_side_quests');

  const sideQuests = fixCase(results.recordset);
  return sideQuests;
};

const register_for_side_quest = async (sideQuestId, upn) => {
  const q = `
    insert into UserSideQuests
      (UPN, SideQuestId, DateRegistered)
    values 
      (LOWER(@UPN), @SideQuestId, getDate())

    select SideQuestId, DateCompleted 
    from UserSideQuests
    where UserSideQuestId = @@IDENTITY
  `;

  const connection = await db();
  const results = await connection
    .input('SideQuestId', sideQuestId)
    .input('UPN', upn)
    .timed_query(q, 'register_for_side_quest');

  const sideQuests = fixCase(results.recordset)[0];

  return sideQuests;
};

const completed_side_quests_by_type = async (upn, side_quest_type_code) => {
  const query = `
    select
      sq.SideQuestId,
      usq.UserSideQuestId,
      sq.Name,
      sq.Description,
      sq.Link,
      sq.Venue,
      sq.StartDate,
      sq.ExternalEvent,
      sq.RegistrationRequired,
      sq.Restricted,
      sq.SideQuestTypeId,
      usq.DateCompleted
    from SideQuests sq
    inner join SideQuestTypes sqt on sq.SideQuestTypeId = sqt.SideQuestTypeId
    inner join UserSideQuests usq on sq.SideQuestId = usq.SideQuestId
    left outer join Points p on sq.SideQuestId = p.LinkId and usq.UPN = p.UserPrincipleName and p.DeletedBy is null
    where usq.UPN = @UPN
    and sqt.Code = @Code
    and usq.DateCompleted is not null
    and p.PointId is null
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .input('Code', side_quest_type_code)
    .timed_query(query, 'completed_side_quests_by_type');

  return fixCase(result.recordset);
};

const get_side_quest_types = async () => {
  const q = `
    SELECT SideQuestTypeId, Code, Name, Icon, Description
    FROM SideQuestTypes
  `;

  const connection = await db();
  const results = await connection.timed_query(q, 'get-side-quest-types');

  const sideQuestTypes = fixCase(results.recordset);

  return sideQuestTypes;
};

const delete_side_quest_type = async (id) => {
  const q = `
  DELETE FROM SideQuestTypes
  WHERE SideQuestTypeId = @SideQuestTypeId
  `;

  const tx = await transaction();

  try {
    await tx.begin();

    const request = await tx.request();

    await request
      .input('SideQuestTypeId', id)
      .query(q, 'delete-side-quest-type');

    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};

const create_side_quest = async (sideQuest) => {
  const tx = await transaction();
  try {
    await tx.begin();

    const sideQuestTypeId = await get_side_quest_id_from_code(tx, sideQuest.type);

    if (!sideQuestTypeId) {
      console.error('Side quest type does not exist.');
      await tx.rollback();
      return;
    }

    const q = `
      INSERT INTO SideQuests
      VALUES(@Type, @Name, @Link, @Venue, @StartDate, @ExternalEvent, @RegistrationRequired, @Restricted, @Description, NULL)

      SELECT SideQuestId
      FROM SideQuests
      WHERE SideQuestId = @@IDENTITY
    `;

    const request = await tx.request();
    const results = await request
      .input('Type', sideQuestTypeId)
      .input('Name', sideQuest.name)
      .input('Link', sideQuest.link ? sideQuest.link : null)
      .input('Venue', sideQuest.venue)
      .input('StartDate', sideQuest.startDate)
      .input('ExternalEvent', sideQuest.external ? sideQuest.external : 0)
      .input(
        'RegistrationRequired',
        sideQuest.registrationRequired ? sideQuest.registrationRequired : 0
      )
      .input('Restricted', sideQuest.restrictGroup.length ? true : false)
      .input('Description', sideQuest.description)
      .query(q, 'create-side-quest');

    let sideQuestId = fixCase(results.recordset)[0];
    sideQuestId = sideQuestId.sideQuestId;

    for (const group of sideQuest.restrictGroup) {
      await restrict_content(
        tx,
        group.groupName,
        sideQuestId,
        RESTRICTION_TYPE_ID
      );
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const update_side_quest = async (sideQuest) => {
  const tx = await transaction();
  try {
    await tx.begin();

    const sideQuestTypeId = await get_side_quest_id_from_code(tx, sideQuest.type);

    if (!sideQuestTypeId) {
      console.error('Side quest type does not exist.');
      await tx.rollback();
      return;
    }

    const restrictions = {
      sideQuestId: sideQuest.id,
      restrictions: sideQuest.restrictGroup,
    };

    const q = `
    UPDATE SideQuests
    SET SideQuestTypeId = @SideQuestTypeId, 
        Name = @Name,
        Link = @Link, 
        Venue = @Venue, 
        StartDate = @StartDate, 
        ExternalEvent = @ExternalEvent, 
        RegistrationRequired = @RegistrationRequired, 
        Restricted = @Restricted, 
        Description = @Description

    WHERE SideQuestId = @SideQuestId
  `;

    const request = tx.request();

    await request
      .input('SideQuestTypeId', sideQuestTypeId)
      .input('Name', sideQuest.name)
      .input('Link', sideQuest.link ? sideQuest.link : null)
      .input('Venue', sideQuest.venue)
      .input('StartDate', sideQuest.startDate)
      .input('ExternalEvent', sideQuest.external)
      .input('RegistrationRequired', sideQuest.registrationRequired)
      .input('Restricted', sideQuest.restricted)
      .input('Description', sideQuest.description)
      .input('SideQuestId', sideQuest.id)
      .query(q, 'update-side-quest');

    await DeleteExistingRestrictions(restrictions, tx);
    if (sideQuest.restricted) {
      await InsertRestrictions(restrictions, tx);
    }

    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};

const delete_side_quest = async (sideQuestId) => {
  const q = `
  DELETE FROM SideQuests
  WHERE SideQuestId = @SideQuestId
  `;

  const tx = await transaction();

  try {
    await tx.begin();

    const request = tx.request();

    await request
      .input('SideQuestId', sideQuestId)
      .query(q, 'delete-side-quest');

    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};

const get_side_quest_id_from_code = async (tx, code) => {
  const q = `
    SELECT SideQuestTypeId
    FROM SideQuestTypes
    WHERE Code = @Code
  `;

  const request = await tx.request();
  const results = await request
    .input('Code', code)
    .query(q, 'get-side-quest-id-from-type');

  const sideQuestId = fixCase(results.recordset)[0];

  return sideQuestId.sideQuestTypeId;
};

const create_side_quest_type = async (sideQuestType) => {
  let q = `
    SELECT TOP 1 SideQuestTypeId
    FROM SideQuestTypes
    ORDER BY SideQuestTypeId DESC
  `;

  let connection = await db();
  const results = await connection.timed_query(q, 'get-last-side-quest-type-id');

  const sideQuestTypeId = fixCase(results.recordset)[0];

  q = `
    INSERT INTO SideQuestTypes
    VALUES(@Id, @Code, @Name, @Icon, @Description)
  `;

  connection = await db();
  await connection
    .input('Id', parseInt(sideQuestTypeId.sideQuestTypeId) + 1)
    .input('Code', sideQuestType.code)
    .input('Name', sideQuestType.name)
    .input('Icon', sideQuestType.icon)
    .input('Description', sideQuestType.description)
    .timed_query(q, 'create-side-quest-type');
};

const update_side_quest_type = async (sideQuestType) => {
  const tx = await transaction();

  try {
    await tx.begin();

    const q = `
    UPDATE SideQuestTypes
    SET Name = @Name,
        Code = @Code,
        Icon = @Icon,
        Description = @Description
    WHERE SideQuestTypeId = @SideQuestTypeId
    `;

    const request = tx.request();

    await request
      .input('Name', sideQuestType.name)
      .input('Code', sideQuestType.code)
      .input('Icon', sideQuestType.icon)
      .input('Description', sideQuestType.description)
      .input('SideQuestTypeId', sideQuestType.id)
      .query(q, 'update-side-quest-type');

    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};

const get_side_quest_type_images = async () => {
  const q = `
    SELECT DISTINCT Icon
    FROM SideQuestTypes
  `;

  const connection = await db();
  const results = await connection.timed_query(q, 'get-side-quest-type-images');

  return fixCase(results.recordset);
};

const active_side_quest_types = async () => {
  const q = `
    SELECT DISTINCT s.SideQuestTypeId
    FROM SideQuests as s
  `;

  const request = await db();
  const results = await request.timed_query(q, 'active-level-up-types');
  return fixCase(results.recordset);
};

const getSideQuestUsers = async (id) => {
  const q = `
    SELECT u.UserSideQuestId, lower(u.UPN) AS upn, u.DateRegistered, u.DateCompleted, s.BBDUserName, s.DisplayName
    FROM UserSideQuests u
    INNER JOIN Staff s ON lower(u.UPN) = lower(s.UserPrincipleName)
    WHERE u.SideQuestId = @Id
    ORDER BY u.UPN ASC
  `;

  const request = await db();
  const results = await request
    .input('Id', id)
    .timed_query(q, 'getSideQuestUsers');

  return fixCase(results.recordset);
};

module.exports = {
  all_side_quests,
  available_side_quests,
  register_for_side_quest,
  completed_side_quests_by_type,
  get_side_quest_types,
  create_side_quest,
  update_side_quest,
  delete_side_quest,
  create_side_quest_type,
  update_side_quest_type,
  delete_side_quest_type,
  get_side_quest_type_images,
  active_side_quest_types,
  count_sidequest_mission,
  getSideQuestUsers,
};
