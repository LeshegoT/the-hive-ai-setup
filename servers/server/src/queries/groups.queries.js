const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const CANARY_RELEASE_GROUP_NAMES = ['Graduate 2023', 'HR', 'ATC'];

const get_all_groups = async () => {
  const q = `
        SELECT DISTINCT GroupName
        FROM Groups
    `;

  const connection = await db();
  const results = await connection.timed_query(q, 'get-all-groups');

  const groups = fixCase(results.recordset);

  return groups;
};

const get_group_members = async (groupName) => {
  const q = `
  SELECT MemberUserPrincipleName
  FROM Groups
  WHERE GroupName = @GroupName
  `;

  const request = await db();
  const results = await request
    .input('GroupName', groupName)
    .timed_query(q, 'get-group-members');

  return fixCase(results.recordset);
};
const group_restrictions = async (groupName) => {
  const q = `
    SELECT count(*) AS CountRestrictions FROM ContentRestrictions
    WHERE GroupName = @GroupName
  `;
  const connection = await db();
  const results = await connection
    .input('GroupName', groupName)
    .timed_query(q, 'group_restrictions');
  return results.recordset[0].CountRestrictions;
};
const delete_group = async (groupName) => {
  const tx = await transaction();
  const q = `
    DELETE FROM Groups
    WHERE GroupName = @GroupName
    `;
  try {
    await tx.begin();
    const request = await tx.request();
    await request.input('GroupName', groupName).query(q, 'delete-group');
    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};
const get_all_groups_members = async () => {
  const groups = await get_all_groups();

  const allGroups = [];

  for (const group of groups) {
    const groupMembers = await get_group_members(group.groupName);
    const members = [];
    groupMembers.forEach((groupMember) =>
      members.push(groupMember.memberUserPrincipleName)
    );
    allGroups.push({ groupName: group.groupName, members: members });
  }

  return allGroups;
};

const create_group = async (group) => {
  const tx = await transaction();

  const q = `
    INSERT INTO Groups
    VALUES(@GroupName, LOWER(@MemberUPN))
  `;

  try {
    await tx.begin();

    for (const member of group) {
      const request = await tx.timed_request();
      await request
        .input('GroupName', member.groupName)
        .input('MemberUPN', member.memberUPN)
        .timed_query(q, 'create-group');
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const update_group = async (group) => {
  const tx = await transaction();
  const q = `
    UPDATE Groups
    SET GroupName = @NewGroupName
    WHERE GroupName = @OldGroupName
  `;

  try {
    await tx.begin();

    const getMembers = await get_group_members(group.oldName);
    const oldMembers = getMembers.map((member) => member.memberUserPrincipleName);
    const newMembers = group.members;

    const deleteMembers = oldMembers.filter((element) => {
      return newMembers.indexOf(element) === -1;
    });

    const addMembers = newMembers.filter((element) => {
      return oldMembers.indexOf(element) === -1;
    });

    const request = await tx.request();

    for (const member of deleteMembers) {
      await delete_member(tx, group.oldName, member);
    }

    for (const member of addMembers) {
      await add_member(tx, group.newName, member);
    }

    await request
      .input('NewGroupName', group.newName)
      .input('OldGroupName', group.oldName)
      .query(q, 'update-group');

    await tx.commit();
  } catch (error) {
    console.error(error);
    tx.rollback();
  }
};

const delete_member = async (tx, groupName, memberUPN) => {
  const q = `
    DELETE FROM Groups
    WHERE GroupName = @GroupName AND MemberUserPrincipleName = @MemberUPN
    `;

  const request = await tx.request();

  await request
    .input('GroupName', groupName)
    .input('MemberUPN', memberUPN)
    .query(q, 'delete-member');
};
const add_member = async (tx, groupName, memberUPN) => {
  const q = `
    INSERT INTO Groups
    VALUES(@GroupName, LOWER(@MemberUPN))
  `;

  const request = await tx.request();

  await request
    .input('GroupName', groupName)
    .input('MemberUPN', memberUPN)
    .query(q, 'add-member');
};

const restrict_content = async (tx, group, contentId, restrictionTypeId) => {
  const q = `
    INSERT INTO ContentRestrictions
    VALUES(NULL, @Group, @RestrictionTypeId, @ContentId)
  `;

  const request = await tx.request();
  await request
    .input('Group', group)
    .input('RestrictionTypeId', restrictionTypeId)
    .input('ContentId', contentId)
    .query(q, 'restrict-content');
};

const restrict_content_to_individual = async (
  tx,
  upn,
  contentId,
  restrictionTypeId
) => {
  const q = `
    INSERT INTO ContentRestrictions
    VALUES(LOWER(@UPN), NULL, @RestrictionTypeId, @ContentId)
  `;

  const request = await tx.request();
  await request
    .input('UPN', upn)
    .input('RestrictionTypeId', restrictionTypeId)
    .input('ContentId', contentId)
    .query(q, 'restrict-content-to-individual');
};

const check_canary_release_group = async (upn) => {
  const q = `
        SELECT 1 
        FROM Groups
        WHERE GroupName IN ( ${
          "'" + CANARY_RELEASE_GROUP_NAMES.join("','") + "'"
        }) AND MemberUserPrincipleName = @UPN
    `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(q, 'check-canary-release-group');

  if (results.recordset && results.recordset.length) {
    return true;
  } else {
    return false;
  }
};

module.exports = {
  get_all_groups,
  get_group_members,
  get_all_groups_members,
  update_group,
  create_group,
  restrict_content,
  restrict_content_to_individual,
  check_canary_release_group,
  delete_group,
  group_restrictions,
};
