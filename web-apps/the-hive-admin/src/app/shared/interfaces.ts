import { StaffStatus } from "@the-hive/lib-staff-shared";

export interface RestrictionsFormat {
  restricted : boolean
  groups: [],
  people: []
}
export interface UserInfo {
  upn: string;
  displayName: string;
}

export interface ReviewFeedback {
  review: ReviewBasicDetails;
  reviewResponses: (ReviewResponse | HistoricReviewResponse)[];
}

export interface ReviewBasicDetails {
  reviewee: string;
  reviewId: number;
  assignedBy: UserInfo;
  createdAt: Date;
  dueDate: Date;
  status: string;
  template: string;
  archived: boolean;
}

export interface HistoricReviewResponse {
  feedbackAssignmentId: number;
  reviewer: UserInfo;
  createdAt: Date;
  tags: Tag[];
  positiveComment: string;
  constructiveComment: string;
  generalComment: string;
  discussionPoints: DiscussionPoint[];
  anonymous: boolean;
}

export interface ReviewReportResponse {
  feedbackAssignmentId: number;
  reviewer: UserInfo;
  createdAt: Date;
  feedback: ReviewReportResponseFeedback[];
  anonymous: boolean;
  discussionPoints: DiscussionPoint[];
}

export interface ReviewReportResponseFeedback {
  rating: Rating;
  tags: Tag[];
  positiveComment: string;
  generalComment: string;
  constructiveComment: string;
  question: QuestionResponse;
}

export interface ReviewResponse {
  feedbackAssignmentId: number;
  reviewer: UserInfo;
  createdAt: Date;
  feedback: ReviewResponseFeedback[];
}

export interface ReviewResponseFeedback {
  rating: Rating[];
  tags: Tag[];
  positiveComment: string;
  generalComment: string;
  constructiveComment: string;
  discussionPoints: DiscussionPoint[];
  question: QuestionResponse;
}

export interface QuestionResponse {
  name: string;
  displayOrder: number;
  type: string;
}

export interface Rating {
  score: number;
  total: number;
  description: string;
}

export interface Tag {
  name: string;
  score: number;
  total: number;
}

export interface DiscussionPoint {
  question: QuestionResponse;
  generalComment: string;
}

export interface VoluntaryFeedback {
  reviewer: UserInfo;
  createdAt: Date;
  tags: Tag[];
  positiveComment: string;
  messageId: number;
}


export interface Person {
  dateOfBirth?: Date;
  nationality?: string;
  displayName: string;
  jobTitle: string;
  userPrincipleName: string;
  userName: string;
  department: string;
  office: string;
  manager: string;
  managerDisplayName: string;
  startDate: Date;
  qualifications: string[];
  entityAbbreviation: string;
  entityDescription: string;
  staffStatus: StaffStatus;
  residence?: string;
}


export interface AssignmentTemplate {
  name: string;
  id: number;
  isManualFeedback: boolean;
}

export interface Assignment {
  assignedBy: string;
  displayName?: string;
  createdAt: Date;
  dueBy: Date;
  feedbackAssignmentId: number;
  reviewer: string;
  status: string;
  reviewee?: string;
  createdBy: string,
  hrRep: string,
  assignedByDisplayName: string,
  hrNudges: number
  systemNudges: number
  clientEmail?: string;
  updateDate?: Date;
}

export interface StaffOverviewFilterParameters {
  searchText?: string;
  staffFilter?: string;
  unit?: string;
  entityFilters? : number[];
}

export interface AssignmentTrackingFilterParameters {
  searchText?: string;
  selectedStaffMember?: Person;
  manager?: string
}

export interface ReviewCycle {
  reviewCycleId: number;
  name: string;
  description: string;
  reviewsPerYear: number;
  editCycle: boolean;
}

export interface ReviewCycleAssignment {
  upn: string;
  reviewCycleId: number;
}

export type Route = { routePattern: string; routerLink?: string; displayName: string };

export interface DateRangeFilter {
  from: Date;
  to: Date;
}

