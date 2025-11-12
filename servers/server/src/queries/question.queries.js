const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const all_questions = async () => {
  const query = `
      select *
      from Questions
    `;

  const connection = await db();
  const result = await connection.timed_query(query, 'all_questions');

  return fixCase(result.recordset);
};

const all_answers = async () => {
  const query = `
        select *
        from QuestionAnswers
      `;

  const connection = await db();
  const result = await connection.timed_query(query, 'all_answers');

  return fixCase(result.recordset);
};

const current_user_answers = async (upn) => {
  const query = `
    WITH ranked_answers AS (
      SELECT
        q.*,
        ROW_NUMBER() OVER (PARTITION BY QuestionId ORDER BY DateCreated DESC) AS rn
      FROM UserAnswers AS q
      WHERE UserPrincipleName = @UPN
    )

    select
      QuestionId,
      QuestionAnswerId
    from ranked_answers
    where rn = 1
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'all_answers');

  return fixCase(result.recordset);
};

const insert_answers = async (upn, userAnswers) => {
  const tx = await transaction();

  try {
    await tx.begin();

    for (const answer of userAnswers) {
      const query = `
        INSERT INTO UserAnswers
          (UserPrincipleName, QuestionId, QuestionAnswerId, DateCreated)
        VALUES
          (LOWER(@UPN), @QuestionId, @QuestionAnswerId, getDate())
      `;

      const request = await tx.timed_request();

      await request
        .input('UPN', upn)
        .input('QuestionId', answer.questionId)
        .input('QuestionAnswerId', answer.questionAnswerId)
        .timed_query(query, 'insert_answers');
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

module.exports = {
  all_questions,
  all_answers,
  current_user_answers,
  insert_answers,
};
