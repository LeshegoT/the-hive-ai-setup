/** @format */
import { fixCase } from "@the-hive/lib-core";
import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { Attribute, Institution, SkillsRestrictedWordDetails } from "@the-hive/lib-skills-shared";
type RestrictedWordsRecord = {
  SkillsRestrictedWordsId: number;
  RestrictedWord: string;
};
export async function getSkillsRestrictedWords(db: () => Promise<SqlRequest>): Promise<SkillsRestrictedWordDetails[]> {
  const query = `SELECT SkillsRestrictedWordsId ,RestrictedWord FROM SkillsRestrictedWords`;
  const request = await db();
  const result = await request.timed_query(query, "getSkillsRestrictedWords");
  return fixCase(result.recordset as RestrictedWordsRecord[]);
}

export async function checkIfCanonicalNameWasPreviouslyRejected(db: () => Promise<SqlRequest>,canonicalName: string,canonicalNameCategory: string): Promise<boolean> {
  const query = `
    SELECT 1
    FROM RejectedAttributesAndInstitutions
    WHERE CanonicalName = @CanonicalName
      AND CanonicalNameCategoryId = (
          SELECT CanonicalNameCategoryId
          FROM CanonicalNameCategories
          WHERE LOWER(CanonicalNameCategory) = LOWER(@CanonicalNameCategory)
      )
  `;

  const request = await db();
  request.input("CanonicalName", canonicalName);
  request.input("CanonicalNameCategory", canonicalNameCategory);

  const result = await request.timed_query(query, "checkIfCanonicalNameWasPreviouslyRejected");
  return result.recordset.length > 0;
}

export async function addRejectedCanonicalName(tx: SqlTransaction, institutionOrAttribute: Institution | Attribute, rejectedBy: string): Promise<void>{
  const query = `
    INSERT INTO RejectedAttributesAndInstitutions 
      (CanonicalName, CanonicalNameCategoryId, RejectedAt, RejectedBy)
      VALUES (@CanonicalName, @CanonicalNameCategoryId, GETDATE(), @RejectedBy)
  `;
  const request = await tx.timed_request();
  await request.input("CanonicalName", institutionOrAttribute.canonicalName)
  .input("CanonicalNameCategoryId", institutionOrAttribute.canonicalNameCategoryId)
  .input("RejectedBy", rejectedBy)
  .timed_query(query, "addRejectedCanonicalName");
}