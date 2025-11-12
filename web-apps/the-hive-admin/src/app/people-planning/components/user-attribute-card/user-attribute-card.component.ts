/**@format */
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCard, MatCardContent, MatCardTitle } from "@angular/material/card";
import { MatChip } from "@angular/material/chips";
import { MatIcon } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FieldTypeConverter, FieldValue, JsType, JSTypeScale, SkillField, StandardizedName, UserAttribute } from "@the-hive/lib-skills-shared";
import { EnvironmentService } from "../../../services/environment.service";
import { SkillsService } from "../../../skills/services/skills.service";
import { BadRequestDetail, isError } from "@the-hive/lib-shared";
@Component({
  selector: "app-user-attribute-card",
  templateUrl: "./user-attribute-card.component.html",
  styleUrls: ["./user-attribute-card.component.css"],
  providers: [],
  standalone: true,
  imports: [
    MatIcon,
    MatTooltipModule,
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatChip,
    MatButtonModule
  ],
})
export class UserAttributeCardComponent implements OnInit {
  @Input() skillsFields: SkillField[] = undefined;
  @Input() jsTypes: JsType[] = undefined;
  @Input() jsTypeScales: JSTypeScale[] = undefined;
  @Input() userAttribute: UserAttribute = undefined;
  @Input() isCoreTech: boolean = undefined;
  @Input() hasReachedCoreTechLimit: boolean = undefined;
  @Output() userAttributeSelected = new EventEmitter<UserAttribute>();
  currentDate: string = Date.now().toString();
  fieldTypeConverter: FieldTypeConverter = undefined;
  fieldMap = undefined;
  displayValuesRecord: {[fieldStandardizedName: StandardizedName]: string | number | BadRequestDetail;} = undefined;

  constructor(
    private readonly skillService: SkillsService,
    private readonly environmentService: EnvironmentService
  ) {
    this.fieldTypeConverter = new FieldTypeConverter(
      this.skillService.mapStandardizedNameToCanonicalName,
      this.skillService.mapStaffIdToDisplayName
    );
    this.currentDate = this.environmentService.getConfiguratonValues().SKILL_CURRENT_DATE;
  }

  async ngOnInit(){
    this.fieldMap = this.fieldTypeConverter.createFieldsMap(
      this.userAttribute.fieldValues.map((fieldValue) => fieldValue.standardizedName),
      this.skillsFields,
      this.jsTypes,
      this.jsTypeScales
    );
    await this.createDisplayValuesMap();
  }

  sortFieldValues(fieldValues: FieldValue[]): FieldValue[]{
      return fieldValues.sort((a, b) => {
        const fieldA = this.fieldMap[a.standardizedName];
        const fieldB = this.fieldMap[b.standardizedName];
        
        const orderA = fieldA.displayOrder;
        const orderB = fieldB.displayOrder;
        
        return orderA - orderB;
      });
  }

  async createDisplayValuesMap(){
    this.displayValuesRecord = {};
    const sortedFieldValues = this.sortFieldValues(this.userAttribute.fieldValues);
    for(const fieldValue of sortedFieldValues){
        this.displayValuesRecord[fieldValue.standardizedName] = await this.parseDisplayValueForStandardizedName(
          fieldValue.standardizedName, 
          fieldValue.value
        );
    }
  }

  async parseDisplayValueForStandardizedName(standardizedName: string, fieldValue: FieldValue["value"]): Promise<string | number | BadRequestDetail> {
    const valueToDisplay = JSON.stringify(fieldValue) === JSON.stringify(this.currentDate) ?
                            this.currentDate :
                            this.fieldMap[standardizedName].parse(fieldValue);

    return valueToDisplay === this.currentDate ? 
      valueToDisplay : 
      await this.fieldMap[standardizedName].toDisplay( valueToDisplay || fieldValue);
  }

  lookupDisplayValue(fieldStandardizedName: StandardizedName): string | number | BadRequestDetail{
    return this.displayValuesRecord[fieldStandardizedName];
  }

  lookupFieldLabel(fieldStandardizedName: StandardizedName): string{
    return this.fieldMap[fieldStandardizedName].fieldLabel;
  }

  isDisplayValueError(displayValue: string | number | BadRequestDetail): boolean{
    return isError(displayValue);
  }

  findTopLevelSkillPathCanonicalNameForAttribute(userAttribute: UserAttribute): string{
    const skillPath = userAttribute.attribute.skillPath.find((skillPath) => skillPath.isTopLevel);
    if(skillPath){
      return skillPath.canonicalName;
    } else{
      return undefined;
    }
  }

  makeToolTipMessage(): string{
    if(this.hasReachedCoreTechLimit && !this.isCoreTech){
      return "Staff has reached core tech limit";
    } else if(this.isCoreTech){
      return `Remove ${this.userAttribute.attribute.canonicalName} as core tech`;
    } else{
      return `Make ${this.userAttribute.attribute.canonicalName} core tech`;
    }
  }

  generateSupportEmail(badRequestDetail: BadRequestDetail): string {
    const subject = encodeURIComponent('Error on People planning');
    const body = encodeURIComponent(`Hi,\n\nI am getting this error on People planning: "${badRequestDetail.message}".`);
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }
}
