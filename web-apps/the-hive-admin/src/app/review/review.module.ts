import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewRoutingModule } from './review-routing.module';
import { ChangeStaffToContractorComponent } from './components/change-staff-to-contractor/change-staff-to-contractor.component';
import { FeedbackComponent } from './pages/feedback/feedback.page';
import { SharedModule } from '../shared.modules';
import { AssignmentTrackingListComponent } from './components/assignment-tracking-list/assignment-tracking-list.component';
import { AssignmentTrackingSearchBarComponent } from './components/assignment-tracking-search-bar/assignment-tracking-search-bar.component';
import { DashboardFilterComponent } from './components/dashboard-filter/dashboard-filter.component';
import { FeedbackAssignmentComponent } from './components/feedback-assignment/feedback-assignment.component';
import { FeedbackListComponent } from './components/feedback-list/feedback-list.component';
import { FeedbackProvidersSelectionDialogComponent } from './components/feedback-providers-selection-dialog/feedback-providers-selection-dialog.component';
import { FeedbackQuestionsTemplateDisplayComponent } from './components/feedback-questions-template-display/feedback-questions-template-display.component';
import { FeedbackRetractDialogComponent } from './components/feedback-retract-dialog/feedback-retract-dialog.component';
import { FeedbackRetractionReason } from './components/feedback-retraction-reasons/feedback-retraction-reasons.component';
import { FeedbackRetractionsComponent } from './components/feedback-retractions/feedback-retractions.component';
import { FeedbackReviewComponent } from './components/feedback-review/feedback-review.component';
import { FilterDropDownOptionsComponent } from './components/filter-drop-down-options/filter-drop-down-options.component';
import { HrRepSelectionDialogComponent } from './components/hr-rep-selection-dialog/hr-rep-selection-dialog.component';
import { ModifyFeedbackReasonComponent } from './components/modify-feedback-retraction-reason/modify-feedback-retraction-reason.componet';
import { ModifyFeedbackTemplateComponent } from './components/modify-feedback-template/modify-feedback-template.component';
import { ReasonsDialogComponent } from './components/reasons-dialog/reasons-dialog.component';
import { ReviewCommentsComponent } from './components/review-comments/review-comments.component';
import { ReviewDeleteDialogTriggerComponent } from './components/review-delete-dialog-trigger/review-delete-dialog-trigger.component';
import { ReviewAndContractRecommendationDeleteDialogComponent } from './components/review-and-contract-recommendation-delete-dialog/review-and-contract-recommendation-delete-dialog.component';
import { ReviewListComponent } from './components/review-list/review-list.component';
import { ReviewMeetingMinutesDialogComponent } from './components/review-meeting-minutes-dialog/review-meeting-minutes-dialog.component';
import { ReviewReportDialogComponent } from './components/review-report-dialog/review-report-dialog.component';
import { ReviewReportDownloadedComponent } from './components/review-report-downloaded/review-report-downloaded.component';
import { ReviewReportComponent } from './components/review-report/review-report.component';
import { ReviewStealDialogComponent } from './components/review-steal-dialog/review-steal-dialog.component';
import { StaffOverviewListComponent } from './components/staff-overview-list/staff-overview-list.component';
import { StaffOverviewReviewListComponent } from './components/staff-overview-review-list/staff-overview-review-list.component';
import { StaffOverviewSearchBarComponent } from './components/staff-overview-search-bar/staff-overview-search-bar.component';
import { StaffProfileComponent } from '../components/staff-profile/staff-profile.component';
import { StatsComparisonViewComponent } from './components/stats-comparison-view/stats-comparison-view.component';
import { TableFeedbackTemplateComponent } from './components/table-feedback-template/table-feedback-template.component';
import { ReviewFeedbackRetractionReason } from './components/view-retracted-feedback/view-retracted-feedback.component';
import { DashboardComponent } from './tabs/dashboard/dashboard.page';
import { ReviewCompletedComponent } from './review-status-views/review-completed/review-completed.view';
import { ReviewExecFeedbackReceivedComponent } from './review-status-views/review-exec-feedback-received/review-exec-feedback-received.view';
import { ReviewExecFeedbackRequestedComponent } from './review-status-views/review-exec-feedback-requested/review-exec-feedback-requested.view';
import { ReviewFinaliseSalaryComponent } from './review-status-views/review-finalise-salary/review-finalise-salary.view';
import { ReviewInProgressComponent } from './review-status-views/review-in-progress/review-in-progress.view';
import { ReviewMeetingScheduledComponent } from './review-status-views/review-meeting-scheduled/review-meeting-scheduled.view';
import { ReviewNewComponent } from './review-status-views/review-new/review-new.view';
import { ReviewProcessFinalizedComponent } from './review-status-views/review-process-finalized/review-process-finalized.view';
import { ReviewProvidersAssignedComponent } from './review-status-views/review-providers-assigned/review-providers-assigned.view';
import { ReviewProvidersRequestedComponent } from './review-status-views/review-providers-requested/review-providers-requested.view';
import { ReviewToBeCreatedComponent } from './review-status-views/review-to-be-created/review-to-be-created.view';
import { AssignmentTrackingComponent } from './tabs/assignment-tracking/assignment-tracking.tab';
import { ReviewsComponent } from './tabs/reviews/reviews.tab';
import { StaffOverviewComponent } from './tabs/staff-overview/staff-overview.tab';
import { StatsIndividualViewComponent } from './tabs/stats-individual-view/stats-individual-view.tab';
import { ReviewToDOComponent } from './tabs/to-do/to-do.tab';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { ReviewSearchBarComponent } from './components/review-search-bar/review-search-bar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
import {MatBadgeModule} from '@angular/material/badge';
import { ReviewStatusSummaryTableComponent } from './components/review-status-summary-table/review-status-summary-table.component';
import { SelectCompanyEntities } from '../components/select-company-entity/select-company-entity.component';
import { WarningBadgeComponent } from './components/warning-badge/warning-badge.component';
import { ReviewDashboardServiceToken } from '../shared/reviews-dashboard-service-token';
import { HrReviewDashboardService } from './services/hr-review-dashboard.service';
import { MarkStaffMemberForTerminationActionComponent } from '../components/mark-staff-member-for-termination-action/mark-staff-member-for-termination-action.component';
import { ReviewAuditTableDialogComponent } from './components/review-audit-table-dialog/review-audit-table-dialog.component';
import { StaffResidenceComponent } from '../components/staff-residence/staff-residence.component';


