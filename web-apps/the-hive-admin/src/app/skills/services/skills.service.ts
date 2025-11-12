/** @format */
import { Injectable, Injector } from "@angular/core";
import {
  Attribute,
  Institution,
  AttributeType,
  BioTemplate,
  CanonicalNames,
  EntityCount,
  JsType,
  JSTypeScale,
  RatificationSummary,
  SkillField,
  AttributeTotals,
  DecoratedStaff,
  UserAttribute,
  StandardizedName,
  CanonicalNameDetails,
  CanonicalNameUpdateCounts,
  AttributeForSearchTextException,
  AttributeWithInstitution,
  DuplicateEdge,
  CanonicalNameCategory,
  TopLevelTag,
  InstitutionType
} from "@the-hive/lib-skills-shared";
import { firstValueFrom, Observable, switchMap, shareReplay, map } from "rxjs";
import { BaseService } from "../../services/base.service";
import { CompanyEntity } from "../../services/company-entities.service";
import { SharedService } from "../../services/shared.service";
import {
  AttributeFields,
  FilterQuery,
  RatingData,
  RequiredFields,
  RequiredFieldsAttributeTypeFilter,
  UserSearchResults,
} from "./skills-search.types";
import { Office } from "../../services/offices-service";
import { Staff, StaffSpokenLanguage } from "@the-hive/lib-staff-shared";
import { Pagination, includeInObjectWhenSet } from "@the-hive/lib-shared";
@Injectable({
  providedIn: "root",
})
export class SkillsService extends BaseService {
  searchFilterOptions: FilterSearchOption[] = undefined;
  jsTypes: JsType[] = undefined;
  jsTypeScale$: Observable<JSTypeScale[]> = undefined;
  skillsFields: SkillField[] = undefined;
  skillFieldNames: AttributeFields = undefined;
  industryKnowledgeLevelOptions: string[] = undefined;
  skillLevelOptions: string[] = undefined;
  qualityLevels: string[];
  qualityYearsOfExperience: string[];
  canonicalNameCategories$: Observable<CanonicalNameCategory[]>;
  topLevelTags$: Observable<TopLevelTag[]>;
  searchExceptions$: Observable<AttributeForSearchTextException[]>;
  skillsFields$: Observable<SkillField[]>;

  constructor(private readonly sharedService: SharedService, inject: Injector) {
    super(inject);
    this.canonicalNameCategories$ = this.sharedService.get("skills/canonical-name-categories").pipe(
      shareReplay(1),
    )
    this.topLevelTags$ = this.sharedService.get("attribute-types").pipe(
      shareReplay(1),
    )
    this.searchExceptions$ = this.sharedService.get("search-exceptions").pipe(
      shareReplay(1),
    )
    this.skillsFields$ = this.sharedService.get("skills/skills-field").pipe(
      map((response) =>{
        this.skillFieldNames = this.mapSkillsFieldsToAttributeFields(response.fields);
        this.skillsFields = response.fields;
        return response.fields;
      }),
      shareReplay(1),
    )
  }

  mapSkillsFieldsToAttributeFields = (skillsFields: SkillField[]): AttributeFields => {
    return skillsFields.reduce((skillFieldNames: AttributeFields, skillField: SkillField) => {
      skillFieldNames[skillField.name] = { ...skillField };
      return skillFieldNames;
    }, {} as AttributeFields);
  }

  getAliases(canonicalNameId: number): Observable<Alias[]> {
    return this.sharedService.get(`skills/aliases/${canonicalNameId}`);
  }

  getCanonicalNames(): Observable<CanonicalName[]> {
    return this.sharedService.get("skills/canonical-names");
  }

  mapStandardizedNameToCanonicalName = (standardizedName: StandardizedName) => firstValueFrom<CanonicalNameDetails>(this.sharedService.get(`skills/canonical-names/${standardizedName}`));

  mapStaffIdToDisplayName = (staffId: number) => firstValueFrom<string>(this.sharedService.get(`staff/${staffId}/displayName`))
                                                                                            .catch((message) => {return {message};});
  
  addCanonicalName(canonicalName: string, canonicalNameCategoryId: number): Observable<CanonicalName> {
    return this.sharedService.post("skills/canonical-names", { canonicalName, canonicalNameCategoryId });
  }

  addAlias(canonicalNameId: number, alias: string): Observable<Alias> {
    return this.sharedService.post("skills/aliases", {
      canonicalNameId: canonicalNameId,
      alias: alias,
    });
  }

