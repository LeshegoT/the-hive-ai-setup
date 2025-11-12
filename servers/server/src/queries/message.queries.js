const { db, transaction, logger } = require('../shared/db');
const { insert_learning_task } = require('../queries/learning-task.queries');
const { createContent } = require('../shared/create-content');
const fixCase = require('../shared/fix-case');
const number_of_rows_at_a_time = 20;

const user_messages = async (
  upn,
  offset,
  questId,
  missionId,
  courseId,
  sideQuestId
) => {
  const q = `
    with HeroMessages (
      MessageId,
      MessageTypeId,
      HeroUserPrincipleName,
      CreatedByUserPrincipleName,
      CreationDate,
      Text,
      QuestId,
      MissionId,
      CourseId,
      SideQuestId,
      SelfDirected
    )
    as
    (
      select
        m.MessageId,
        m.MessageTypeId,
        m.HeroUserPrincipleName,
        m.CreatedByUserPrincipleName,
        m.CreationDate,
        m.Text,
        qm.QuestId,
        mm.MissionId,
        cm.CourseId,
        sqm.SideQuestId,
        mt.SelfDirected
      from Messages m
        left join QuestMessages qm on m.MessageId = qm.MessageId
        left join MissionMessages mm on m.MessageId = mm.MessageId
        left join CourseMessages cm on m.MessageId = cm.MessageId
        left join SideQuestMessages sqm on m.MessageId = sqm.MessageId
        left join MessageTypes mt on m.MessageTypeId = mt.MessageTypeId
      where m.HeroUserPrincipleName = @UPN
        and (@QuestId is null or qm.QuestId = @QuestId)
        and (@MissionId is null or mm.MissionId = @MissionId)
        and (@CourseId is null or cm.CourseId = @CourseId)
        and (@SideQuestId is null or sqm.SideQuestId = @SideQuestId)
        and (m.MessageTypeId != 15)
    )

    select DISTINCT *
    from (
        select
          hm.*,
          q.Goal as Name,
          mt.Icon,
          null as Code,
          null as Link,
          null as Title
        from Quests q
          inner join HeroMessages hm
            on hm.QuestId = q.QuestId
          left join MessageTypes mt
            on hm.MessageTypeId = mt.MessageTypeId
        where hm.QuestId is not null
      union all
        select
          hm.*,
          m.Name,
          mt.Icon,
          mt.Code,
          null as Link,
          null as Title
        from Missions m
          inner join HeroMessages hm
            on hm.MissionId = m.MissionId
          inner join MissionTypes mt
          on mt.MissionTypeId = m.MissionTypeId
        where hm.MissionId is not null
      union all
        select
          hm.*,
          c.Name,
          c.Icon,
          c.Code,
          null as Link,
          null as Title
        from Courses c
          inner join HeroMessages hm
            on hm.CourseId = c.CourseId
        where hm.CourseId is not null
          and hm.MissionId is null
      union all
        select
          hm.*,
          sq.Name,
          sqt.Icon,
          sqt.Code,
          sq.Link,
          null as Title
        from SideQuests sq
          inner join HeroMessages hm
            on hm.SideQuestId = sq.SideQuestId
          inner join SideQuestTypes sqt
            on sq.SideQuestTypeId = sqt.SideQuestTypeId
        where hm.SideQuestId is not null
          and hm.QuestId is null
          and hm.MissionId is null
          and hm.CourseId is null
      union all
        select
          hm.*,
          mt.Description as Name,
          mt.Icon,
          mt.Code,
          lt.Link,
          lt.Title
        from MessageTypes mt
          inner join HeroMessages hm
            on hm.MessageTypeId = mt.MessageTypeId
          inner join LearningTasks lt
            on lt.MessageId = hm.MessageId
        where hm.MessageTypeId is not null
          and hm.QuestId is null
          and hm.MissionId is null
          and hm.CourseId is null
          and hm.SideQuestId is null
          and hm.SelfDirected = 1
      union all
        select
          hm.*,
          null as Name,
          null as Icon,
          null as Code,
          null as link,
          null as Title
        from HeroMessages hm
        where hm.SelfDirected = 0
          and hm.QuestId is null
          and hm.MissionId is null
          and hm.CourseId is null
          and hm.SideQuestId is null
    )results
    order by CreationDate desc
    offset @offset rows
    fetch next @next row only
  `;

  console.warn(
    `Offset: ${
      offset * number_of_rows_at_a_time
    }; Next: ${number_of_rows_at_a_time}`
  );
  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .input('offset', offset * number_of_rows_at_a_time)
    .input('next', number_of_rows_at_a_time)
    .input('QuestId', questId)
    .input('MissionId', missionId)
    .input('CourseId', courseId)
    .input('SideQuestId', sideQuestId)
    .timed_query(q, 'user_messages');

  return fixCase(results.recordset);
};

