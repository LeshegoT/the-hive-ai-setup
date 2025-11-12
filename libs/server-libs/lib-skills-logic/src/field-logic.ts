import { cacheUntilExpiry, makeExpiringValue, parseIfSetElseDefault } from "@the-hive/lib-core";
import { StaffLogic } from "@the-hive/lib-staff-logic";
import { SqlRequest } from "@the-hive/lib-db";
import { BadRequestItem, FieldTypeConverter, FieldValue,  JsType, JSTypeScale, SkillField, StandardizedName } from "@the-hive/lib-skills-shared";
import { retrieveJSType, retrieveJSTypeScale, retrieveSkillField } from "./queries/skills.queries";
import { CanonicalNamesLogic } from "./canonical-names-logic";
import gremlin from "gremlin";
import {
  addIncomingEdges,
  addVertex,
  getVerticesWithLabel,
  removeVertex,
  retrieveIncomingEdges,
  retrieveOutGoingEdges,
  addOutGoingEdges
} from "./queries/vertex.queries";


export class FieldLogic {
  db: () => Promise<SqlRequest>;
  fieldTypeConverter: FieldTypeConverter;
  canonicalNamesLogic: CanonicalNamesLogic = undefined;
  staffLogic: StaffLogic = undefined;

  constructor(db: () => Promise<SqlRequest>, gremlin: gremlin.driver.Client) {
    this.db = db;
    this.canonicalNamesLogic = new CanonicalNamesLogic(db, gremlin);
    this.staffLogic = new StaffLogic(db);
    this.fieldTypeConverter = new FieldTypeConverter(
      (standardizedName: StandardizedName) => this.canonicalNamesLogic.retrieveCanonicalNameDetails(standardizedName),
      (staffId) => this.staffLogic.retrieveStaffDisplayName(staffId)
    );
  }

  async retrieveJSTypeScale() {
    return retrieveJSTypeScale(this.db);
  }

  private createCacheExpiryDate(): Date{
    const cacheDurationHours = parseIfSetElseDefault("CACHE_DURATION_HOURS", 24);
    return new Date((new Date()).getTime()+(cacheDurationHours*60*60*1000));
  }

  private async loadJSTypeScales(): Promise<JSTypeScale[]>{
    const cachedValue = await cacheUntilExpiry(
      "JSTypeScale",
      async () => makeExpiringValue(await retrieveJSTypeScale(this.db), this.createCacheExpiryDate())
    );
    return cachedValue;
  }

  async retrieveJSType() {
    return retrieveJSType(this.db);
  }

  private async loadJSTypes(): Promise<JsType[]>{
    const cachedValue = await cacheUntilExpiry(
      "JSType",
      async () => makeExpiringValue(await retrieveJSType(this.db), this.createCacheExpiryDate())
    );
    return cachedValue;
  }

  async retrieveSkillField() {
    return retrieveSkillField(this.db);
  }

  private async loadSkillFields(): Promise<SkillField[]>{
    const cachedValue = await cacheUntilExpiry(
      "SkillField",
      async () => makeExpiringValue(await retrieveSkillField(this.db), this.createCacheExpiryDate())
    );
    return cachedValue;
  }

  /**
   * Takes in fieldValues and attempts to parse them and if it fails, returns an error along with which fields could not be parsed correctly
   *
   * @function parseFieldValues
   * @param {FieldValue[]} fieldValues - The field values coming from the frontend in an array of field value objects
   * @returns {Promise<FieldValue[] | BadRequestItem[]>} - The correclty parsed FieldValue[] or a BadRequestItem[] if the function failed to parse any of the field values correctly
   */
  async parseFieldValues(fieldValues: FieldValue[]): Promise<FieldValue[] | BadRequestItem[]> {
    const jsTypeScale: JSTypeScale[] = await this.loadJSTypeScales();
    const jsTypes: JsType[] = await this.loadJSTypes();
    const skillfields: SkillField[] = await this.loadSkillFields();

    const fieldsMap = this.fieldTypeConverter.createFieldsMap(
      fieldValues.map((field) => field.standardizedName),
      skillfields,
      jsTypes,
      jsTypeScale,
    );

    const notCorrectlyFormattedFields: BadRequestItem[] = [];
    const correctlyFormattedFields: FieldValue[] = [];

    for(const field of fieldValues){
      try {
        const fieldObject = fieldsMap[field.standardizedName];
        const correctlyFormatted = fieldObject.parse(field.value);

        if (!correctlyFormatted || (correctlyFormatted instanceof Date && Number.isNaN(correctlyFormatted.getTime()))) {
          notCorrectlyFormattedFields.push({
            message: `Value not correctly formatted or could not be parsed to expected format as expected format is a ${fieldObject.javaScriptType}`,
            detail: field.standardizedName
          });
        } else {
          correctlyFormattedFields.push({
            ...field,
            value: correctlyFormatted,
          });
        }
      } catch (error) {
        notCorrectlyFormattedFields.push({
          message: error.message,
          detail: field.standardizedName
        });
      }
    }

    if (notCorrectlyFormattedFields.length !== 0) {
      return notCorrectlyFormattedFields;
    } else {
      return correctlyFormattedFields;
    }
  }

  async standardizeFields(gremlin: gremlin.driver.Client): Promise<{
    standardized: string[];
    failedToStandardize: string[];
  }> {
    const allFields = await getVerticesWithLabel(gremlin, "field");
    const standardizedResults = {
      standardized: [],
      failedToStandardize: [],
    };

    for (const field of allFields) {
      try {
        const incomingEdges = await retrieveIncomingEdges(gremlin, field);
        const outGoingEdges = await retrieveOutGoingEdges(gremlin, field);
        const vertexName = field.charAt(0).toLowerCase() + field.slice(1);

        if (!allFields.includes(vertexName)) {
          await addVertex(gremlin, "field", vertexName);
          await addIncomingEdges(gremlin, vertexName, incomingEdges);
          await addOutGoingEdges(gremlin, vertexName, outGoingEdges);
          await removeVertex(gremlin, field);
          standardizedResults.standardized.push(field);
        } else {
          // Field has already been standardized
        }
      } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
        standardizedResults.failedToStandardize.push(field);
      }
    }

    return standardizedResults;
  }
}