  deleteAlias(aliasId: number) {
    return this.sharedService.delete(`skills/aliases/${aliasId}`);
  }

  getCanonicalNamesAndAliases(
    searchText: string,
    category: string,
    pageSize: number,
    currentPage: number,
    findNotInGraphDB: boolean,
  ): Observable<CanonicalNameAndAliasesData> {
    let queryString = `skills/canonical-names-and-aliases/?searchText=${searchText}&pageSize=${pageSize}&currentPage=${currentPage}`;
    if (category) {
      queryString += `&category=${category}`;
    } else {
      // Do not append query parameter
    }
    if (findNotInGraphDB) {
      queryString += `&findNotInGraphDB=true`;
    } else {
      // Do not append query parameter
    }

    return this.sharedService.get(queryString);
  }

  async getSearchFilterOptions(): Promise<FilterSearchOption[]> {
    if (this.searchFilterOptions === undefined) {
      const response = await firstValueFrom(this.sharedService.get("skills/skill-search-filter-options"));
      this.searchFilterOptions = response;
    }
    return this.searchFilterOptions;
  }

  async retrieveTopLevelTags(): Promise<TopLevelTag[]> {
    return await firstValueFrom(this.topLevelTags$);
  }

  getAttributeFieldBasedOffOfTopLevelTag(
    topLevelTag: string,
  ): Observable<RequiredFields | RequiredFieldsAttributeTypeFilter> {
    topLevelTag = encodeURIComponent(topLevelTag);
    return this.sharedService.get(`/skills/fields/${topLevelTag}`);
  }

  getAttributeData(standardizedName: string): Observable<RequiredFields | RequiredFieldsAttributeTypeFilter> {
    standardizedName = encodeURIComponent(standardizedName);
    return this.sharedService.get(`skills/attributes/${standardizedName}`);
  }

  getAttributeSearchResults(searchText: string,attributeType? : string): Observable<CanonicalNameDetails[]> {
    searchText = encodeURIComponent(searchText);
   const attributeFilter = attributeType? `&attributeTypes=${attributeType}` : ''
    return this.sharedService.get(`skills?searchText=${searchText}${attributeFilter}`);
  }

  getAttributeSummary(standardizedName: string, selectedOffices: Office[]): Observable<Attribute & EntityCount> {
    const params = new URLSearchParams();
    const officeFilters = (selectedOffices.map(office => office.officeId)).join(",");
    params.append('officeIds', officeFilters);
    return this.sharedService.get(`skills/attribute-summary/${standardizedName}?${params.toString()}`);
}

  async getRatingData(): Promise<RatingData> {
    const response = await firstValueFrom(this.sharedService.get("experience-levels-and-descriptions"));
    return response;
  }

  getInstitutionsForSpecificAttribute(attribute: string): Observable<string[]> {
    attribute = encodeURIComponent(attribute);
    return this.sharedService.get(`skills/institutions/${attribute}`);
  }

  getInstitutionsFromAttributeType(attributeType: string): Observable<string[]> {
    return this.sharedService.get(`/skills/institutions-for-attributes/${attributeType}`);
  }

  retrieveSearchTextExceptions():Observable<AttributeForSearchTextException[]>{
    return this.searchExceptions$;
  }

  async getSkillsFields(): Promise<SkillField[]> {
    if (this.skillsFields === undefined) {
      this.skillsFields = await firstValueFrom(this.skillsFields$);
    }
    return this.skillsFields;
  }

  async getJSTypes(): Promise<JsType[]> {
    if (this.jsTypes === undefined) {
      const response = await firstValueFrom(this.sharedService.get(`skills/js-type`));
      this.jsTypes = response.types;
    }
    return this.jsTypes;
  }

  async getJSTypeScale(): Promise<JSTypeScale[]> {
    if (this.jsTypeScale$ === undefined) {
      this.jsTypeScale$ = this.sharedService.get(`skills/js-type-scale`).pipe(
        map((response) => response.fields),
        shareReplay(1)
      );
    } else{
      // jsTypeScale$ is already initialized so we do not need to make an api call to set it again
    }
    return firstValueFrom(this.jsTypeScale$);
  }

