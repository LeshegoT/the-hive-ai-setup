const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const IdeaVotes = async (syndicateFormationId) => {
  const q = `
    SELECT i.SyndicateIdeaId, Title, [Description],
    COUNT(IdeaRank) as Votes,
    STRING_AGG (r.UserPrincipleName, ',') as Voters,
    GitRepo
    FROM SyndicateIdeas i
    LEFT JOIN UserIdeasRankings r ON i.SyndicateIdeaId = r.SyndicateIdeaId AND IdeaRank IS NOT NULL
    WHERE
        DeletedBy IS NULL AND
        SyndicateFormationId = @FORMATIONID
    Group BY i.SyndicateIdeaId, Title, [Description], GitRepo
    ORDER BY Votes DESC, i.SyndicateIdeaId ASC
  `;

  const connection = await db();
  const result = await connection
    .input('FORMATIONID', syndicateFormationId)
    .timed_query(q, 'IdeaVotes');

  return fixCase(result.recordset);
};

const SyndicateFormationStages = async () => {
  const q = `
    SELECT FormationStagesId, FormationStage FROM FormationStages
    WHERE Deleted = 0
  `;
  const connection = await db();
  const result = await connection.timed_query(q, 'SyndicateFormationStages');

  return fixCase(result.recordset);
};

const getFormationStage = async (syndicateFormationId) => {
  const q = `
    SELECT
      CurrentStage
    FROM  SyndicateFormation
    WHERE
      SyndicateFormationId = @FORMATIONID
  `;
  const connection = await db();
  const result = await connection
    .input('FORMATIONID', syndicateFormationId)
    .timed_query(q, 'SyndicateFormationStage');

  return result.recordset.length
    ? fixCase(result.recordset)[0].currentStage
    : undefined;
};

const getLevelUpFormationStage = async (levelUpId) => {
  const q = `
    SELECT
      CurrentStage
    FROM  SyndicateFormation
    WHERE
      LevelUpId = @LEVELUPID
  `;
  const connection = await db();
  const result = await connection
    .input('LEVELUPID', levelUpId)
    .timed_query(q, 'SyndicateFormationStage');

  return result.recordset.length
    ? fixCase(result.recordset)[0].currentStage
    : undefined;
};

const SyndicateFormationDetails = async (levelUpId) => {
  const q = `
    SELECT
    SyndicateFormationId,
    LevelUpId,
    IdeasLimit,
    NumberOfGroups,
    CurrentStage,
    FormationStage AS CurrentFormationDescription,
    ChoicesAllowed,
    AllowConflictingGroups
  FROM (
      SELECT * FROM  SyndicateFormation
      WHERE levelUpId = @LEVELUPID
  ) f
  INNER JOIN FormationStages s on f.CurrentStage = s.FormationStagesId
  `;
  const connection = await db();
  const result = await connection
    .input('LEVELUPID', levelUpId)
    .timed_query(q, 'SyndicateFormationDetails');

  return fixCase(result.recordset)[0];
};

const getIdeaSyndicateFormationDetails = async (syndicateIdeaId) => {
  const q = `
    SELECT
    sf.SyndicateFormationId,
    LevelUpId,
    NumberOfGroups
  FROM
      SyndicateFormation sf
  INNER JOIN SyndicateIdeas si
  ON si.SyndicateFormationId = sf.SyndicateFormationId
  WHERE SyndicateIdeaId = @IDEAID
  `;
  const connection = await db();
  const result = await connection
    .input('IDEAID', syndicateIdeaId)
    .timed_query(q, 'SyndicateFormationDetails');

  return fixCase(result.recordset)[0];
};

const GetSubmittedIdeas = async (syndicateFormationId, upn) => {
  const q = `
    WITH UserRankings AS(
        SELECT SyndicateIdeaId, IdeaRank AS UserIdeaRanking FROM UserIdeasRankings
        WHERE  UserPrincipleName = @UPN
    ),
    Ideas AS (
        SELECT SyndicateIdeaId, SyndicateFormationId, Title, Description, Deleted, DeletedBy,
        CASE
            WHEN UserPrincipleName = @UPN THEN 1
            ELSE 0
        END AS UserSubmitted
        FROM SyndicateIdeas
        WHERE SyndicateFormationId = @FORMATIONID AND Deleted = 0
    )
    SELECT i.SyndicateIdeaId, SyndicateFormationId, Title, Description, UserSubmitted, UserIdeaRanking, Deleted, DeletedBy
    FROM Ideas i LEFT JOIN UserRankings r ON i.SyndicateIdeaId = r.SyndicateIdeaId
  `;
  const connection = await db();
  const result = await connection
    .input('FORMATIONID', syndicateFormationId)
    .input('UPN', upn)
    .timed_query(q, 'GetSubmittedIdeas');

  return fixCase(result.recordset);
};

