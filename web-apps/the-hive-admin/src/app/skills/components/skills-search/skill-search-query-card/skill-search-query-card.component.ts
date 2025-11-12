import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { FieldTypeConverter, SkillFieldTypes } from '@the-hive/lib-skills-shared';
import { AttributeFilter, AttributeTypeFilter, FieldFilter, MinMaxField, RequiredFields, RequiredFieldsAttributeTypeFilter } from '../../../services/skills-search.types';
import { camelCaseToReadable, defaultOperator, SkillsSearchQueryService } from '../../../services/skills-searchQuery.service';
import { CanonicalName, FilterSearchOption, SkillsService } from '../../../services/skills.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'skill-search-query-card',
    templateUrl: './skill-search-query-card.component.html',
    styleUrls: ['./skill-search-query-card.component.css', '../../../../shared/shared.css'],
    imports: [MatCardModule, CommonModule, MatIconModule, MatButtonModule, MatDividerModule, MatIcon, MatTooltipModule]
})
export class SkillQueryCardComponent implements OnInit{
    @Input() attributeFilters: AttributeFilter | AttributeTypeFilter;
    @Input() filterOperators: FilterSearchOption[];
    @Input() topLevelTag: CanonicalName;
    @Output() onAttributeDeleted = new EventEmitter<AttributeFilter | AttributeTypeFilter>();
    @Output() onAttributeEdited = new EventEmitter<AttributeFilter | AttributeTypeFilter>();
    fieldConfigs: SkillFieldTypes = undefined;
    fieldTypeConverter: FieldTypeConverter= undefined;
    displayName: string;
    fieldValueMap: Record<string, string> = undefined;
    constructor (private readonly skillsService: SkillsService,
        private readonly skillsSearchQueryService: SkillsSearchQueryService){}

    async ngOnInit(){
        this.fieldTypeConverter = new FieldTypeConverter(
            this.skillsService.mapStandardizedNameToCanonicalName,
            this.skillsService.mapStaffIdToDisplayName,
        );
        await this.getFieldMapForAttribute();
    }

    async formatFieldValues(){
        this.fieldValueMap = {};
        for(const field of this.attributeFilters.fieldFilters){
            for(const operator of this.returnOperatorForField(field)){
                this.fieldValueMap[`field${field.field}${operator}`] = await this.convertFieldValueToReadableString(field.field, operator, field[operator]);
            }
        }
    }

    lookupDisplayValue(field: string, operator: string){
        return this.fieldValueMap[`field${field}${operator}`]
    }

    returnOperatorForField(field: FieldFilter): string[] {
        return Object.keys(field).filter(key => key !== 'field');
    }

    returnDisplayValue(requiredFields: RequiredFields | RequiredFieldsAttributeTypeFilter): void{
        if ('canonicalName' in requiredFields) {
            this.displayName = requiredFields.canonicalName;
        }else{
            //its neither an attribute filter or an attribute type filter
        }
    }

    onRemoveAttributeFilterFromSearch(attributeFilter: AttributeFilter | AttributeTypeFilter): void {
        this.onAttributeDeleted.emit(attributeFilter);
    }

    onEditAttributeFilterFromSearch(attributeFilter: AttributeFilter | AttributeTypeFilter): void {
        this.onAttributeEdited.emit(attributeFilter);
    }

    makeFieldNameReadable(name: string): string{
        return camelCaseToReadable(name);
    }

    isMinMaxObject(value: string | Date | number | MinMaxField | string[]): boolean {
        return value && typeof value === 'object' && 'min' in value && 'max' in value;
    }

