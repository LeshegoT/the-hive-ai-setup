const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const createProgramme = async (startDate, period, name) => {
  const programmeQuery = `
  INSERT INTO Programmes 
  (StartDate, Period, Name) 
  VALUES (@STARTDATE,@PERIOD,@NAME)

  SELECT scope_identity() AS  NewProgrammeId;
  `;

  const connection = await db();
  const result = await connection
    .input('NAME', name)
    .input('PERIOD', period)
    .input('STARTDATE', startDate)
    .timed_query(programmeQuery, 'createProgramme');

  return result.recordset[0].NewProgrammeId;
};

const createProgrammeLevelUps = async (levelUpId, programmeId, tx) => {
  const programmeLevelUpQuery = `
  INSERT INTO ProgrammeLevelUps
  (ProgrammeID, LevelUpID)
  VALUES(@PROGRAMMEID,@LEVELUPID)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('LEVELUPID', levelUpId)
    .input('PROGRAMMEID', programmeId)
    .timed_query(programmeLevelUpQuery, 'createProgrammeLevelUps');
};

const createProgrammeUsers = async (UPN, programmeId, dateAdded, tx) => {
  const programmeUserQuery = `
  INSERT INTO ProgrammeUsers
  (UPN, ProgrammeID,DateAdded)
  VALUES(@UPN,@PROGRAMMEID,@DATEADDED)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('UPN', UPN)
    .input('PROGRAMMEID', programmeId)
    .input('DATEADDED', dateAdded)
    .timed_query(programmeUserQuery, 'createProgrammeUsers');
};

const updateProgrammeLevelUps = async (programmeID, levelups, tx) => {
  await deleteProgrammeLevelUpsByProgrammeId(programmeID, tx);
  const programmeLevelUps = levelups.map((levelup) => {
    return {
      programmeID,
      levelUpId: levelup.levelUpId,
    };
  });

  for (const levelup of programmeLevelUps) {
    await createProgrammeLevelUps(levelup.levelUpId, levelup.programmeID, tx);
  }
};

const updateProgrammeUsers = async (programmeID, users, tx) => {
  await deleteProgrammeUsersByProgrammeId(programmeID, tx);
  const programmeUsers = users.map((user) => {
    return {
      upn: user.upn,
      programmeID,
      dateAdded: user.dateAdded,
    };
  });
  for (user of programmeUsers) {
    await createProgrammeUsers(user.upn, user.programmeID, user.dateAdded, tx);
  }
};

const getAllProgrammes = async () => {
  const getAllprogrammeQuery = `
  SELECT 
  ProgrammeID, StartDate, Period, Name
  FROM Programmes
  WHERE DeletedBy IS NULL;
  `;

  const connection = await db();
  const result = await connection.timed_query(
    getAllprogrammeQuery,
    'getAllProgrammes'
  );
  return fixCase(result.recordset);
};

const getAllProgrammesInfo = async () => {
  const query = `WITH ProgrammeDates AS (
    SELECT
        P.ProgrammeID,
        P.StartDate,
        P.Period,
        P.Name,
        PU.UserProgrammeID,
        PU.UPN,
        PU.DateAdded
    FROM Programmes AS P
    INNER JOIN ProgrammeUsers AS PU ON P.ProgrammeID = PU.ProgrammeID
    WHERE P.DeletedBy IS NULL
    AND P.StartDate >= GETDATE()
    AND PU.DropOffDate IS NULL
)

SELECT
    pd.ProgrammeID,
    pd.StartDate,
    pd.Period,
    pd.Name,
    pd.UserProgrammeID,
    pd.UPN,
    pd.DateAdded,
    lu.LevelUpId,
    lu.LevelUpStartDate,
    lu.LevelUpEndDate,
    lu.LevelUpName,
    lu.LevelUpDescription,
    lu.LevelUpIcon
FROM ProgrammeDates pd
INNER JOIN (
    SELECT
        l.LevelUpId,
        l.Name AS LevelUpName,
        l.Description AS LevelUpDescription,
        l.Icon AS LevelUpIcon,
        la.StartDate AS LevelUpStartDate,
        la.EndDate AS LevelUpEndDate,
        plu.ProgrammeID
    FROM LevelUps l
    INNER JOIN ProgrammeLevelUps plu ON l.LevelUpId = plu.LevelUpID
    INNER JOIN (
        SELECT
            LevelUpId,
            MIN(ActivityDate) AS StartDate,
            MAX(DATEADD(MINUTE, DurationInMinutes, ActivityDate)) AS EndDate
        FROM LevelUpActivities
        GROUP BY LevelUpId
    ) la ON l.LevelUpId = la.LevelUpId
) lu ON pd.ProgrammeID = lu.ProgrammeID;`;

  const connection = await db();
  const result = await connection.timed_query(query, 'getAllProgrammesInfo');
  return fixCase(result.recordset);
};

