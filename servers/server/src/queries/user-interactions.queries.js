const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const get_interaction_type = async (tx, typeCode) => {
  const q = `
    select it.InteractionTypeID 
        from InteractionTypes as it
        where it.InteractionCode = @TypeCode
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('TypeCode', typeCode)
    .query(q, 'get_interaction_type');
  return result.recordset[0].InteractionTypeID;
};

const insert_user_interaction = async (tx, UPN, typeCode) => {
  const q = `
    insert into UserInteractions
    (
        InteractionTypeID,
        HeroUserPrincipleName,
        InteractionDate
    )
    values
    (
        @TypeCode,
        LOWER(@UPN),
        getdate()
    )
    
    select scope_identity() as uiid;
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('TypeCode', typeCode)
    .input('UPN', UPN)
    .query(q, 'insert_user_interaction');

  return result.recordset[0].uiid;
};

const user_interactions = async (UPN) => {
  const q = `
      select * 
      from UserInteractions as ui
      where ui.HeroUserPrincipleName = @UPN
    `;

  const request = await db();
  const result = await request
    .input('UPN', UPN)
    .timed_query(q, 'user_interactions');
  return fixCase(result.recordset);
};

const interaction_types = async () => {
  const q = `
        select * from InteractionTypes
    `;

  const request = await db();
  const result = await request.timed_query(q, 'interaction_types');
  return fixCase(result.recordset);
};

module.exports = {
  get_interaction_type,
  user_interactions,
  interaction_types,
  insert_user_interaction,
};
