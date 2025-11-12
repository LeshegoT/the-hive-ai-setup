const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const award_bucks = async (tx, amount, upn, awardedBy, reasonId) => {
  const q = `
        insert into SpendAwarded
        (AwardedTo, Amount, AwardedOn, AwardedBy, RewardReasonId)
        values
        (LOWER(@UPN), @Amount, getdate(), @AwardedBy, @ReasonId);

        select scope_identity() awardId
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('Amount', amount)
    .input('UPN', upn)
    .input('AwardedBy', awardedBy)
    .input('ReasonId', reasonId)
    .timed_query(q, 'award_bucks');

  return result.recordset[0].awardId;
};

const get_reward_reasons = async () => {
  const q = `
        select RewardReasonId, Description from RewardReasons
    `;

  const connection = await db();
  const result = await connection.timed_query(q, 'get_reward_reasons');
  return fixCase(result.recordset);
};

const insert_reward_reason = async (tx, reason) => {
  const q = `
        insert into RewardReasons(Description)
        values(@Reason)

        select scope_identity() reasonId;
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('Reason', reason)
    .timed_query(q, 'insert_reward_reason');
  return result.recordset[0].reasonId;
};

const get_easter_egg_record = async (guid) => {
  const q = `
        select
            CodeId, 
            ClaimLimit,
            ActiveStartDate,
            ActiveEndDate,
            BucksValue,
            rc.TypeId,
            IssuedTo,
            Expiry,
            CanClaimManually
        from RewardCodes rc
        inner join RewardCodeTypes rct
        on rc.TypeId = rct.TypeId
        where CodeGuid = @GUID
    `;

  const connection = await db();
  const result = await connection
    .input('GUID', guid)
    .timed_query(q, 'get_easter_egg_record');
  return fixCase(result.recordset)[0];
};

const get_code_claims = async (codeId) => {
  const q = `
        select claimedBy
        from RewardCodeClaims
        where CodeId = @CodeId
    `;

  const connection = await db();
  const result = await connection
    .input('CodeId', codeId)
    .timed_query(q, 'get_code_claims');
  return fixCase(result.recordset);
};

const claim_easter_egg_code = async (tx, codeId, upn) => {
  const q = `
        insert into RewardCodeClaims
        (
            CodeId,
            ClaimedBy,
            ClaimDate
        )
        values
        (
            @CodeId,
            LOWER(@UPN),
            getdate()
        )
    `;

  const connection = await tx.timed_request();
  await connection
    .input('CodeId', codeId)
    .input('UPN', upn)
    .timed_query(q, 'claim_easter_egg_code');
};

const get_easter_egg_token = async () => {
  const q = `
        select codes.CodeId, CodeGuid, ActiveStartDate, ActiveEndDate, BucksValue, IssuedTo
        from RewardCodes codes
        inner join RewardCodeTypes types
        on codes.TypeId = types.TypeId
        where 1=1
        and not EXISTS (select 1
        from RewardCodeClaims claims
        where codes.CodeId = claims.CodeId)
        and ClaimLimit=1
        and getdate() between ActiveStartDate AND ActiveEndDate
        and types.CanClaimManually = 0
        and IssuedTo is null
    `;

  const connection = await db();
  const result = await connection.timed_query(q, 'get_easter_egg_token');
  const availableTokens = fixCase(result.recordset);

  if (availableTokens.length === 1) {
    return availableTokens[0];
  }
  return availableTokens && !!availableTokens.length
    ? availableTokens[getRandomInt(availableTokens.length)]
    : null;
};

const get_code_types = async () => {
  const q = `
        SELECT TypeId, [Description], CanClaimManually 
        FROM RewardCodes
    `;

  const connection = await db();
  const result = await connection.timed_query(q, 'get_code_types');
  return fixCase(result.recordset);
};

const issue_easter_egg = async (codeId, upn) => {
  const q = `
        update RewardCodes
        set IssuedTo = @UPN,
        Expiry = dateadd(s, 30, getdate())
        where CodeId = @CodeId
    `;

  const connection = await db();
  await connection
    .input('CodeId', codeId)
    .input('UPN', upn)
    .timed_query(q, 'issue_easter_egg');
};

const clear_easter_egg_issue_data = async () => {
  const q = `
        update RewardCodes
        set IssuedTo = NULL,
        Expiry = NULL
        where TypeId = 5
        and Expiry < getdate()
    `;

  const connection = await db();
  await connection.timed_query(q, 'clear_easter_egg_issue_data');
};

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

module.exports = {
  award_bucks,
  get_reward_reasons,
  insert_reward_reason,
  claim_easter_egg_code,
  get_easter_egg_record,
  get_code_claims,
  get_easter_egg_token,
  get_code_types,
  issue_easter_egg,
  clear_easter_egg_issue_data,
};
