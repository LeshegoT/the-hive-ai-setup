const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const all_parts = async () => {
  const q = 'select * from Parts';

  const request = await db();
  const results = await request.timed_query(q, 'all_parts');
  const parts = fixCase(results.recordset);

  return parts;
};

const number_of_parts_available = async (upn) => {
  const q = `
    select count(*) as numberOfPartsAvailable
    from ClaimParts 
    where UPN = @UPN 
      and ClaimedDate is null
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'number_of_parts_available');
  const numberOfPartsAvailable = results.recordset[0].numberOfPartsAvailable;

  return numberOfPartsAvailable;
};

const all_claim_parts = async (upn) => {
  const q = `
  select *
  from ClaimParts 
  where UPN = @UPN 
    and ClaimedDate is null
`;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'all_claim_parts');
  return fixCase(results.recordset);
};

const choose_parts = async (avatarId, claim_parts) => {
  const tx = await transaction();

  try {
    await tx.begin();

    for (const { claimPartId, partId } of claim_parts) {
      const q = `
        -- Update the claim part to claimed
        update ClaimParts
        set PartId = @PartId,
            ClaimedDate = getdate()
        where ClaimPartId = @ClaimPartId

        -- Disable all parts that share the same part type
        update AvatarParts
        set Active = 0
        where AvatarId = @AvatarId
         and AvatarPartId in (
          select ap.AvatarPartId
          from ClaimParts cp
            inner join Parts p on p.PartType = cp.PartType
            inner join AvatarParts ap on ap.PartId = p.PartId
          where cp.ClaimPartId = @ClaimPartId
            and ap.AvatarId = @AvatarId
         )

        -- Insert and activate the new part
        insert into AvatarParts
        (AvatarId, PartId, Active)
        values (@AvatarId, @PartId, 1)
      `;

      const request = await tx.timed_request();

      await request
        .input('AvatarId', avatarId)
        .input('ClaimPartId', claimPartId)
        .input('PartId', partId)
        .timed_query(q, 'choose_parts');
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const award_part = async (upn, partId, partType, reason) => {
  const request = await db();
  const insertedId = await insert_part(request, upn, partId, partType, reason);
  return insertedId;
};

const insert_part = async (request, upn, partId, partType, reason) => {
  const q = `
  INSERT INTO ClaimParts
  (
      UPN,
      PartId,
      PartType,
      CreatedDate,
      [Description]
  )
  VALUES
  (
    LOWER(@UPN),
    @PartId,
    @PartType,
    getdate(),
    @Reason
  )

  SELECT SCOPE_IDENTITY() as ClaimPartId
  `;

  const insertedId = await request
    .input('UPN', upn)
    .input('PartId', partId)
    .input('PartType', partType)
    .input('Reason', reason)
    .timed_query(q, 'insert_part');

  return fixCase(insertedId.recordset)[0].claimPartId;
};

const link_part_to_quest = async (tx, claimPartId, questId) => {
  const q = `
  INSERT INTO QuestClaims
  (
    ClaimPartId,
    QuestId
  )
  VALUES
  (
    @ClaimPartId,
    @QuestId
  )
  `;

  const request = await tx.timed_request();

  await request
    .input('QuestId', questId)
    .input('ClaimPartId', claimPartId)
    .timed_query(q, 'link_part_to_quest');
};

const remove_part = async (tx, upn, type, id) => {
  const q = `
    Declare @ClaimPartId int

    IF @PartType = 'accessory'
    Begin
      select TOP(1) @ClaimPartId = ClaimPartId 
      from QuestClaims 
      where QuestId = @ID

      Delete from QuestClaims
        where QuestId = @ID
    End

    IF @PartType = 'left'
    Begin
      select TOP(1) @ClaimPartId = ClaimPartId 
      from MissionClaims 
      where MissionId = @ID

      Delete from MissionClaims
        where MissionId = @ID
    End

    Delete from AvatarParts
    where AvatarId = (select Top(1) AvatarId from Avatars where UPN = @UPN)
    and PartId = (
      select TOP(1) PartId from ClaimParts
        where ClaimPartId = @ClaimPartId
    )

    Delete from ClaimParts
    where ClaimPartId = @ClaimPartId
  `;

  const request = await tx.timed_request();

  await request
    .input('UPN', upn)
    .input('PartType', type)
    .input('ID', id)
    .timed_query(q, 'remove_part');
};

const save_mission_claim = async (claimPartId, missionId) => {
  const q = `
  INSERT INTO MissionClaims
  (ClaimPartId, MissionId)
  VALUES
  (
    @ClaimPartId,
    @MissionId
  )
  `;

  const request = await db();
  await request
    .input('ClaimPartId', claimPartId)
    .input('MissionId', missionId)
    .timed_query(q, 'save_mission_claim');
};

module.exports = {
  all_parts,
  all_claim_parts,
  number_of_parts_available,
  choose_parts,
  award_part,
  link_part_to_quest,
  insert_part,
  remove_part,
  save_mission_claim,
};
