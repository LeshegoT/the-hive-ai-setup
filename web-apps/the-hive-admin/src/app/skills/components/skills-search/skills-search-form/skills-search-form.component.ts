import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, ViewChild, OnInit, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FieldTypeConverter, JSTypeScale, JsType, SkillField, CanonicalNameDetails, SkillFieldTypes, AttributeForSearchTextException, StandardizedName } from '@the-hive/lib-skills-shared';
import { BehaviorSubject, debounceTime, filter, from, map, mergeMap, Observable, reduce } from 'rxjs';
import { EnvironmentService } from '../../../../services/environment.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AttributeFilter,
  AttributeTypeFilter,
  FieldFilter,
  FilterQuery,
  RatingData,
  RequiredFields,
  RequiredFieldsAttributeTypeFilter,
  UserResults,
  UserSearchResults
} from '../../../services/skills-search.types';
import { SkillsSearchQueryService } from '../../../services/skills-searchQuery.service';
import { FilterSearchOption, SkillsService } from '../../../services/skills.service';
import { SkillQueryCardComponent } from '../skill-search-query-card/skill-search-query-card.component';
import { SkillsSearchDatePickerComponent } from '../skills-search-date-picker/skills-search-date-picker.component';
import { SkillsSearchDropDownComponent } from '../skills-search-drop-down/skills-search-drop-down.component';
import { SkillsSearchNumberInputComponent } from '../skills-search-number-input/skills-search-number-input.component';
import { SkillsSearchRadioButtonComponent } from '../skills-search-radio-button/skills-search-radio-button.component';
import { SelectOffices } from '../../../../components/select-office/select-office.component';
import { SelectCompanyEntities } from '../../../../components/select-company-entity/select-company-entity.component';
import { CompanyEntity } from '../../../../services/company-entities.service';
import { Office } from '../../../..//services/offices-service';
import { SkillsSearchBarComponent } from '../../skills-search-bar/skills-search-bar.component';
import { SkillsSearchSharedFiltersService } from '../../../services/skills-search-shared-filters.service';
import { BadRequestDetail, Pagination } from '@the-hive/lib-shared';

