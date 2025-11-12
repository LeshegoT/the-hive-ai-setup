export type StaffStatus = 'active' | 'onboarding' | 'pending-delete' | 'terminated';
export const staffTypes = ['Permanent', 'Contract', 'Terminated'] as const;
export type StaffType = typeof staffTypes[number];
export const activeStaffTypes = ['Permanent', 'Contract'] as const;
export type ActiveStaffType = Extract<StaffType, (typeof activeStaffTypes)[number]>;

export type StaffStatusDetail = {
  staffStatusId: number;
  staffStatus: StaffStatus;
}

export type StaffTypeDetail = {
  staffTypeId: number;
  staffType: StaffType;
}

export type Staff = {
  upn: string;
  staffId: number;
  bbdUserName: string;
  displayName: string;
  jobTitle: string;
  office: string;
  employmentDate: Date;
  qualification1?: string;
  qualification2?: string;
  qualification3?: string;
  staffTypeId: number;
  staffType: StaffType;
  staffStatusId: number;
  staffStatus: StaffStatus;
  department: string;
  manager: string;
  entityAbbreviation: string;
  entityDescription: string;
  companyEntityId: number;
};

export type StaffWithDirectReportsCount = Staff & {
  directReportsCount: number;
}

export type StaffFilter = {
  upn?: string;
  staffIds?: number[];
  bbdUserName?: string;
  displayName?: string;
  jobTitle?: string;
  office?: string;
  employmentDate?: Date;
  staffTypes?: StaffType[];
  staffStatuses?: StaffStatus[];
  department?: string;
  manager?: string;
  entityAbbreviation?: string;
}

export const staffFilterKeys: readonly (keyof StaffFilter)[] = Object.freeze([
  'upn',
  'staffIds',
  'bbdUserName',
  'displayName',
  'jobTitle',
  'office',
  'employmentDate',
  'staffTypes',
  'staffStatuses',
  'department',
  'manager',
  'entityAbbreviation',
] as const);

export type OnboardingStaff = {
  displayName: string;
  staffId: number;
  bbdUserName: string;
  upn: string;
  jobTitle: string;
  department?: string;
  departmentId?: number;
  office?: string;
  officeId?: number;
  manager?: string;
  staffType?: ActiveStaffType;
  staffTypeId?: number;
  staffStatus?: string;
  staffStatusId?: number;
  companyEntityId?: number;
  companyEntityAbbreviation?: string;
  employmentDate?: Date;
}

export type OnboardingStaffWithContractDates = OnboardingStaff & (
  | {
    staffType: 'Permanent';
    probationaryReviewDate?: Date;
  }
  | {
    staffType: 'Contract';
    contractStartDate?: Date;
    contractEndDate?: Date;
    contractReviewDate?: Date;
  }
)

export type StaffUpdateFields = {
  department?: string;
  manager?: string;
  officeId?: number;
  companyEntityId?: number;
  jobTitle?: string;
  employmentDate?: Date;
} & (
  |  {
      staffType?: undefined;
      probationaryReviewDate?: never;
      contractStartDate?: never;
      contractEndDate?: never;
      contractReviewDate?: never;
    }
  | {
      staffType: 'Permanent';
      probationaryReviewDate: Date;
    }
  | {
      staffType: 'Contract';
      contractStartDate: Date;
      contractEndDate: Date;
      contractReviewDate: Date;
    }
);

export type StaffDepartment = {
  staffDepartmentId: number,
  department: string,
  manager: string,
  startDate: Date,
  staffId: number
}

export type BbdUserName = `bbdnet${string}`;

export const isBbdUsername = (username: string): username is BbdUserName => username.startsWith('bbdnet');

export type NewStaffMemberRequest = {
  upn: string,
  displayName: string,
  bbdUserName: BbdUserName,
  jobTitle: string,
  office: string,
  entityAbbreviation: string,
  department: string,
  reviewer: string,
}

export type StaffSpokenLanguage = {
  proficiency: string;
  language: string;
}

export type BulkStaffReviewerReassignmentRequest = { staffIds: number[], effectiveDate: Date, newManagerUpn: string }

export type StaffStatusChangeReason = {
  reason: string,
  nextStaffStatusId: number,
  nextStaffStatus: string
}