import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit, } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { BadRequestDetail, FieldTypeConverter, FieldValue, JsType, JSTypeScale, SkillField, StandardizedName, TopLevelTag } from '@the-hive/lib-skills-shared';
import { BehaviorSubject, firstValueFrom, from, Observable } from 'rxjs';
import { EnvironmentService } from '../../../services/environment.service';
import { RFPSearchComponent } from '../../components/skills-search/skills-rfp-search/skills-rfp-search.component';
import { SearchByPersonComponent } from '../../components/skills-search/skills-search-by-person/skills-search-by-person.component';
import { SearchFormComponent } from '../../components/skills-search/skills-search-form/skills-search-form.component';
import { PeopleAndTheirSkillsCard } from '../../components/skills-search/user-search-cards/user-search-card.component';
import { FilterQuery, SkillReport, UserResults, UserSearchResults } from '../../services/skills-search.types';
import { SkillsService } from '../../services/skills.service';
import { FileService } from './../../../services/file.service';
import { TableService } from '../../../services/table.service';
import { isError, Pagination } from '@the-hive/lib-shared';
@Component({
    selector: 'skills-search',
    templateUrl: './skills-search.component.html',
    styleUrls: ['./skills-search.component.css', '../../../shared/shared.css'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTab,
        MatTabGroup,
        SearchFormComponent,
        SearchByPersonComponent,
        MatCheckboxModule,
        MatRadioModule,
        MatDividerModule,
        FormsModule,
        PeopleAndTheirSkillsCard,
        MatPaginatorModule,
        RFPSearchComponent,
        MatError
    ], providers: [
        
    ]
})
export class SkillsSearchComponent implements OnInit {
  listOfPeople$: BehaviorSubject<UserResults[]> = new BehaviorSubject<UserResults[]>(undefined);
  totalStaffCount$: BehaviorSubject<number> = new BehaviorSubject<number>(undefined);
  isLoading = false;
  attributeFilerObject: FilterQuery = undefined;
  reportColumns: string[] =  ['attributeType', 'skill', 'total'];
  detailedReportColumns: string[] = ["Employee number", "Employee name", "Company entity"];
  snackBarDuration: number;
  jsTypeScales: JSTypeScale[];
  jsTypes: JsType[];
  skillsFields: SkillField[];
  attributeTypes: TopLevelTag[] = [];
  currentlyUsedValue : string = undefined;
  fieldTypeConverter: FieldTypeConverter = undefined;
  selectedUPN: string = undefined;
  generateReportError: BadRequestDetail = undefined;
  pagination$: BehaviorSubject<Pagination> = new BehaviorSubject<Pagination>(undefined);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFormComponent) searchFormComponent!: SearchFormComponent;
  exportDetailedReport$: Observable<UserResults[]> = undefined;
  exportSummaryReport$: Observable<UserResults[]> = undefined;

  constructor(
    private readonly fileService: FileService,
    private readonly skillsService: SkillsService,
    private readonly matSnackBar: MatSnackBar,
    private readonly environmentService: EnvironmentService,
    public tableService: TableService
  ) {
    this.fieldTypeConverter = new FieldTypeConverter(
      this.skillsService.mapStandardizedNameToCanonicalName,
      this.skillsService.mapStaffIdToDisplayName
    );
  }

  setSearchResults(searchResults: UserSearchResults): void {
    if (!searchResults) {
      this.listOfPeople$.next(undefined);
      this.generateReportError = undefined;
      this.selectedUPN = undefined;
    } else {
      this.selectedUPN = undefined;
      this.listOfPeople$.next(searchResults.userResults);
      if (searchResults.totalCount !== undefined) {
        this.totalStaffCount$.next(searchResults.totalCount);
      } else {
        // totalStaffCount is not set so we don't need to update the pagination
      }
      this.pagination$.next(searchResults.pagination);
      this.generateReportError = undefined;
    }
  }

  ngOnInit(): void {
    this.fetchEnvironmentConfigurations();
    from(this.skillsService.getJSTypes()).subscribe((data) => {
      this.jsTypes = data;
    });

    from(this.skillsService.getJSTypeScale()).subscribe((data) => {
      this.jsTypeScales = data;
    });

    from(this.skillsService.getSkillsFields()).subscribe((data) => {
      this.skillsFields = data;
    });
    from(this.skillsService.retrieveTopLevelTags()).subscribe(data=>{
      this.attributeTypes = data;
    })
    this.pagination$.next({startIndex: 0, pageLength: this.tableService.getPageSize()});
  }

  createFiledMap(requiredFields :string[]) {
    return this.fieldTypeConverter.createFieldsMap(requiredFields, this.skillsFields, this.jsTypes, this.jsTypeScales);
  }

  setSelectedUpn(upn: string){
    this.selectedUPN = upn;
  }

  generateReportData(people: UserResults[]): SkillReport[] {
    const result: SkillReport[] = [];
    for (const person of people) {
      const userAttributes = new Set<string>();
      for (const userAttribute of person.userAttributes) {
        const { canonicalName: skill, attributeType } = userAttribute.attribute;
        if (!userAttributes.has(skill)) {
          userAttributes.add(skill);
          let skillRow = result.find((entry) => entry.skill === skill);
          if (!skillRow) {
            skillRow = { attributeType, skill, total: 0};
            result.push(skillRow);
          } else {
            //Row for skill already exists
          }

          skillRow.total += 1;
          if (!skillRow[person.entity]) {
            skillRow[person.entity] = 0;
            if (!this.reportColumns.includes(person.entity)) {
              this.reportColumns.push(person.entity);
            } else {
              // column already added to reportColumns
            }
          } else {
            // skillRow already contains person.entity
          }
          skillRow[person.entity] += 1;
        } else {
          //if a user has 2 of the same degrees we do not want to count both since the report data count is per person.
        }
      }
    }
    return result;
  }

  async generateSummaryReport() {
    this.exportSummaryReport$ = this.searchFormComponent.retrieveAllPeopleWithSpecificSkills();
    const people = await firstValueFrom(this.exportSummaryReport$);
    const reportData = this.generateReportData(people);
    this.fileService.generateCSVFile(
      this.reportColumns,
      reportData,
      'Summary Report'
    );
    this.exportSummaryReport$ = undefined;
  }

  async getDisplayValuesForAttribute(fieldValues: FieldValue[], columnHeading: string) {
    const fields = fieldValues.map((fieldValue) => fieldValue.standardizedName);
    const fieldsMap = this.createFiledMap(fields);
    const displayValues = {};

    for (const fieldValue of fieldValues) {
      const parsedValue = fieldsMap[fieldValue.standardizedName].parse(fieldValue.value);

      const toDisplayValue =
        JSON.stringify(fieldValue.value) === JSON.stringify(this.currentlyUsedValue)
          ? this.currentlyUsedValue
          : await fieldsMap[fieldValue.standardizedName].toDisplay(parsedValue);
      displayValues[`${columnHeading} ${fieldsMap[fieldValue.standardizedName].fieldLabel}`] = toDisplayValue;
    }
    return displayValues;
  }

  groupResultsByAttributeType(listOfPeople: UserResults[]) {
    return listOfPeople.reduce((searchResultsGroupedByType, user) => {
      for(const userAttribute of user.userAttributes){
        if (!searchResultsGroupedByType[userAttribute.attribute.attributeType]) {
          searchResultsGroupedByType[userAttribute.attribute.attributeType] = [];
        }
        searchResultsGroupedByType[userAttribute.attribute.attributeType].push({
          ...user,
          canonicalName: userAttribute.attribute.canonicalName,
          fieldValues: userAttribute.fieldValues
        });

        }
      return searchResultsGroupedByType;
    }, {});
  }

  findCanoncialNameForCategory(standardizedName: StandardizedName) {
    const canonicalAndStandardizednameForCategory = this.attributeTypes.find(
      (canonicalAndStandardizedName) => canonicalAndStandardizedName.standardizedName === standardizedName,
    );
    return canonicalAndStandardizednameForCategory.canonicalName;
  }

  async generateRowContentForAttributeType(attributeType: string, listOfPeople: UserResults[]) {
    const groupedByCategory = this.groupResultsByAttributeType(listOfPeople);
    const people = groupedByCategory[attributeType];
    const rows = [];
    for (const person of people) {
      const categoryCanonicalName = this.findCanoncialNameForCategory(attributeType);
      const displayValuesForFields = await this.getDisplayValuesForAttribute(person.fieldValues, categoryCanonicalName);

      const headings= Object.keys(displayValuesForFields).filter(
        (el) => !this.detailedReportColumns.includes(el) && !el.toLowerCase().includes("proof"),
      );

      if (headings.length > 0) {
        this.detailedReportColumns = [...this.detailedReportColumns, ...headings];
      } else {
        // column has already been added or is proof which we don't want to include in the report
      }

      const row = {
        "Employee number": person.bbdUserName,
        "Employee name": person.userName,
        "Company entity": person.entity || "",
        ...displayValuesForFields,
        [categoryCanonicalName]: `"${person.canonicalName}"`,
      };
      rows.push(row);
    }
    return rows;
  }

  async generateDetailedReport() {
    this.exportDetailedReport$ = this.searchFormComponent.retrieveAllPeopleWithSpecificSkills();
    const people = this.checkIfUserAttributesAreError(await firstValueFrom(this.exportDetailedReport$));
    if(isError(people)){
      this.generateReportError = people;
    } else {
      const groupedByCategory = this.groupResultsByAttributeType(people);
      let reportContent = [];
      const searchResultAttributeType = Object.keys(groupedByCategory);

      for (const type of searchResultAttributeType) {
        if (!this.detailedReportColumns.includes(this.findCanoncialNameForCategory(type))) {
          this.detailedReportColumns.push(this.findCanoncialNameForCategory(type));
        } else {
          //Column has already been added
        }
        const rowDataForAttribute = await this.generateRowContentForAttributeType(type, people);
        reportContent = [...reportContent, ...rowDataForAttribute];
      }
      this.fileService.generateCSVFile(this.detailedReportColumns, reportContent, "Detailed Report");
      this.exportDetailedReport$ = undefined;
    }
  }

  checkIfUserAttributesAreError(people: UserResults[]): BadRequestDetail | UserResults[]{
    const errorMessages = Object.values(people).reduce((acc, person) => [...acc, ...person.userAttributes.filter(isError)], []);
    if(errorMessages.length > 0){
      const uniqueErrorMessages = [...new Set(errorMessages.map((error) => error.message))].join(', ');
      return { message: `Cannot generate report, due to: ${uniqueErrorMessages}` };
    } else{
      return people;
    }
  }

  onPageChange(event: PageEvent): void {
    this.pagination$.next({startIndex: event.pageIndex, pageLength: event.pageSize});
  }

  fetchEnvironmentConfigurations(): void {
    this.environmentService.getConfig().subscribe((env) => {
      this.snackBarDuration = env.SNACKBAR_DURATION;
      this.currentlyUsedValue = env.SKILL_CURRENT_DATE;
    });
  }

  updateAttributeFilters(updatedAttributeFilterObject: FilterQuery){
    this.attributeFilerObject = updatedAttributeFilterObject;
    this.setSearchResults(undefined);
  }

  generateSupportEmail(errorMessage: string): string {
    const subject = encodeURIComponent('Error on Talent search');
    const body = encodeURIComponent(`Hi,\n\nI am getting this error on Talent search: "${errorMessage}".`);
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }
}

