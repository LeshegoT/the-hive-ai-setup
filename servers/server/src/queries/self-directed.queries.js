const fixCase = require('../shared/fix-case');

const get_mission_type = async (tx, missionTypeId) => {
  const q = `
    select Code from MessageTypes where MessageTypeId = @MissionType
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('MissionType', missionTypeId)
    .timed_query(q, 'get_mission_type');

  return result.recordset[0].Code;
};

const get_mission_code = async (tx, missionTypeId) => {
  const q = `
    select Code from MissionTypes where MissionTypeId = @MissionType
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('MissionType', missionTypeId)
    .timed_query(q, 'get_mission_code');

  return result.recordset[0].Code;
};

const insert_self_directed_mission = async (tx, uiid, typeID) => {
  const q = `
        insert into UserSelfDirectedMissions
        (
            InteractionTypeID,
            UserInteractionID
        )
        values
        (
            @TypeID,
            @UserInteractionID
        )

        select UserSelfDirectedMissionsID from UserSelfDirectedMissions where UserSelfDirectedMissionsID = scope_identity()
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('UserInteractionID', uiid)
    .input('TypeID', typeID)
    .timed_query(q, 'insert_self_directed_mission');

  return fixCase(result.recordset);
};

module.exports = {
  get_mission_type,
  insert_self_directed_mission,
  get_mission_code,
};