@NgModule({
  declarations: [
    FeedbackComponent,
    DashboardComponent,
    StatsIndividualViewComponent,
    StatsComparisonViewComponent,
    FeedbackQuestionsTemplateDisplayComponent,
    ModifyFeedbackTemplateComponent,
    TableFeedbackTemplateComponent,
    FeedbackReviewComponent,
    FeedbackAssignmentComponent,
    ReviewsComponent,
    ReviewCommentsComponent,
    ReviewReportComponent,
    ReviewAndContractRecommendationDeleteDialogComponent,
    ReviewStealDialogComponent,
    ReasonsDialogComponent,
    ReviewDeleteDialogTriggerComponent,
    FeedbackRetractionReason,
    ModifyFeedbackReasonComponent,
    ReviewFeedbackRetractionReason,
    FeedbackRetractionsComponent,
    FeedbackRetractDialogComponent,
    ReviewToDOComponent,
    StaffOverviewComponent,
    ReviewToBeCreatedComponent,
    HrRepSelectionDialogComponent,
    ReviewListComponent,
    StaffOverviewListComponent,
    StaffOverviewReviewListComponent,
    StaffOverviewSearchBarComponent,
    AssignmentTrackingSearchBarComponent,
    AssignmentTrackingListComponent,
    AssignmentTrackingComponent,
    ReviewNewComponent,
    ReviewProvidersRequestedComponent,
    FeedbackProvidersSelectionDialogComponent,
    ReviewProvidersAssignedComponent,
    FeedbackListComponent,
    ReviewInProgressComponent,
    ReviewCompletedComponent,
    ReviewReportDialogComponent,
    ReviewReportDownloadedComponent,
    ReviewExecFeedbackRequestedComponent,
    ReviewExecFeedbackReceivedComponent,
    ReviewMeetingScheduledComponent,
    ReviewFinaliseSalaryComponent,
    ReviewProcessFinalizedComponent,
    ReviewMeetingMinutesDialogComponent,
    ReviewSearchBarComponent,
  ],
  imports: [
    CommonModule,
    ReviewRoutingModule,
    MaterialModule,
    SelectCompanyEntities,
    FormsModule,
    ReactiveFormsModule,
    FilterDropDownOptionsComponent,
    ChangeStaffToContractorComponent,
    AngularEditorModule,
    SharedModule,
    StaffProfileComponent,
    MatBadgeModule,
    DashboardFilterComponent,
    WarningBadgeComponent,
    ReviewStatusSummaryTableComponent,
    MarkStaffMemberForTerminationActionComponent,
    ReviewAuditTableDialogComponent,
    StaffResidenceComponent,
  ],
  providers: [
    {
      provide: ReviewDashboardServiceToken,
      useClass: HrReviewDashboardService
    }
  ]
})
export class ReviewModule { }
