const { get } = require('./graph-api');

const MAX_CACHE_AGE = 24 * 3600 * 1000; // 24 hours

const activeDirectoryProfileCache = new Map();

const getProfilePicture = async (userPrincipleName) => await get(`/users/${userPrincipleName}/photo/$value`, true);

const getActiveDirectoryProfile = async (upn) => {
  const cachedProfile = activeDirectoryProfileCache.get(upn);
  if (cachedProfile && new Date() - cachedProfile.cacheTime < MAX_CACHE_AGE) {
    return cachedProfile.profile;
  }

  const profile = await get(`/users/${upn}`);
  if (profile) {
    activeDirectoryProfileCache.set(upn, { profile, cacheTime: new Date() });
  }
  return profile;
};

const getActiveDirectoryGroupMembers = async (mailGroup) => {
  const group = await get(`/groups?$filter=mail eq '${mailGroup}'&$select=id`);
  const members = await get(
    `/groups/${group.value[0].id}/transitiveMembers?$select=userPrincipalName&$top=999`
  );
  return members.value;
};

const mailingListGroupExists = async (mailGroup) => {
  const group = await get(`/groups?$filter=mail eq '${mailGroup}'&$select=id`);
  return group.value[0] ? true : false;
};

const userExists = async (upn) => {
  const adResponse = await getActiveDirectoryProfile(upn);
  if (adResponse.error) {
    // TODO: RE - we need to check the response
    // see todo in 'shared/peer-feedback' and
    // trello ticket: https://trello.com/c/VT4WUEyU
    return false;
  } else {
    return true;
  }
};

module.exports = {
  getActiveDirectoryProfile,
  getProfilePicture,
  getActiveDirectoryGroupMembers,
  userExists,
  mailingListGroupExists,
};
