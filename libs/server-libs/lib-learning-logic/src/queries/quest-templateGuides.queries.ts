
import { SqlTransaction,SqlRequest } from "@the-hive/lib-db";
import { fixCase } from "@the-hive/lib-core";
import { QuestTemplateGuideResult } from '@the-hive/lib-learning-shared';

export const addGuideToQuestTemplate = async (
  db: () => Promise<SqlRequest>,
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
  db: () => Promise<SqlRequest>,
  tx: SqlTransaction,
  questTemplateId: number
): Promise<void> => {
  const request = tx.request();
  await request
    .input('QuestTemplateId', questTemplateId)
    .query('DELETE FROM QuestTemplateGuides WHERE QuestTemplateId = @QuestTemplateId');
};

export const getGuidesForQuestTemplate = async (
  db: () => Promise<SqlRequest>,
  questTemplateId: number
): Promise<string[]> => {
  const query = `SELECT UPN FROM QuestTemplateGuides WHERE QuestTemplateId = @QuestTemplateId`;
  const request = await db();
  const result = await request.input('QuestTemplateId', questTemplateId).query(query);
  return result.recordset.map((row: { UPN: string }) => row.UPN);
};

export const deleteGuidesForQuestTemplate = async (
  db: () => Promise<SqlRequest>,
  tx: SqlTransaction,
  questTemplateId: number
): Promise<void> => {
  const request = tx.request();
  await request
    .input('QuestTemplateId', questTemplateId)
    .query('DELETE FROM QuestTemplateGuides WHERE QuestTemplateId = @QuestTemplateId');
};

export const addGuidesToQuestTemplate = async (
  db: () => Promise<SqlRequest>,
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


export const getQuestTemplatesByGuideUpn = async (
  db: () => Promise<SqlRequest>,
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
  return fixCase<QuestTemplateGuideResult>(result.recordset);
};