@Component({
    selector: 'app-search-form',
    templateUrl: './skills-search-form.component.html',
    styleUrls: ['./skills-search-form.component.css', '../../../../shared/shared.css'],
    imports: [
        CommonModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule,
        SkillsSearchDatePickerComponent,
        MatSelectModule,
        FormsModule,
        MatCheckboxModule,
        SkillsSearchNumberInputComponent,
        SkillsSearchDropDownComponent,
        SkillsSearchRadioButtonComponent,
        SkillQueryCardComponent,
        MatDividerModule,
        MatProgressSpinnerModule,
        CommonModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatSelect,
        MatCheckboxModule,
        MatRadioModule,
        SelectCompanyEntities,
        SelectOffices,
        MatDividerModule,
        FormsModule,
        MatPaginatorModule,
        SkillsSearchBarComponent,
        MatTooltipModule
    ], providers: [
        
    ]
})
export class SearchFormComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() pagination: Pagination;
  @Output() attributeFilterObjectUpdate = new EventEmitter<FilterQuery>();
  @Output() peopleListUpdated = new EventEmitter<UserSearchResults>();
  @Output() resetSearch = new EventEmitter<boolean>();
  selectedEntities: CompanyEntity[] = [];
  selectedOffices: Office[];
  userSearchResults: UserSearchResults;
  isSearching = false;
  searchAttributeType: FormControl<string> = new FormControl('all');
  isAttributeTypeFilter = false;
  fieldFormatters: SkillFieldTypes = undefined;
  searchText: FormControl<string> = new FormControl();
  requiredFields: RequiredFields | RequiredFieldsAttributeTypeFilter = undefined;
  topLevelTags: Record<CanonicalNameDetails["standardizedName"], CanonicalNameDetails["canonicalName"]> = {};
  isLoading = false;
  snackBarDuration: number;
  ratingData: RatingData;
  jsType: JsType[];
  jsTypeScale: JSTypeScale[];
  skillsFields: SkillField[];
  searchNameControl = new FormControl("", Validators.required);
  savedSearches: string[] = [];
  selectedSavedSearch = new FormControl();
  filterByStaffOnSupply: boolean;
  minimumAllowedYearsOfExperience: number = undefined;
  maximumAllowedYearsOfExperience: number = undefined;
  minimumSearchCharacters: number = undefined;
  searchTextExceptions$: Observable<AttributeForSearchTextException[]>;
  fieldTypeConverter: FieldTypeConverter = undefined;
  attributeFilerObject: FilterQuery = {
    filters: {
      attributeFilters: [],
      attributeTypeFilters: [],
    },
  };

  attributeFilters: AttributeFilter = {
    attribute: undefined,
    fieldFilters: [],
  };

  attributeTypeFilters: AttributeTypeFilter = {
    attributeType: undefined,
    fieldFilters: [],
  };

  shouldFilter = (): boolean => {
    const attributeFilters = this.attributeFilerObject.filters.attributeFilters;
    const attributeTypeFilters = this.attributeFilerObject.filters.attributeTypeFilters;
    return this.selectedEntities.length > 0 &&
          this.selectedOffices.length > 0 && 
          (attributeFilters.length > 0 || attributeTypeFilters.length > 0) 

  }
    editAttribute$: BehaviorSubject<AttributeFilter | AttributeTypeFilter> = new BehaviorSubject<AttributeFilter | AttributeTypeFilter>(undefined);

  constructor(private readonly skillsService: SkillsService,
    private readonly matSnackBar: MatSnackBar,
    private readonly skillsSearchUtils: SkillsSearchQueryService,
    private readonly environmentService: EnvironmentService,
    private readonly skillsSearchSharedFiltersService: SkillsSearchSharedFiltersService
  ) {
    this.fieldTypeConverter = new FieldTypeConverter(
      this.skillsService.mapStandardizedNameToCanonicalName,
      this.skillsService.mapStaffIdToDisplayName
    );
  }

  filerOperators: FilterSearchOption[];
  institutions: string[];
  scale: string[];
  @ViewChild(SelectCompanyEntities) selectCompanyEntitiesComponent: SelectCompanyEntities;
  @ViewChild(SelectOffices) selectOfficeComponent: SelectOffices;
  errorMessage: BadRequestDetail = undefined;

  async ngOnInit() {
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this.minimumAllowedYearsOfExperience = this.environmentService.getConfiguratonValues().MINIMUM_ALLOWED_YEARS_OF_EXPERIENCE;
    this.maximumAllowedYearsOfExperience = this.environmentService.getConfiguratonValues().MAXIMUM_ALLOWED_YEARS_OF_EXPERIENCE;
    this.resetSearchVariables();
    this.searchAttributeType.valueChanges.subscribe(() => {
      this.resetSearchVariables();
    });
    this.getFieldTypes()
    this.retrieveFilterOperators();
    this.retrieveAllInfoRequiredForFields();
    this.retrieveTopLevelTags()
    this.retrieveSavedSearches();
    this.selectedSavedSearch.valueChanges
    .pipe(
        filter((searchName: string) => searchName.trim().length > 0)
    ).subscribe((searchName: string) => {
        this.retrieveSavedSearchParameters(searchName);
    });
  }

  getTooltipMessage(fieldName: StandardizedName): string {
    const tooltips = {
      [this.skillsService.skillFieldNames.lastUsed.name]: "Filter by when this skill or certification was last actively used",
      [this.skillsService.skillFieldNames.expiryDate.name]: "Filter by certification expiration dates to find active or expiring credentials",
      [this.skillsService.skillFieldNames.dateOfGraduation.name]: "Filter by graduation date to find qualifications obtained within a specific timeframe",
      [this.skillsService.skillFieldNames.achievedDate.name]: "Filter by when certifications or qualifications were first achieved",
      [this.skillsService.skillFieldNames.obtainedFrom.name]: "Filter by institution or organization where the qualification was obtained",
      [this.skillsService.skillFieldNames.yearsExperience.name]: "Filter by total years of hands-on experience with this skill",
      [this.skillsService.skillFieldNames.skillLevel.name]: "Filter by proficiency level (Beginner, Intermediate, Advanced, Expert)",
      [this.skillsService.skillFieldNames.industryKnowledgeLevel.name]: "Filter by level of expertise and knowledge within specific industries",
      [this.skillsService.skillFieldNames.expertiseLevel.name]: "Filter by overall level of mastery and specialized knowledge in the field",
      [this.skillsService.skillFieldNames.yearsOfExperienceRating.name]: "Filter by experience rating based on years of practice and performance"
    };
    return tooltips[fieldName] || 'Filter to refine search results for this attribute';
  }

  ngAfterViewInit() {
    this.skillsSearchSharedFiltersService.selectedCompanyEntities.subscribe(selectedCompanyEntities => {
      this.selectCompanyEntitiesComponent.setSelectedEntities(selectedCompanyEntities);
      this.selectedEntities = selectedCompanyEntities;
    });
    this.skillsSearchSharedFiltersService.selectedOffices.subscribe(selectedOffices => {
      this.selectOfficeComponent.setSelectedOffices(selectedOffices);
      this.selectedOffices = selectedOffices;
    });
  }

  onCompanyEntitySelected(selectedCompanyEntities: CompanyEntity[]): void {
    this.skillsSearchSharedFiltersService.setSelectedEntities(selectedCompanyEntities);
  }

  onOfficeSelected(selectedOffices: Office[]): void {
    this.skillsSearchSharedFiltersService.setSelectedOffices(selectedOffices);
  }

  retrieveAllInfoRequiredForFields(){
    this.retrieveInstitutions();
  }

  async retrieveTopLevelTags(){
    const attributeTypes = await this.skillsService.retrieveTopLevelTags();
    const filteredAttributeTypes = attributeTypes.filter(type => type.standardizedName !== "institution");

    for (const type of filteredAttributeTypes) {
      this.topLevelTags[type.standardizedName] = type.canonicalName;
    }
  }

  retrieveInstitutions(): void {
    if ((this.requiredFields as RequiredFields)?.attribute) {
      this.errorMessage = undefined;
      this.skillsService.getInstitutionsForSpecificAttribute((this.requiredFields as RequiredFields).attribute).subscribe({
            next: (data) => {
              this.institutions = data;
            },
            error: (error) => {
              this.errorMessage = {message: error};
            this.matSnackBar.open(`Something went wrong with retrieving institutions`, 'dismiss', { duration: this.snackBarDuration });
            },
          });
    } else if ((this.requiredFields as RequiredFieldsAttributeTypeFilter)?.topLevelTag) {
      this.errorMessage = undefined;
      this.skillsService.getInstitutionsFromAttributeType(
          (this.requiredFields as RequiredFieldsAttributeTypeFilter)
            .topLevelTag
        )
          .subscribe({
            next: (data) => {
              this.institutions = data;
            },
            error: (error) => {
              this.errorMessage = {message: error};
            this.matSnackBar.open(`Something went wrong with retrieving institutions`, 'dismiss', { duration: this.snackBarDuration });
            },
          });
    }else{
        //neither a attribute or attributeType
      }
  }

  retrieveFilterOperators(): void{
    this.skillsSearchUtils.retrieveSkillsSearchFilters().then((data) =>{
      this.filerOperators = data;
    });
  }

  getRatingLabelsForField(fieldName: string) {
    const lowerCaseFieldName = fieldName.toLowerCase();
    const matchingFieldKey = Object.keys(this.ratingData).find(
      key => key.toLowerCase() === lowerCaseFieldName
    );
    return matchingFieldKey ? Object.keys(this.ratingData[matchingFieldKey]) : [];
  }

  async retrieveRatingData(){
    this.ratingData= await this.skillsService.getRatingData();
  }

  async getFieldTypes(){
    this.jsType = await (this.skillsService.getJSTypes())
    this.jsTypeScale = await (this.skillsService.getJSTypeScale())
    this.skillsFields = await (this.skillsService.getSkillsFields())
    this.retrieveRatingData();
  }

  attributeTypeFilterChecked(event: MatCheckboxChange): void {
    this.isAttributeTypeFilter = event.checked;
    if (this.isAttributeTypeFilter) {
      this.isLoading = true;
      this.errorMessage = undefined;
      this.skillsService.getAttributeFieldBasedOffOfTopLevelTag(this.searchAttributeType.value)
        .subscribe({
          next: async (data) => {
            this.requiredFields = await data;
            this.fieldFormatters = this.fieldTypeConverter.createFieldsMap(this.requiredFields.fields, this.skillsFields, this.jsType, this.jsTypeScale);
            this.retrieveAllInfoRequiredForFields();
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = {message: error};
            this.matSnackBar.open(`Something went wrong while retrieving ${this.topLevelTags[this.searchAttributeType.value]} info`, 'dismiss',
              { duration: this.snackBarDuration }
            );
            this.isLoading = false;
          },
        });
    } else {
      this.requiredFields = undefined;
      this.fieldFormatters = undefined;
    }
  }

  onSearchOptionSelected(selectedAttribute: CanonicalNameDetails): void {
    this.isLoading = true;
    const standardizedName = selectedAttribute.standardizedName;
    this.errorMessage = undefined;
    this.skillsService.getAttributeData(standardizedName)
      .subscribe({next: async (data) => {
        this.requiredFields = data;
        this.fieldFormatters = this.fieldTypeConverter.createFieldsMap(this.requiredFields.fields, this.skillsFields, this.jsType, this.jsTypeScale);
        this.isLoading = false;
        this.retrieveAllInfoRequiredForFields();
      },
      error: (error) => {
        this.errorMessage = {message: error};
        this.matSnackBar.open(`Something went wrong while retrieving ${standardizedName} info`, 'dismiss', { duration: this.snackBarDuration });
        this.isLoading = false;
    }});
  }

  resetSearchVariables(): void {
    this.searchAttributeType.reset = undefined;
    this.fieldFormatters = undefined;
    this.requiredFields = undefined;
    this.isAttributeTypeFilter = false;
  }

  searchForPeople(): void {
    if (this.shouldFilter()) {
      this.isSearching = true;
      this.userSearchResults = undefined;
      this.peopleListUpdated.emit(this.userSearchResults);
      this.errorMessage = undefined;
      this.skillsService.getPeopleWithSpecificSkills(this.attributeFilerObject, this.selectedEntities, this.selectedOffices, this.filterByStaffOnSupply, { startIndex: 0, pageLength: this.pagination.pageLength}, true).subscribe({
        next: (data) => {
          this.userSearchResults = {...data};
          this.peopleListUpdated.emit(this.userSearchResults);
          this.isSearching = false;
        },
        error: (error) => {
          this.errorMessage = {message: error};
          this.isSearching = false;
          this.userSearchResults = undefined;
          this.peopleListUpdated.emit(this.userSearchResults);
        },
      });
    } else {
      // Don't attempt to search without any filters
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pagination'] && this.pagination && this.shouldFilter()) {
      const totalCount = this.userSearchResults.totalCount;
      this.isSearching = true;
      this.userSearchResults = undefined;
      this.peopleListUpdated.emit(this.userSearchResults);
      this.errorMessage = undefined;
      this.skillsService.getPeopleWithSpecificSkills(this.attributeFilerObject, this.selectedEntities, this.selectedOffices, this.filterByStaffOnSupply, this.pagination, false).subscribe({
        next: (data) => {
          this.userSearchResults = {...data, totalCount: totalCount};
          this.peopleListUpdated.emit(this.userSearchResults);
          this.isSearching = false;
        },
        error: (error) => {
          this.errorMessage = { message: error };
          this.isSearching = false;
          this.userSearchResults = undefined;
          this.peopleListUpdated.emit(this.userSearchResults);
        },
      });
    } else {
      // Pagination has not changed dont refetch data
    }

  }

  retrieveAllPeopleWithSpecificSkills(): Observable<UserResults[]>{
    const pageLength = 50;
    const numberOfPages = Math.ceil(this.userSearchResults.totalCount/pageLength);
    return from([...Array(numberOfPages).keys()]).pipe(
      mergeMap(pageIndex =>
        this.skillsService.getPeopleWithSpecificSkills(
          this.attributeFilerObject,
          this.selectedEntities,
          this.selectedOffices,
          this.filterByStaffOnSupply,
          { startIndex: pageIndex, pageLength },
          false
        ).pipe(
          map(data => Object.values(data.userResults))
        )
      ),
      reduce((accumulator, currentValue) => accumulator.concat(currentValue), [])
    );
    
  }
  resetAttributeSearchObject(): void {
    this.fieldFormatters = undefined;
    this.requiredFields = undefined;
    this.attributeFilerObject = {
      filters: {
        attributeFilters: [],
        attributeTypeFilters: [],
      },
    };

    this.attributeFilters = {
      attribute: undefined,
      fieldFilters: [],
    };

    this.attributeTypeFilters = {
      attributeType: undefined,
      fieldFilters: [],
    };
    this.peopleListUpdated.emit(undefined);
    this.selectedSavedSearch.setValue('');
  }

  cancelAttributeSearchForm(): void {
    this.isAttributeTypeFilter = false;
    this.fieldFormatters = undefined;
    this.requiredFields = undefined;
    if (this.attributeFilters) {
      this.removeAttributeFromAttributeList(this.attributeFilters);
    } else if (this.attributeTypeFilters) {
      this.removeAttributeFromAttributeList(this.attributeTypeFilters);
    }
    this.attributeTypeFilters.attributeType = undefined;
    this.attributeTypeFilters.fieldFilters = [];
    this.attributeFilters.attribute = undefined;
    this.attributeFilters.fieldFilters = [];
    this.errorMessage = undefined;
  }

  removeAttributeFromAttributeList(attribute: AttributeTypeFilter | AttributeFilter): void {
    const isAttribute = this.checkTheTypeOfTheAttribute(attribute);
    if (isAttribute) {
      this.attributeFilerObject.filters.attributeFilters =
        this.attributeFilerObject.filters.attributeFilters.filter(
          (filter: AttributeFilter) => filter.attribute !== attribute.attribute
        );
    } else if (!isAttribute) {
      this.attributeFilerObject.filters.attributeTypeFilters =
        this.attributeFilerObject.filters.attributeTypeFilters.filter(
          (filter: AttributeTypeFilter) => filter.attributeType !== attribute.attributeType
        );
    }else{
      //its neither attribute or attributeType
    }
  }

  itemAlreadyAddedToSearch(attributeOrTopLevelTag: string) {
    const attribute = this.attributeFilerObject.filters.attributeFilters.find(
      (filter) => filter.attribute === attributeOrTopLevelTag
    );
    const topLevelTag =
      this.attributeFilerObject.filters.attributeTypeFilters.find(
        (filter) => filter.attributeType === attributeOrTopLevelTag
      );

    return attribute || topLevelTag;
  }

  setFiltersForSearchForEveryoneWithAttributeType() {
    if (this.isAttributeTypeFilter) {
      this.attributeFilerObject.filters.attributeTypeFilters.push({
        attributeType: (
          this.requiredFields as RequiredFieldsAttributeTypeFilter
        ).topLevelTag,
        fieldFilters: [],
      });
    } else {
      //searching for people with some attribute type but with specific parameters
    }
  }

  setFiltersForSearchForEveryOneWithAttribute(attribute: string) {
    const attributeIfAlreadyAddedToSearch =
      this.itemAlreadyAddedToSearch(attribute);
    if (attributeIfAlreadyAddedToSearch) {
      attributeIfAlreadyAddedToSearch.fieldFilters = [];
    } else {
      this.attributeFilerObject.filters.attributeFilters.push({
        attribute: attribute,
        fieldFilters: [],
      });
      this.attributeFilterObjectUpdate.emit(this.attributeFilerObject);
    }
  }

  setSearchForEveryOneFilters(targetAttribute: string): void {
    if (targetAttribute) {
      this.setFiltersForSearchForEveryOneWithAttribute(targetAttribute);
    } else {
      this.setFiltersForSearchForEveryoneWithAttributeType();
    }
  }

  onGetEveryoneCheckboxChange(event: MatCheckboxChange, attribute): void {
    if (event.checked) {
      this.setSearchForEveryOneFilters(attribute);
    } else {
      this.removeAttributeFromAttributeList(attribute);
    }
  }

  addAttributeToSearch(): void {
    if (this.attributeFilters.fieldFilters.length > 0) {
      const existingIndex = this.attributeFilerObject.filters.attributeFilters.findIndex(
        (filter: AttributeFilter) =>
          filter.attribute === this.attributeFilters.attribute
      );

      if (existingIndex >= 0) {
        this.attributeFilerObject.filters.attributeFilters = this.attributeFilerObject.filters.attributeFilters.map((filter, index) => 
          index === existingIndex ? { ...this.attributeFilters } : filter
        );
      } else {
        this.attributeFilerObject.filters.attributeFilters = [
          ...this.attributeFilerObject.filters.attributeFilters,
          { ...this.attributeFilters }
        ];
      }

      this.attributeFilters = {
        attribute: undefined,
        fieldFilters: [],
      };
    } else if (this.attributeTypeFilters.fieldFilters.length > 0) {
      const existingIndex = this.attributeFilerObject.filters.attributeTypeFilters.findIndex(
        (filter: AttributeTypeFilter) =>
          filter.attributeType === this.attributeTypeFilters.attributeType
      );

      if (existingIndex >= 0) {
        this.attributeFilerObject.filters.attributeTypeFilters = 
        this.attributeFilerObject.filters.attributeTypeFilters.map((filter, index) => 
          index === existingIndex ? { ...this.attributeTypeFilters } : filter
        );
      } else {
        this.attributeFilerObject.filters.attributeTypeFilters = [
          ...this.attributeFilerObject.filters.attributeTypeFilters,
          { ...this.attributeTypeFilters },
        ];
      }
      this.attributeTypeFilters = {
        attributeType: undefined,
        fieldFilters: [],
      };
    }else{
      if (this.isAttributeTypeFilter) {
        if (this.attributeTypeFilters.attributeType === undefined) {
          this.attributeTypeFilters.attributeType = (
            this.requiredFields as RequiredFieldsAttributeTypeFilter
          ).topLevelTag;
        }else{
          //
        }
      }else{
        if (this.attributeFilters.attribute === undefined) {
          this.attributeFilters.attribute = (
            this.requiredFields as RequiredFields
          ).attribute;
        }else{
          //
        }
      }
    }
    this.attributeFilterObjectUpdate.emit(this.attributeFilerObject);
    this.resetSearchVariables();
  }

  editAttributeFiltersInSearch(): void {
    this.addAttributeToSearch();
    this.editAttribute$.next(undefined);
    this.attributeFilterObjectUpdate.emit(this.attributeFilerObject);
  }

  onAttributeFieldChanged(field: FieldFilter): void {
    if (this.isAttributeTypeFilter) {
      if (this.attributeTypeFilters.attributeType === undefined) {
        this.attributeTypeFilters.attributeType = (
          this.requiredFields as RequiredFieldsAttributeTypeFilter
        ).topLevelTag;
        this.attributeTypeFilters.fieldFilters.push(field);
      } else {
        const index = this.attributeTypeFilters.fieldFilters.findIndex(
          (filter: FieldFilter) => filter.field === field.field
        );

        if(index >= 0){
          this.attributeTypeFilters.fieldFilters[index] = field;
        }else{
          this.attributeTypeFilters.fieldFilters.push(field);
        }
      }
    } else {
      if (this.attributeFilters.attribute === undefined) {
        this.attributeFilters.attribute = (this.requiredFields as RequiredFields).attribute;
        this.attributeFilters.fieldFilters.push(field);
      } else {
        const index = this.attributeFilters.fieldFilters.findIndex(
          (filter: FieldFilter) => filter.field === field.field
        );
        if(index >= 0){
          this.attributeFilters.fieldFilters[index] = field;
        }else{
          this.attributeFilters.fieldFilters.push(field);
        }
      }
    }
  }

  editAttributeFilter( attribute: AttributeFilter ): void {
    this.skillsService.getAttributeData(attribute.attribute)
    .subscribe((data) => {
      this.requiredFields = data;
      this.fieldFormatters = this.fieldTypeConverter.createFieldsMap(
        this.requiredFields.fields, 
        this.skillsFields, 
        this.jsType, 
        this.jsTypeScale
      );
      this.isLoading = false;
      this.retrieveAllInfoRequiredForFields();
      this.editAttribute$.next(attribute);
    });
  }

  cancelEditAttributeInSearch(): void {
    this.editAttribute$.next(undefined);
    this.resetSearchVariables();
  }

  checkTheTypeOfTheAttribute(obj: AttributeFilter | AttributeTypeFilter): obj is AttributeFilter {
    if('attribute' in obj && typeof obj.attribute === 'string'){
      return true;
    }else if('attributeType' in obj && typeof obj.attributeType === 'string'){
      return false;
    }else{
      return undefined;
    }
  }

  getCombinedFilters(): (AttributeFilter | AttributeTypeFilter)[] {
    const { attributeFilters, attributeTypeFilters } =
      this.attributeFilerObject.filters;
    return [...attributeFilters, ...attributeTypeFilters];
  }

  saveSearch() {
    if (this.searchNameControl.valid) {
      const searchName = this.searchNameControl.value;
      this.errorMessage = undefined;
      this.skillsService
        .saveSearch(searchName, this.attributeFilerObject)
        .pipe(debounceTime(500))
        .subscribe({
          next: (savedSearch) => {
            this.matSnackBar.open(`Search saved as "${searchName}"`, "dismiss", { duration: this.snackBarDuration });
            this.savedSearches.push(savedSearch.savedSearchName);
          },
          error: (error) => {
            this.errorMessage = { message: error };
            this.matSnackBar.open(`Unable to save search`, "dismiss", { duration: this.snackBarDuration });
          },
        });
    } else {
      // Don't attempt to save the search with an empty name
    }
  }

  retrieveSavedSearches() {
    this.skillsService.retrieveSavedSearches().subscribe((savedSearches) => {
      this.savedSearches = savedSearches;
    });
  }

  retrieveSavedSearchParameters(savedSearchName: string) {
    this.skillsService.retrieveSavedSearchParameters(savedSearchName).subscribe((parameters) => {
      this.attributeFilerObject.filters.attributeFilters = parameters.attributeFilters;
      this.attributeFilerObject.filters.attributeTypeFilters = parameters.attributeTypeFilters;
    });
  }

  toggleFilterForStaffOnSupply(event: MatCheckboxChange){
    if(event.checked){
      this.filterByStaffOnSupply = true;
    } else{
      this.filterByStaffOnSupply = false;
    }
  }

  generateSupportEmail(badRequestDetail: BadRequestDetail): string {
    const subject = encodeURIComponent('Error on Talent search');
    const body = encodeURIComponent(`Hi,\n\nI am getting this error on Talent search: "${badRequestDetail.message}".`);
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }
}
