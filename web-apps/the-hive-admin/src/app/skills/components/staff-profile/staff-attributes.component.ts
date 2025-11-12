import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { SkillsService } from '../../services/skills.service';
import { AttributeType, UserAttribute, FieldValue, StandardizedName, SkillField, JsType, TopLevelTag, JSTypeScale, BadRequestDetail, FieldTypeConverter } from '@the-hive/lib-skills-shared';
import { AttributeFields } from '../../services/skills-search.types';
import { EnvironmentService } from '../../../services/environment.service';
import { Person } from '../../../shared/interfaces';
import { SkillsProofDownloadService } from '../../services/skills-proof-download.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { isError } from '@the-hive/lib-shared';

@Component({
    selector: 'app-staff-attributes',
    templateUrl: './staff-attributes.component.html',
    styleUrls: ['./staff-attributes.component.css'],
    imports: [
      CommonModule,
      MatProgressSpinnerModule,
      MatExpansionModule,
      MatCardModule,
      MatChipsModule,
      MatIconModule
    ]
})
export class StaffAttributesComponent implements OnInit, OnChanges {
  @Input() selectedStaffMember: Person = undefined;
  currentFieldValue: string = undefined;
  fieldTypeConverter: FieldTypeConverter = undefined;
  fieldsMap = undefined;
  skillsFields: SkillField[] = undefined;
  jsTypes: JsType[] = undefined;
  jsTypeScales: JSTypeScale[] = undefined;
  topLevelTags: TopLevelTag[] = undefined;
  staffAddedAttributeTypes: AttributeType[] = undefined;
  displayValueMap: {[serialisedAttributeStandardizedNameAndFieldStandardizedName: string]: (string | number | BadRequestDetail);} = undefined;
  personSearchResults = signal<UserAttribute[] | BadRequestDetail>(undefined);
  readonly proofFieldName = 'proof';
  readonly obtainedFromFieldName = 'obtainedFrom';
  readonly proofValidationFieldName = 'uploadVerifiedBy';
  snackBarDuration: number = undefined;
  displayValidationPendingChip = false;
  constructor(private skillsService: SkillsService, private environmentService: EnvironmentService, private proofDownloadService: SkillsProofDownloadService, private snackBar: MatSnackBar) {}