  getPeopleWithSpecificSkills(attributeFilters: FilterQuery,companyEntityFilters : CompanyEntity[],offices : Office[], filterByStaffOnSupply: boolean, pagination: Pagination, includeCount: boolean): Observable<UserSearchResults> {
    const entityFilters = companyEntityFilters.map(entity=>entity.companyEntityId)
    const officeFilters = (offices.map(office=>office.officeId)).join(",");
    const response = this.sharedService.put("/skills/users", {...attributeFilters,entityFilters : entityFilters.join(","), officeFilters, filterByStaffOnSupply, pagination, includeCount}).pipe(map((response) => ({
      ...response,
      pagination
    })))
    return response;
  }

  saveSearch(saveName: string, attributeFilters: FilterQuery): Observable<{ savedSearchName: string }> {
    return this.sharedService.put("/skills/saved-search", {...attributeFilters, saveName });
  }

  retrieveSavedSearches(): Observable<string[]> {
    return this.sharedService.get("skills/saved-search");
  }

  retrieveSavedSearchParameters(savedSearchName:string) : Observable<FilterQuery["filters"]> {
    return this.sharedService.get(`skills/saved-search/${savedSearchName}`);
  }

  getCanonicalNameCategories(): Observable<CanonicalNameCategory[]> {
    return this.canonicalNameCategories$;
  }

  getInstitutions(isNew?: boolean): Observable<InstitutionForRatification[]> {
    const institutionsEndpoint = `skills/institutions${isNew ? "/?new=true" : ""}`;
    return this.sharedService.get(institutionsEndpoint);
  }

  getQualifications(isNew?: boolean): Observable<Qualification[]> {
    const qualificationsEndpoint = `skills/qualifications${isNew ? "/?new=true" : ""}`;
    return this.sharedService.get(qualificationsEndpoint);
  }

  getCertifications(isNew?: boolean): Observable<Certification[]> {
    const certificationsEndpoint = `skills/certifications${isNew ? "/?new=true" : ""}`;
    return this.sharedService.get(certificationsEndpoint);
  }

  getSkills(isNew?: boolean): Observable<Skill[]> {
    const skillsEndpoint = `skills/skill-attributes${isNew ? "/?new=true" : ""}`;
    return this.sharedService.get(skillsEndpoint);
  }

  getIndustryKnowledge(isNew?: boolean): Observable<IndustryKnowledge[]> {
    const industryKnowledgeEndpoint = `skills/industry-knowledge${isNew ? "/?new=true" : ""}`;
    return this.sharedService.get(industryKnowledgeEndpoint);
  }

  approveNewUserAttribute(attribute: Skill | Quality | IndustryKnowledge) {
    const canonicalName = attribute.canonicalName;
    return this.sharedService.patch(`skills/new/${attribute.attributeId}`, { canonicalName });
  }

  rejectNewUserAttribute(standardizedName: StandardizedName): Observable<Attribute> {
    return this.sharedService.delete(`skills/${standardizedName}`);
  }

  rejectNewInstitution(standardizedName: StandardizedName): Observable<Institution> {
    return this.sharedService.delete(`skills/institutions/${standardizedName}`);
  }

  approveNewInstitution(institution: InstitutionForRatification, institutionType: InstitutionType, updatedName?: string) {
    let approveInstitutionBody = {};
    if (updatedName) {
      approveInstitutionBody = { institution, institutionType, updatedName };
    } else {
      approveInstitutionBody = { institution, institutionType };
    }

    return this.sharedService.patch("skills/institutions", approveInstitutionBody);
  }

  ratifyNewQualification(qualification: Qualification) {
    return this.sharedService.patch(`skills/qualifications/${qualification.qualificationId}`, { qualification });
  }

  rejectNewQualification(qualificationId: number) {
    return this.sharedService.delete(`skills/qualifications/${qualificationId}`);
  }

  ratifyNewCertification(certification: Certification) {
    return this.sharedService.patch(`skills/certifications/${certification.certificationId}`, { certification });
  }

  rejectNewCertification(certificationId: number) {
    return this.sharedService.delete(`skills/certifications/${certificationId}`);
  }

  getQualities(isNew?: boolean): Observable<Quality[]> {
    const qualitiesEndpoint = `skills/qualities${isNew ? "/?new=true" : ""}`;
    return this.sharedService.get(qualitiesEndpoint);
  }

  getUsersWithQualificationForInstitution(qualificationId: number, institution: string) {
    return this.sharedService.get(`skills/user-qualifications/${qualificationId}/?institution=${institution}`);
  }

