import { CanonicalNameDetails, JSTypeScale, JsType, SkillField, StandardizedName, BadRequestDetail } from './skills-objects';

/* eslint-disable */
// TODO - RE: The bare 'Function' types here need to be replaced with something better (@typescript-eslint/no-unsafe-function-type)
export type FieldTypes = {
  fieldName: string;
  fieldLabel: string;
  displayOrder: number;
  javaScriptType: string;
  formatFunction: string;
  parse: Function,
  toDisplay: Function,
  toGremlin: Function,
}
/* eslint-enable */

export type SkillFieldTypes = {
  lastUsed?: FieldTypes,
  obtainedFrom?: FieldTypes,
  yearsExperience?: FieldTypes,
  dateOfGraduation?: FieldTypes,
  achievedDate?: FieldTypes,
  industryKnowledgeLevel?: FieldTypes,
  skillLevel?: FieldTypes,
  expiryDate?: FieldTypes,
  proof?: FieldTypes,
  expertiseLevel?: FieldTypes,
  yearsOfExperienceRating?: FieldTypes,
}

export class FieldTypeConverter {
    /* eslint-disable */
    // TODO - RE: The bare 'Function' type here need to be replaced with something better (@typescript-eslint/no-unsafe-function-type)
    fieldTypeConversions: { [key: string]: (typeId: number) => Function };
    /* eslint-enable */
    jsTypeScale: JSTypeScale[] = [];
    skillsFields = new Map<string, SkillField>();
    jsTypes = new Map<number, JsType>();

    constructor(
        mapStandardizedNameToCanonicalName: (standardizedName: StandardizedName) => Promise<CanonicalNameDetails>,
        mapStaffIdToDisplayName: (staffId: number) => Promise<string | BadRequestDetail>
    ){
        this.fieldTypeConversions = Object.freeze({
            /* eslint-disable */
            // NOTE - RE: The unused parameters here are explicit to remind developers that these properties "can be" dependent on
            //            the JSType ID
            toString: (typeId: number) => JSON.stringify,
            formatYearAndMonth: (typeId: number) => this.dateFormat('yyyy-MM'),
            parsePositiveFloat: (typeId: number) => (x: string) => this.ensurePositive(Number.parseFloat(x)),
            parseYearAndMonth: (typeId: number) => this.parseDate('yyyy-MM'),
            formatYear: (typeId: number) => this.dateFormat('yyyy'),
            parseYear: (typeId: number) => this.parseDate('yyyy'),
            formatFullDate: (typeId: number) => this.dateFormat(''),
            parseFullDate: (typeId: number) => this.parseDate(''),
            formatYearAndMonthAndDay: (typeId: number) => this.dateFormat('yyyy-MM-dd'),
            parseYearMonthAndDay: (typeId: number) => this.parseDate('yyyy-MM-dd'),
            parseLevel: (typeId: number) => this.parseScaleForField(typeId),
            displayLevel: (typeId: number) => this.displayScaleForField(typeId),
            parseStoragePath: (typeId: number) => this.id,
            parseUPN: (typeid: number) => this.id,
            parseStaffId: (typeid: number) => this.id,
            displayStaffName: (typeid: number) => this.displayStaffName(mapStaffIdToDisplayName),
            id: (typeId: number) => this.id,
            displayCanonicalName: (typeid: number) => this.displayCanonicalName(mapStandardizedNameToCanonicalName)
            /* eslint-enable */
        });
    }

    displayCanonicalName(mapStandardizedNameToCanonicalName: (standardizedName: StandardizedName) => Promise<CanonicalNameDetails>): (standardizedName: StandardizedName) => Promise<string>{
        return (standardizedName: StandardizedName) => mapStandardizedNameToCanonicalName(standardizedName)
                    .then((canonicalNameDetails) => canonicalNameDetails.canonicalName);
    }

    displayStaffName = (mapStaffIdToDisplayName: (staffId: number) => Promise<string | BadRequestDetail>) => (staffId: number) => mapStaffIdToDisplayName(staffId).then((upn) => upn).catch((error) => error)

