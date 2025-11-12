const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { user_sections, user_side_quests } = require('../queries/user.queries');

const { user_quest } = require('../queries/quest.queries');

const { user_missions } = require('../queries/mission.queries');

const { user_avatar, user_avatar_parts } = require('../queries/avatar.queries');

const { number_of_parts_available } = require('../queries/part.queries');

const { is_guide, guide_requests } = require('../queries/guide.queries');

const { user_settings } = require('../queries/setting.queries');

router.get(
  '/userData',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;

    const sections = await user_sections(upn);
    const sideQuests = await user_side_quests(upn);
    const quest = await user_quest(upn);
    const missions = await user_missions(upn);
    const avatar = await user_avatar(upn);
    const parts = await user_avatar_parts(upn);
    const numberOfPartsAvailable = await number_of_parts_available(upn);
    const isGuide = await is_guide(upn);
    const settings = await user_settings(upn);
    const guideRequests = await guide_requests(upn);

    const response = {
      sections,
      quest,
      missions,
      avatar: avatar,
      parts,
      numberOfPartsAvailable,
      isGuide,
      sideQuests,
      settings,
      guideRequests,
    };

    res.json(response);
  })
);

module.exports = router;
