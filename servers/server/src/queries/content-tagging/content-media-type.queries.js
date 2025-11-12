const { db } = require('../../shared/db');
const fixCase = require('../../shared/fix-case');

const getMediaTypes = async () => {
  const connection = await db();
  const query =
    'SELECT ContentMediaTypeId, Description FROM ContentMediaType T';
  const result = await connection.timed_query(query, 'all-content-media-types');
  return fixCase(result.recordset);
};

const getMediaType = async (mediaTypeId) => {
  if (!mediaTypeId) {
    return getMediaTypes();
  } else {
    const query = `SELECT ContentMediaTypeId, Description
      FROM ContentMediaType T
      where T.ContentMediaTypeId = @TYPE_ID
    `;
    const connection = await db();
    const result = await connection
      .input('TYPE_ID', mediaTypeId)
      .timed_query(query, 'media-type-by-id');

    return result.recordset ? fixCase(result.recordset)[0] : undefined;
  }
};

const deleteMediaType = async (tx, typeId) => {
  const request = await tx.timed_request();
  const query = `DELETE FROM ContentMediaType
    WHERE ContentMediaTypeId = @MEDIA_TYPE`;
  const result = await request
    .input('MEDIA_TYPE', typeId)
    .timed_query(query, 'delete-content-media-type');
  return result.rowsAffected[0];
};

module.exports = {
  getMediaTypes,
  getMediaType,
  deleteMediaType,
};
