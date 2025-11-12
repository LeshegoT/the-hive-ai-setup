const { logger } = require('@the-hive/lib-core');
const { IsAdminUser } = require('../queries/security.queries');
const { parseIfSetElseDefault } = require('@the-hive/lib-core');
import { cache } from '@the-hive/lib-core';
const graphApi = require('../shared/graph-api');
const HIRING_MANAGER_AD_USER_GROUP = parseIfSetElseDefault('HIRING_MANAGER_AD_USER_GROUP', 'SKILLS Search');

module.exports = async (req, res, next) => {
  try {
    const permitted = await IsAdminUser(res.locals.upn);
    if ( permitted ) {
      return next();
    } else {
      const isHiringManager = (await retrieveHiringManagers()).some(
        (manager) => manager.email === res.locals.upn
      );

      if (isHiringManager === true) {
        return next();
      } else {
        res.status(401).send('User: ' + res.locals.upn + ' is not an admin');
        return;
      }
    }
  } catch (e) {
    logger.error(e);
    res.status(e.status || 403).send({
      status: e.status || 403,
      body: {
        message: e.message,
      },
    });
  }
};

async function retrieveHiringManagers() {
  return cache(`HIRING_MANAGERS_LIST`, async () => {
    try {
      const groupResponse = await graphApi.get(
      `/groups?$filter=displayName eq '${HIRING_MANAGER_AD_USER_GROUP}'&$select=id,displayName`,
      false
      );

      if (!groupResponse.value || groupResponse.value.length === 0) {
        return [];
      } else {
        const groupId = groupResponse.value[0].id;
        const groupMembersResponse = await graphApi.get(
          `/groups/${groupId}/members?$select=displayName,userPrincipalName,mail`,
          false
        );

        if (groupMembersResponse?.value) {
          return groupMembersResponse.value.map(member => ({
            displayName: member.displayName,
            userPrincipalName: member.userPrincipalName,
            email: member.mail
          }));
        } else {
          return [];
        }
      }
    } catch (error) {
      // TODO: RE: We should probably have ths error managed through appInsights.
      logger.error(error);
      return [];
    }
  });
}
