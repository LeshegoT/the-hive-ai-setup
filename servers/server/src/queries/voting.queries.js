const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const voting_event = async (eventId) => {
  const query = `
    SELECT TOP 1 * FROM VotingEvents WHERE VotingEventId = @EVENTID
  `;

  const connection = await db();
  const results = await connection
    .input('EVENTID', eventId)
    .timed_query(query, 'voting_event');

  return fixCase(results.recordset);
};

const active_voting_events = async () => {
  const query =
    'SELECT * FROM VotingEvents where GETDATE() Between StartDate and EndDate and Active = 1 ';

  const connection = await db();
  const results = await connection.timed_query(query, 'active_voting_events');

  return fixCase(results.recordset);
};

const voting_options = async (eventId) => {
  const query = `
      SELECT 
      VotingOptionId,
      VotingEventId,
      Name,
      Description
      FROM VotingOptions 
      WHERE VotingEventId = @EVENTID AND Active = 1
    `;

  const connection = await db();
  const results = await connection
    .input('EVENTID', eventId)
    .timed_query(query, 'voting_options');

  return fixCase(results.recordset);
};

const user_votes = async (eventId, upn) => {
  const query = `
    WITH Options AS (
        SELECT VotingOptionId, VotingEventId FROM VotingOptions WHERE VotingEventId = @EVENTID
    ),
    votes AS (
        SELECT * FROM UserVotes WHERE UserPrincipleName = @UPN
    )
    SELECT 
      o.VotingOptionId,
      VotingEventId,
      UserVoteId,
      UserPrincipleName,
      Rating
    FROM Options o Left JOIN votes v on o.VotingOptionId = v.VotingOptionId
    `;

  const connection = await db();
  const results = await connection
    .input('EVENTID', eventId)
    .input('UPN', upn)
    .timed_query(query, 'user_votes');

  return fixCase(results.recordset);
};

const vote = async (tx, optionId, upn, rating) => {
  const query = `
    IF NOT EXISTS(SELECT * FROM UserVotes WHERE UserPrincipleName = @UPN AND VotingOptionId = @OPTIONID )
    BEGIN 
        INSERT INTO UserVotes(UserPrincipleName, VotingOptionId, Rating) 
        VALUES (LOWER(@UPN), @OPTIONID, @RATING)

        SELECT CAST(1 AS BIT) AS ShouldReward
    END 
    ELSE 
    BEGIN 
        UPDATE UserVotes 
        SET Rating = @RATING
        WHERE UserPrincipleName = @UPN AND VotingOptionId = @OPTIONID

        SELECT CAST(0 AS BIT) AS ShouldReward
    END 
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('OPTIONID', optionId)
    .input('UPN', upn)
    .input('RATING', rating)
    .timed_query(query, 'vote');

  return result.recordset[0].ShouldReward;
};

const get_vote_reward = async (eventId) => {
  const q = `
    SELECT Reward FROM VotingEvents
    WHERE VotingEventId = @EventId
  `;

  const connection = await db();
  const result = await connection
    .input('EventId', eventId)
    .timed_query(q, 'get_vote_reward');
  return result.recordset[0].Reward;
};

const get_voting_option_details = async (optionId) => {
  const q = `
    SELECT ve.EventName ,vo.Name FROM VotingEvents ve
    INNER JOIN VotingOptions vo 
    ON ve.VotingEventId = vo.VotingEventId
    WHERE vo.VotingOptionId = @OptionId
  `;

  const connection = await db();
  const result = await connection
    .input('OptionId', optionId)
    .timed_query(q, 'get_voting_option_details');

  return fixCase(result.recordset)[0];
};

module.exports = {
  voting_options,
  user_votes,
  vote,
  active_voting_events,
  voting_event,
  get_vote_reward,
  get_voting_option_details,
};
