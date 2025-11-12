const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  get_all_groups,
  get_all_groups_members,
} = require('../queries/groups.queries');

router.get(
  '/getAllGroups',
  handle_errors(async (req, res) => {
    const groups = await get_all_groups();
    res.json(groups);
  })
);

router.get(
  '/getAllGroupsMembers',
  handle_errors(async (req, res) => {
    const allGroupsMembers = await get_all_groups_members();
    res.json(allGroupsMembers);
  })
);

module.exports = router;
