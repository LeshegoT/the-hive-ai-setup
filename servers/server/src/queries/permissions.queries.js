const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const graphApi = require('../shared/graph-api');

const getAppPermissions = async (upn) => {
  const q = `
    SELECT
      AppPermissionAssignments.AppPermissionAssignmentId AS AppPermissionAssignmentId ,
      Actions.ActionName,
      Resources.ResourceName,
      Modules.ModuleName,
      AppPermissions.Description AS PermissionDescription
    FROM AppPermissionAssignments
    INNER JOIN AppPermissions ON AppPermissionAssignments.AppPermissionId = AppPermissions.AppPermissionId
    INNER JOIN Actions ON AppPermissions.ActionId = Actions.ActionId
    INNER JOIN Resources ON AppPermissions.ResourceId = Resources.ResourceId
    INNER JOIN Modules ON AppPermissions.ModuleId = Modules.ModuleId
    WHERE UserOrGroup = @UPN OR UserOrGroup IN (@Groups)
  `;

  const adgroups = await getUserADGroups(upn);
  const joinedTeams = await getUserTeams(upn);
  const userHiveGroups = await getUserHiveGroups(upn);

  const allGroups = [
    ...adgroups,
    ...joinedTeams,
    ...userHiveGroups.map((hiveGroup) => hiveGroup.groupName),
  ];

  const request = await db();
  const result = await request
    .input('UPN', upn)
    .input('Groups', allGroups)
    .timed_query(q, 'getAppPermissions');
  return fixCase(result.recordset);
};

const getUserHiveGroups = async (upn) => {
  const q = `
    SELECT GroupName
    FROM Groups
    WHERE MemberUserPrincipleName = @UPN
  `;
  const request = await db();
  const result = await request
    .input('UPN', upn)
    .timed_query(q, 'getUserHiveGroups');
  return fixCase(result.recordset);
};

async function getUserADGroups(upn) {
  const response = await graphApi
    .get(
      `/users/${upn}/transitiveMemberOf/microsoft.graph.group?$count=true&$select=displayName`,
      false
    )
    .then((data) => {
      return data['value'];
    })
    .then((groupDetails) => {
      return groupDetails.map((x) => x.displayName);
    });
  return response;
}

async function getUserTeams(upn) {
  const response = graphApi
    .get(`/users/${upn}/joinedTeams`)
    .then((data) => {
      return data['value'];
    })
    .then((groupDetails) => {
      return groupDetails.map((x) => x.displayName);
    });
  return response;
}

module.exports = {
  getAppPermissions,
};