    /**
     * Returns a function that converts a Date object into a string based on the provided date type format.
     *
     * @function dateFormat
     * @param {string} dateType - The date type format ('yyyy', 'yyyy-MM', 'yyyy-MM-dd', '').
     * @returns {(date: Date) => string} - Returns a function that takes in a Date object and returns a string representation of the date.
     */
    dateFormat(dateType: string): (date: Date) => string {
        switch (dateType) {
            case 'yyyy':
                return (x: Date) => JSON.stringify(x.getFullYear());
            case 'yyyy-MM':
                return (x: Date) => {
                    const year = JSON.stringify(x.getFullYear());
                    const month = (x.getMonth()+1) < 10 ? `0${JSON.stringify(x.getMonth()+1)}` : JSON.stringify(x.getMonth()+1);
                    return `${year}-${month}`;
                };
            case 'yyyy-MM-dd':
                return (x: Date) => {
                    const year = JSON.stringify(x.getFullYear());
                    const month = (x.getMonth()+1) < 10 ? `0${JSON.stringify(x.getMonth()+1)}` : JSON.stringify(x.getMonth()+1);
                    const day = x.getDate() < 10 ? `0${JSON.stringify(x.getDate())}` : JSON.stringify(x.getDate());
                    return `${year}-${month}-${day}`;
                };
            default:
                return (x: Date) => x.toISOString();
        }
    }

    /**
     * Returns a function that converts a string into a Date object based on the provided date type format.
     *
     * @function parseDate
     * @param {string} dateType - The date type format ('yyyy', 'yyyy-MM', 'yyyy-MM-dd', '').
     * @returns {(date: string) => Date } - A function that takes a date string and returns a Date object.
     */
    parseDate(dateType: string): (date: string) => Date  {
        switch (dateType) {
            case 'yyyy':
                return (x: string) => new Date(parseInt(x, 10), 0, 2);
            case 'yyyy-MM':
                return (x: string) => {
                    const year = parseInt(x.split('-')[0]);
                    const month = parseInt(x.split('-')[1]);
                    return new Date(year, month-1, 2);
                };
            case 'yyyy-MM-dd':
                return (x: string) => {
                    const year = parseInt(x.split('-')[0]);
                    const month = parseInt(x.split('-')[1]);
                    const day = parseInt(x.split('-')[2]);
                    return new Date(year, month-1, day);
                };
            default:
                return (x: string) => new Date(x);
        }
    }

    ensurePositive(value: number): number {
        if(Math.abs(value) == value) {
            return value;
        } else {
            throw new Error('Value needs to be a positive number');
        }
    }

    /**
     * Depending on the jsTypeId return a function that when given a number returns the label for a rating
     *
     * @function displayScaleForField
     * @param {number} jsTypeId - The jsTypeId value to determine which function to return.
     * @returns {(rating: number, jsType: number) => string | undefined} - Returns the corresponding function based on the jsTypeId or undefined if no match is found.
     */
    displayScaleForField(jsTypeId: number): (rating: number, jsType: number) =>string |undefined {
        const jsType = String(jsTypeId);
        return (rating: number) => this.retrieveScaleWord(jsType, rating);
    }


    /**
     * Retrieves the label that matches the given scale type (JSTypeId) and rating value.
     *
     * @async
     * @function retrieveScaleWord
     * @param {string} scaleType - The scale type to match.
     * @param {number} ratingValue - The rating value to match.
     * @returns {(string|undefined)} - returns the label if a match is found, otherwise returns undefined.
     * @throws {Error} - Throws an error if FieldTypeService.getJSTypeScale() fails.
     */
    retrieveScaleWord(scaleType: string, ratingValue: number): string | undefined{
        const ratings = this.jsTypeScale;
        if(ratings){
            const ratingMatch = ratings.find((rating: { jsTypeId: number; label: string; rating: number }) => rating.jsTypeId== Number(scaleType) && rating.rating==ratingValue);
            return ratingMatch ? ratingMatch.label : undefined;
        } else {
            throw new Error('No fields could be found');
        }
    }

    /**
     * Given a JsTypeId, returns the function that converts a given word to a rating.
     * eg. 'Intermediate' will be 5 or 3 depending on the jsTypeId
     *
     * @function parseScaleForField
     * @param {number} jsTypeId - The jsTypeId value to convert.
     * @returns {(word: string, jsTypeId: number) => number | string | undefined} - Returns the corresponding function based on the jsTypeId value or undefined if no match is found.
     */
    parseScaleForField(jsTypeId: number): (word: string, jsTypeId: number) => number | string | undefined{
        const jsType = String(jsTypeId);
        return (word: string) => this.retrieveScaleRating(jsType, word);
    }

