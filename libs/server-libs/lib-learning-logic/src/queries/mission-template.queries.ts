import { fixCase } from "@the-hive/lib-core";
import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { MissionTemplate, MissionTemplateUpdate } from '@the-hive/lib-learning-shared';



export const getMissionTemplatesByQuestTemplateId = async (
  db: () => Promise<SqlRequest>,
  questTemplateId: number
): Promise<MissionTemplate[]> => {
  const query = `
    SELECT
      mt.MissionTemplateId,
      mt.Name,
      mt.Description,
      mty.Name AS MissionTypeName,
      mt.Link,
      mt.SortOrder,
      mt.CreatedDate,
      mt.ModifiedDate
    FROM MissionTemplates mt
    INNER JOIN MissionTypes mty ON mt.MissionTypeId = mty.MissionTypeId
    WHERE mt.QuestTemplateId = @QuestTemplateId
    ORDER BY SortOrder
  `;
  const request = await db();
  const result = await request
    .input('QuestTemplateId', questTemplateId)
    .timed_query(query, 'get_mission_templates_by_quest_template_id');

  return fixCase(result.recordset) as MissionTemplate[];
};

export const getMissionTemplateById = async (
  db: () => Promise<SqlRequest>,
  missionTemplateId: number
): Promise<MissionTemplate> => {
  const query = `SELECT
    MissionTemplateId,
    QuestTemplateId,
    Name,
    Description,
    Link,
    MissionTypeId,
    SortOrder,
    CreatedDate,
    ModifiedDate
  FROM MissionTemplates WHERE MissionTemplateId = @MissionTemplateId`;
  const request = await db();
  const result = await request
    .input('MissionTemplateId', missionTemplateId)
    .timed_query(query, 'get_mission_template_by_id');
  return fixCase(result.recordset)[0] as MissionTemplate;
};


export const updateMissionTemplate = async (
  db: () => Promise<SqlRequest>,
  missionTemplateId: number,
  updates: MissionTemplateUpdate
): Promise<void> => {
  const query = `
    UPDATE MissionTemplates
    SET
      Name = @Name,
      Description = @Description,
      Link = @Link,
      MissionTypeId = @MissionTypeId,
      SortOrder = @SortOrder,
      ModifiedDate = GETDATE()
    WHERE MissionTemplateId = @MissionTemplateId;
  `;
  const request = await db();
  await request
    .input('MissionTemplateId', missionTemplateId)
    .input('Name', updates.name)
    .input('Description', updates.description)
    .input('Link', updates.link)
    .input('MissionTypeId', updates.missionTypeId)
    .input('SortOrder', updates.sortOrder)
    .timed_query(query, 'update_mission_template');
};

export const createMissionTemplate = async (
  tx: SqlTransaction,
  {
    questTemplateId,
    name,
    description,
    link,
    missionTypeId,
    sortOrder
  }: {
    questTemplateId: number;
    name: string;
    description: string;
    link?: string;
    missionTypeId: number;
    sortOrder: number;
  }
): Promise<MissionTemplate> => {
  const query = `
    INSERT INTO MissionTemplates (
      QuestTemplateId, Name, Description, Link, MissionTypeId, SortOrder
    )
    OUTPUT INSERTED.MissionTemplateId, INSERTED.QuestTemplateId, INSERTED.Name, INSERTED.Description, INSERTED.Link, INSERTED.MissionTypeId, INSERTED.SortOrder, INSERTED.CreatedDate, INSERTED.ModifiedDate
    VALUES (
      @QuestTemplateId, @Name, @Description, @Link, @MissionTypeId, @SortOrder
    )
  `;
  const request = tx.request();
  const result = await request
    .input('QuestTemplateId', questTemplateId)
    .input('Name', name)
    .input('Description', description)
    .input('Link', link)
    .input('MissionTypeId', missionTypeId)
    .input('SortOrder', sortOrder)
    .query(query);
  return result.recordset[0];
};
