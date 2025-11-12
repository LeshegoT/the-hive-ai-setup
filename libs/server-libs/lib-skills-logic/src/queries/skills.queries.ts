/** @format */

import { fixCase } from "@the-hive/lib-core";
import { SqlRequest } from "@the-hive/lib-db";
import { BioTemplate, JsType, JSTypeScale, SkillField, SkillsFieldJSTypes } from "@the-hive/lib-skills-shared";

export async function getFieldsAndTypes(db: () => Promise<SqlRequest>): Promise<SkillsFieldJSTypes[]> {
  const query = `
    SELECT sf.FieldName as fieldName, jst.JavaScriptType as javaScriptType,
    sf.JSTypeId as jsTypeId, jst.Description as description,
    jst.ParseFunction as parseFunction
          FROM SkillsField sf
          INNER JOIN JSType jst
          ON sf.JSTypeId = jst.JSTypeId;
  `;

  const request = await db();
  const result = await request.timed_query(query, "getFieldsAndTypes");
  return result.recordset as SkillsFieldJSTypes[];
}

export async function retrieveJSTypeScale(db: () => Promise<SqlRequest>): Promise<JSTypeScale[]> {
  const query = `
    SELECT JSTypeId as jsTypeId, Rating as rating, Label as label from JSTypeScale;
  `;

  const request = await db();
  const result = await request.timed_query(query, "retrieveJSTypeScale");
  return result.recordset as JSTypeScale[];
}

export async function retrieveJSType(db: () => Promise<SqlRequest>): Promise<JsType[]> {
  const query = `
    SELECT JSTypeId as jsTypeId, Description as description, JavaScriptType as javaScriptType,
    DisplayFormatFunction as displayFormatFunction,
    GremlinStringFormatFunction as gremlinStringFormatFunction, ParseFunction as parseFunction
    from JSType;
  `;

  const request = await db();
  const result = await request.timed_query(query, "retrieveJSType");
  return result.recordset as JsType[];
}

export async function retrieveSkillField(db: () => Promise<SqlRequest>): Promise<SkillField[]> {
  const query = `
    SELECT
      SkillsFieldId as skillsFieldId,
      JSTypeId as jsTypeId,
      DisplayOrder as displayOrder,
      PortfolioFormDisplayOrder as portfolioFormDisplayOrder,
      FieldLabel as label,
      FieldName as name,
      DisplayOnPortfolioScreen as displayOnPortfolioScreen
    from SkillsField;
  `;

  const request = await db();
  const result = await request.timed_query(query, "retrieveSkillField");
  return result.recordset as SkillField[];
}

export async function getBioTemplatesDetails(db: () => Promise<SqlRequest>): Promise<BioTemplate[]> {
  const query = `
    SELECT
      BioTemplateId,
      BioTemplateName,
      BioTemplateFilename
    FROM BioTemplates
    ORDER BY BioTemplateName;
  `;

  const request = await db();
  const result = await request.timed_query(query, "getBioTemplates");
  return fixCase(result.recordset) as BioTemplate[];
}

export async function createSkillsCommunication(
  db: () => Promise<SqlRequest>,
  upn: string,
  communicationType: string,
  reason: string,
  sentBy: string
): Promise<void> {
  const query = `
    INSERT INTO SkillsCommunication
      (StaffId, SkillsCommunicationTypeId, SkillsCommunicationReasonId, SentBy, SentAt)
    SELECT s.StaffId, t.SkillsCommunicationTypeId, r.SkillsCommunicationReasonId, @sentBy, GETDATE()
    FROM Staff s
    INNER JOIN SkillsCommunicationTypes t
      ON t.CommunicationType = @communicationType
    INNER JOIN SkillsCommunicationReasons r
      ON r.Reason = @reason
    WHERE s.UserPrincipleName = @upn
  `;

  const request = await db();
  await request
    .input("upn", upn)
    .input("communicationType", communicationType)
    .input("reason", reason)
    .input("sentBy", sentBy)
    .timed_query(query, "createSkillsCommunication");
}

