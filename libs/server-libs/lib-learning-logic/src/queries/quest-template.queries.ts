import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { fixCase } from "@the-hive/lib-core";
import { QuestTemplate, QuestTemplateUpdate, MissionTemplateUpdate  } from '@the-hive/lib-learning-shared';

export const getAllQuestTemplates = async (db: () => Promise<SqlRequest>): Promise<QuestTemplate[]> => {
  const query = `
    SELECT
      qt.QuestTemplateId,
      qt.Name,
      qt.Description,
      qt.Goal,
      qt.DurationMonths,
      qt.CreatedDate,
      qt.ModifiedDate,
      qt.SpecialisationId,
      s.Name AS SpecialisationName,
      qt.QuestTypeId,
      qty.Name AS QuestTypeName
    FROM QuestTemplates qt
    INNER JOIN Specialisations s ON qt.SpecialisationId = s.SpecialisationId
    INNER JOIN QuestTypes qty ON qt.QuestTypeId = qty.QuestTypeId
    ORDER BY qt.Name ASC
  `;
  const request = await db();
  const result = await request.timed_query(query, 'get_all_quest_templates');
  const questTemplates = fixCase(result.recordset);
  return questTemplates as QuestTemplate[];
};

export const getQuestTemplateById = async (db: () => Promise<SqlRequest>,
  questTemplateId: number
): Promise<QuestTemplate> => {
  const query = `
    SELECT
      qt.QuestTemplateId,
      qt.Name,
      qt.Description,
      qt.Goal,
      qt.DurationMonths,
      s.Name AS SpecialisationName,
      qty.Name AS QuestTypeName,
      qt.CreatedDate,
      qt.ModifiedDate
    FROM QuestTemplates qt
    INNER JOIN Specialisations s ON qt.SpecialisationId = s.SpecialisationId
    INNER JOIN QuestTypes qty ON qt.QuestTypeId = qty.QuestTypeId
    WHERE qt.QuestTemplateId = @QuestTemplateId
  `;
  const request = await db();
  const result = await request
    .input('QuestTemplateId', questTemplateId)
    .timed_query(query, 'get_quest_template_by_id');
  const questTemplate = fixCase(result.recordset)[0];
  return questTemplate as QuestTemplate;
};


export const updateQuestTemplate = async (
  tx: SqlTransaction,
  questTemplateId: number,
  updates: QuestTemplateUpdate
): Promise<void> => {
  const query = `
    UPDATE QuestTemplates
    SET
      Name = @Name,
      Description = @Description,
      QuestTypeId = @QuestTypeId,
      SpecialisationId = @SpecialisationId,
      Goal = @Goal,
      DurationMonths = @DurationMonths,
      ModifiedDate = GETDATE()
    WHERE QuestTemplateId = @QuestTemplateId;
  `;
  const request = await tx.timed_request();
  await request
    .input('QuestTemplateId', questTemplateId)
    .input('Name', updates.name)
    .input('Description', updates.description)
    .input('QuestTypeId', updates.questTypeId)
    .input('SpecialisationId', updates.specialisationId)
    .input('Goal', updates.goal)
    .input('DurationMonths', updates.durationMonths)
    .query(query);
};

export const createQuestTemplate = async (
  tx: SqlTransaction,
  questTemplate: QuestTemplateUpdate
): Promise<QuestTemplate> => {
  const query = `
    INSERT INTO QuestTemplates (
      Name, Description, QuestTypeId, SpecialisationId, Goal, DurationMonths
    )
    OUTPUT INSERTED.QuestTemplateId, INSERTED.Name, INSERTED.Description, INSERTED.QuestTypeId, INSERTED.SpecialisationId, INSERTED.Goal, INSERTED.DurationMonths, INSERTED.CreatedDate, INSERTED.ModifiedDate
    VALUES (
      @Name, @Description, @QuestTypeId, @SpecialisationId, @Goal, @DurationMonths
    )
  `;
  const request = await tx.timed_request();
  const result = await request
    .input('Name', questTemplate.name)
    .input('Description', questTemplate.description)
    .input('QuestTypeId', questTemplate.questTypeId)
    .input('SpecialisationId', questTemplate.specialisationId)
    .input('Goal', questTemplate.goal)
    .input('DurationMonths', questTemplate.durationMonths)
    .query(query);
  return fixCase<QuestTemplate>(result.recordset)[0];
};

export const update_quest_template = async (
  tx: SqlTransaction,
  questTemplateId: number,
  updates: QuestTemplateUpdate,
  newMissions: MissionTemplateUpdate[],
  existingMissions: (MissionTemplateUpdate & { missionTemplateId: number })[]
): Promise<void> => {


  await updateQuestTemplate(tx, questTemplateId, updates);

  const result = await (await tx.timed_request())
    .input('QuestTemplateId', questTemplateId)
    .query<{ MissionTemplateId: number }>(
      'SELECT MissionTemplateId FROM MissionTemplates WHERE QuestTemplateId = @QuestTemplateId'
    );

  const currentIds = new Set<number>(
    result.recordset.map(mission => mission.MissionTemplateId)
  );

  const incomingIds = new Set<number>(
    existingMissions.map(mission => mission.missionTemplateId)
  );


  for (const id of currentIds) {
    if (!incomingIds.has(id)) {
      const request = await tx.timed_request();
      await request
        .input('MissionTemplateId', id)
        .query('DELETE FROM MissionTemplates WHERE MissionTemplateId = @MissionTemplateId');
    }
  }
  for (const mission of existingMissions) {
    const request = await tx.timed_request();
    await request
      .input('MissionTemplateId', mission.missionTemplateId)
      .input('Name', mission.name)
      .input('Description', mission.description)
      .input('Link', mission.link)
      .input('MissionTypeId', mission.missionTypeId)
      .input('SortOrder', mission.sortOrder)
      .query(`UPDATE MissionTemplates
              SET Name = @Name, Description = @Description, Link = @Link,
                  MissionTypeId = @MissionTypeId, SortOrder = @SortOrder
              WHERE MissionTemplateId = @MissionTemplateId`);
  }

  for (const mission of newMissions) {
    const request = await tx.timed_request();
    await request
      .input('QuestTemplateId', questTemplateId)
      .input('Name', mission.name)
      .input('Description', mission.description)
      .input('Link', mission.link)
      .input('MissionTypeId', mission.missionTypeId)
      .input('SortOrder', mission.sortOrder)
      .query(`INSERT INTO MissionTemplates (QuestTemplateId, Name, Description, Link, MissionTypeId, SortOrder)
              VALUES (@QuestTemplateId, @Name, @Description, @Link, @MissionTypeId, @SortOrder)`);
  }

};
