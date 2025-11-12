const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const update_point_values = async (pointTypeId, value) => {
  const q = `
        update Points set Points = @Value where PointTypeId = @PointTypeId and DeletedBy is null
    `;

  const connection = await db();
  await connection
    .input('PointTypeId', pointTypeId)
    .input('Value', value)
    .timed_query(q, 'update_point_values');
};

const get_upns_from_points = async () => {
  const q = `
        select distinct UserPrincipleName from Points and p.DeletedBy is null
    `;

  const connection = await db();
  const result = await connection.timed_query(q, 'get_upns_from_points');
  return fixCase(result.recordset);
};

const get_upns_from_sections = async () => {
  const q = `
        select distinct UserPrincipleName from UserSections where DeletedBy is null
    `;

  const connection = await db();
  const result = await connection.timed_query(q, 'get_upns_from_sections');
  return fixCase(result.recordset);
};

const get_points_records = async (upn) => {
  const q = `
        select PointId, PointTypeId, CreatedDate from Points
        where UserPrincipleName = @UPN
        and p.DeletedBy is null
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'get_points_records');
  return fixCase(result.recordset);
};

const create_interaction_for_record = async (tx, typeId, upn, date) => {
  const q = `insert into UserInteractions
    (
        InteractionTypeID,
        HeroUserPrincipleName,
        InteractionDate
    )
    values
    (
        @TypeID,
        LOWER(@UPN),
        @CreatedDate
    )
    
    select scope_identity() as uiid`;

  const connection = await tx.timed_request();
  const result = await connection
    .input('TypeID', typeId)
    .input('UPN', upn)
    .input('CreatedDate', date)
    .timed_query(q, 'create_interaction_for_record');
  return fixCase(result.recordset)[0];
};

const update_points_with_uiid = async (tx, pointId, uiid) => {
  const q = `
        update Points set UserInteractionID = @UIID, Multiplier = 1 where PointId = @PointID and DeletedBy is null
    `;

  const connection = await tx.timed_request();
  await connection
    .input('PointID', pointId)
    .input('UIID', uiid)
    .timed_query(q, 'update_points_with_uiid');
};

const get_self_directed_interaction_records = async (upn) => {
  const q = `
        select * from UserInteractions
        where InteractionTypeID > 8
        and InteractionTypeID != 22
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'get_self_directed_interaction_records');
  return fixCase(result.recordset);
};

const get_user_section_records = async (upn) => {
  const q = `
        select * from UserSections where UserPrincipleName = @UPN and DeletedBy is null
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'get_user_section_records');
  return fixCase(result.recordset);
};

const update_section_with_uiid = async (tx, sectionId, uiid) => {
  const q = `
        update UserSections set UserInteractionID = @UIID where UserSectionsId = @SectionId
    `;

  const connection = await tx.timed_request();
  await connection
    .input('SectionId', sectionId)
    .input('UIID', uiid)
    .timed_query(q, 'update_points_with_uiid');
};

const get_upns_from_courses = async () => {
  const q = `
        select distinct UserPrincipleName from UserCourses
    `;

  const connection = await db();
  const result = await connection.timed_query(q, 'get_upns_from_courses');
  return fixCase(result.recordset);
};

const get_course_records = async (upn) => {
  const q = `
        select * from UserCourses
        where UserPrincipleName = @UPN
        and DateCompleted IS NOT NULL;
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'get_course_records');
  return fixCase(result.recordset);
};

const update_course_with_uiid = async (tx, courseId, uiid) => {
  const q = `
        insert into UserCompletedCourses
        (
            CourseId,
            UserInteractionId
        )
        values
        (
            @CourseId,
            @UIID
        )
    `;

  const connection = await tx.timed_request();
  await connection
    .input('CourseId', courseId)
    .input('UIID', uiid)
    .timed_query(q, 'update_missions_with_uiid');
};

const insert_new_points_record = async (
  tx,
  upn,
  pointTypeId,
  date,
  value,
  uiid
) => {
  const q = `
        insert into Points
        (
            UserPrincipleName,
            PointTypeId,
            CreatedDate,
            Points,
            LinkId,
            Multiplier,
            UserInteractionID
        )
        values
        (
            LOWER(@UPN),
            @PointTypeId,
            @CreatedDate,
            @Value,
            1,
            1,
            @UIID
        )
    `;

  const connection = await tx.timed_request();
  await connection
    .input('UPN', upn)
    .input('PointTypeId', pointTypeId)
    .input('CreatedDate', date)
    .input('Value', value)
    .input('UIID', uiid)
    .timed_query(q, 'insert_new_points_record');
};

const get_upns_from_missions = async () => {
  const q = `
        SELECT DISTINCT q.HeroUserPrincipleName 
        FROM Missions m
        INNER JOIN Quests q 
        ON m.QuestId = q.QuestId
        WHERE m.MissionTypeId > 1
    `;

  const connection = await db();
  const result = await connection.timed_query(q, 'get_upns_from_missions');
  return fixCase(result.recordset);
};

const get_mission_records = async (upn) => {
  const q = `
        SELECT m.MissionId, m.MissionTypeId, m.DateCompleted, q.HeroUserPrincipleName 
        FROM Missions m
        INNER JOIN Quests q 
        ON m.QuestId = q.QuestId
        WHERE q.HeroUserPrincipleName = @UPN
        AND m.MissionTypeId != 8
        AND m.MissionTypeId > 1
        AND m.DateCompleted IS NOT NULL
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'get_mission_records');
  return fixCase(result.recordset);
};

const get_mission_types = async () => {
  const q = `
        select * from MissionTypes
    `;

  const connection = await db();
  const result = await connection.timed_query(q, 'get_mission_types');
  return fixCase(result.recordset);
};

const update_missions_with_uiid = async (tx, type, uiid) => {
  const q = `
        insert into UserSelfDirectedMissions
        (
            InteractionTypeID,
            UserInteractionID
        )
        values
        (
            @Type,
            @UIID
        )
    `;

  const connection = await tx.timed_request();
  await connection
    .input('Type', type)
    .input('UIID', uiid)
    .timed_query(q, 'update_missions_with_uiid');
};

module.exports = {
  get_upns_from_points,
  get_upns_from_sections,
  get_upns_from_missions,
  get_points_records,
  create_interaction_for_record,
  update_points_with_uiid,
  get_self_directed_interaction_records,
  get_user_section_records,
  update_section_with_uiid,
  get_mission_records,
  get_mission_types,
  update_missions_with_uiid,
  get_upns_from_courses,
  get_course_records,
  update_course_with_uiid,
  update_point_values,
  insert_new_points_record,
};
