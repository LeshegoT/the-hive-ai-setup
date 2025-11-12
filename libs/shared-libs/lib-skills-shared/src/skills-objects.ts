import { StaffSpokenLanguage } from "@the-hive/lib-staff-shared";

export type StandardizedName = string;

export type Guid = string;

export interface Alias {
  aliasId?: number;
  alias: string;
}

export type AttributeStandardizedNameWithUnratifiedOffers = {
  attributeStandardizedName: StandardizedName;
  institutionStandardizedNames: StandardizedName[]
}

export interface BadRequestDetail {
  message: string;
  detail?: string;
}

export type BadRequestItem = string | BadRequestDetail;

export interface BadRequestResponse {
  errors: BadRequestItem[];
}

export interface SkillsEntity {
  standardizedName: StandardizedName;
  canonicalName: string;
  canonicalNameId: number;
  canonicalNameGuid: Guid;
  canonicalNameCategory?: string;
  canonicalNameCategoryId?: number;
}

export type TopLevelTag = CanonicalNameDetails & { attributeTypeOrder?: number };

export type SkillsEntityWithAlias = SkillsEntity & {
  aliases: Alias[];
  needsRatification: boolean;
}

export const allInstitutionTypes = ['University', 'Tertiary Education', 'Secondary Education', 'Proctored', 'NonProctored', 'Attendance'] as const;
export type InstitutionType = (typeof allInstitutionTypes)[number];

export function isNotInstitutionType(typeToCheck: string): typeToCheck is InstitutionType {
  return !allInstitutionTypes.includes(typeToCheck as InstitutionType)
}

export type RequiredField = SkillsEntity & {
  skillsFieldId: number;
}

export type Tag = SkillsEntityWithAlias & {
  isTopLevel: boolean;
  relatedTagNames?: StandardizedName[];
  relatedTags?: Tag[];
}

export type skillPathEdgeLabels = "is-a" | "is-related-to";

export const allAttributeTypes = [
  "skill",
  "qualification",
  "industry-knowledge",
  "certification",
  "quality",
] as const;

export type AttributeType = (typeof allAttributeTypes)[number];

export function isAttributeType(value: string): value is AttributeType {
  return allAttributeTypes.includes(value as AttributeType);
}

export type VertexLabel = 
  | "person" 
  | "tag" 
  | "attribute" 
  | "field" 
  | "topLevelTag" 
  | "metaDataTag" 
  | "new";
  
export type AttributeWithInstitution = Attribute & {
  availableAt: Pick<Institution,"canonicalName"|"standardizedName"|"needsRatification"|"canonicalNameGuid">[];
}

export type AttributeCanonicalNameDetailsWithInstitution = {
  canonicalNameDetails:( BadRequestDetail | AttributeCanonicalNameDetailsWithInstitutionItem )[];
  ratificationCount:number;
}

export type AttributeCanonicalNameDetailsWithInstitutionItem = CanonicalNameDetails & {
  availableAt: (Pick<Institution,"canonicalName"|"standardizedName"|"needsRatification"|"canonicalNameGuid"> | BadRequestDetail)[];
}


export type RatificationSummary = {
  standardizedName: StandardizedName;
  count: number;
}

export type FieldValue = {
  standardizedName: StandardizedName;
  value: object;
}

export interface UserAttribute {
  staffId: number;
  attribute: Attribute;
  fieldValues: FieldValue[];
  guid: Guid;
}

export type StaffBioAttributes = {
  Skill: UserAttribute[];
  Qualification: UserAttribute[];
  Certification: UserAttribute[];
}

export type Institution = SkillsEntityWithAlias & {
  institutionType: InstitutionType;
  offers: Attribute[];
}

export type Attribute = SkillsEntityWithAlias & {
  attributeType: AttributeType;
  requiredFields: RequiredField[];
  skillPath: Tag[];
  metaDataTags? : MetaDataTags[]
}
export type MetaDataTags = "Repeatable" | "Provable"

export type AttributeSearchResult = SkillsEntity & {
  attributeType : string;
  skillPath : Partial<Tag>[];
}

export interface Staff {
  staffId: number;
  upn: string;
  displayName: string;
}

export interface DecoratedStaff extends Staff {
  bbdUserName: string;
  jobTitle: string;
  department: string;
  entityDescription: string;
  entityAbbreviation: string;
  manager: string;
  lastModified? :Date,
  lastVisited? :Date
  nationality?: string;
  residence?: string;
  dateOfBirth?: Date;
}

export interface EntityCount {
  BBD: number,
  BBn: number,
  BBu: number,
  GNC: number,
  BBi: number,
  ILI: number,
  IND: number,
  BBs: number
}

export interface StaffOnSupply extends DecoratedStaff {
  role: string;
  onSupplyAsOf: Date;
  staffCoreTech: UserAttribute[];
}

export type SkillsRestrictedWordDetails =  {
  skillsRestrictedWordsId: number;
  restrictedWord: string;
}

export type SkillsLastUsedDetails = {
  staffId:number,
  lastModified :Date,
  lastVisited :Date
}

export type SkillsFieldJSTypes = {
  fieldName: string,
  javaScriptType: string,
  jsTypeId : number,
  description: string,
  parseFunction: string
}

