const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  create_group,
  update_group,
  delete_group,
  group_restrictions,
} = require('../../queries/groups.queries');

router.post(
  '/createGroup',
  handle_errors(async (req, res) => {
    const group = [];
    const members = req.body.members;

    for (const member of members) {
      group.push({ groupName: req.body.groupName, memberUPN: member.trim() });
    }

    await create_group(group);
    res.status(204).send();
  })
);
router.get(
  '/restrictions/:name',
  handle_errors(async (req, res) => {
    const name = req.params.name;
    countRestriction = await group_restrictions(name);
    res.json(countRestriction);
  })
);
router.delete(
  '/group/:name',
  handle_errors(async (req, res) => {
    const name = req.params.name;
    await delete_group(name);
    res.status(204).send();
  })
);
router.post(
  '/updateGroup',
  handle_errors(async (req, res) => {
    const group = req.body;
    await update_group(group);

    res.status(201).send({ statusText: 'completed' });
  })
);

module.exports = router;