  getUsersForAttribute(standardizedName: StandardizedName): Observable<(Pick<Staff, 'upn' | 'displayName'> & UserAttribute)[]> {
    return this.sharedService.get(`skills/users/${standardizedName}`);
  }

  getCertificationConnectedUsersForInstitution(certificationId: number, institution: string) {
    return this.sharedService.get(`skills/user-certifications/${certificationId}/?institution=${institution}`);
  }

  getProofBlob(filepath: string): Observable<Blob> {
    return this.sharedService.getBlob(`skills/proof/${filepath}`);
  }

  ratifyQualificationConnectionToInstitution(qualificationId: number, institutionId: number) {
    return this.sharedService.patch(`skills/needs-ratification/qualifications/${qualificationId}`, { institutionId });
  }

  ratifyCertificationConnectionToInstitution(certificationId: number, institutionId: number) {
    return this.sharedService.patch(`skills/needs-ratification/certifications/${certificationId}`, { institutionId });
  }

  getPersonSearchResults(upn: string): Observable<UserAttribute[]> {
    return this.sharedService.get(`/user-skills?upn=${upn}`);
  }

  editCanonicalName(canonicalNameId: number, canonicalNameCategory: string, updatedCanonicalName: string) {
    return this.sharedService.patch(`/skills/canonical-name/${canonicalNameId}`, {
      updatedCanonicalName,
      canonicalNameCategory,
    });
  }

  getStaffWhoHaveUsedSkillsSummary(
    selectedEntities: CompanyEntity[],
    searchDate?: Date,
    staffNameSearchText?: string,
    attributeType?:AttributeType
  ): Observable<{ usersWithSkillsProfiles: number; totalStaff: number }> {
    const companyEntityIds = selectedEntities?.map((entity) => entity.companyEntityId).join(",") || "";
    const queryParameters = {
      companyEntityIds,
      ...(searchDate && { searchDate: searchDate?.toISOString() }),
      ...(staffNameSearchText && { staffNameSearchText }),
      ...(attributeType && { attributeType }),
    };
    const searchParams = new URLSearchParams(queryParameters);    return this.sharedService.get(
      `skills/user-summary/?${searchParams.toString()}`,
    );
  }

  getUnratifiedAttributesSummary(): Observable<RatificationSummary[]> {
    return this.sharedService.get("skills/ratification-summary");
  }

  retrieveStaffSummaryAttributeTypes(): Observable<StaffSummaryPanel[]> {
    return this.sharedService.get("attribute-types?includeStaffSummaryAttributeTypes=true");
  }

  retrieveSummaryOfAttributesAdded(selectedEntities: CompanyEntity[]): Observable<AttributeTotals> {
    const companyEntityIds = selectedEntities?.map((entity) => entity.companyEntityId).join(",");
    const searchParams = new URLSearchParams();
    if (companyEntityIds) {
      searchParams.set("companyEntityIds", companyEntityIds);
    } else {
      // No companyEntityIds to add
    }
    const url = searchParams.toString()
      ? `skills/skill-summary?${searchParams.toString()}`
      : `skills/skill-summary`;
    return this.sharedService.get(url);
  }

  getCSVOfSkillsUsers(hasUsedSkills: boolean, companyEntityIds: string, staffNameSearchText: string, searchDate: Date, attributeType?: AttributeType) {
    const queryParameters = new URLSearchParams({
      hasUsedSkills: hasUsedSkills.toString(),
      ...(companyEntityIds && { companyEntityIds }),
      ...(staffNameSearchText && { staffNameSearchText }),
      ...(searchDate && { searchDate: searchDate.toISOString() }),
      ...(attributeType && { attributeType }),
    })
    return this.sharedService.getBlob(`/csv-of-skills-users?${queryParameters.toString()}`);
  }

  updateCanonicalName(canonicalNames: CanonicalNames) {
    return this.sharedService.patch(`skills/canonical-names`, canonicalNames);
  }

 retrieveCanonicalNames(): Observable<CanonicalName[]> {
    return this.sharedService.get(
      `skills/canonical-names?categories=skill,qualification,industry-knowledge,qualification,certification`,
    );
  }

  getUserAttributes(upn: string, attributeType?: AttributeType): Observable<UserAttribute[]>{
    const params = new URLSearchParams({
      upn: upn,
      ...(includeInObjectWhenSet('attributeType', attributeType))
    });
    return this.sharedService.get(`user-skills?${params.toString()}`);
  }

