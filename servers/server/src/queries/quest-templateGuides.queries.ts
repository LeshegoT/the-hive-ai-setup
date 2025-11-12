import { db } from '../shared/db';
import { SqlTransaction } from '@the-hive/lib-db';
import fixCase from '../shared/fix-case';

export const addGuideToQuestTemplate = async (
  tx: SqlTransaction,
  questTemplateId: number,
  upn: string
): Promise<void> => {
  const request = tx.request();
  await request
    .input('QuestTemplateId', questTemplateId)
    .input('UPN', upn)
    .query('INSERT INTO QuestTemplateGuides (QuestTemplateId, UPN) VALUES (@QuestTemplateId, @UPN)');
};

export const removeGuidesForQuestTemplate = async (
  tx: SqlTransaction,
  questTemplateId: number
): Promise<void> => {
  const request = tx.request();
  await request
    .input('QuestTemplateId', questTemplateId)
    .query('DELETE FROM QuestTemplateGuides WHERE QuestTemplateId = @QuestTemplateId');
};

export const getGuidesForQuestTemplate = async (
  questTemplateId: number
): Promise<string[]> => {
  const query = `SELECT UPN FROM QuestTemplateGuides WHERE QuestTemplateId = @QuestTemplateId`;
  const request = await db();
  const result = await request.input('QuestTemplateId', questTemplateId).query(query);
  return result.recordset.map((row: { UPN: string }) => row.UPN);
};

export const deleteGuidesForQuestTemplate = async (
  tx: SqlTransaction,
  questTemplateId: number
): Promise<void> => {
  const request = tx.request();
  await request
    .input('QuestTemplateId', questTemplateId)
    .query('DELETE FROM QuestTemplateGuides WHERE QuestTemplateId = @QuestTemplateId');
};

export const addGuidesToQuestTemplate = async (
  tx: SqlTransaction,
  questTemplateId: number,
  upns: string[]
): Promise<void> => {
  if (upns.length === 0) {
    return;
  }else{
  const values = upns.map((_, i) => `(@QuestTemplateId, @UPN${i})`).join(', ');
  const request = tx.request().input('QuestTemplateId', questTemplateId);
  for (let i = 0; i < upns.length; i++) {
    request.input(`UPN${i}`, upns[i]);
  }
  await request.query(
    `INSERT INTO QuestTemplateGuides (QuestTemplateId, UPN) VALUES ${values}`
  );
  }
};

export interface QuestTemplate {
  QuestTemplateId: number;
  Name: string;
  Description: string;
  QuestTypeId: number;
  SpecialisationId: number;
  Goal: string;
  DurationMonths: number;
  CreatedDate: Date;
  ModifiedDate: Date;
}

export interface QuestTemplateGuideResult {
  questTemplateId: number;
  name: string;
  description: string;
  questTypeName: string;
  specialisationName: string;
  goal: string;
  durationMonths: number;
  createdDate: Date;
  modifiedDate: Date;
}

export const getQuestTemplatesByGuideUpn = async (
  guideUpn: string
): Promise<QuestTemplateGuideResult[]> => {
  const query = `
    SELECT
      qt.QuestTemplateId,
      qt.Name,
      qt.Description,
      qty.Name AS QuestTypeName,
      s.Name AS SpecialisationName,
      qt.Goal,
      qt.DurationMonths,
      qt.CreatedDate,
      qt.ModifiedDate
    FROM QuestTemplates qt
    INNER JOIN QuestTemplateGuides qtg ON qt.QuestTemplateId = qtg.QuestTemplateId
    INNER JOIN Specialisations s ON qt.SpecialisationId = s.SpecialisationId
    INNER JOIN QuestTypes qty ON qt.QuestTypeId = qty.QuestTypeId
    WHERE qtg.UPN = @GuideUpn
    ORDER BY qt.CreatedDate DESC
  `;
  const request = await db();
  const result = await request.input('GuideUpn', guideUpn).query(query);
  return fixCase(result.recordset);
};
