const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const insert_user_login = async (tx, uiid) => {
  const q = `
    insert into UserLogins
    (
      LoginDate,
      UserInteractionID
    )
    values
    (
      getdate(),
      @UserInteractionID
    )
    `;

  const connection = await tx.timed_request();
  await connection
    .input('UserInteractionID', uiid)
    .query(q, 'insert_user_login');
};

const all_logins_for_today = async () => {
  const q = `
      select ui.HeroUserPrincipleName, ul.LoginDate 
      from UserInteractions ui 
      inner join UserLogins ul
      on ui.UserInteractionID = ul.UserInteractionID
	    where ul.LoginDate = CAST(GETDATE() as DATE)
    `;

  const connection = await db();
  const result = await connection.timed_query(q, 'all_logins_for_today');
  return fixCase(result.recordset);
};

const latestLogin = async (upn) => {
  const q = `
      SELECT CAST( MAX(ul.LoginDate) AS DATE) AS LastLogin
      FROM UserInteractions ui 
      INNER JOIN UserLogins ul ON ui.UserInteractionID = ul.UserInteractionID
      WHERE ui.HeroUserPrincipleName = @UPN
      GROUP BY ui.HeroUserPrincipleName
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'latest_login ');
  const last_login = fixCase(result.recordset)[0];
  if (last_login) {
    return last_login.lastLogin;
  }
  else {
    return new Date(0);
  }
};

module.exports = {
  insert_user_login,
  all_logins_for_today,
  latestLogin,
};
