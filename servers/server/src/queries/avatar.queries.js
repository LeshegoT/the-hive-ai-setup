const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const query = async (q, upn, query_name) => {
  const connection = await db();
  const results = await connection.input('UPN', upn).timed_query(q, query_name);

  return fixCase(results.recordset);
};

const user_avatar = async (upn) => {
  const result = await query(
    `    
    select 
      AvatarId,
      LevelId,
      Red,
      Green,
      Blue
    from Avatars
    where UPN= @UPN
  `,
    upn,
    'user_avatar'
  );

  return result[0];
};

const check_avatar = async (tx, upn) => {
  const q = `select * from Avatars where UPN = @UPN`;
  const request = await tx.timed_request();
  const results = await request.input('UPN', upn).timed_query(q, 'check_avatar');

  return fixCase(results.recordset)[0];
};

const user_avatar_parts = async (upn) =>
  await query(
    `
    select
      ap.AvatarPartId, 
      ap.PartId,
      ap.Active
    from AvatarParts ap
      inner join Avatars a on a.AvatarId = ap.AvatarId
    where a.UPN= @UPN
  `,
    upn,
    'user_avatar_parts'
  );

const update_avatar = async (upn, r, g, b, parts) => {
  const tx = await transaction();

  try {
    await tx.begin();

    await update_avatar_colour(tx, upn, r, g, b);
    await update_avatar_parts(tx, parts);

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const update_avatar_colour = async (tx, upn, r, g, b) => {
  const q = `
    update Avatars
      set Red = @Red,
      Green = @Green,
      Blue = @Blue
    where UPN = @UPN
  `;

  const request = await tx.timed_request();
  await request
    .input('Red', r)
    .input('Green', g)
    .input('Blue', b)
    .input('UPN', upn)
    .timed_query(q, 'update_avatar_colour');
};

const update_avatar_parts = async (tx, parts) => {
  for (const p of parts) {
    const q = `update AvatarParts set Active = @Active where AvatarPartId = @AvatarPartId`;

    const request = await tx.timed_request();

    await request
      .input('Active', p.active)
      .input('AvatarPartId', p.avatarPartId)
      .timed_query(q, 'update_avatar_parts');
  }
};

const create_user_avatar = async (tx, upn) => {
  const q = `
    insert into Avatars
    values (LOWER(@UPN), 1, 255, 255, 255)
    
    select *
    from Avatars
    where AvatarId = @@IDENTITY
  `;

  const request = await tx.timed_request();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'create_user_avatar');

  return fixCase(results.recordset)[0];
};

module.exports = {
  user_avatar,
  check_avatar,
  user_avatar_parts,
  update_avatar,
  create_user_avatar,
};
