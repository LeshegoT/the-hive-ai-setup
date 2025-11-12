import { db } from '../shared/db';
import fixCase from '../shared/fix-case';
import { SqlTransaction } from '@the-hive/lib-db';

export interface MissionTemplate {
  missionTemplateId: number;
  questTemplateId: number;
  name: string;
  description: string;
  link: string;
  missionTypeId: number;
  sortOrder: number;
  createdDate: Date;
  modifiedDate: Date;
  questTemplateName: string;
  missionTypeName: string;
}

export const getAllMissionTemplates = async (): Promise<MissionTemplate[]> => {
  const query = `
    SELECT
      mt.MissionTemplateId,
      mt.QuestTemplateId,
      mt.Name,
      mt.Description,
      mt.Link,
      mt.MissionTypeId,
      mt.SortOrder,
      mt.CreatedDate,
      mt.ModifiedDate,
      qt.Name AS QuestTemplateName,
      mty.Name AS MissionTypeName
    FROM MissionTemplates mt
    INNER JOIN QuestTemplates qt ON mt.QuestTemplateId = qt.QuestTemplateId
    INNER JOIN MissionTypes mty ON mt.MissionTypeId = mty.MissionTypeId
    ORDER BY mt.SortOrder ASC
  `;
  const request = await db();
  const result = await request.timed_query(query, 'get_all_mission_templates');
  return fixCase(result.recordset);
};

export const getMissionTemplatesByQuestTemplateId = async (
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
  return fixCase(result.recordset);
};

export const getMissionTemplateById = async (
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
  return fixCase(result.recordset)[0];
};

export type MissionTemplateUpdate = Omit<MissionTemplate, 'missionTemplateId' | 'questTemplateId' | 'createdDate' | 'modifiedDate' | 'questTemplateName' | 'missionTypeName'>;

export const updateMissionTemplate = async (
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
  return fixCase(result.recordset)[0];
};
