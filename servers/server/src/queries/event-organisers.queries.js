const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const getEventOrganisers = async () => {
  const q = `
    SELECT EventOrganiserId, Upn 
    FROM EventOrganisers
    WHERE DeletedDate IS NULL`;

  const request = await db();
  const result = await request.timed_query(q, 'getEventOrganisers');

  return fixCase(result.recordset);
};

const addEventOrganiser = async (upn) => {
  const q = `
    INSERT INTO EventOrganisers (Upn)
    OUTPUT INSERTED.EventOrganiserId, INSERTED.Upn
    VALUES (@Upn)`;

  const connection = await db();
  const result = await connection
    .input('Upn', upn)
    .timed_query(q, 'addEventOrganiser');

  return fixCase(result.recordset)[0];
};

const removeEventOrganiser = async (deletedBy, eventOrganiserId) => {
  const q = `
    UPDATE EventOrganisers
    SET DeletedDate = GETDATE(),
        DeletedBy = @DeletedBy
    WHERE EventOrganiserId = @EventOrganiserId`;

  const connection = await db();
  await connection
    .input('DeletedBy', deletedBy)
    .input('EventOrganiserId', eventOrganiserId)
    .timed_query(q, 'removeEventOrganiser');
};

module.exports = {
  getEventOrganisers,
  addEventOrganiser,
  removeEventOrganiser,
};