const getIdeaFormationStage = async (ideaId) => {
  const q = `
    SELECT sf.CurrentStage as FormationStage
    FROM SyndicateIdeas si
    INNER JOIN SyndicateFormation sf ON sf.SyndicateFormationId = si.SyndicateFormationId
    WHERE si.SyndicateIdeaId =  @IDEAID
  `;
  const connection = await db();
  const result = await connection
    .input('IDEAID', ideaId)
    .timed_query(q, 'getIdea');

  return result.recordset.length ? result.recordset[0].FormationStage : null;
};

const updateIdea = async (
  syndicateIdeaId,
  ideaTitle,
  ideaDescription,
  gitLink
) => {
  const q = `
    UPDATE SyndicateIdeas SET
      Title = COALESCE(@TITLE, Title),
      [Description] = COALESCE(@DESCRIPTION, [Description]),
      GitRepo = COALESCE(@GITLINK, GitRepo)
      OUTPUT @@ROWCOUNT
    WHERE SyndicateIdeaId = @IDEAID
  `;
  const connection = await db();
  const result = await connection
    .input('TITLE', ideaTitle)
    .input('DESCRIPTION', ideaDescription)
    .input('GITLINK', gitLink)
    .input('IDEAID', syndicateIdeaId)
    .timed_query(q, 'updateIdea');

  return result.recordset[0];
};

const updateIdeaDetails = async (
  syndicateIdeaId,
  ideaTitle,
  ideaDescription,
  upn
) => {
  const q = `
    UPDATE SyndicateIdeas SET
      Title = COALESCE(@TITLE, Title),
      [Description] = COALESCE(@DESCRIPTION, [Description])
      OUTPUT @@ROWCOUNT
    WHERE SyndicateIdeaId = @IDEAID
      AND UserPrincipleName = @UPN
      AND Deleted = 0
  `;
  const connection = await db();
  const result = await connection
    .input('TITLE', ideaTitle)
    .input('DESCRIPTION', ideaDescription)
    .input('UPN', upn)
    .input('IDEAID', syndicateIdeaId)
    .timed_query(q, 'updateIdeaDetails');

  return result.recordset[0];
};

const SubmitIdea = async (idea) => {
  const { syndicateFormationId, upn, ideaTitle, ideaDescription } = idea;
  const q = `
    INSERT INTO SyndicateIdeas (SyndicateFormationId, UserPrincipleName, Title, [Description])
    VALUES (@FORMATIONID, LOWER(@UPN), @TITLE, @DESC)
  `;
  const connection = await db();
  await connection
    .input('FORMATIONID', syndicateFormationId)
    .input('UPN', upn)
    .input('TITLE', ideaTitle)
    .input('DESC', ideaDescription)
    .timed_query(q, 'submitIdea');
};

const RankIdea = async (tx, ideaId, upn, rank) => {
  const q = `
    IF EXISTS (
        SELECT 1 FROM UserIdeasRankings
        WHERE syndicateIdeaId = @IDEAID AND UserPrincipleName = @UPN
    )
        BEGIN
            UPDATE UserIdeasRankings
            SET IdeaRank = @RANK
            WHERE
                syndicateIdeaId = @IDEAID AND
                UserPrincipleName = @UPN
        END
    ELSE
        BEGIN
            INSERT INTO UserIdeasRankings (SyndicateIdeaId, UserPrincipleName, IdeaRank)
            VALUES(@IDEAID, LOWER(@UPN), @RANK)
        END
  `;

  const connection = await tx.timed_request();
  await connection
    .input('IDEAID', ideaId)
    .input('UPN', upn)
    .input('RANK', rank)
    .timed_query(q, 'RankIdea');
};