const create_message = async (
  messageTypeId,
  heroUserPrincipleName,
  createdByUserPrincipleName,
  text,
  questId,
  missionId,
  sideQuestId,
  courseId,
  dateCompleted,
  link,
  timeSpent,
  title,
  content
) => {
  const tx = await transaction();

  try {
    await tx.begin();
    ///// TITLE HERE
    // TODO:
    const request = await tx.timed_request();

    const message = await insert_message(
      request,
      messageTypeId,
      heroUserPrincipleName,
      createdByUserPrincipleName,
      text
    );
    let insertedMessage = null;
    let context = '';
    let icon = '';
    if (questId) {
      insertedMessage = await insert_quest_message(
        tx,
        message.messageId,
        questId
      );
      context = 'Quest: ' + insertedMessage.context;
    }
    if (missionId) {
      insertedMessage = await insert_mission_message(
        request,
        message.messageId,
        missionId
      );
      context = 'Mission: ' + insertedMessage.context;

      const q = `
        select Icon
        from MissionTypes
        where MissionTypeId = @MissionTypeId
      `;
      const missionIconResult = await request
        .input('MissionTypeId', insertedMessage.missionTypeId)
        .timed_query(q, 'get_icon');

      icon = fixCase(missionIconResult.recordset)[0].icon;
    }
    if (courseId) {
      insertedMessage = await insert_course_message(
        request,
        message.messageId,
        courseId
      );
      context = 'Course: ' + insertedMessage.context;
      icon = insertedMessage.icon;
    }
    if (sideQuestId) {
      insertedMessage = await insert_side_quest_message(
        tx,
        message.messageId,
        sideQuestId
      );
      context = 'Side Quest: ' + insertedMessage.context;

      const q = `
        select Icon
        from SideQuestTypes
        where SideQuestTypeId = @SideQuestTypeId
      `;
      const sideQuestIconResult = await request
        .input('SideQuestTypeId', insertedMessage.sideQuestTypeId)
        .timed_query(q, 'get_icon');

      icon = fixCase(sideQuestIconResult.recordset)[0].icon;
    }
    const messageType = await message_type(tx, messageTypeId);
    if (messageType.selfDirected) {
      insertedMessage = await insert_learning_task(
        tx,
        heroUserPrincipleName,
        message.messageId,
        messageTypeId,
        dateCompleted,
        link,
        timeSpent,
        title
      );
      context = insertedMessage.context;
    }
    const name = insertedMessage
      ? insertedMessage.context || 'Conversation'
      : 'Conversation';
    context = context || 'Conversation';

    if (!icon) {
      const q = `
        select Icon
        from MessageTypes
        where MessageTypeId = @MessageType
      `;
      const messageIconResult = await request
        .input('MessageType', messageTypeId)
        .timed_query(q, 'get_icon');

      icon = fixCase(messageIconResult.recordset)[0].icon;
    }

    let newContent;
    if (content) {
      newContent = await createContent(tx, content);
    }

    await tx.commit();
    return {
      ...message,
      name: name,
      context: context,
      selfDirected: messageType.selfDirected,
      icon,
      content: newContent,
    };
  } catch (error) {
    logger.error({message: "Rolling back transaction", error});
    await tx.rollback();
  }
};

