import type { CompanyEntity } from "@the-hive/lib-shared";
import type { StaffStatus } from "@the-hive/lib-staff-shared";

export type ContractRecommendationStatusLatenessSummary = {
  statusId: number;
  status: string;
  hrRep: string;
  lateness: string;
  periodStartDate: Date;
  periodEndDate: Date;
  numberOfContractRecommendations: number;
}

export const periodLengths: ReadonlyArray<string> = ['week', 'fortnight', 'month', 'quarter', 'half-year'];
export const latenessCategories: ReadonlyArray<string> = ['on-track', '0-30 days', '30-60 days', '60-90 days', '90-120 days', '120+ days'];

export type PeriodLength = typeof periodLengths[number];
export type LatenessCategory = typeof latenessCategories[number];

export type RequestValidationError = {
  message: string,
  details?: string[]
}

export type ReviewsDashboardFieldValidationRule = {
  field: string,
  valid: boolean,
  error: string,
  requiresValidation: boolean,
}

export interface ContractRecommendation {
  staffId: number;
  contractId: number;
  userPrincipleName: string;
  displayName: string;
  startsAt: Date;
  endsAt: Date;
  nextReviewDate: Date;
  contractRecommendationId: number;
  status: string;
  hrRep: string;
  updatedAt: Date;
  updatedBy: string;
  isIndia: boolean;
  jobTitle: string;
  holdReason: string;
  onHoldBy: string;
}

export type DashboardContractRecommendation = {
  staffId: number;
  contractId: number;
  userPrincipleName: string;
  displayName: string;
  startsAt: Date;
  endsAt: Date;
  nextReviewDate: Date;
  contractRecommendationId: number;
  status: string;
  hrRep: string;
  updatedAt: Date;
  updatedBy: string;
  lateness: LatenessCategory;
  department: string;
  reviewer: string;
}

export type DashboardFilterParams = {
  asAtEndOf: Date,
  status?: ReviewStatus | ContractRecommendationStatus,
  lateness?: LatenessCategory,
  hrRep?: string,
  templateName?: string,
  periodLength?: PeriodLength,
  numberOfPeriods?: number,
  excludedLatenesses?: LatenessCategory[],
  excludedStatuses?: (ReviewStatus | ContractRecommendationStatus)[],
  excludedHrReps?: string[],
  companyEntities?: CompanyEntity[],
  excludedTemplateNames?: string[]
}
export type DashboardStatusSummary = {
  asAtEndOf: Date,
  status: ReviewStatus | ContractRecommendationStatus,
  lateness: LatenessCategory,
  numberOfItems: number,
  hrRep?: string,
  templateName?: string
};

export type DashboardReview = {
  department: string,
  displayName: string,
  dueDate: Date,
  hrRep: string,
  lateness: LatenessCategory,
  manager: string,
  nextReviewDate: Date,
  reviewId: number,
  reviewStatus: string,
  staffId: number,
  staffStatus: StaffStatus,
  updatedDate: Date,
}

export type NextReview = {
  staffId: number;
  nextReviewDate: Date;
  typeId: number;
}

export const reviewStatuses = Object.freeze(['Upcoming Reviews',
  'New',
  'Reviewers Requested',
  'Reviewers Assigned',
  'Feedback In Progress',
  'Feedback Completed',
  'Report Downloaded',
  'Summary sent to STRATCO',
  'STRATCO Feedback Received',
  'Review Meeting Scheduled',
  'Finalise Salary',
  'Confirm Next Review Date',
  'Cancelled',
  'Archived'
] as const);

export type ReviewStatus = typeof reviewStatuses[number]

export type UnchangedReviewsItem = {
  asAtEndOf: Date;
  lateness?: LatenessCategory;
  status?: ReviewStatus | ContractRecommendationStatus;
  hrRep?: string;
  templateName?: string;
  numberOfItemsWithUnchangedStatus?: number;
}

export const contractRecommendationStatuses = Object.freeze([
  'Archived',
  'In Review',
  'New',
  'Review Completed',
  'To Make Permanent',
  'To Renew',
  'To Terminate',
  'Cancelled',
  'Continue As Is'
] as const);

export type ContractRecommendationStatus = typeof contractRecommendationStatuses[number];

export type DetailedReviewStatus = {
  reviewStatusId: number,
  description: string,
  actionName: string
}

export type ReviewStatusProgression = { 
  allowedReviewStatusId: number,
  currentStatusId: number, 
  nextStatusId: number 
}

export type ContractRecommendationStatusProgression = {
  contractRecommendationStatusProgressionId: number,
  fromStatus: string,
  toStatus: string,
}

export type FeedbackAssignmentTemplate = {
  feedbackAssignmentTemplateId: number,
  templateName: string,
  subjectLineTemplate: string,
  textContentTemplate: string,
  urlTemplate: string,
  titleTemplate: string,
  manualFeedbackAssignment: boolean,
  includeInManagerEmail: boolean,
  requiresSelfReview: boolean,
  exclusiveToReviewer: boolean,
  requiresFeedback: boolean,
  isReview: boolean
}

export const UNIT_MOVE_REVIEW_TEMPLATE_NAME = "Unit Move";

export type ContractRecommendationUpdate =
  | { status: 'In Review', nextReviewType: string, nextReviewDate: Date }
  | { status: 'Cancelled', recommendationCancelReason: string }
  | { status: 'Archived', startDate?: Date, endDate?: Date, nextReviewDate?: Date }
  | { status: Exclude<ContractRecommendationStatus, 'In Review' | 'Cancelled' | 'Archived'> }

export type ReviewAudit = {
  reviewId: number,
  auditType: string,
  actionTime: Date,
  actionUser: string,
  auditDescription: string,
  actionUserDisplayName: string
}

export type FeedbackAssignmentRetractionReason = {
  retractionReasonId: number,
  retractionReason: string
}

export type FeedbackAssignmentWithDisplayName = {
  feedbackAssignmentId: number,
  revieweeDisplayName: string,
  hrRep: string,
  hrRepDisplayName: string,
  feedbackAssignmentStatus: string,
  feedbackDeadline: Date
}

export type ReviewWithDisplayNames = {
  reviewId: number,
  reviewee: string,
  revieweeDisplayName: string,
  hrRep: string,
  hrRepDisplayName: string,
  reviewStatus: ReviewStatus,
  dueDate: Date
}

export type FeedbackProvidersRequest = {
  revieweeName: string;
  reviewerName: string;
  hrRepName: string;
  hrRepEmail: string;
  reviewerEmail: string;
  reviewMonth: string;
  reviewType: string;
  reviewId: number;
}

export const feedbackAssignmentStatuses = {
  new: "New",
  viewed: "Viewed",
  started: "Started",
  savedForLater: "Saved for Later",
  completed: "Completed",
  retracted: "Retracted",
  deleted: "Deleted",
} as const;

export type FeedbackAssignmentStatus = typeof feedbackAssignmentStatuses[keyof typeof feedbackAssignmentStatuses];

export type NewContractRequest = {
  startDate: Date;
  endDate: Date;
  reviewDate: Date;
  staffId: number;
  staffReviewId?: number;
}

export type ContractWithLatestRecommendation = {
  contractId: number;
  contractRecommendationId: number;
  startsAt: Date;
  endsAt: Date;
  nextReviewDate: Date;
  staffId: number;
  userPrincipleName: string;
  displayName: string;
  jobTitle: string;
  office: string;
  employmentDate: Date;
  recommendation: string;
}
