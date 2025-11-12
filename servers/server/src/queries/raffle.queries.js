const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const retrieveUserParticipantRaffles = async (upn) => {
  const query = `
      SELECT rp.RaffleParticipantId, rp.Entries, rp.Winner, r.RaffleId, r.Description, r.CreatedBy, r.SpinDate, r.OutlookEvent, rs.Status, rs.Description AS StatusDescription
      FROM RaffleParticipants rp
        INNER JOIN Raffles r ON rp.RaffleId = r.RaffleId AND r.RaffleId = 31
        INNER JOIN RaffleStatus rs ON rs.RaffleStatusId = r.RaffleStatusId
      WHERE rp.Participant = @UPN
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'retrieveUserParticipantRaffles');

  return fixCase(result.recordset);
};

const retrieveRaffleParticipants = async (id) => {
  const query = `
      SELECT rp.RaffleParticipantId, rp.Winner, rp.Participant, s.DisplayName , rp.RaffleId , rp.Entries, rp.BucksSpent
      FROM RaffleParticipants rp
        INNER JOIN Staff s ON s.UserPrincipleName = rp.Participant
      WHERE rp.RaffleId = @ID
      ORDER BY rp.Entries DESC
    `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(query, 'retrieveRaffleParticipants');

  return fixCase(result.recordset);
};

const retrieveRaffle = async (id) => {
  const query = `
      SELECT r.RaffleId, r.Description, r.CreatedBy, r.SpinDate, r.OutlookEvent, rs.Status, rs.Description AS StatusDescription
      FROM Raffles r
        INNER JOIN RaffleStatus rs ON rs.RaffleStatusId = r.RaffleStatusId
      WHERE r.RaffleId = @ID
    `;

  const connection = await db();
  const result = await connection
    .input('ID', id)
    .timed_query(query, 'retrieveRaffle');

  return fixCase(result.recordset);
};

const retrieveRaffleRewardReason = async () => {
  const query = `
      SELECT RewardReasonId
      FROM RewardReasons
      WHERE Description = 'Raffle Winnings'
    `;

  const connection = await db();
  const result = await connection.timed_query(
    query,
    'retrieveRaffleRewardReason'
  );

  return fixCase(result.recordset)[0];
};

const createRaffle = async (tx, description, by, status, spinDate) => {
  const query = `
    INSERT INTO Raffles (Description, CreatedBy, CreatedAt, RaffleStatusId, SpinDate)
    VALUES (@Description, @By, GETDATE(), @Status, @SpinDate)

    SELECT scope_identity() AS  RaffleId;
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('Description', description)
    .input('By', by)
    .input('Status', status)
    .input('SpinDate', spinDate)
    .timed_query(query, 'createRaffle');

  return result.recordset[0].RaffleId;
};

const addParticipantToRaffle = async (tx, participant, raffle) => {
  const query = `
    INSERT INTO RaffleParticipants (Participant, RaffleId)
    VALUES (@Participant, @Raffle)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('Participant', participant)
    .input('Raffle', raffle)
    .timed_query(query, 'addParticipantToRaffle');
};

const updateParticpantEntries = async (entries, bucks, id, upn) => {
  const query = `
      UPDATE RaffleParticipants
      SET Entries = Entries + @Entries,
      BucksSpent = BucksSpent + @Bucks
      WHERE RaffleId = @ID
      AND Participant = @UPN
    `;

  const connection = await db();
  await connection
    .input('Entries', entries)
    .input('Bucks', bucks)
    .input('ID', id)
    .input('UPN', upn)
    .timed_query(query, 'updateParticpantEntries');
};

const updateRaffleWinner = async (tx, winnerId, awardId) => {
  const query = `
      UPDATE RaffleParticipants
      SET Winner = 1 , AwardId = @AwardID
      WHERE RaffleParticipantId = @WinnerID
    `;

  const connection = await tx.timed_request();
  await connection
    .input('WinnerID', winnerId)
    .input('AwardID', awardId)
    .timed_query(query, 'updateRaffleWinner');
};

const updateRaffleSpinDate = async (id, spinDate, upn) => {
  const query = `
      UPDATE Raffles
      SET SpinDate = @SpinDate
      WHERE RaffleId = @ID AND CreatedBy = @UPN
    `;

  const connection = await db();
  await connection
    .input('ID', id)
    .input('SpinDate', spinDate)
    .input('UPN', upn)
    .timed_query(query, 'updateRaffleSpinDate');
};

const updateRaffleStatus = async () => {
  const query = `
      UPDATE Raffles
      SET RaffleStatusId = 1
      WHERE ( CAST(SpinDate AS DATETIME) > CAST(GETDATE() AS DATETIME))

      UPDATE Raffles
      SET RaffleStatusId = 2
      WHERE ( CAST(SpinDate AS DATETIME) < CAST(GETDATE() AS DATETIME))

      UPDATE Raffles
      SET RaffleStatusId = 3
      WHERE RaffleId IN (SELECT RaffleId FROM RaffleParticipants WHERE Winner = 1)

      UPDATE Raffles
      SET RaffleStatusId = 4
      WHERE RaffleStatusId = 2 AND
      RaffleId IN
      (
           SELECT RaffleId
                FROM RaffleParticipants
                    WHERE Entries > 0
                    GROUP BY RaffleId
                    HAVING COUNT(*) < 3
            UNION
                SELECT RaffleId
                FROM RaffleParticipants
                    GROUP BY RaffleId
                    HAVING SUM(Entries)  = 0
      )

    `;

  const connection = await db();
  await connection.timed_query(query, 'updateRaffleStatus');
};

module.exports = {
  retrieveUserParticipantRaffles,
  retrieveRaffleParticipants,
  createRaffle,
  addParticipantToRaffle,
  updateParticpantEntries,
  updateRaffleStatus,
  retrieveRaffle,
  updateRaffleWinner,
  retrieveRaffleRewardReason,
  updateRaffleSpinDate,
};