export interface OrderItemsFilterParameters {
  status?: string;
  userPrincipleName?: string;
}

export interface ReviewStatus {
  statusId: number;
  description: string;
  allowedToProgressTo?: Array<ReviewStatus>;
  startingStatus?: boolean,
  cancellationStatus?: boolean
  actionName?: string;
}

export interface FeedbackAssignmentTemplate {
  feedbackAssignmentTemplateId: number;
  templateName: string;
  subjectLineTemplate: string;
  textContentTemplate: string;
  urlTemplate: string;
  titleTemplate: string;
  manualFeedbackAssignment: boolean;
  includeInManagerEmail: boolean;
  requiresSelfReview: boolean;
}

export interface StaffOverviewListItem {
  displayName: string;
  upn: string;
  unit: string;
  staffId: number;
  reviewer: string;
  nextReview: {
    id?: number,
    templateName?: string,
    date?: Date
  };
  currentReview: {
    id?: number,
    templateName?: string,
    date?: Date,
    currentHrRepDisplayName?: string,
  };
}

export interface AssignmentTrackingListItem {
  displayName: string;
  upn: string;
  staffId: number;
  department: string;
  manager: string;
  jobTitle: string;
  entity: string;
}

export interface HrReps {
  hrOther: string[],
  hrIndia: string[]
}

export interface ReviewMeetingAttendee {
  reviewMeetingMinutesAttendeeId?: number,
  attendeeUPN: string,
  reviewMeetingMinutesId?: number
}

export interface ReviewMeetingMinutes {
  reviewMeetingMinutesId?: number,
  createdAt?: Date,
  createdBy?: string,
  meetingTimeslot: Date,
  notes: string,
  reviewId: number,
  meetingAttendees: ReviewMeetingAttendee[]
}
export interface RegisteredUser {
  levelUpId: number;
  upn: string;
  bbdUserName: string;
  displayName: string;
  jobTitle: string;
  office: string;
}


export interface EventOrganiser {
  eventOrganiserId: number;
  upn: string;
}

export interface AssignmentStatusProgression {
  fromStatus: string;
  toStatus: string;
}

export interface HrComment {
  dateCreated: string,
  createdBy: string,
  comment: string;
}

export interface Guide {
  userPrincipleName: string;
  specialisation: string;
  heroes: number;
  guideStatus: string;
  lastGuideActivityDate: Date;
}

export interface NewGuideRequest {
  newGuideRequestsId: number;
  upn: string;
  bio: string;
  specialisationId: number;
  specialisation: string;
  requestStatusTypeId: number;
  requestStatusType: string;
  requestStatusReason?: string;
  dateRequested: Date
}

export interface RequestStatusType {
  requestStatusTypeId: number;
  requestStatusType: string;
}

export interface Specialisation {
  specialisationId: number,
  name: string
}

export interface Hero {
  heroUserPrincipleName: string;
  guideUserPrincipleName: string;
  specialisation: string;
}

export interface SideQuest {
  id: number;
  name: string;
  sideQuestType: string;
  venue: string;
  description: string;
  startDate: Date;
  link: string;
  registrationRequired: boolean;
  external: boolean;
  code: string;
}

export interface UpcomingReviewComment extends HrComment {
  staffReviewId: number;
  reviewHRCommentId: number;
  reviewHrCommentsStaffReviewId: number;
}

export interface ReviewComment extends HrComment {
  reviewId: number;
  reviewHRCommentId: number;
  reviewHRCommentsReviewsId: number;
}

export interface StaffComment extends HrComment {
  staffId: number;
  reviewHRCommentId: number;
  reviewHrCommentsStaffId: number;
}

export interface Icon{
  name: string,
  path: string
}

export type CommentTypeName = "upcomingReviewComments" | "reviewComments" | "staffComments";



export interface SideQuestUser {
  displayName: string;
  upn: string;
  dateRegistered: Date;
  dateCompleted: Date;
}

export type CountryFilter = "india"|"non-india";
