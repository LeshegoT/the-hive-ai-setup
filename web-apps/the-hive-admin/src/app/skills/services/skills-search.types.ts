import { Pagination } from "@the-hive/lib-shared";
import { UserAttribute } from "@the-hive/lib-skills-shared";

type Descriptions = string[];

export interface RatingField {
    [label: string]: Descriptions;
}

export interface RatingData {
    [fieldName: string]: RatingField;
}

export type QualityScales = {
  yearsOfExperienceLevels: string[],
  experienceLevels: string[]
}

export type AttributeFields = {
  lastUsed: FieldInfo,
  obtainedFrom: FieldInfo,
  yearsExperience: FieldInfo,
  dateOfGraduation: FieldInfo,
  achievedDate: FieldInfo,
  industryKnowledgeLevel: FieldInfo,
  skillLevel: FieldInfo,
  expiryDate: FieldInfo,
  proof: FieldInfo,
  expertiseLevel: FieldInfo,
  yearsOfExperienceRating: FieldInfo,
}

type FieldInfo = {
    name: string,
    label: string,
    jsTypeId: number,
    order: number
}

export type ScaleForFields = {
  skillLevelOptions: string[],
  industryKnowledgeLevelOptions: string[],
  qualityLevelOptions: string[],
  qualityYearsOfExperienceOptions: string[],
}

export type TopLevelTags = {
    IndustryKnowledge: string,
    Skill: string,
    Qualification: string,
    Certification: string,
    Quality: string
}

export type RequiredFieldsAttributeTypeFilter = {
  topLevelTag: string;
  fields: [];
  canonicalName: string;
}

export type RequiredFields = {
  attribute: string;
  fields: [];
  tags: [];
  type: string;
  canonicalName: string;
}
export type UserResults = {
  staffId: number;
  userName: string;
  jobTitle: string;
  isIndia: boolean;
  entity: string;
  latestQualification?:string
  bbdUserName : string;
  userPrincipleName: string;
  department: string | undefined;
  office: string;
  manager: string | undefined;
  userAttributes: UserAttribute[];
}

export type SkillReport = {
  attributeType: string;
  skill: string;
  total: number;
};

export type FieldFilter = {
  field: string;
} & {
  [key: string]: string | Date | number | MinMaxField;
};

export type AttributeFilter = {
  attribute: string;
  fieldFilters: FieldFilter[];
};

export type AttributeTypeFilter = {
  attributeType: string;
  fieldFilters: FieldFilter[];
};


export type FilterQuery = {
  filters: {
    attributeFilters: AttributeFilter[];
    attributeTypeFilters: AttributeTypeFilter[];
  };
};

export type RangeField = {
  between: MinMaxField;
};

export type MinMaxField = {
  min: string | number | Date;
  max: string | number | Date;
};

export type UserSearchResults = { userResults: UserResults[]; totalCount?: number; pagination: Pagination };