  addCoreTech(upn: string, userAttribute: UserAttribute): Observable<UserAttribute>{
    return this.sharedService.patch(`/skills/user-skills/${upn}`, userAttribute);
  }

  removeCoreTech(upn: string, coreTech: UserAttribute): Observable<UserAttribute>{
    return this.sharedService.patch(`/user-skills/${upn}/core-tech`, coreTech);
  }

  retrieveStaffCoreTech(upn: string): Observable<UserAttribute[]>{
    return this.sharedService.get(`/user-skills/${upn}/core-tech`);
  }

  retrieveInstitutions(searchText: string, excludeOffers = false): Observable<Institution[]> {
    return this.sharedService.get(`/institutions?searchText=${encodeURIComponent(searchText)}&excludeOffers=${excludeOffers}`);
  }

  standardizeFields(): Observable<{ standardized: string[]; failedToStandardize: string[] }> {
    return this.sharedService.patch(`required-fields`, {});
  }

  retrieveAttribute(standardizedName:StandardizedName): Observable<Attribute>{
    return this.sharedService.get(`skills/attribute/${standardizedName}`);
  }

  mergeAttributes(standardizedNameForAttributeToMerge: StandardizedName, canonicalNameForAttributeToMergeInto: string): Observable<Attribute> {
    return this.retrieveAttribute(standardizedNameForAttributeToMerge).pipe(
      switchMap((attribute) =>
        this.updateAttribute({
          ...attribute,
          canonicalName: canonicalNameForAttributeToMergeInto
        })
      )
    );
  }

  mergeInstitutions(standardizedName: StandardizedName, canonicalName: string): Observable<Institution> {
    return this.sharedService.patch(`/institutions/${standardizedName}`, {
      needsRatification: true,
      canonicalName
    });
  }

  updateAttribute(attributeWithInstitution:Attribute | AttributeWithInstitution):Observable<Attribute>{
    return this.sharedService.patch(`skills/attribute/${attributeWithInstitution.standardizedName}`, attributeWithInstitution);
  }

 ratifyAttribute(
  standardizedName: StandardizedName,
  canonicalName: string,
  availableAt?: Pick<Institution,"canonicalNameGuid"|"canonicalName"|"needsRatification"|"standardizedName">[]
): Observable<Attribute> {
  return this.retrieveAttribute(standardizedName).pipe(
    switchMap((attribute) =>
      this.updateAttribute({
        ...attribute,
        needsRatification: false,
        canonicalName,
        ...(availableAt && { availableAt })
      })
    )
  );
}


  removeDuplicateEdges(): Observable<{edgesRemoved:DuplicateEdge[], failedEdgeRemovals:DuplicateEdge[]}> {
    return this.sharedService.delete(`skills`);
  }

  getStaffDetailsForSkills(
    haveUsedSkills: boolean,
    selectedEntities: CompanyEntity[],
    pageLength: number,
    startIndex: number,
    searchDate?: Date,
    staffNameSearchText?: string,
    sortedColumn?:(keyof DecoratedStaff),
    sortOrder?:string,
    attributeType?:AttributeType,
  ): Observable<DecoratedStaff[]> {

    const companyEntityIds = selectedEntities?.map((entity) => entity.companyEntityId).join(",") || "";

    const queryParameters = {
      pageLength: pageLength.toString(),
      startIndex: startIndex.toString(),
      hasSkills: haveUsedSkills.toString(),
      companyEntityIds,
      ...(searchDate && { searchDate: searchDate?.toISOString() }),
      ...(staffNameSearchText && { staffNameSearchText }),
      ...(sortedColumn && { sortedColumn }),
      ...(sortOrder && { sortOrder }),
      ...(attributeType && { attributeType }),
    };
    const searchParams = new URLSearchParams(queryParameters);

    return this.sharedService.get(`skills/staff-summary/?${searchParams.toString()}`);
  }

  generateStaffBio(upn: string, bioTemplateId: number, skillsProfileId?: number): Observable<Blob>{
    const profileParam = skillsProfileId ? `&skillsProfileId=${skillsProfileId}` : '';
    return this.sharedService.getBlob(`skills/staff-bio?upn=${upn}&bioTemplateId=${bioTemplateId}${profileParam}`);
  }

  getBioTemplates(): Observable<BioTemplate[]> {
    return this.sharedService.get("skills/bio-template");
  }

