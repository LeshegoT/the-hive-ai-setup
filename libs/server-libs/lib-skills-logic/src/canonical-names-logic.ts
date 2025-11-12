import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import gremlin from "gremlin";
import {
  addAnAlias,
  addSearchTextException,
  getCanonicalNameDetails,
  retrieveCanonicalNameDetailsByCanonicalNameId,
  retrieveCanonicalNames,
  retrieveSearchTextExceptions,
  updateCanonicalName,
  updateCanonicalNameGuidByStandardizedName,
} from "./queries/canonical-name.queries";
import { Alias,  CanonicalNameDetails, SearchTextException, StandardizedNameAndCanonicalNameGuid, StandardizedName, CanonicalNameUpdateCounts } from "@the-hive/lib-skills-shared";
export class CanonicalNamesLogic {
  db: () => Promise<SqlRequest>;
  gremlin: gremlin.driver.Client;

  constructor(db: () => Promise<SqlRequest>, gremlin: gremlin.driver.Client) {
    this.db = db;
    this.gremlin = gremlin;
  }

  async updateCanonicalName(tx: SqlTransaction, newName: CanonicalNameDetails){
    const existingCanonicalName = await retrieveCanonicalNames(this.db, newName.canonicalName);
    if (existingCanonicalName[0]) {
      const canonicalName = existingCanonicalName[0];
      if (newName.canonicalNameCategoryId !== canonicalName.canonicalNameCategoryId) {
        return {
          message: `${newName.canonicalName} already exists as ${canonicalName.canonicalNameCategory}`,
        };
      } else if (newName.canonicalNameId !== canonicalName.canonicalNameId) {
        return {
          message: `${newName.canonicalName} already exists`,
        };
      } else {
        const isSameCasing = canonicalName.canonicalName === newName.canonicalName;
        if (!isSameCasing) {
          return await updateCanonicalName(tx, newName.canonicalNameId, newName.canonicalName);
        } else {
          return canonicalName.canonicalName;
        }
      }
    } else {
      return await updateCanonicalName(tx, newName.canonicalNameId, newName.canonicalName);
    }
  }

  async retrieveCanonicalNameDetails(standardizedName: StandardizedName): Promise<CanonicalNameDetails>{
    const canonicalNameDetails = await getCanonicalNameDetails(this.db, standardizedName);
    if (canonicalNameDetails) {
      return canonicalNameDetails;
    } else {
      throw new Error(`Canonical name details for ${standardizedName} not found`);
    }
  }

  async updateCanonicalNameGuidsByStandardizedNames(
    tx: SqlTransaction,
    guidAndStandardizedNames:StandardizedNameAndCanonicalNameGuid[],
  ):Promise<CanonicalNameUpdateCounts>{
    const failedUpdates: StandardizedNameAndCanonicalNameGuid[] = [];
    const successfulUpdates: StandardizedNameAndCanonicalNameGuid[] = [];
    for (const guidAndStandardizedName of guidAndStandardizedNames){
      try{
        const updatedCanonicalNameGuid = await updateCanonicalNameGuidByStandardizedName(tx, guidAndStandardizedName);
        if (updatedCanonicalNameGuid) {
          successfulUpdates.push(guidAndStandardizedName);
        } else {
          //no updates were made
        }
      }catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
        failedUpdates.push(guidAndStandardizedName);
      }
    }

    return {
      updatedCanonicalNameGuids: successfulUpdates,
      failedUpdatedCanonicalNameGuids: failedUpdates,
    };
  }

  async addSearchTextException(tx: SqlTransaction, searchTextException: string, standardizedName: StandardizedName): Promise<SearchTextException>{
    return addSearchTextException(tx, searchTextException, standardizedName);
  }

  async retrieveCanonicalNameDetailsByCanonicalNameId(canonicalNameId: number): Promise<CanonicalNameDetails>{
    return retrieveCanonicalNameDetailsByCanonicalNameId(this.db, canonicalNameId);
  }

  async addAnAlias(tx: SqlTransaction, canonicalNameId: number, alias: string): Promise<Alias>{
    return addAnAlias(tx, canonicalNameId, alias);
  }

  async retrieveSearchTextExceptions(): Promise<SearchTextException[]> {
    return retrieveSearchTextExceptions(this.db);
  }
}
