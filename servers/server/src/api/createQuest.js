const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  validateDate,
  validateMissions,
  validateIdExists,
  validateLoggedInUser,
} = require('../shared/validations');

const {
  create_quest,
  overlapping_quest,
} = require('../queries/quest.queries');
const { quest_missions } = require('../queries/mission.queries');
const { number_of_parts_available } = require('../queries/part.queries');

const { withTransaction } = require('../shared/db');

module.exports = router.post(
  '/createQuest',
  handle_errors(async (req, res) => {
    const {
      heroUpn,
      guideUpn,
      specialisationId,
      goal,
      startDate,
      endDate,
    } = req.body.quest;

    validateLoggedInUser(res.locals.upn, heroUpn, 'heroUpn');
    const validatedEndDate = validateDate(endDate, 'endDate');
    const validatedStartDate = validateDate(startDate, 'startDate');
    const validatedSpecialisationId = await validateIdExists(
        specialisationId,
        'Specialisations',
        'SpecialisationId'
      );

    const overlap = await overlapping_quest(heroUpn, startDate);
    if (overlap) {
      res.json({ quest: overlap, error: true });
      return;
    }

    let missions = validateMissions(req.body.missions);

    const { quest, avatar } = await withTransaction((tx) =>
      create_quest(
        tx,
        heroUpn,
        guideUpn,
        validatedSpecialisationId.specialisationId,
        goal,
        validatedStartDate,
        validatedEndDate,
        missions
      )
    );

    missions = await quest_missions(quest.questId);
    const numberOfPartsAvailable = await number_of_parts_available(
      heroUpn
    );

    res.json({ quest, missions, avatar, numberOfPartsAvailable });
  })
);

