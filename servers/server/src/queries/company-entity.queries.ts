/** @format */
import fixCase from "../shared/fix-case";
import { db } from "../shared/db";
export type CompanyEntity = {
  companyEntityId: number;
  abbreviation: string;
  description: string;
};

export async function getCompanyEntities(): Promise<CompanyEntity[]> {
  const query = `
  SELECT CompanyEntityId, Abbreviation, Description
  FROM CompanyEntity
  WHERE DeletedBy IS NULL
`;

  const request = await db();
  const result = await request.timed_query(query, "getCompanyEntities");

  return fixCase(result.recordset);
}
