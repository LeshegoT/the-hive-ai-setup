const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../../shared/db');
const {
  createProgramme,
  createProgrammeLevelUps,
  createProgrammeUsers,
  getAllProgrammes,
  deleteProgramme,
  deleteProgrammeLevelUpsByProgrammeId,
  getAllProgrammeLevelUps,
  updateProgramme,
  updateProgrammeLevelUps,
  getProgrammeUsers,
  updateProgrammeUsers,
} = require('../../queries/programme.queries');

router.post(
  '/programme',
  handle_errors(async (req, res) => {
    const programme = req.body;
    const programmeCreation = await createProgramme(
      programme.startDate,
      programme.period,
      programme.name
    );
    try {
      await withTransaction(async (tx) => {
        for (const levelup of programme.levelups) {
          await createProgrammeLevelUps(
            levelup.levelUpId,
            programmeCreation,
            tx
          );
        }
        for (const user of programme.users) {
          await createProgrammeUsers(
            user.UPN,
            programmeCreation,
            programme.dateAdded,
            tx
          );
        }
      });
    } catch (error) {
      res.status(400).send(error);
    }
    res.json(programme);
  })
);

router.patch(
  '/programme',
  handle_errors(async (req, res) => {
    const { programmeId, name, startDate, period, levelups, users } =
      req.body.programme;
    try {
      await withTransaction(async (tx) => {
        await updateProgramme(programmeId, startDate, period, name, tx);
        await deleteProgrammeLevelUpsByProgrammeId(programmeId, tx);
        await updateProgrammeLevelUps(programmeId, levelups, tx);
        await updateProgrammeUsers(programmeId, users, tx);
      });
      res.status(201).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);
router.get(
  '/programme',
  handle_errors(async (req, res) => {
    const allProgrammes = await getAllProgrammes();
    for (let i = 0; i < allProgrammes.length; i++) {
      allProgrammes[i].levelups = await getAllProgrammeLevelUps(
        allProgrammes[i].programmeID
      );
    }
    for (let i = 0; i < allProgrammes.length; i++) {
      allProgrammes[i].users = await getProgrammeUsers(
        allProgrammes[i].programmeID
      );
    }
    res.json(allProgrammes);
  })
);

router.delete(
  '/programme/:id',
  handle_errors(async (req, res) => {
    try {
      await withTransaction(async (tx) => {
        await deleteProgramme(req.params.id, res.locals.upn, tx);
        await deleteProgrammeLevelUpsByProgrammeId(req.params.id, tx);
      });
    } catch (error) {
      res.status(400).send(error);
    }
    res.status(201).send();
  })
);

module.exports = router;
