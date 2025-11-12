const { db } = require('../../shared/db');
const fixCase = require('../../shared/fix-case');

const getRatingValues = async () => {
  const connection = await db();
  const query =
    'SELECT RatingValueId, Description, Score FROM ContentRatingValue T';
  const result = await connection.timed_query(query, 'all-rating-valuess');
  return fixCase(result.recordset);
};

const findExistingRating = async (contentId, upn) => {
  const query = `SELECT RatingId
      FROM ContentRating CR
      WHERE CR.ContentId = @CONTENT_ID AND CR.UPN = @UPN
    `;
  const connection = await db();
  const result = await connection
    .input('CONTENT_ID', contentId)
    .input('UPN', upn)
    .timed_query(query, 'rating-by-content-and-upn');

  return result.recordset.length
    ? fixCase(result.recordset)[0].ratingId
    : undefined;
};

const rateContent = async (tx, contentId, upn, ratingValueId) => {
  const contentRatingId = await findExistingRating(contentId, upn);
  const updateQuery = `UPDATE ContentRating
    SET RatingValueId = @VALUE_ID
    WHERE RatingId = @RATING_ID
    `;
  const request = await tx.request();

  if (contentRatingId) {
    await request
      .input('RATING_ID', contentRatingId)
      .input('VALUE_ID', ratingValueId)
      .query(updateQuery, 'update-rating');
    return contentRatingId;
  }

  const insertQuery = `INSERT INTO ContentRating(ContentId, UPN, RatingValueId) OUTPUT INSERTED.RatingId
    VALUES (@CONTENT_ID, @UPN, @VALUE_ID)`;
  const result = await request
    .input('CONTENT_ID', contentId)
    .input('UPN', upn)
    .input('VALUE_ID', ratingValueId)
    .query(insertQuery, 'insert-rating');
  return result.recordset.length
    ? fixCase(result.recordset)[0].ratingId
    : undefined;
};

const getContentRatings = async (contentId) => {
  const query = `SELECT RatingId
    FROM ContentRating
    WHERE ContentId = @CONTENT_ID
    `;
  const connection = await db();
  const result = await connection
    .input('CONTENT_ID', contentId)
    .timed_query(query, 'ratings-by-content');

  return fixCase(result.recordset);
};

const removeContentRatings = async (tx, contentId) => {
  const request = await tx.request();
  const query = `DELETE
    FROM ContentRating
    WHERE contentId = @CONTENT_ID
  `;
  await request.input('CONTENT_ID', contentId).query(query, 'remove-tag');
};

const averageContentRating = async (contentId) => {
  const query = `SELECT AVG(Score) As AverageScore
  FROM ContentRating AS cr
  LEFT JOIN ContentRatingValue AS crv
  ON cr.RatingValueId = crv.RatingValueId
  WHERE cr.ContentId = @CONTENT_ID
  `;

  const connection = await db();
  const result = await connection
    .input('CONTENT_ID', contentId)
    .timed_query(query, 'content-average-rating');
  return result.recordset[0];
};

module.exports = {
  getRatingValues,
  rateContent,
  removeContentRatings,
  averageContentRating,
  getContentRatings,
};
