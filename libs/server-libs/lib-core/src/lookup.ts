import { logger } from "./logger";

/**
 * Utility class to reduce boilerplate of lookup of certain static values available in the database.
 * 
 * For example, we often need to convert IDs to descriptions (and vice versa) for lookup values (like ReviewStatus, JSTypes and other tables)
 * 
 * This utility class allows the lookup objects to be retrieved from pre-computed maps instead of forcing calling the database again (or having to loop 
 * over some existing cached value)
 * 
 * Sample:
 * ```ts
type SampleType = {
    id: number,
    description: string
} 
let lookup = new Lookup("sample", sampleObjects, "id", "description");
let description = lookup.descriptionFromId(1); //
 * ```
 * 
 * More detailed sample usage can be found lookup.test.ts unit test in this project
 * 
 * @param T the type of the data in the lookup table
 * @param I the type (name) of the lookup table's ID field
 * @param D the type (name) of the lookup table's description field
 * 
 * @param {string} fromTable the tablet the data was retrieved from (informational only)
 * @param {T[]} dataArray the data (as retrieved from the database), IDs and descriptions have to be unique
 * @param {I} primaryKeyField the type (name) of the lookup table's ID field 
 * @param {D} descriptionField the type (name) of the lookup table's description field
 */
export class Lookup<T, I extends keyof T, D extends keyof T> {
    fromTable: string;
    data: T[];
    primaryKeyField: I;
    descriptionField: D;
    lookupByIdMap:  Map<T[I],T>;
    lookupByDescriptionMap: Map<T[D],T>

    constructor(fromTable: string, dataArray: T[], primaryKeyField: I, descriptionField: D){
      this.fromTable = fromTable;
      this.data = dataArray;
      this.primaryKeyField = primaryKeyField;
      this.descriptionField = descriptionField;
      this.lookupByIdMap = new Map<T[I],T>();
      this.lookupByDescriptionMap = new Map<T[D],T>();

      for(const data of dataArray){
        const id = data[primaryKeyField];
        if(this.lookupByIdMap.has(id)){
            logger.error("Attempting to build a lookup for %s with duplicate IDs (field: %s) in %s", fromTable, primaryKeyField, JSON.stringify(dataArray));
        }
        this.lookupByIdMap.set(id, data);

        const description = data[descriptionField];
        if(this.lookupByDescriptionMap.has(description)){
            logger.error("Attempting to build a lookup for %s with duplicate descriptions ((field: %s)) in %s", fromTable, descriptionField, JSON.stringify(dataArray))
        }
        this.lookupByDescriptionMap.set(description, data);
      }
    }

    getByDescription = (description: T[D]) => {
        return  this.lookupByDescriptionMap.get(description);
    }

    getById = (id: T[I]) => {
        return this.lookupByIdMap.get(id);
    }

    descriptionFromId = (id: T[I]) => {
        return this.lookupByIdMap.get(id)[this.descriptionField];
    }

    idFromDescription = (description: T[D]) => {
        return this.lookupByDescriptionMap.get(description)[this.primaryKeyField];
    }
}
