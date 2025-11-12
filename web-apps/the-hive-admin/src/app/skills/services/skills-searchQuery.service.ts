import { Injectable } from '@angular/core';
import { SkillsService, FilterSearchOption } from './skills.service';
import { AttributeFilter, AttributeTypeFilter, FieldFilter, RangeField } from './skills-search.types';

export const currentStringValue = 'current';
export const rangeOperator = 'between';
export const defaultOperator = 'equals'
export const institutionOperatorValue = 'within'

export function createFieldFilterForRange(field: string, min: Date | string | number, max: Date | string | number): FieldFilter{
  const rangeFormat: RangeField = {
    between: {
      min: min,
      max: max,
    }
  }
  return { field, ...rangeFormat};
}

export function createFieldFilter(field: string, filters: { [key: string]: Date | string | number }): FieldFilter {
  return { field, ...filters };
}

export function createAttributeFilter(attribute: string, fieldFilters: FieldFilter[]): AttributeFilter {
  return {
    attribute,
    fieldFilters,
  };
}

export function createAttributeTypeFilter(attributeType: string, fieldFilters: FieldFilter[]): AttributeTypeFilter {
  return {
    attributeType,
    fieldFilters,
  };
}

export function camelCaseToReadable(text: string): string {
  return text.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

@Injectable({
  providedIn: 'root'
})
export class SkillsSearchQueryService {

  constructor(private readonly skillsService: SkillsService){}
  searchFilterOptions: FilterSearchOption[] = undefined;
  comparisonObject = {};
  
  
  async retrieveSkillsSearchFilters(){
    if(this.searchFilterOptions === undefined){
      const data = await this.skillsService.getSearchFilterOptions();
      const filteredData = this.filterUniqueByJavaScriptType(data);
      this.searchFilterOptions = Object.freeze(filteredData) as FilterSearchOption[];
      this.createComparisonObject(this.searchFilterOptions);
    }
    return this.searchFilterOptions;
  }

  createComparisonObject(data: FilterSearchOption[]){
    data.forEach(item => {
      if (!this.comparisonObject[item.skillSearchComparison]) {
        this.comparisonObject[item.skillSearchComparison] = item.skillSearchComparison;
      }else{
        //already in the variable
      }
    });
  }

  filterUniqueByJavaScriptType(data: FilterSearchOption[]) {
    const filteredData: FilterSearchOption[] = [];
    const seen: Map<string, Set<string>> = new Map();
  
    data.forEach(item => {
      const { javaScriptType, skillSearchComparison } = item;
  
      if (!seen.has(javaScriptType)) {
        seen.set(javaScriptType, new Set());
      }else{
        //set has already been initialized
      }
  
      if (!seen.get(javaScriptType)!.has(skillSearchComparison)) {
        seen.get(javaScriptType)!.add(skillSearchComparison);
        filteredData.push(item);
      }else{
        //the comparison is already in the variable 
      }
    });
  
    return filteredData;
  }

  checkAttributeFilterOrAttributeTypeFilter(obj: AttributeFilter | AttributeTypeFilter): obj is AttributeFilter {
    if('attribute' in obj && typeof obj.attribute === 'string'){
      return true;
    }else if('attributeType' in obj && typeof obj.attributeType === 'string'){
      return false;
    }else{
      return undefined;
    }
  }

}