    /**
     * Retrieves the rating value that matches the given scale type and rating word.
     *
     * @async
     * @function retrieveScaleRating
     * @param {string} scaleType - The scale type to match (JStTypeId).
     * @param {string} ratingValue - The rating word to match.
     * @returns {(number|string|undefined)} - Logs the rating value if a match is found, otherwise logs a message indicating no fields.
     * @throws {Error} - Throws an error if FieldTypeService.getJSTypeScale() fails.
     */
    retrieveScaleRating(scaleType: string, ratingValue: string): number | string | undefined{
        const ratings = this.jsTypeScale;
        const numericValue = Number(ratingValue);
        if (!isNaN(numericValue)){
            return ratingValue
        } else if(ratings){
            const ratingMatch = ratings.find((rating: { jsTypeId: number; label: string; rating: number }) =>
                rating.jsTypeId== Number(scaleType) && rating.label==ratingValue);
            return ratingMatch ? ratingMatch.rating : undefined;
        } else {
            throw new Error('No fields could be found');
        }
    }

    id(x: number): number{
        return x;
    }

    createOrReturnSkillsFields(skillsFields: SkillField[]): Map<string, SkillField> {
        if(this.skillsFields.size > 0) {
            return this.skillsFields;
        } else {
            const skillsFieldsArray = skillsFields;
            if(skillsFieldsArray){
                skillsFieldsArray.forEach((skillField: SkillField) => {
                    this.skillsFields.set(skillField.name, skillField);
                });
                return this.skillsFields;
            } else {
                throw new Error('No fields could be found');
            }
        }
    }

    createOrReturnJSTypes(jsTypes: JsType[]): Map<number, JsType>{
        if(this.jsTypes.size > 0) {
            return this.jsTypes;
        } else {
            const jsTypesArray = jsTypes;
            if(jsTypesArray){
                jsTypesArray.forEach((jsTypes: JsType) => {
                    this.jsTypes.set(jsTypes.jsTypeId, jsTypes);
                });
                return this.jsTypes;
            } else {
                throw new Error('No types could be found');
            }
        }
    }

    createFieldObject(fieldName: string, jsTypes: JsType[], skillsFields: SkillField[]): object {
        const skillsField = (this.createOrReturnSkillsFields(skillsFields)).get(fieldName);
        const jsType = (this.createOrReturnJSTypes(jsTypes)).get(skillsField.jsTypeId);
        const rating = this.jsTypeScale.find((rating: { jsTypeId: number }) => rating.jsTypeId== Number(skillsField.jsTypeId));
        return {
            displayOnPortfolioScreen: skillsField?.displayOnPortfolioScreen,
            fieldName: skillsField?.name,
            fieldLabel: skillsField?.label,
            displayOrder: skillsField?.displayOrder,
            portfolioFormDisplayOrder: skillsField?.portfolioFormDisplayOrder,
            description : jsType.description,
            rating,
            javaScriptType: jsType.javaScriptType,
            formatFunction: jsType.displayFormatFunction,
            toDisplay: this.fieldTypeConversions[jsType.displayFormatFunction](skillsField.jsTypeId),
            toGremlin: this.fieldTypeConversions[jsType.gremlinStringFormatFunction](skillsField.jsTypeId),
            parse: this.fieldTypeConversions[jsType.parseFunction](skillsField.jsTypeId)
        }
    }

    /**
     * Converts an array of fieldNames into a JS object, with properties that represent each field
     *
     * @async
     * @function createFieldsMap
     * @param {string[]} fieldNames - Array of field names.
     * @returns {object} - Logs the label if a match is found, otherwise logs a message indicating no fields.
     */
    createFieldsMap(fieldNames: string[], skillsFields: SkillField[], jsTypes: JsType[], jsTypeScale: JSTypeScale[]): object {
        this.jsTypeScale = jsTypeScale;
        const fieldsArray = fieldNames.map((fieldName) => {
            const fieldObject = this.createFieldObject(fieldName, jsTypes, skillsFields);
            return { [fieldName]: fieldObject };
        });

        return fieldsArray.reduce((acc, field) => ({ ...acc, ...field }), {});
    }
}
