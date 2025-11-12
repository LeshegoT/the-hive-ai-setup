const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const query = async (query, upn, name) => {
  const connection = await db();
  const result = await connection.input('UPN', upn).timed_query(query, name);

  return fixCase(result.recordset);
};

const userGroups = async (user) =>
  query(
    `select distinct g.GroupName
    from Groups g
    where LOWER(g.MemberUserPrincipleName) = LOWER(@UPN)`,
    user,
    'userGroups'
  );

const user_sections = async (upn) =>
  await query(
    `
      select SectionId
      from UserSections
      where UserPrincipleName = @UPN
      and DeletedBy is null
    `,
    upn,
    'user_sections'
  );

const user_side_quests = async (upn) =>
  await query(
    `
      select SideQuestId, DateCompleted
      from UserSideQuests
      where UPN = @UPN
    `,
    upn,
    'user_side_quests'
  );

const all_upcomming_level_up_activities = async () =>
  await query(
    `
    Select
      ulu.UPN,
      lua.EventId,
      lua.ActivityDate as date
    from UserLevelUps ulu
      inner join LevelUpActivities lua on lua.LevelUpId = ulu.LevelUpId
    where lua.ActivityDate > getDate()
  `,
    ``,
    `all_upcomming_level_up_activities`
  );

const user_settings = async (upn) =>
  await query(
    `
    select *
    from UserSettings s
    where s.UserPrincipleName = @UPN
  `,
    upn,
    'user_settings'
  );

const groupMembers = async (groupName) => {
  const q = `
    SELECT MemberUserPrincipleName
    FROM Groups
    WHERE GroupName = @GroupName
  `;

  const connection = await db();
  const result = await connection
    .input('GroupName', groupName)
    .timed_query(q, 'groupMembers');
  return fixCase(result.recordset);
};

const peopleOwningReviews = async () => {
  const q = `
    SELECT s.UserPrincipleName
    FROM Staff s
    WHERE EXISTS (
      SELECT 1
      FROM ReviewWithActiveStatus rwas
      INNER JOIN ReviewStatus rs ON rs.ReviewStatusId = rwas.ReviewStatusId and rs.ReviewStatusId not in (12, 13)
      WHERE s.UserPrincipleName = rwas.HrRep
      AND rwas.templateId in (
      SELECT fast.FeedbackAssignmentTemplateId
      FROM FeedbackAssignmentTemplate fast
     )
    ) ORDER BY s.UserPrincipleName ASC;
  `;

  const connection = await db();
  const result = await connection.timed_query(q, 'peopleOwningReviews');
  return fixCase(result.recordset);
};

const managers = async () => {
  const q = `
    WITH managersDepartments AS (
        SELECT
          Manager, Department, StartDate, COALESCE(LEAD(StartDate) OVER ( Partition by Department order by StartDate), '9999-12-31') ToDate
        FROM
          StaffDepartment
    )
      SELECT DISTINCT DisplayName, UserPrincipleName, Office
      FROM DecoratedStaff Staff
        INNER JOIN managersDepartments on Staff.UserPrincipleName = managersDepartments.Manager
            AND GETDATE() BETWEEN StartDate and managersDepartments.ToDate
    WHERE LOWER(Staff.StaffStatus) = 'active'
  `;

  const connection = await db();
  const results = await connection.timed_query(q);
  return fixCase(results.recordset);
};

module.exports = {
  user_sections,
  user_side_quests,
  all_upcomming_level_up_activities,
  user_settings,
  userGroups,
  groupMembers,
  peopleOwningReviews,
  managers,
};