const RemoveIdea = async (ideaId, upn) => {
  const q = `
    UPDATE SyndicateIdeas
    SET Deleted = 1, DeletedBy = @UPN
    WHERE SyndicateIdeaId = @IDEAID
  `;

  const connection = await db();
  await connection
    .input('IDEAID', ideaId)
    .input('UPN', upn)
    .timed_query(q, 'RemoveIdea');
};

const ManageSyndicateFormation = async (formation) => {
  const {
    currentStage,
    ideasLimit,
    levelUpId,
    numberOfGroups,
    syndicateFormationId,
    choicesAllowed,
    allowConflictingGroups,
  } = formation;
  let q = '';
  if (!syndicateFormationId && levelUpId)
    q = `
      INSERT INTO SyndicateFormation (LevelUpId, IdeasLimit, NumberOfGroups, CurrentStage, ChoicesAllowed, AllowConflictingGroups)
      VALUES( @LEVELUPID, @IDEASLIMIT, @GROUPS, @STAGE, @CHOICES, @CONFLICTINGGROUPS )
    `;
  else
    q = `
      UPDATE SyndicateFormation
      SET IdeasLimit = @IDEASLIMIT,
          NumberOfGroups = @GROUPS,
          CurrentStage = @STAGE,
          ChoicesAllowed = @CHOICES,
          AllowConflictingGroups = @CONFLICTINGGROUPS
      WHERE SyndicateFormationId = @FORMATIONID
    `;

  const connection = await db();
  await connection
    .input('LEVELUPID', levelUpId)
    .input('IDEASLIMIT', ideasLimit)
    .input('GROUPS', numberOfGroups)
    .input('STAGE', currentStage)
    .input('FORMATIONID', syndicateFormationId)
    .input('CHOICES', choicesAllowed)
    .input('CONFLICTINGGROUPS', allowConflictingGroups ? 1 : 0)
    .timed_query(q, 'ManageSyndicateFormation');
};

const getTeamMemberships = async (formationId) => {
  const q = `
      SELECT
          i.SyndicateIdeaId,
          lower(i.UserPrincipleName) AS Owner,
          Title as TeamName,
          [Description],
          lower(m.UserPrincipleName) AS Hero
      FROM SyndicateIdeas i
      INNER JOIN TeamMemberships m
      ON i.SyndicateIdeaId = m.SyndicateIdeaId
      WHERE SyndicateFormationId = @FORMATIONID
    `;

  const connection = await db();
  const result = await connection
    .input('FORMATIONID', formationId)
    .timed_query(q, 'getTeamMemberships');

  return fixCase(result.recordset);
};

const getSynicateReportTeams = async (levelUpId) => {
  const q = `
      with
      userdetail
      as
      (
          select lu.LevelUpId, lu.Name as levelUpName, ulu.UPN as "Name"
          from LevelUps lu
              inner join UserLevelUps ulu on lu.levelUpId=ulu.levelUpId
          where lu.levelUpId=@LevelUpId
      ),
      rawteamdata
      as
      (
          select lu.LevelUpId, si.SyndicateIdeaId, sf.NumberOfGroups, (select count(1)
              from userdetail)/sf.NumberOfGroups as membersPerGroup, si.Title, tm.UserPrincipleName as teammember
          from LevelUps lu
              inner join SyndicateFormation sf on sf.LevelUpId=lu.LevelUpId
              inner join SyndicateIdeas si on si.SyndicateFormationId=sf.SyndicateFormationId and deletedBy is null
              inner join teammemberships tm on tm.SyndicateIdeaId=si.SyndicateIdeaId
          where lu.levelUpId=@LevelUpId
      ),
      summary
      as
      (
          select LevelUpId, SyndicateIdeaId, NumberOfGroups, membersPerGroup, title, count(1) as memberCount
          from rawteamdata
          group by LevelUpId, SyndicateIdeaId, NumberOfGroups, membersPerGroup, title
      )
  select ud.levelUpName,ud.Name, s.title as groupName, s.membercount as numberOfMembers
  from userdetail ud
      left join rawteamdata rtd on ud.levelupid=rtd.levelupid and ud.Name=teammember
      left join summary s on s.LevelUpId=ud.levelupid and s.SyndicateIdeaId=rtd.SyndicateIdeaId
  WHERE s.title IS NOT NULL
  order by s.title;
  `;

  const connection = await db();
  const result = await connection
    .input('LevelUpId', levelUpId)
    .timed_query(q, 'getSynicateReportTeams');

  return fixCase(result.recordset);
};

