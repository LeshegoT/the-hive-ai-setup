const {
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
} = require('../../queries/security.queries');
const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const graphApi = require('../../shared/graph-api');
const { withTransaction } = require('../../shared/db');

router.get(
  '/permissions',
  handle_errors(async (req, res) => {
    const permissions = await getAllGrantedPermissions();

    const adUserOrGroupPermissions = permissions.reduce((grouped, permission) => {
      const {
        adminRouteId,
        adminRoutePermissionId,
        displayName,
        restricted,
        routePattern,
        adUserOrGroup,
      } = permission;
      return {
        ...grouped,
        [adUserOrGroup]: [
          ...(grouped[adUserOrGroup] || []),
          {
            adminRouteId: adminRouteId,
            adminRoutePermissionId: adminRoutePermissionId,
            displayName: displayName,
            restricted: restricted,
            routePattern: routePattern,
          },
        ],
      };
    }, {});

    const result = Object.keys(adUserOrGroupPermissions).map(
      (adUserOrGroupPermission) => ({
        adUserOrGroup: adUserOrGroupPermission,
        permissions: adUserOrGroupPermissions[adUserOrGroupPermission],
      })
    );

    res.json(result);
  })
);

router.post(
  '/permissions',
  handle_errors(async (req, res) => {
    const { permissions, user } = req.body;

    try {
      const newRoutePermissionIDs = [];

      for (const route of permissions) {
        const newID = await grantPermission(user, route);
        newRoutePermissionIDs.push(newID);
      }

      res.json(newRoutePermissionIDs);
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.delete(
  '/permission/:id',
  handle_errors(async (req, res) => {
    const permissionId = req.params.id;

    try {
      await revokePermission(permissionId);
      res.status(200).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.delete(
  '/permissions/:upn',
  handle_errors(async (req, res) => {
    const user = req.params.upn;

    try {
      await revokeAllPermissions(user);
      res.status(200).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.post(
  '/site-user',
  handle_errors(async (req, res) => {
    const { user, routes } = req.body;

    try {
      await createAdminSiteUser(user);

      for (const route of routes) {
        await grantPermission(user, route);
      }

      res.status(200).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.post(
  '/routes',
  handle_errors(async (req, res) => {
    const { routePattern, restricted, displayName, routerLink, displayOrder } =
      req.body;
    try {
      const rowInserted = await createRoute(
        routePattern,
        restricted,
        displayName,
        routerLink,
        displayOrder
      );
      if (rowInserted) {
        res.status(201).json({ success: true });
      } else {
        res
          .status(409)
          .json({ message: 'A route with the same pattern already exists' });
      }
    } catch (error) {
      res
        .status(400)
        .json({ error: 'Failed to add route', message: error.message });
    }
  })
);

router.get(
  '/routes',
  handle_errors(async (req, res) => {
    const routes = await getAllAvailableRoutes();
    res.json(routes);
  })
);

router.get(
  '/accessible-routes',
  handle_errors(async (req, res) => {
    try {
      const upn = res.locals.upn;
      const groups = await getUserGroups(upn);
      const routes = await GetAccessibleRoutes(groups, upn);
      res.json(routes);
    } catch (error) {
      res.status(500).send(error.message);
    }
  })
);

async function getUserGroups(upn) {
  const response = graphApi
    .get(
      `/users/${upn}/transitiveMemberOf/microsoft.graph.group?$count=true&$select=displayName`,
      false
    )
    .then((data) => {
      return data['value'];
    })
    .then((groupDetails) => {
      if (groupDetails)
        return groupDetails.map((x) => x.displayName);
      else
        return [];
    });
  return response;
}

router.get(
  '/groups',
  handle_errors(async (req, res) => {
    const groups = await getAllGroups();
    res.json(groups);
  })
);

const getAllGroups = async () => {
  const adGroups = await graphApi.get('/groups?$select=displayName,mail', false);
  const teams = await graphApi.get(
    "/groups?$filter=resourceProvisioningOptions/Any(x:x eq 'Team')&$select=displayName,mail",
    false
  );
  const hiveGroups = await getHiveGroups();

  const allGroups = [
    ...adGroups.value.map((group) => ({
      displayName: group.displayName,
      mail: group.mail,
    })),
    ...teams.value.map((group) => ({
      displayName: group.displayName,
      mail: group.mail,
    })),
    ...hiveGroups.map((group) => ({ displayName: group.groupName })),
  ];

  return allGroups;
};

router.post(
  '/permission/module',
  handle_errors(async (req, res) => {
    const { userOrGroup, action, resource, module } = req.body;

    await withTransaction(async (tx) => {
      await grantPermissionToUserOrGroup(
        tx,
        userOrGroup,
        action,
        resource,
        module
      );
    });
    res.status(201).json({ success: true });
  })
);

router.get(
  '/permissions/:module',
  handle_errors(async (req, res) => {
    const moduleName = req.params.module;
    const result = await getModulePermissions(moduleName);
    res.json(result);
  })
);

router.delete(
  '/permission/module/:id',
  handle_errors(async (req, res) => {
    const permissionId = req.params.id;
    await withTransaction(async (tx) => {
      await revokePermissionFromUserOrGroup(tx, permissionId);
    });
    res.status(200).send();
  })
);

router.get(
  '/modules',
  handle_errors(async (req, res) => {
    const result = await getModules();
    res.json(result);
  })
);

router.get(
  '/actions-resources',
  handle_errors(async (req, res) => {
    const result = await getActionsResourcesByModule();
    res.json(result);
  })
);

module.exports = router;