const insert_message = async (
  request,
  messageTypeId,
  heroUserPrincipleName,
  createdByUserPrincipleName,
  text
) => {
  const q = `
    insert into Messages
      (
        MessageTypeId,
        HeroUserPrincipleName,
        CreatedByUserPrincipleName,
        CreationDate,
        Text
      )
    values
      (
        @MessageTypeId,
        LOWER(@HeroUserPrincipleName),
        LOWER(@CreatedByUserPrincipleName),
        getdate(),
        @Text
      )

    select top 1 *
    from Messages
    where MessageId = @@IDENTITY
  `;

  const results = await request
    .input('MessageTypeId', messageTypeId)
    .input('HeroUserPrincipleName', heroUserPrincipleName)
    .input('CreatedByUserPrincipleName', createdByUserPrincipleName)
    .input('Text', text)
    .timed_query(q, 'insert_message');

  const message = fixCase(results.recordset)[0];

  return message;
};

const insert_message_no_tx = async (
  messageTypeId,
  heroUserPrincipleName,
  createdByUserPrincipleName,
  text
) => {
  const connection = await db();
  const message = await insert_message(
    connection,
    messageTypeId,
    heroUserPrincipleName,
    createdByUserPrincipleName,
    text
  );
  return message;
};

const insert_quest_message = async (tx, messageId, questId) => {
  const q = `
  insert into QuestMessages values (@MessageId, @QuestId)
  select Goal as Context from Quests where QuestId = @QuestId
  `;

  const request = tx ? await tx.timed_request() : await db();
  const context = await request
    .input('MessageId', messageId)
    .input('QuestId', questId)
    .timed_query(q, 'insert_quest_message');

  return fixCase(context.recordset)[0];
};

const insert_mission_message = async (request, messageId, missionId) => {
  const q = `
  insert into MissionMessages values (@MessageId, @MissionId)
  select Name as Context, MissionTypeId from Missions where MissionId = @MissionId
  `;

  const context = await request
    .input('MessageId', messageId)
    .input('MissionId', missionId)
    .timed_query(q, 'insert_mission_message');

  return fixCase(context.recordset)[0];
};

const insert_mission_message_no_tx = async (messageId, missionId) => {
  const connection = await db();
  await insert_mission_message(connection, messageId, missionId);
};

const insert_course_message = async (request, messageId, courseId) => {
  const q = `
  insert into CourseMessages values (@MessageId, @CourseId)
  select Name as Context, Icon from Courses where CourseId = @CourseId
  `;

  const context = await request
    .input('MessageId', messageId)
    .input('CourseId', courseId)
    .timed_query(q, 'insert_course_message');

  return fixCase(context.recordset)[0];
};

const insert_course_message_no_tx = async (messageId, courseId) => {
  const connection = await db();
  await insert_course_message(connection, messageId, courseId);
};

const insert_side_quest_message = async (tx, messageId, sideQuestId) => {
  const q = `
  insert into SideQuestMessages values (@MessageId, @SideQuestId)
  select Name as Context, SideQuestTypeId from SideQuests where SideQuestId = @SideQuestId
  `;

  const request = await tx.timed_request();
  const context = await request
    .input('MessageId', messageId)
    .input('SideQuestId', sideQuestId)
    .timed_query(q, 'insert_side_quest_message');

  return fixCase(context.recordset)[0];
};

const message_type = async (tx, messageTypeId) => {
  const q = `select * from MessageTypes where MessageTypeId = @MessageTypeId`;

  const request = await tx.timed_request();
  const results = await request
    .input('MessageTypeId', messageTypeId)
    .timed_query(q, 'message_type');

  return fixCase(results.recordset)[0];
};

