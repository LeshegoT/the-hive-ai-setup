/**
 *
 * Module containing security related query functions
 * @module queries/security
 *
 */

const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

/**
 * Check whether a user is an admin user
 * @param {string} upn the user to check
 * @returns true if the user is an admin user, fale otherwise
 */
const IsAdminUser = async (upn) => {
  const q = `SELECT CASE WHEN EXISTS (
                    SELECT 1
                    FROM AdminSiteUsers
                    WHERE UPN = @UPN
                  )
                  THEN CAST(1 AS BIT)
                  ELSE CAST(0 AS BIT) END
            AS IsAdmin
          `;

  const request = await db();
  const results = await request.input('UPN', upn).timed_query(q, 'IsAdminUser');
  return results.recordset[0].IsAdmin;
};

const GetAccessibleRoutes = async (groups, upn) => {
  if (!groups) {
    throw new Error('Please provide the groups to get user accessible routes');
  }

  const q = `
    SELECT DISTINCT
      ar.RoutePattern,
      ar.RouterLink,
      ar.DisplayName,
      ar.DisplayOrder
    FROM
      AdminRoutes ar
      INNER JOIN AdminRoutePermissions arp ON arp.AdminRouteId = ar.AdminRouteId
    WHERE
      arp.ADUserOrGroup = @UPN
      OR arp.ADUserOrGroup IN (
        SELECT value
        FROM STRING_SPLIT(@Groups,',')
      )
    ORDER BY 
      ar.DisplayOrder
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .input('Groups', groups.join(','))
    .timed_query(q, 'GetAccessibleRoutes');
  return fixCase(results.recordset);
};

const getAllGrantedPermissions = async () => {
  const q = ` SELECT ap.AdminRoutePermissionId, ap.ADUserOrGroup, ap.AdminRouteId, ar.DisplayName, ar.RoutePattern , ar.Restricted
            FROM AdminRoutePermissions ap
              INNER JOIN AdminRoutes ar ON ar.AdminRouteId = ap.AdminRouteId
            ORDER BY ADUserOrGroup
           `;

  const request = await db();
  const results = await request.timed_query(q, 'getAllGrantedPermissions');
  return fixCase(results.recordset);
};

const grantPermission = async (user, route) => {
  const q = `
          INSERT INTO AdminRoutePermissions (ADUserOrGroup, AdminRouteId)
            SELECT TOP 1 @User, @Route
            FROM AdminRoutePermissions
            WHERE NOT EXISTS(
              SELECT 1
              FROM AdminRoutePermissions
              WHERE ADUserOrGroup = @User AND AdminRouteId = @Route
            ) 
            
          SELECT SCOPE_IDENTITY() AS routePermissionId
  `;

  const connection = await db();
  let result = await connection
    .input('User', user)
    .input('Route', route)
    .timed_query(q, 'grantPermission');

  result = fixCase(result.recordset);
  return result[0].routePermissionId;
};

const revokePermission = async (id) => {
  const q = `DELETE FROM AdminRoutePermissions
           WHERE AdminRoutePermissionId = @ID
           `;

  const request = await db();
  const result = await request.input('ID', id).timed_query(q, 'revokePermission');
  return result;
};

const revokeAllPermissions = async (upn) => {
  const q = `DELETE FROM AdminRoutePermissions
           WHERE ADUserOrGroup = @UPN
           `;

  const request = await db();
  return request.input('UPN', upn).timed_query(q, 'revokeAllPermissions');
};

const createAdminSiteUser = async (upn) => {
  const q = `
  INSERT INTO AdminSiteUsers (UPN)
    SELECT TOP 1 @UPN 
    FROM AdminSiteUsers
    WHERE NOT EXISTS(
      SELECT 1
      FROM AdminSiteUsers
      WHERE UPN = @UPN
    ) 
  `;

  const request = await db();
  return request.input('UPN', upn).timed_query(q, 'createAdminSiteUser');
};

const createRoute = async (
  routePattern,
  restricted,
  displayName,
  routerLink,
  displayOrder
) => {
  const q = `
    INSERT INTO AdminRoutes(RoutePattern, Restricted, DisplayName, RouterLink, DisplayOrder)
    VALUES (@routePattern, @restricted, @displayName, @routerLink, @displayOrder);
  `;

  const request = await db();
  const result = await request
    .input('routePattern', routePattern)
    .input('restricted', restricted)
    .input('displayName', displayName)
    .input('routerLink', routerLink)
    .input('displayOrder', displayOrder)
    .timed_query(q, 'createRoute');

  return result.rowsAffected[0];
};

const getAllAvailableRoutes = async () => {
  const q = ` SELECT AdminRouteId, DisplayName, RoutePattern , Restricted, RouterLink, DisplayOrder
            FROM AdminRoutes 
           `;

  const request = await db();
  const results = await request.timed_query(q, 'getAllAvailableRoutes');
  return fixCase(results.recordset);
};

const grantPermissionToUserOrGroup = async (
  tx,
  userOrGroup,
  action,
  resource,
  module
) => {
  const q = `
    IF NOT EXISTS (
      SELECT 1
      FROM AppPermissionAssignments apa
      JOIN AppPermissions ap ON apa.AppPermissionId = ap.AppPermissionId
      WHERE
        apa.UserOrGroup = @UserOrGroup
        AND ap.ActionId = (SELECT ActionId FROM Actions WHERE ActionName = @Action)
        AND ap.ResourceId = (SELECT ResourceId FROM Resources WHERE ResourceName = @Resource)
        AND ap.ModuleId = (SELECT ModuleId FROM Modules WHERE ModuleName = @Module)
    )
    BEGIN
      INSERT INTO AppPermissionAssignments (UserOrGroup, AppPermissionId)
      VALUES (
        @UserOrGroup,
        (SELECT AppPermissionId
          FROM AppPermissions
          WHERE
            ActionId = (SELECT ActionId FROM Actions WHERE ActionName = @Action)
            AND ResourceId = (SELECT ResourceId FROM Resources WHERE ResourceName = @Resource)
            AND ModuleId = (SELECT ModuleId FROM Modules WHERE ModuleName = @Module)
        )
      )
    END
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('UserOrGroup', userOrGroup)
    .input('Action', action)
    .input('Resource', resource)
    .input('Module', module)
    .timed_query(q, 'grantPermissionToUserOrGroup');

  return result.recordset;
};

