const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  create_level_up_activity_link,
  create_level_up,
  delete_level_up,
  update_level_up,
  create_level_up_activity_type,
  update_level_up_activity_type,
  delete_level_up_activity_type,
  countLevelUpsActivityAttendees,
} = require('../../queries/level-up.queries');

router.post(
  '/createLevelUpActivityLink',
  handle_errors(async (req, res) => {
    await create_level_up_activity_link(req.body);
    res.status(204).send();
  })
);

router.post(
  '/createLevelUp',
  handle_errors(async (req, res) => {
    const levelUp = req.body;

    for (const activity of levelUp.activities) {
      activity.startDate = new Date(activity.startDate);
    }

    await create_level_up(levelUp);
    res.status(204).send();
  })
);

router.post(
  '/createNewLevelUpInstance',
  handle_errors(async (req, res) => {
    const levelUp = req.body;

    for (const activity of levelUp.activities) {
      activity.startDate = new Date(activity.startDate);
    }
    await create_level_up(levelUp);
    res.status(204).send();
  })
);

router.post(
  '/createLevelUpActivityType',
  handle_errors(async (req, res) => {
    await create_level_up_activity_type(req.body);
    res.status(204).send();
  })
);

router.delete(
  '/deleteLevelUp/:id',
  handle_errors(async (req, res) => {
    const id = parseInt(req.params.id);

    const totalAttendees = await countLevelUpsActivityAttendees(id);
    if (totalAttendees > 0) {
      res
        .status(400)
        .json({
          message:
            'Deletion is not allowed because users have participated in this level-up',
        });
    } else {
      await delete_level_up(id);
      res.status(204).send();
    }
  })
);

router.post(
  '/updateLevelUp',
  handle_errors(async (req, res) => {
    const levelUp = req.body.levelUp;

    for (const activity of levelUp.activities) {
      activity.startDate = new Date(activity.startDate);
    }
    await update_level_up(levelUp);
    res.status(201).send();
  })
);

router.delete(
  '/deleteLevelUpActivityType/:id',
  handle_errors(async (req, res) => {
    const id = parseInt(req.params.id);

    await delete_level_up_activity_type(id);
    res.status(204).send();
  })
);

router.post(
  '/updateLevelUpActivityType',
  handle_errors(async (req, res) => {
    const levelUpActivityType = req.body.levelUpActivityType;

    await update_level_up_activity_type(levelUpActivityType);
    res.status(201).send();
  })
);

module.exports = router;