const learning_tasks_by_type = async (upn, code) => {
  const q = `
    select *
    from LearningTasks lt
    inner join MessageTypes mt
      on lt.MessageTypeId = mt.MessageTypeId and SelfDirected = 1
    left outer join Points p
      on lt.UserPrincipleName = p.UserPrincipleName and lt.LearningTaskId = p.LinkId and p.DeletedBy is null
    left outer join PointTypes pt
      on p.PointTypeId = pt.PointTypeId and pt.Code = @Code
    where lt.UserPrincipleName = @UPN
    and mt.Code = @Code
    and p.LinkId is null
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .input('Code', code)
    .timed_query(q, 'learning_tasks_by_type');

  return fixCase(result.recordset);
};

const allHeroMessages = async (upn) => {
  const q = `
    Select * from Messages m
    Inner Join MessageTypes mt ON mt.MessageTypeId = m.MessageTypeId and mt.MessageTypeId not in (15)
    Where HeroUserPrincipleName = @UPN
    Or CreatedByUserPrincipleName = @UPN
    Order by CreationDate desc
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'allHeroMessages');

  return fixCase(result.recordset);
};

const find_system_message = async (upn, courseId) => {
  const q = `
    select m.MessageId
    from Messages m
    inner join CourseMessages cm on m.MessageId = cm.MessageId
    where CreatedByUserPrincipleName = 'System'
    and HeroUserPrincipleName = @UPN
    and CourseId = @CourseId
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .input('CourseId', courseId)
    .timed_query(q, 'find_system_messages');
  const message = fixCase(results.recordset)[0];

  return message;
};

const all_messages_during_quest = async (hero, questId) => {
  let q = `
    SELECT StartDate, EndDate
    FROM Quests
    WHERE QuestId=@QuestId
  `;

  let connection = await db();
  let results = await connection
    .input('QuestId', questId)
    .timed_query(q, 'quest_dates');

  const startDate = results.recordset[0].StartDate;
  const endDate = results.recordset[0].EndDate;

  q = `
    WITH HeroMessages (
      MessageId,
      MessageTypeId,
      HeroUserPrincipleName,
      CreatedByUserPrincipleName,
      CreationDate,
      Text,
      QuestId,
      MissionId,
      CourseId,
      SideQuestId,
      SelfDirected
    )
    AS
    (
      SELECT
        m.MessageId,
        m.MessageTypeId,
        m.HeroUserPrincipleName,
        m.CreatedByUserPrincipleName,
        m.CreationDate,
        m.Text,
        qm.QuestId,
        mm.MissionId,
        cm.CourseId,
        sqm.SideQuestId,
        mt.SelfDirected
      FROM Messages AS m
        left join QuestMessages qm on m.MessageId = qm.MessageId
        left join MissionMessages mm on m.MessageId = mm.MessageId
        left join CourseMessages cm on m.MessageId = cm.MessageId
        left join SideQuestMessages sqm on m.MessageId = sqm.MessageId
        left join MessageTypes mt on m.MessageTypeId = mt.MessageTypeId
      WHERE CreationDate > ' 2020-07-17T11:41:29.117Z' AND CreationDate < '2020-11-17T00:00:00.000Z' AND CreatedByUserPrincipleName='lucky@bbd.co.za' OR HeroUserPrincipleName='lucky@bbd.co.za'
    )

  select DISTINCT *
    from (
        select
          hm.*,
          q.Goal as Name,
          mt.Icon,
          null as Code,
          null as Link,
          null as Title
        from Quests q
          inner join HeroMessages hm
            on hm.QuestId = q.QuestId
          left join MessageTypes mt
            on hm.MessageTypeId = mt.MessageTypeId
        where hm.QuestId is not null
      union all
        select
          hm.*,
          m.Name,
          mt.Icon,
          mt.Code,
          null as Link,
          null as Title
        from Missions m
          inner join HeroMessages hm
            on hm.MissionId = m.MissionId
          inner join MissionTypes mt
          on mt.MissionTypeId = m.MissionTypeId
        where hm.MissionId is not null
      union all
        select
          hm.*,
          c.Name,
          c.Icon,
          c.Code,
          null as Link,
          null as Title
        from Courses c
          inner join HeroMessages hm
            on hm.CourseId = c.CourseId
        where hm.CourseId is not null
          and hm.MissionId is null
      union all
        select
          hm.*,
          sq.Name,
          sqt.Icon,
          sqt.Code,
          sq.Link,
          null as Title
        from SideQuests sq
          inner join HeroMessages hm
            on hm.SideQuestId = sq.SideQuestId
          inner join SideQuestTypes sqt
            on sq.SideQuestTypeId = sqt.SideQuestTypeId
        where hm.SideQuestId is not null
          and hm.QuestId is null
          and hm.MissionId is null
          and hm.CourseId is null
      union all
        select
          hm.*,
          mt.Description as Name,
          mt.Icon,
          mt.Code,
          lt.Link,
          lt.Title
        from MessageTypes mt
          inner join HeroMessages hm
            on hm.MessageTypeId = mt.MessageTypeId
          inner join LearningTasks lt
            on lt.MessageId = hm.MessageId
        where hm.MessageTypeId is not null
          and hm.QuestId is null
          and hm.MissionId is null
          and hm.CourseId is null
          and hm.SideQuestId is null
          and hm.SelfDirected = 1
      union all
        select
          hm.*,
          null as Name,
          null as Icon,
          null as Code,
          null as link,
          null as Title
        from HeroMessages hm
        where hm.SelfDirected = 0
          and hm.QuestId is null
          and hm.MissionId is null
          and hm.CourseId is null
          and hm.SideQuestId is null
    )results
  `;

  connection = await db();
  results = await connection
    .input('StartDate', startDate)
    .input('EndDate', endDate)
    .input('UPN', hero)
    .timed_query(q, 'all_messages_during_quest');

  return fixCase(results.recordset);
};

const insert_peer_feedback_reply = async (reply, messageId) => {
  const q = `
  UPDATE Messages SET Reply = @Reply WHERE MessageId = @MessageId
  `;

  const connection = await db();
  const context = await connection
    .input('Reply', reply)
    .input('MessageId', messageId)
    .timed_query(q, 'insert_peer_feedback_reply');

  return context.recordset;
};

const update_peer_feedback_publish = async (messageId) => {
  const query = `
  UPDATE Messages
  SET Published = CASE
        WHEN Published = 1 THEN 0
        WHEN Published = 0 THEN 1
        ELSE 0
      END
  WHERE MessageId = @MessageId;
  `;
  const connection = await db();
  const result = await connection
    .input('MessageId', messageId)
    .timed_query(query, 'update_peer_feedback_publish');
  return result.recordset;
};

const isUsersMessage = async (messageId, upn) => {
  const q = `
    SELECT 1 AS "isAuthorized"
    FROM Messages m
    WHERE m.MessageTypeId = 15
    AND m.MessageId=@messageId AND m.HeroUserPrincipleName = @upn
  `;

  const connection = await db();
  const result = await connection
    .input('messageId', messageId)
    .input('upn', upn)
    .timed_query(q, 'check-if-user-owns-message');

  if (result.recordset[0]?.isAuthorized) {
    return fixCase(result.recordset)[0].isAuthorized;
  } else {
    return 0;
  }
};

module.exports = {
  user_messages,
  learning_tasks_by_type,
  create_message,
  allHeroMessages,
  find_system_message,
  insert_mission_message_no_tx,
  insert_message_no_tx,
  insert_course_message_no_tx,
  all_messages_during_quest,
  insert_peer_feedback_reply,
  update_peer_feedback_publish,
  isUsersMessage,
};
