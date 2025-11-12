const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  level_up_activities,
  user_level_ups,
  level_up_users,
  all_permitted_levelups,
  user_level_up_activities,
  level_up_activity_link_types,
  get_level_up_icons,
  all_level_up_activity_types,
  level_up_activity_type_icons,
  active_level_up_types,
} = require('../queries/level-up.queries');

router.get(
  '/levelUps',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const levelUps = await all_permitted_levelups(upn);
    const userLevelUps = await user_level_ups(upn);
    const levelUpActivities = await level_up_activities();
    const userLevelUpActivities = await user_level_up_activities(upn);

    res.json({
      levelUps,
      levelUpActivities,
      userLevelUps,
      userLevelUpActivities,
    });
  })
);

router.get(
  '/levelUpUsers/:id',
  handle_errors(async (req, res) => {
    const { id } = req.params;

    const levelUpUsers = await level_up_users(id);

    res.json(levelUpUsers);
  })
);

router.get(
  '/levelUpActivityLinkTypes',
  handle_errors(async (req, res) => {
    res.json(await level_up_activity_link_types());
  })
);

router.get(
  '/getLevelUpIcons',
  handle_errors(async (req, res) => {
    const iconPaths = await get_level_up_icons();
    const icons = [];

    for (const path of iconPaths) {
      icons.push({
        name: path.icon.substring(
          path.icon.lastIndexOf('/') + 1,
          path.icon.lastIndexOf('.')
        ),
        path: path.icon,
      });
    }

    res.json(icons);
  })
);

router.get(
  '/getLevelUpActivityTypeIcons',
  handle_errors(async (req, res) => {
    const iconPaths = await level_up_activity_type_icons();
    const icons = [];

    for (const path of iconPaths) {
      icons.push({
        name: path.icon.substring(
          path.icon.lastIndexOf('/') + 1,
          path.icon.lastIndexOf('.')
        ),
        path: path.icon,
      });
    }

    res.json(icons);
  })
);

router.get(
  '/allLevelUpActivityTypes',
  handle_errors(async (req, res) => {
    res.json(await all_level_up_activity_types());
  })
);

router.get(
  '/getActiveLevelUpActivityTypes',
  handle_errors(async (req, res) => {
    res.json(await active_level_up_types());
  })
);

module.exports = router;
