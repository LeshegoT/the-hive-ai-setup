const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const assign_facilitators = async (upns, levelUpId) => {
  const tx = await transaction();

  const exists_q = `
  SELECT *
  FROM LevelUpFacilitators
  WHERE UserPrincipleName = @UPN
  AND LevelUpId = @LevelUpId
  `;

  const q = `
  INSERT INTO LevelUpFacilitators
  (UserPrincipleName, LevelUpId)
  VALUES
  (@UPN, @LevelUpId)
  `;

  try {
    await tx.begin();

    for (const upn of upns) {
      await tx.timed_request();

      const request = await tx.request();
      const existing = await request
        .input('UPN', upn)
        .input('LevelUpId', levelUpId)
        .query(exists_q, 'get_facilitator');

      if (existing.recordset.length) continue;

      await request.query(q, 'assign_facilitators');
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const levelUpFacilitators = async (levelUpId) => {
  const q = `
    SELECT f.UserPrincipleName, BBDUserName AS bbdUserName, DisplayName, JobTitle, Office FROM (
        SELECT UserPrincipleName
        FROM LevelUpFacilitators
        WHERE LevelUpId = @LevelUpId
    ) f LEFT JOIN DecoratedStaff s ON f.UserPrincipleName = s.UserPrincipleName
  `;

  const connection = await db();
  const result = await connection
    .input('LevelUpId', levelUpId)
    .timed_query(q, 'level_up_facilitators');

  return fixCase(result.recordset);
};

const remove_facilitator = async (upn, levelUpId) => {
  const q = `
    DELETE
    FROM LevelUpFacilitators
    WHERE LevelUpId = @LevelUpId
    AND UserPrincipleName = @UPN
  `;

  const connection = await db();
  await connection
    .input('LevelUpId', levelUpId)
    .input('UPN', upn)
    .timed_query(q, 'remove_facilitator');
};

module.exports = {
  assign_facilitators,
  remove_facilitator,
  levelUpFacilitators,
};