  updateCanonicalNameGuidAndStandardizedNames() : Observable<CanonicalNameUpdateCounts> {
    return this.sharedService.put("skills/canonical-names",{});
  }

  updateInstitution(
  standardizedName: StandardizedName, 
  needsRatification: boolean,  
  updatedInstitutionType: InstitutionType, 
  updatedCanonicalName?: string
): Observable<Institution> {
  return this.sharedService.patch(`/institutions/${standardizedName}`, {
    needsRatification,
    institutionType: updatedInstitutionType,
    ...(updatedCanonicalName && { canonicalName: updatedCanonicalName })
  });
}
  removeOfferedAttributeFromInstitution(
    attributeStandardizedName: StandardizedName,
    institutionStandardizedName: StandardizedName
  ): Observable<void> {
    return this.sharedService.delete(`/skills/unratified/available-at/${institutionStandardizedName}/${attributeStandardizedName}`);
  }

  retrieveSpokenLanguages(): Observable<string[]> {
    return this.sharedService.get('staff/spoken-languages');
  }

  retrieveProficiencies(): Observable<string[]> {
    return this.sharedService.get('staff/spoken-language-proficiencies');
  }

  retrieveStaffSpokenLanguages(upn: string): Observable<StaffSpokenLanguage[]> {
    return this.sharedService.get(`staff/${upn}/spoken-languages`);
  }

  updateStaffSpokenLanguages(upn: string, languages: StaffSpokenLanguage[]): Observable<void> {
    return this.sharedService.patch(`staff/${upn}/spoken-languages`, { languages });
  }
}

export interface Alias {
  aliasesId: number;
  alias: string;
}

export interface FilterSearchOption {
  description: string;
  javaScriptType: string;
  skillSearchComparison: string;
  displayComparison: string;
}

export interface CanonicalName {
  canonicalNamesId: number;
  canonicalName: string;
  standardizedName: string;
  canonicalNameCategoryId: number;
  canonicalNameCategory: string;
}
export interface Qualification {
  canonicalName: string;
  standardizedName: StandardizedName;
  qualificationId: number;
  institutions: InstitutionForRatification[];
  needsRatification: boolean;
}

export const RATIFICATION_ACTION = {
  merge: "Merge",
  changeCanonicalName: "ChangeCanonicalName",
  reject: "Reject",
  accept: "Accept"
} as const;

export type RatificationAction = typeof RATIFICATION_ACTION[keyof typeof RATIFICATION_ACTION];

export const CANCELLED_RATIFICATION_ACTION = "Cancelled";
export type CancelledRatificationAction = typeof CANCELLED_RATIFICATION_ACTION;

export interface Skill {
  canonicalName: string;
  standardizedName: StandardizedName;
  attributeId: number;
}

export interface Certification {
  canonicalName: string;
  standardizedName: StandardizedName;
  certificationId: number;
  expires: boolean;
  institutions: InstitutionForRatification[];
  needsRatification: boolean;
}

export interface IndustryKnowledge {
  canonicalName: string;
  attributeId: number;
  standardizedName: StandardizedName;
}

export interface InstitutionForRatification {
  standardizedName: StandardizedName;
  canonicalName: string;
  institutionId: number;
  needsRatification: boolean;
  qualifications: Qualification[];
  certifications: Certification[];
}

export interface Quality {
  canonicalName: string;
  attributeId: number;
  standardizedName: StandardizedName;
}

export interface Vertex {
  name: string;
  vertexId: number;
  label: string;
}

export interface CanonicalNameAndAliasesData {
  total: number;
  canonicalNamesAndAliases: CanonicalNameAndAlias[];
}

export interface CanonicalNameAndAlias {
  standardizedName: string;
  canonicalNamesId: number;
  canonicalNameCategory: string;
  canonicalName: string;
  aliasesId: number;
  alias: string;
  inGraphDB: boolean;
}

export interface CanonicalNameWithAliases {
  canonicalNamesId: number;
  canonicalNameCategory: string;
  canonicalName: string;
  aliases: Alias[];
  inGraphDB: boolean;
}

export interface UsersWithSkills {
  staffId: number;
  email: string;
  proof: string;
}

export type EdgeLabel = "is-a" | "is-related-to" | "need";

export type StaffSummaryPanel = {
  attributeTypeCanonicalName: string;
  attributeType: AttributeType;
};

