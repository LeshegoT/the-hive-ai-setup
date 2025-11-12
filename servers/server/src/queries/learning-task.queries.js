const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const insert_learning_task = async (
  tx,
  upn,
  messageId,
  messageTypeId,
  dateCompleted,
  link,
  timeSpent,
  title
) => {
  const q = `
    INSERT INTO LearningTasks 
      ( 
        UserPrincipleName, 
        MessageId, 
        MessageTypeId,
        CreatedDate,
        DateCompleted,
        Link,
        TimeSpent,
        Title
      )
    VALUES
      (
        LOWER(@UPN),
        @MessageId,
        @MessageTypeId,
        getDate(),
        @DateCompleted,
        @Link,
        @TimeSpent,
        @Title
      )

      select Description as Context from MessageTypes where MessageTypeId = @MessageTypeId
    `;
  console.log('inside: ', title);
  const request = await tx.timed_request();
  const context = await request
    .input('UPN', upn)
    .input('MessageId', messageId)
    .input('MessageTypeId', messageTypeId)
    .input('DateCompleted', dateCompleted)
    .input('Link', link)
    .input('TimeSpent', timeSpent)
    .input('Title', title)
    .timed_query(q, 'insert_learning_task');

  return fixCase(context.recordset)[0];
};

const user_learning_tasks = async (upn) => {
  const q = `select * from LearningTasks where UserPrincipleName = @UPN`;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'user_learning_tasks');

  return fixCase(result.recordset);
};

module.exports = {
  insert_learning_task,
  user_learning_tasks,
};