    async convertFieldValueToReadableString(fieldName: string, operatorName: string, fieldValue: string | Date | number | MinMaxField | string[]): Promise<string>{
        if(fieldName === this.skillsService.skillFieldNames.skillLevel.name ||
            fieldName === this.skillsService.skillFieldNames.industryKnowledgeLevel.name ||
            fieldName === this.skillsService.skillFieldNames.expertiseLevel.name ||
            fieldName === this.skillsService.skillFieldNames.yearsOfExperienceRating.name){
            if(this.isMinMaxObject(fieldValue)){
                const minMaxValue = fieldValue as MinMaxField;
                const indexOfMinFieldValue = this.fieldConfigs[fieldName].parse(minMaxValue.min);
                const indexOfMaxFieldValue = this.fieldConfigs[fieldName].parse(minMaxValue.max);
                return `${(await this.fieldConfigs[fieldName].toDisplay(indexOfMinFieldValue))} - ${(await this.fieldConfigs[fieldName].toDisplay(indexOfMaxFieldValue))}`
            }else{
                const parsedFieldValue = this.fieldConfigs[fieldName].parse(fieldValue);
                if(operatorName === defaultOperator){
                    return `${(await this.fieldConfigs[fieldName].toDisplay(parsedFieldValue))}`
                }else{
                    return `${this.returnDisplayValueForFieldOperators(operatorName)} ${(await this.fieldConfigs[fieldName].toDisplay(parsedFieldValue))}`
                }
            }
        } else if(fieldName === this.skillsService.skillFieldNames.yearsExperience.name){
            if(this.isMinMaxObject(fieldValue)){
                const minMaxValue = fieldValue as MinMaxField;
                const indexOfMinFieldValue = this.fieldConfigs[fieldName].parse(minMaxValue.min);
                const indexOfMaxFieldValue = this.fieldConfigs[fieldName].parse(minMaxValue.max);
                return `${(await this.fieldConfigs[fieldName].toDisplay(indexOfMinFieldValue))} -
                    ${(await this.fieldConfigs[fieldName].toDisplay(indexOfMaxFieldValue))}
                    ${this.makeFieldNameReadable(fieldName)}`
            }else{
                const parsedFieldValue = this.fieldConfigs[fieldName].parse(fieldValue);
                return `${this.returnDisplayValueForFieldOperators(operatorName)} ${(await this.fieldConfigs[fieldName].toDisplay(parsedFieldValue))} ${this.makeFieldNameReadable(fieldName)}`
            }
        }else if(fieldName === this.skillsService.skillFieldNames.obtainedFrom.name){
            if (Array.isArray(fieldValue)) {
                return fieldValue.map(value => value).join(", ");
            } else {
                return `${fieldValue}`;
            }
        }else{
            if(this.isMinMaxObject(fieldValue)){
                const minMaxValue = fieldValue as MinMaxField;
                const indexOfMinFieldValue = this.fieldConfigs[fieldName].parse(minMaxValue.min);
                const indexOfMaxFieldValue = this.fieldConfigs[fieldName].parse(minMaxValue.max);
                return `${this.makeFieldNameReadable(fieldName)} ${(await this.fieldConfigs[fieldName].toDisplay(indexOfMinFieldValue))} - ${(await this.fieldConfigs[fieldName].toDisplay(indexOfMaxFieldValue))}`
            }else{
                const parsedFieldValue = this.fieldConfigs[fieldName].parse(fieldValue);
                if(isNaN(parsedFieldValue)){
                    return `${this.makeFieldNameReadable(fieldName)} - ${fieldValue}`;
                }else if(operatorName === defaultOperator){
                    return `${this.makeFieldNameReadable(fieldName)} - ${(await this.fieldConfigs[fieldName].toDisplay(parsedFieldValue))}`
                }else{
                    return `${this.makeFieldNameReadable(fieldName)} - ${this.returnDisplayValueForFieldOperators(operatorName)} ${(await this.fieldConfigs[fieldName].toDisplay(parsedFieldValue))}`
                }
            }
        }
    }

    returnDisplayValueForFieldOperators(searchComparison: string): string {
        const displayValue = this.filterOperators.find(operator => operator.skillSearchComparison === searchComparison);
        return displayValue ? displayValue.displayComparison : '';
    }

    async getFieldMapForAttribute(){
        if(!this.skillsSearchQueryService.checkAttributeFilterOrAttributeTypeFilter(this.attributeFilters)){
            this.skillsService.getAttributeFieldBasedOffOfTopLevelTag(this.attributeFilters.attributeType).subscribe({
                next: async (data) => {
                  const requiredFields = data;
                  const jsType = await (this.skillsService.getJSTypes()).then((data) =>{
                    return data;
                  });
                  const jsTypeScale = await (this.skillsService.getJSTypeScale()).then((data) =>{
                    return data;
                  });
                  const skillsFields = await (this.skillsService.getSkillsFields()).then((data) =>{
                    return data;
                  });
                  this.fieldConfigs = this.fieldTypeConverter.createFieldsMap(requiredFields.fields, skillsFields, jsType, jsTypeScale);
                  this.returnDisplayValue(requiredFields);
                  await this.formatFieldValues();
                }
            });

        }else{
            this.skillsService.getAttributeData(this.attributeFilters.attribute).subscribe({
                next: async (data) => {
                  const requiredFields = data;
                  const jsType = await (this.skillsService.getJSTypes()).then((data) =>{
                    return data;
                  });
                  const jsTypeScale = await (this.skillsService.getJSTypeScale()).then((data) =>{
                    return data;
                  });
                  const skillsFields = await (this.skillsService.getSkillsFields()).then((data) =>{
                    return data;
                  });
                  this.fieldConfigs = this.fieldTypeConverter.createFieldsMap(requiredFields.fields, skillsFields, jsType, jsTypeScale);
                  this.returnDisplayValue(requiredFields);
                  await this.formatFieldValues();
                }
            });
        }
    }
}