const getModulePermissions = async (moduleName) => {
  const q = `
    SELECT apa.AppPermissionAssignmentId, apa.UserOrGroup, ap.AppPermissionId, a.ActionName, r.ResourceName, m.ModuleName
    FROM AppPermissionAssignments apa
    JOIN AppPermissions ap ON apa.AppPermissionId = ap.AppPermissionId
    LEFT JOIN Actions a ON ap.ActionId = a.ActionId
    LEFT JOIN Resources r ON ap.ResourceId = r.ResourceId
    LEFT JOIN Modules m ON ap.ModuleId = m.ModuleId
    WHERE m.ModuleName = @ModuleName;
  `;

  const request = await db();
  let results = await request
    .input('ModuleName', moduleName)
    .timed_query(q, 'getAllModulePermissions');

  results = fixCase(results.recordset);
  const categorizedPermissions = results.reduce(
    (permissionsByUserOrGroup, item) => {
      const category = item.userOrGroup.includes('@') ? 'users' : 'groups';

      if (!permissionsByUserOrGroup[category]) {
        permissionsByUserOrGroup[category] = {};
      }

      const userOrGroupKey = item.userOrGroup.toLowerCase();
      if (!permissionsByUserOrGroup[category][userOrGroupKey]) {
        permissionsByUserOrGroup[category][userOrGroupKey] = [];
      }

      permissionsByUserOrGroup[category][userOrGroupKey].push({
        permissionAssignmentId: item.appPermissionAssignmentId,
        permissionId: item.appPermissionId,
        userOrGroup: item.userOrGroup,
        action: item.actionName,
        resource: item.resourceName,
        module: item.moduleName,
      });

      return permissionsByUserOrGroup;
    },
    {}
  );

  return categorizedPermissions;
};

const revokePermissionFromUserOrGroup = async (tx, permissionId) => {
  const q = `
    DELETE FROM AppPermissionAssignments
    WHERE AppPermissionAssignmentId = @PermissionId
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('PermissionId', permissionId)
    .timed_query(q, 'revokePermissionFromUserOrGroup');

  return result.recordset;
};

const getHiveGroups = async () => {
  const q = `
    SELECT DISTINCT GroupName From Groups;
  `;

  const connection = await db();
  const result = await connection.timed_query(q, 'getHiveGroups');
  return fixCase(result.recordset);
};

const getModules = async () => {
  const q = `
    SELECT * From Modules;
  `;

  const connection = await db();
  const result = await connection.timed_query(q, 'getModules');
  return fixCase(result.recordset);
};

const getActionsResourcesByModule = async () => {
  const q = `
      SELECT AP.ModuleId, M.ModuleName, A.ActionName,R.ResourceName
      FROM AppPermissions AS AP
      INNER JOIN Actions AS A ON AP.ActionId = A.ActionId
      INNER JOIN Resources AS R ON AP.ResourceId = R.ResourceId
      INNER JOIN Modules AS M ON AP.ModuleId = M.ModuleId
      ORDER BY M.ModuleName, A.ActionName, R.ResourceName;
  `;

  const connection = await db();
  const result = await connection.timed_query(q, 'getActionsResourceByModule');
  return fixCase(result.recordset);
};

module.exports = {
  IsAdminUser,
  GetAccessibleRoutes,
  getAllGrantedPermissions,
  getAllAvailableRoutes,
  grantPermission,
  revokePermission,
  createAdminSiteUser,
  revokeAllPermissions,
  createRoute,
  grantPermissionToUserOrGroup,
  revokePermissionFromUserOrGroup,
  getModulePermissions,
  getHiveGroups,
  getModules,
  getActionsResourcesByModule,
};