const joinSyndicate = async (upn, syndicateIdeaId) => {
  const q = `INSERT INTO TeamMemberships(SyndicateIdeaId,UserPrincipleName)
    VALUES (@SYNDICATEIDEAID,LOWER(@UPN)) `;

  const connection = await db();
  await connection
    .input('SYNDICATEIDEAID', syndicateIdeaId)
    .input('UPN', upn)
    .timed_query(q, 'joinSyndicate');

  return 'inserted';
};

const updateSyndicateMembership = async (
  tx,
  upn,
  syndicateIdeaId,
  syndicateFormationId
) => {
  const q = `
    DECLARE @membershipId INT;
    SELECT @membershipId = tm.TeamMembershipId
      FROM TeamMemberships tm
      INNER JOIN SyndicateIdeas si
	    ON tm.SyndicateIdeaId = si.SyndicateIdeaId
	    WHERE tm.UserPrincipleName = @UPN AND si.SyndicateFormationId = @FORMATIONID

    IF (@membershipId IS NOT NULL)
    BEGIN
      UPDATE TeamMemberships
      SET SyndicateIdeaId = @SYNDICATEIDEAID
      WHERE TeamMembershipId = @membershipId;
    END
    ELSE
    BEGIN
      INSERT INTO TeamMemberships (SyndicateIdeaId, UserPrincipleName) VALUES
        (@SYNDICATEIDEAID, @UPN)
    END`;

  const connection = await tx.timed_request();
  await connection
    .input('SYNDICATEIDEAID', syndicateIdeaId)
    .input('FORMATIONID', syndicateFormationId)
    .input('UPN', upn)
    .timed_query(q, 'joinSyndicate');
};

const getTeamMembers = async (SyndicateideaId) => {
  const q = `
      select lower(UserPrincipleName)
      from TeamMemberships
      where SyndicateIdeaId = @ID
    `;

  const connection = await db();
  const result = await connection
    .input('ID', SyndicateideaId)
    .timed_query(q, 'getMembers');

  return fixCase(result.recordset);
};

const getAllUserPastSyndicateIdeas = async (lvlUpId, upn) => {
  const q = `
      Select UserPrincipleName, SyndicateIdeaId from TeamMemberships
      where SyndicateIdeaId !>
      (select max(SyndicateIdeaId) from SyndicateIdeas where SyndicateFormationId =
      (select SyndicateFormationId from SyndicateFormation where LevelUpId = @ID))
      and UserPrincipleName = @UPN
      ORDER by UserPrincipleName
    `;

  const connection = await db();
  const result = await connection
    .input('ID', lvlUpId)
    .input('UPN', upn)
    .timed_query(q, 'getAllUsersPastSyndicates');

  return fixCase(result.recordset);
};

const getUserPastTeamMembers = async (upn) => {
  const q = `
      SELECT UserPrincipleName
      FROM TeamMemberships
      WHERE SyndicateIdeaId IN (
        SELECT SyndicateIdeaId
        FROM TeamMemberships
        WHERE UserPrincipleName = @UPN
      )
      AND UserPrincipleName <> @UPN
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'getUsersPastTeamMembers');

  return fixCase(result.recordset);
};

const getIdeaIds = async (levelUpId) => {
  const q = `
    select SyndicateIdeaId
    from SyndicateIdeas
    where SyndicateFormationId = (select SyndicateFormationId
              from SyndicateFormation
              where LevelUpId = @ID)
  `;

  const connection = await db();
  const result = await connection
    .input('ID', levelUpId)
    .timed_query(q, 'getIdeas');

  return fixCase(result.recordset);
};

module.exports = {
  SyndicateFormationDetails,
  getIdeaSyndicateFormationDetails,
  SyndicateFormationStages,
  getFormationStage,
  getLevelUpFormationStage,
  SubmitIdea,
  GetSubmittedIdeas,
  ManageSyndicateFormation,
  RankIdea,
  RemoveIdea,
  getTeamMemberships,
  IdeaVotes,
  joinSyndicate,
  getSynicateReportTeams,
  getTeamMembers,
  getIdeaIds,
  getAllUserPastSyndicateIdeas,
  getUserPastTeamMembers,
  updateSyndicateMembership,
  getIdeaFormationStage,
  updateIdea,
  updateIdeaDetails,
};