export type SkillsFieldJSTypesRecord = {
  FieldName: string,
  JavaScriptType: string
}

export type NewAttribute = {
  attributeType: AttributeType;
  canonicalName: string;
  requiredFields: StandardizedName[];
}

export type SkillField = {
  skillsFieldId : number;
  name : string;
  label : string;
  jsTypeId : number;
  displayOrder:number;
  portfolioFormDisplayOrder:number;
  displayOnPortfolioScreen:boolean;
}

export interface JSTypeScale {
  jsTypeId: number,
  rating: number,
  label: string
}

export interface JsType {
  jsTypeId: number,
  description: string,
  javaScriptType: string,
  displayFormatFunction: string,
  gremlinStringFormatFunction: string,
  parseFunction: string
}

export interface CanonicalNames {
  canonicalName: string;
  canonicalNameId: number;
  canonicalNameCategoryId: number;
  standardizedName: string;
  canonicalNameCategory?: string;
}

export interface BioTemplate {
  bioTemplateId: number;
  bioTemplateName: string;
  bioTemplateFilename: string;
}

export interface AttributeTotals {
  skill: number;
  qualification: number;
  certification: number;
  quality: number;
  industryKnowledge: number;
}

export interface CanonicalNameDetails {
  canonicalName: string;
  canonicalNameId: number;
  canonicalNameCategoryId: number;
  standardizedName: string;
  canonicalNameCategory?: string;
  canonicalNameGuid?: Guid;
}

export interface SearchTextException {
  searchTextExceptionId: number;
  searchTextException: string;
  standardizedName: StandardizedName;
}

export type StandardizedNameAndCanonicalNameGuid = {
  standardizedName: StandardizedName;
  canonicalNameGuid: Guid;
}

export interface CanonicalNameUpdateCounts{
  updatedCanonicalNameGuids?: StandardizedNameAndCanonicalNameGuid[];
  failedUpdatedCanonicalNameGuids?: StandardizedNameAndCanonicalNameGuid[];
}

export type AttributeForSearchTextException = SearchTextException & {
  attribute: Attribute;
}

export type DuplicateEdge = {
  inV:StandardizedName,
  outV:StandardizedName,
  edges:Guid[]
}

export type OnSupplyRole =  {
  onSupplyRoleId: number;
  role: string;
}

export type CanonicalNameCategory = {
  canonicalNameCategoryId: number;
  standardizedName: string;
  canonicalName?: string;
}

export type SkillsProfile = {
  skillsProfilesId: number;
  staffId: number;
  skillsProfile: string;
  shortDescription: string;
}

export interface Skill {
  name: string;
  yearsExperience: string;
  skillLevel?: string;
  lastUsed?: string;
}

export interface Qualification{
  name: string;
  institution: string;
  year: string
}

export interface Certification {
  name: string;
  institution: string;
  year: string
}

export interface StaffBio {
  name: string;
  jobTitle: string;
  profilePicture?: string;
  skills: Skill[];
  qualifications: Qualification[];
  certifications: Certification[];
  workExperiences: WorkExperience[];
  profileOverview?: string;
  staffSpokenLanguages: StaffSpokenLanguage[];
  nationality: string;
  residence: string;
  dateOfBirth: Date;
}

export interface WorkExperience {
  workExperienceId: number;
  staffId: number;
  companyName: string;
  sectorName: string;
  roleName: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  bbdExperience: boolean;
  projectDescription?: string;
  outcomes: WorkExperienceOutcome[];
  technologies: WorkExperienceTechnology[];
}

export type NewWorkExperience = Omit<WorkExperience, 'workExperienceId' | 'staffId' | 'outcomes' | 'technologies'> & {
  outcomes: Pick<WorkExperienceOutcome, 'body' | 'order'>[];
  technologies: Pick<WorkExperienceTechnology, 'standardizedName' | 'order'>[];
}

export interface WorkExperienceOutcome {
  workExperienceOutcomeId: number;
  workExperienceId: number;
  body: string;
  order: number;
}

export interface WorkExperienceTechnology {
  workExperienceTechnologyId: number;
  workExperienceId: number;
  canonicalNameId: number;
  canonicalName: string;
  standardizedName: string;
  order: number;
}

export interface WorkExperienceSector {
  workExperienceSectorId: number;
  sectorName: string;
  approvedBy: string;
  approvedAt: string;
}

export interface WorkExperienceRole {
  workExperienceRoleId: number;
  roleName: string;
  approvedBy: string;
  approvedAt: string;
}

export type WorkExperienceUpdate = Omit<WorkExperience, 'workExperienceId'>

export type UserAttributeWithStaffDetails = UserAttribute & {
  upn: Staff['upn'];
  displayName: Staff['displayName'];
};

export type RatificationCanonicalNameDetails = {
  canonicalNameDetails: (CanonicalNameDetails | BadRequestDetail)[];
  ratificationCount: number;
};

export type PendingProofValidation = {
  staffId: number;
  staffName: string;
  staffEmail: string;
  qualification: string;
  proofFile: string;
  guidOfEdgeRequiringValidation : Guid;
};