const deleteProgramme = async (programmeID, user, tx) => {
  const deleteQuery = `
UPDATE Programmes SET DeletedBy = @user
WHERE ProgrammeId = @programmeID;

UPDATE ProgrammeLevelUps SET DeletedBy = @user
WHERE ProgrammeId = @programmeID;
`;

  const connection = await tx.timed_request();

  await connection
    .input('user', user)
    .input('ProgrammeId', programmeID)
    .timed_query(deleteQuery, 'delete-programme');
};

const deleteProgrammeLevelUpsByProgrammeId = async (programmeID, tx) => {
  const deleteProgrammeLevelUpsQuery = `
  DELETE FROM ProgrammeLevelUps WHERE ProgrammeID = @programmeID
  `;

  const connection = await tx.timed_request();

  await connection
    .input('ProgrammeID', programmeID)
    .timed_query(
      deleteProgrammeLevelUpsQuery,
      'deleteProgrammeLevelUpsByProgrammeId'
    );
};

const deleteProgrammeUsersByProgrammeId = async (programmeID, tx) => {
  const deleteProgrammeUsersQuery = `
 UPDATE ProgrammeUsers SET DropOffDate = GETDATE()
 WHERE ProgrammeId = @ProgrammeID;
  `;

  const connection = await tx.timed_request();

  await connection
    .input('ProgrammeID', programmeID)
    .timed_query(
      deleteProgrammeUsersQuery,
      'deleteProgrammeUsersByProgrammeId'
    );
};

const getAllProgrammeLevelUps = async (programmeId) => {
  const getAllprogrammelevelupsQuery = `
   WITH LevelUpDates (LevelUpId, StartDate, EndDate)
    AS
    (
      SELECT
        LevelUpId,
        MIN(ActivityDate) as StartDate,
        MAX(DATEADD (MINUTE, DurationInMinutes, ActivityDate)) AS EndDate
      FROM LevelUpActivities
      GROUP BY LevelUpId
    )

    SELECT
      l.LevelUpId,
      l.Name,
      l.Description,
      l.Icon,
      d.StartDate,
      d.EndDate,
      ProgrammeLevelUps.ProgrammeID
    FROM LevelUps l
    INNER JOIN ProgrammeLevelUps ON l.LevelUpId = ProgrammeLevelUps.LevelUpID
    INNER JOIN LevelUpDates d ON l.LevelUpId = d.LevelUpId
    WHERE ProgrammeLevelUps.ProgrammeID = @programmeID;
  `;
  const connection = await db();
  const result = await connection
    .input('programmeID', programmeId)
    .timed_query(getAllprogrammelevelupsQuery, 'getAllProgrammeLevelUps');
  console.log(fixCase(result.recordset));
  return fixCase(result.recordset);
};

const updateProgramme = async (programmeId, startDate, period, name, tx) => {
  const updateProgrammeQuery = `
  UPDATE Programmes
  SET Name = @name, StartDate = @startDate, Period = @period
  WHERE ProgrammeID = @programmeId;
  `;
  const connection = await tx.timed_request();
  await connection
    .input('PROGRAMMEID', programmeId)
    .input('NAME', name)
    .input('PERIOD', period)
    .input('STARTDATE', startDate)
    .timed_query(updateProgrammeQuery, 'updateProgramme');
};

const getProgrammeUsers = async (programmeID) => {
  const getProgrammeUsersQuery = `
  SELECT 
  UserProgrammeID, UPN, ProgrammeID, DateAdded
  FROM ProgrammeUsers
  WHERE DropOffDate IS NULL AND ProgrammeID = @PROGRAMMEID;
  `;

  const connection = await db();
  const result = await connection
    .input('PROGRAMMEID', programmeID)
    .timed_query(getProgrammeUsersQuery, 'getProgrammeUsers');
  return fixCase(result.recordset);
};

module.exports = {
  createProgramme,
  createProgrammeLevelUps,
  createProgrammeUsers,
  getAllProgrammes,
  deleteProgramme,
  deleteProgrammeLevelUpsByProgrammeId,
  deleteProgrammeUsersByProgrammeId,
  getAllProgrammeLevelUps,
  updateProgramme,
  updateProgrammeLevelUps,
  updateProgrammeUsers,
  getProgrammeUsers,
  getAllProgrammesInfo,
};
