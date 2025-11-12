const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../shared/db');
const {
  getAllProgrammesInfo,
  updateProgramme,
  deleteProgrammeLevelUpsByProgrammeId,
  updateProgrammeLevelUps,
  updateProgrammeUsers,
} = require('../queries/programme.queries');
const { groupBy } = require('../shared/mapping');

router.patch(
  '/programmes',
  handle_errors(async (req, res) => {
    const { programmeId, name, startDate, period, levelUps, users } =
      req.body.programme;
    try {
      await withTransaction(async (tx) => {
        await updateProgramme(programmeId, startDate, period, name, tx);
        await deleteProgrammeLevelUpsByProgrammeId(programmeId, tx);
        await updateProgrammeLevelUps(programmeId, levelUps, tx);
        await updateProgrammeUsers(programmeId, users, tx);
      });
      res.status(201).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.get(
  '/programmes',
  handle_errors(async (req, res) => {
    const allProgrammesInfo = await getAllProgrammesInfo();
    const programmes = groupBy(
      allProgrammesInfo,
      (programme) => programme.programmeID,
      false
    );
    const result = Object.values(programmes).map((programme) => {
      return programme.reduce((accumulator, current, index) => {
        if(!index){
            accumulator = createProgrammeStructure(current)
        } else {
            // index is truthy so we don't need to create the accumulator
        };
        accumulator.users.push(createUser(current));
        accumulator.levelUps.push(createLevelUp(current));
        return accumulator;
      }, {});
    });
    res.status(200).json(result);
  })
);

function createUser(programme) {
  const user = {
    userProgrammeID: programme.userProgrammeID,
    upn: programme.upn,
    dateAdded: programme.dateAdded,
    programmeID: programme.programmeID,
  };
  return user;
}

function createLevelUp(programme) {
  const levelup = {
    description: programme.levelUpDescription,
    endDate: programme.levelUpEndDate,
    icon: programme.levelUpIcon,
    levelUpId: programme.levelUpId,
    name: programme.levelUpName,
    programmeID: programme.programmeID,
    startDate: programme.levelUpStartDate,
  };
  return levelup;
}

function createProgrammeStructure(programme) {
  const programmeObject = {
    programmeID: programme.programmeID,
    startDate: programme.startDate,
    period: programme.period,
    name: programme.name,
    users: [],
    levelUps: [],
  };
  return programmeObject;
}

module.exports = router;
