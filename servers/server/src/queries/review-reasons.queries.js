const fixCase = require('../shared/fix-case');
const { db } = require('../shared/db');

const getReviewReasons = async () => {
  const query = 'SELECT ReviewReasonsId,Reason FROM ReviewReasons';
  const connection = await db();
  const results = await connection.timed_query(query, 'getReviewReasons');
  return fixCase(results.recordset);
};

const findReviewReasonId = async (reason) => {
  const query =
    'SELECT ReviewReasonsId FROM ReviewReasons WHERE Reason = @Reason';
  const connection = await db();
  const results = await connection
    .input('Reason', reason)
    .timed_query(query, 'findReviewReasonId');
  return fixCase(results.recordset)[0].reviewReasonsId;
};

const addHRReviewReason = async (
  tx,
  reason,
  createdBy,
  reviewId,
  specialCaseReason = undefined
) => {
  const reviewReasonId = await findReviewReasonId(reason);
  const specialCaseReasonId = await findReviewReasonId('Special Case');

  if (reviewReasonId === specialCaseReasonId && !specialCaseReason) {
    throw new Error('Please enter special case reason');
  }

  const query = `
    INSERT INTO ReviewHRReasons (DateCreated, CreatedBy, SpecialCaseReason,ReviewReasonsId,ReviewId)
    VALUES (GETDATE(), @createdBy, @SpecialCaseReason,@ReviewReasonsId,@ReviewId);
    `;
  const connection = await tx.timed_request();

  await connection
    .input('CreatedBy', createdBy)
    .input('SpecialCaseReason', specialCaseReason)
    .input('ReviewReasonsId', reviewReasonId)
    .input('ReviewId', reviewId)
    .timed_query(query, 'addHRReviewReason');
};

module.exports = {
  addHRReviewReason,
  getReviewReasons,
};