  async ngOnInit() {
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this.displayValidationPendingChip = this.environmentService.getConfiguratonValues().DISPLAY_PROOF_VALIDATION_INDICATOR_ON_SKILLS_CARDS;
    this.fieldTypeConverter = new FieldTypeConverter(
      this.skillsService.mapStandardizedNameToCanonicalName,
      this.skillsService.mapStaffIdToDisplayName
    );
    this.currentFieldValue = this.environmentService.getConfiguratonValues().SKILL_CURRENT_DATE;
    await this.getSkillTypes();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedStaffMember']) {
      await this.getPersonSearchResults();
    } else {
      // selectedStaffMember did not change, so don't retrieve staff attributes
    }
  }

  filterByAttributeType(userAttributes: UserAttribute[], attributeType: AttributeType): UserAttribute[] {
    return userAttributes.filter((userAttribute) => userAttribute.attribute.attributeType === attributeType);
  }

  compareByLastUsed(userAttribute1: UserAttribute, userAttribute2: UserAttribute, skillFieldNames: AttributeFields): number {
    const lastUsed1 = String(userAttribute1.fieldValues.find((fieldValue) => fieldValue.standardizedName === skillFieldNames.lastUsed.name).value);
    const lastUsed2 = String(userAttribute2.fieldValues.find((fieldValue) => fieldValue.standardizedName === skillFieldNames.lastUsed.name).value);

    if (lastUsed1 === lastUsed2){
      return 0;
    } else if (lastUsed1 === this.currentFieldValue) {
      return -1;
    } else if (lastUsed2 === this.currentFieldValue) {
      return 1;
    } else {
      return new Date(lastUsed2).getTime() - new Date(lastUsed1).getTime();
    }
  }

  compareByYearsOfExperience(userAttribute1: UserAttribute, userAttribute2: UserAttribute, skillFieldNames: AttributeFields): number {
    const yearsOfExperience1 = Number(userAttribute1.fieldValues.find((fieldValue) => fieldValue.standardizedName === skillFieldNames.yearsExperience.name).value);
    const yearsOfExperience2 = Number(userAttribute2.fieldValues.find((fieldValue) => fieldValue.standardizedName === skillFieldNames.yearsExperience.name).value);

    return yearsOfExperience2 - yearsOfExperience1;
  }

  hasYearsOfExperienceField(fieldValues: FieldValue[]): boolean {
    return fieldValues.some((fieldValue) => fieldValue.standardizedName === this.skillsService.skillFieldNames.yearsExperience.name);
  }

  hasLastUsedField(fieldValues: FieldValue[]): boolean {
    return fieldValues.some((fieldValue) => fieldValue.standardizedName === this.skillsService.skillFieldNames.lastUsed.name);
  }

  lookupFieldLabel(userAttributeStandardizedName: StandardizedName, fieldStandardizedName: StandardizedName): string {
    return this.fieldsMap[userAttributeStandardizedName][fieldStandardizedName]?.fieldLabel;
  }

  async getSkillTypes() {
    this.skillsFields = await this.skillsService.getSkillsFields();
    this.jsTypes = await this.skillsService.getJSTypes();
    this.jsTypeScales = await this.skillsService.getJSTypeScale();
    this.topLevelTags = await this.skillsService.retrieveTopLevelTags();
  }

  createFieldsMapFromAttributeFieldValues(userAttributes: UserAttribute[]) {
    this.fieldsMap = {};
    for(const userAttribute of userAttributes){
      this.fieldsMap[userAttribute.attribute.standardizedName] = this.fieldTypeConverter.createFieldsMap(
        userAttribute.fieldValues.map((fieldValue) => fieldValue.standardizedName),
        this.skillsFields,
        this.jsTypes,
        this.jsTypeScales
      );
    }
  }

  async getPersonSearchResults() {
    this.personSearchResults.set(undefined);
    this.skillsService.getPersonSearchResults(this.selectedStaffMember.userPrincipleName).subscribe({
      next: async(userAttributes) => {
        this.createFieldsMapFromAttributeFieldValues(userAttributes);
        await this.parseFieldValuesForUserAttributes(userAttributes);
        this.sortUserAttributes(userAttributes);
        this.extractUniqueAttributeTypes(userAttributes);
        this.personSearchResults.set(userAttributes);
      },
      error: (error) => {
        this.personSearchResults.set({message: `Failed to retrieve portfolio for ${this.selectedStaffMember.displayName}`, detail: error});
      },
    });
  }

  async parseFieldValuesForUserAttributes(userAttributes: UserAttribute[]) {
    this.displayValueMap = {};
    for(const userAttribute of userAttributes){
      const sortedFieldValues = this.sortFieldValuesByDisplayOrder(userAttribute.attribute.standardizedName, userAttribute.fieldValues);

      for(const fieldValue of sortedFieldValues){
        const displayValue = await this.getDisplayValue(userAttribute.attribute.standardizedName, fieldValue)
        this.displayValueMap[JSON.stringify([
          userAttribute.attribute.standardizedName, 
          fieldValue.standardizedName
        ])] = displayValue;
      }
    }
  }

  lookupDisplayValue(userAttributeStandardizedName: string, fieldStandardizedName: string): string | number | BadRequestDetail{
    return this.displayValueMap[JSON.stringify([userAttributeStandardizedName, fieldStandardizedName])];
  }

  async getDisplayValue(attributeStandardizedName: StandardizedName, fieldValue: FieldValue): Promise<number | string>{
    const fieldsHelper = this.fieldsMap[attributeStandardizedName][fieldValue.standardizedName];
    const valueToDisplay = JSON.stringify(fieldValue.value) === JSON.stringify(this.currentFieldValue) ?
                            this.currentFieldValue :
                            fieldsHelper.parse(fieldValue.value);

    return valueToDisplay === this.currentFieldValue ? valueToDisplay : await fieldsHelper.toDisplay(valueToDisplay || fieldValue.value);
  }

  sortFieldValuesByDisplayOrder(userAttributeStandardizedName:StandardizedName,fieldValues: FieldValue[]): FieldValue[] {
    const userAttributeFieldsMap = this.fieldsMap[userAttributeStandardizedName];
      return fieldValues.sort((a, b) => {
      const fieldA = userAttributeFieldsMap[a.standardizedName];
      const fieldB = userAttributeFieldsMap[b.standardizedName];
      
      const orderA = fieldA.displayOrder;
      const orderB = fieldB.displayOrder;
      
      return orderA - orderB;
    });
  }

  sortUserAttributes(userAttributes: UserAttribute[]) {
    userAttributes.sort((userAttribute1: UserAttribute, userAttribute2: UserAttribute) => {
      const attributeType1Order = this.topLevelTags.find((topLevelTag) => topLevelTag.standardizedName === userAttribute1.attribute.attributeType)?.attributeTypeOrder;
      const attributeType2Order = this.topLevelTags.find((topLevelTag) => topLevelTag.standardizedName === userAttribute2.attribute.attributeType)?.attributeTypeOrder;
      if (attributeType1Order == undefined) {
        return 1;
      } else if (attributeType2Order == undefined) {
        return -1;
      } else if (attributeType1Order === attributeType2Order) {
        if (this.hasLastUsedField(userAttribute1.fieldValues) && this.hasLastUsedField(userAttribute2.fieldValues)) { // If both have last used field, sort by last used
          const lastUsedDifference = this.compareByLastUsed(userAttribute1, userAttribute2, this.skillsService.skillFieldNames);
          if (lastUsedDifference === 0) {
            return this.compareByYearsOfExperience(userAttribute1, userAttribute2, this.skillsService.skillFieldNames);
          } else {
            return lastUsedDifference;
          }
        } else {
          return 0;
        }
      } else {
        return attributeType1Order - attributeType2Order;
      }
    });
  }

  extractUniqueAttributeTypes(userAttributes: UserAttribute[]) {
    this.staffAddedAttributeTypes = [...new Set(userAttributes.map(attribute => attribute.attribute.attributeType))];
  }

  lookupCanonicalNameForTopLevelTag(standardizedName: StandardizedName): string {
    return this.topLevelTags?.find((topLevelTag) => topLevelTag.standardizedName === standardizedName)?.canonicalName;
  }

  isDisplayValueError(displayValue: string | number | BadRequestDetail): boolean {
    return typeof displayValue === 'object' && 'message' in displayValue;
  }

  hasProofField(fieldValues: FieldValue[]): boolean {
    return fieldValues.some((fieldValue) => fieldValue.standardizedName === this.proofFieldName);
  }

  hasPendingProof(fieldValues: FieldValue[]): boolean {
    return this.hasProofField(fieldValues) && this.hasNoFileValue(fieldValues);
  }

  hasNoFileValue(fieldValues: FieldValue[]): boolean {
    const noFileValue = this.environmentService.getConfiguratonValues().SKILL_FILE_DEFAULT;
    return fieldValues.some((fieldValue) => String(fieldValue.value) === noFileValue);
  }

  hasPendingValidation(fieldValues: FieldValue[]): boolean {
    return !fieldValues.some((fieldValue) => fieldValue.standardizedName === this.proofValidationFieldName);
  }

  downloadProof(fileValue: string, fileName: string) {
    this.proofDownloadService.downloadProof(fileValue, fileName).subscribe({
      next: (message) => {
        this.snackBar.open(message, 'Dismiss', {
          duration: this.snackBarDuration,
        });
      },
      error: (error) => {
        this.snackBar.open(error, 'Dismiss', {
          duration: this.snackBarDuration,
        });
      },
    });
  }

  generateSupportEmail(badRequestDetail: BadRequestDetail): string {
    const subject = encodeURIComponent('Error on Search by staff member');
    const body = encodeURIComponent(`Hi,\n\nI am getting this error on Search by staff member: "${badRequestDetail.detail || badRequestDetail.message}".`);
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }

  isError(personSearchResults: UserAttribute[] | BadRequestDetail): boolean {
    return isError(personSearchResults);
  }
} 