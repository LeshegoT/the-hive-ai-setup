const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const insertGuideNotification = async (tx, questId, type) => {
  const q = `
    if not exists (select * from GuideNotifications where QuestId = @QuestId)
    begin
      insert into GuideNotifications
      (
        QuestId,
        DateCreated,
        NotificationTypeId,
        Resolved
      )
      values
      (
        @QuestId,
        GETDATE(),
        (select Top(1) NotificationTypeId from NotificationTypes where Name = @Type),
        0
      )
    end
  `;

  const request = await tx.timed_request();
  await request
    .input('QuestId', questId)
    .input('Type', type)
    .timed_query(q, 'insertGuideNotification');
};

const getGuideNotifications = async (upn) => {
  const q = `
    select
      gn.*
    from GuideNotifications gn
      inner join Quests q
        on gn.QuestId = q.QuestId
    where q.GuideUserPrincipleName = @UPN
  `;
  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'getGuideNotifications');

  return fixCase(result.recordset);
};

const resolveGuideNotification = async (questId) => {
  const q = `
    update GuideNotifications
      set Resolved = 1
    where QuestId = @QuestId
  `;

  const connection = await db();
  await connection
    .input('QuestId', questId)
    .timed_query(q, 'resolveGuideNotification');
};

module.exports = {
  insertGuideNotification,
  getGuideNotifications,
  resolveGuideNotification,
};
