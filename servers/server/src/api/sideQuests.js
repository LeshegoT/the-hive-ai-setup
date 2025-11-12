const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  all_side_quests,
  available_side_quests,
  get_side_quest_types,
  get_side_quest_type_images,
  active_side_quest_types,
} = require('../queries/side-quests.queries');

router.get(
  '/sideQuests',
  handle_errors(async (req, res) => {
    const sideQuests = await available_side_quests(res.locals.upn);
    res.json(sideQuests);
  })
);

router.get(
  '/allSideQuests',
  handle_errors(async (req, res) => {
    const sideQuests = await all_side_quests();
    res.json(sideQuests);
  })
);

router.get(
  '/getSideQuestTypes',
  handle_errors(async (req, res) => {
    const sideQuestTypes = await get_side_quest_types(res.locals.upn);
    res.json(sideQuestTypes);
  })
);

router.get(
  '/getSideQuestTypeImages',
  handle_errors(async (req, res) => {
    const imagePaths = await get_side_quest_type_images();
    const images = [];

    for (const path of imagePaths) {
      images.push({
        name: path.icon.substring(
          path.icon.lastIndexOf('/') + 1,
          path.icon.lastIndexOf('.')
        ),
        path: path.icon,
      });
    }

    res.json(images);
  })
);

router.get(
  '/getActiveSideQuestTypes',
  handle_errors(async (req, res) => {
    res.json(await active_side_quest_types());
  })
);

module.exports = router;
