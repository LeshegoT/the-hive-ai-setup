import { StaffStatus } from "@the-hive/lib-staff-shared";

export interface ReviewListItem {
    department: string;
    dueDate: Date;
    employmentDate: Date;
    manager: string;
    reviewId: number;
    reviewStatusId: number;
    staffId: number;
    templateName: string;
    typeId: number;
    userPrincipleName: string;
    displayName: string;
    feedbackDate?: Date;
    nextReviewDate?: Date;
    nextFeedbackTypeId?: number;
    holdReason: string | null,
    staffReviewId?: number;
    onHoldBy: string | null;
    hasFeedbackInProgress?: boolean;
    hrRep: string;
    exclusiveToReviewer: boolean;
    requiresFeedback: boolean;
    staffStatus?: StaffStatus;
    placedOnHoldDate?: Date;
}
