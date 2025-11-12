import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FieldTypeConverter, FieldValue, JsType, JSTypeScale, SkillField, StandardizedName, SkillFieldTypes } from '@the-hive/lib-skills-shared';
import { EnvironmentService } from '../../../../services/environment.service';
import { SkillsProofDownloadService } from '../../../services/skills-proof-download.service';
import { UserResults } from '../../../services/skills-search.types';
import { camelCaseToReadable } from '../../../services/skills-searchQuery.service';
import { SkillsService } from '../../../services/skills.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { BadRequestDetail, isError } from '@the-hive/lib-shared';
@Component({
    selector: 'user-skills-card',
    templateUrl: './user-search-card.component.html',
    styleUrls: ['./user-search-card.component.css', '../../../../shared/shared.css'],
    imports: [MatCardModule,
        MatDividerModule,
        MatExpansionModule,
        MatIconModule,
        CommonModule,
        MatTooltipModule,
        MatButtonModule
      ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeopleAndTheirSkillsCard implements OnInit {
  @Input() personInfo: UserResults;
  @Output() selectUPN = new EventEmitter<string>();
  readonly proofFieldName = 'proof';
  readonly obtainedFromFieldName = 'obtainedFrom';
  snackBarDuration: number;
  attributeFieldFormatters: {[key: string] : SkillFieldTypes} = {};
  fieldTypeConverter: FieldTypeConverter = undefined;
  skillsFields: SkillField[] = undefined;
  jsTypes: JsType[] = undefined;
  jsTypeScales: JSTypeScale[] = undefined;
  skillFileDefault: string = undefined;
  skillsCurrentDateValue: string = undefined;
  displayValueMap: {[serialisedAttributeStandardizedNameAndFieldStandardizedName: string]: (string | number | BadRequestDetail);} = undefined;
  isError = isError;

  constructor(
    private readonly skillsService: SkillsService,
    private snackBar: MatSnackBar,
    private readonly proofDownloadService: SkillsProofDownloadService,
    private readonly environmentService: EnvironmentService,
){}

  async ngOnInit(){
    this.displayValueMap = {};
    this.fieldTypeConverter = new FieldTypeConverter(
      this.skillsService.mapStandardizedNameToCanonicalName,
      this.skillsService.mapStaffIdToDisplayName
    );
    await this.getSkillTypes();
    this.skillFileDefault = this.environmentService.getConfiguratonValues().SKILL_FILE_DEFAULT;
    this.skillsCurrentDateValue = this.environmentService.getConfiguratonValues().SKILL_CURRENT_DATE;
    await this.getFieldMapForAttribute();
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
  }

  makeTitlesReadable(title: string){
    return camelCaseToReadable(title);
  }

  async getSkillTypes() {
    this.skillsFields = await this.skillsService.getSkillsFields();
    this.jsTypes = await this.skillsService.getJSTypes();
    this.jsTypeScales = await this.skillsService.getJSTypeScale();
  }

  async getFieldMapForAttribute(){
    this.displayValueMap = {};
    for(const attributeName of this.personInfo.userAttributes){
      if(isError(attributeName)){
        // the error will be displayed on the HTML and a skills support email link will
        // be shown that the user can click on for this attribute
      } else{

      const fieldMap = this.fieldTypeConverter.createFieldsMap(
        attributeName.fieldValues.map((fieldValue) => fieldValue.standardizedName), 
        this.skillsFields, 
        this.jsTypes, 
        this.jsTypeScales);
      this.attributeFieldFormatters[attributeName.attribute.standardizedName] = fieldMap;

      const sortedFieldValues = this.sortFieldValues(attributeName.fieldValues, attributeName.attribute.standardizedName);

      for(const fieldValue of sortedFieldValues){
        const displayValue = await this.getDisplayValue(attributeName.attribute.standardizedName, fieldValue)
        this.displayValueMap[JSON.stringify([
          attributeName.attribute.standardizedName, 
          fieldValue.standardizedName
        ])] = displayValue;
      }

      }
    }
  }

  parseFieldValue(fieldMap: SkillFieldTypes,isFieldValueCurrentDate: boolean, fieldValue: FieldValue) {
    return isFieldValueCurrentDate ? 
                    this.skillsCurrentDateValue : 
                    fieldMap[fieldValue.standardizedName].parse(fieldValue.value);
  }

  async getDisplayValue(attributeStandardizedName: StandardizedName, fieldValue: FieldValue): Promise<number | string>{
    const fieldMap = this.attributeFieldFormatters[attributeStandardizedName];
    const isFieldValueCurrentDate = JSON.stringify(fieldValue.value) === JSON.stringify(this.skillsCurrentDateValue);

    const parsedValue = this.parseFieldValue(fieldMap, isFieldValueCurrentDate, fieldValue);
    const displayValue = isFieldValueCurrentDate ? this.skillsCurrentDateValue : 
                        await fieldMap[fieldValue.standardizedName].toDisplay(parsedValue || fieldValue.value);
    return displayValue;
  }

  lookupFieldLabel(userAttributeStandardizedName: string, fieldStandardizedName: string): string{
    return this.attributeFieldFormatters[userAttributeStandardizedName]?.[fieldStandardizedName]?.fieldLabel;
  }

  lookupDisplayValue(userAttributeStandardizedName: string, fieldStandardizedName: string): string | number | BadRequestDetail{
    return this.displayValueMap[JSON.stringify([userAttributeStandardizedName, fieldStandardizedName])];
  }

  sortFieldValues(fieldValues: FieldValue[], attributeStandardizedName: StandardizedName): FieldValue[]{
    return fieldValues.sort((a, b) => {
      const fieldA = this.attributeFieldFormatters[attributeStandardizedName][a.standardizedName];
      const fieldB = this.attributeFieldFormatters[attributeStandardizedName][b.standardizedName];
      const orderA = fieldA.displayOrder;
      const orderB = fieldB.displayOrder;
      
      return orderA - orderB;
    });
  }

  getObtainedFromTextForEmail(userAttributeStandardizedName: string): string {
    const institutionName = this.displayValueMap[JSON.stringify([userAttributeStandardizedName, this.obtainedFromFieldName])];
    return institutionName ? ` from the ${institutionName}.%0D%0A%0D%0A` : ".%0D%0A%0D%0A";
  }

  generateSupportEmail(errorMessage: string): string {
    const subject = encodeURIComponent('Error on Talent search');
    const body = encodeURIComponent(`Hi,\n\nI am getting this error on Talent search: "${errorMessage}".`);
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }

  departmentDisplayString(personInfo: UserResults) {
    if(personInfo.department === null) {
      return "Unknown Department"
    } else {
      if(personInfo.manager === null) {
        return `${personInfo.department}, Unknown Manager`
      } else {
        return `${personInfo.department}, ${personInfo.manager}`
      }
    }
  }

  downloadProof(proofUrl: string, fileName: string) {
      this.proofDownloadService.downloadProof(proofUrl, fileName).subscribe({
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
}
