const { db } = require('../shared/db');

const insert_profile_ranking = async (upn, position, points) => {
  const q = `
    INSERT INTO PastProfileRankings (
        UserPrincipleName,
        CreatedDate,
        RankPosition,
        RankPoints
    ) VALUES (
        LOWER(@UPN),
        getDate(),
        @Position,
        @Points
    )
    `;

  const connection = await db();
  await connection
    .input('UPN', upn)
    .input('Position', position)
    .input('Points', points)
    .timed_query(q, 'insert_profile_ranking');
};

const last_month_ranking = async (upn) => {
  const q = `
    SELECT TOP 1
        UserPrincipleName,
        CreatedDate,
        RankPosition,
        RankPoints
    FROM PastProfileRankings
    WHERE UserPrincipleName = @UPN
    AND CreatedDate < DATEADD(month, -1, GETDATE())
    ORDER BY CreatedDate
    `;

  const connection = await db();
  await connection.input('UPN', upn).timed_query(q, 'last_month_ranking');
};

module.exports = {
  insert_profile_ranking,
  last_month_ranking
};
