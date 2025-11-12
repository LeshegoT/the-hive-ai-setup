const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const insertRetractReason = async (retractReason) => {
  const query = `
  insert into FeedbackRetractionReason (RetractionReason) values (@RetractionReason)
  SELECT scope_identity() AS  RetractionReasonID;
  `;

  const connection = await db();
  const result = await connection
    .input('RetractionReason', retractReason)
    .timed_query(query, 'insertRetractReason');
  return {
    retractionReasonID: result.recordset[0].RetractionReasonID,
    retractionReason: retractReason,
  };
};

const updateRetractReason = async (retractID, retractReason) => {
  const query = `
  UPDATE FeedbackRetractionReason
  SET
  RetractionReason =@RetractionReason
  WHERE RetractionReasonID = @RetractionReasonID;
  `;
  const connection = await db();
  const result = await connection
    .input('RetractionReasonID', retractID)
    .input('RetractionReason', retractReason)
    .timed_query(query, 'updateRetractReason');
  return result.recordset;
};

const deleteRetractReason = async (retractID, upn) => {
  const query = `
  UPDATE FeedbackRetractionReason
  SET
  DeletedDate=GETDATE(),
  DeletedBy=@DeletedBy
  WHERE RetractionReasonID = @RetractionReasonID;
  `;
  const connection = await db();
  await connection
    .input('RetractionReasonID', retractID)
    .input('DeletedBy', upn)
    .timed_query(query, 'deleteRetractReason');
};

const getAllRetractReason = async () => {
  const query = `
        SELECT RetractionReasonID,RetractionReason
        FROM FeedbackRetractionReason
        WHERE DeletedDate IS NULL
        ORDER BY RetractionReasonID ASC;
    `;
  const connection = await db();
  const results = await connection.timed_query(query, 'getAllRetractReason');

  return fixCase(results.recordset);
};

const getRetractionReason = async (retractID) => {
  const query = `
        SELECT RetractionReasonID,RetractionReason
        FROM FeedbackRetractionReason
        WHERE RetractionReasonID = @RetractionReasonID;
    `;
  const connection = await db();
  const result = await connection
    .input('RetractionReasonID', retractID)
    .timed_query(query, 'getRetractionReason');
  return result.recordset;
};

module.exports = {
  insertRetractReason,
  updateRetractReason,
  deleteRetractReason,
  getAllRetractReason,
  getRetractionReason,
};
