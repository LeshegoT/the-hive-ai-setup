import { InterceptorService } from './services/interceptor.service';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgModule, ErrorHandler } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { AppComponent } from './app.component';
import { TableCourseProgressComponent } from './components/table-course-progress/table-course-progress.component';
import { LayoutModule } from '@angular/cdk/layout';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RepeatDirective } from './directives/repeat.directive';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { LevelUpPageComponent } from './components/level-up-page/level-up-page.component';
import { RoutingModule } from './routing/routing.module';
import { NavigationComponent } from './components/navigation/navigation.component';
import { HomeComponent } from './components/home/home.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { ProfileComponent } from './components/profile/profile.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { DatePickerComponent } from './components/date-picker/date-picker.component';
import { DateFormatPipe, DayMonthYearDateFormat, TimeFormatNoAdjustPipe, TimeFormatPipe } from './pipes/date-format.pipe';
import { EditQuestComponent } from './components/edit-quest/edit-quest.component';
import { GuideMonitorComponent } from './components/guide-monitor/guide-monitor.component';
import { GuideDetailsComponent } from './components/guide-details/guide-details.component';
import { HeroDetailsComponent } from './components/hero-details/hero-details.component';
import { EditSpecialisationsComponent } from './components/edit-specialisations/edit-specialisations.component';
import { GlobalErrorHandler } from './shared/global-error-handler';
import { AllHeroesComponent } from './components/all-heroes/all-heroes.component';
import { HeroMessagesComponent } from './components/hero-messages/hero-messages.component';
import { HeroQuestsComponent } from './components/hero-quests/hero-quests.component';
import { UnauthorisedComponent } from './components/unauthorised/unauthorised.component';
import { AuthGuard } from './services/auth-guard.service';
import { PrescribedTrainingComponent } from './components/prescribed-training/prescribed-training.component';
import { LevelUpComponent } from './components/level-up/level-up.component';
import { LevelUpDetailsComponent } from './components/level-up-details/level-up-details.component';
import { LevelUpNewInstanceComponent } from './components/level-up-new-instance/level-up-new-instance.component';
import { LevelUpQrComponent } from './components/level-up-qr/level-up-qr.component';
import { ActivityAttendanceRegister } from './components/activity-attendance-register/activity-attendance-register.component';
import { CreateSideQuestComponent } from './components/create-side-quest/create-side-quest.component';
import { CreateContentComponent } from './components/create-content/create-content.component';
import { CreateSideQuestTypeComponent } from './components/create-side-quest-type/create-side-quest-type.component';
import { CreateActivityLinkComponent } from './components/create-activity-link/create-activity-link.component';
import { CreateLevelUpComponent } from './components/create-level-up/create-level-up.component';
import { CreateGroupComponent } from './components/create-group/create-group.component';
import { CreateLevelUpActivityTypeComponent } from './components/create-level-up-activity-type/create-level-up-activity-type.component';
import { PrescribedTrainingReportComponent } from './components/prescribed-training-report/prescribed-training-report.component';
import { CreateCourseComponent } from './components/create-course/create-course.component';
import { ManageContentComponent } from './components/manage-content/manage-content.component';
import { ManageTracksComponent } from './components/manage-tracks/manage-tracks.component';
import { ManageRestrictionsComponent } from './components/manage-restrictions/manage-restrictions.component';
import { CreateTrackComponent } from './components/create-track/create-track.component';
import { ManageCourseComponent } from './components/manage-course/manage-course.component';
import { CourseEditorComponent } from './components/course-editor/course-editor.component';
import { SectionEditorComponent } from './components/section-editor/section-editor.component';
import { QuestionEditorComponent } from './components/question-editor/question-editor.component';
import { QuestionComponent } from './components/question/question.component';
import { AnswerComponent } from './components/answer/answer.component';
import { DateTimePickerComponent } from './components/date-time-picker/date-time-picker.component';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { ManageSideQuestComponent } from './components/manage-side-quest/manage-side-quest.component';
import { ManageLevelUpComponent } from './components/manage-level-up/manage-level-up.component';
import { TableLevelUpComponent } from './components/table-level-up/table-level-up.component';
import { TableSideQuestComponent } from './components/table-side-quest/table-side-quest.component';
import { LimitLengthPipe, RemoveIconPathPipe, RemoveMarkDownPipe } from './pipes/text-format.pipe';
import { ManageTypeComponent } from './components/manage-type/manage-type.component';
import { TableTypeComponent } from './components/table-type/table-type.component';
import { TableCourseComponent } from './components/table-course/table-course.component';
import { TableGroupsComponent } from './components/table-groups/table-groups.component';
import { ManageGroupsComponent } from './components/manage-groups/manage-groups.component';
import { TableTrackComponent } from './components/table-track/table-track.component';
import { AwardBucksComponent } from './components/award-bucks/award-bucks.component';
import { StackedBarGraphComponent } from './components/stacked-bar-graph/stacked-bar-graph.component';
import { StatsLineGraphComponent } from './components/stats-line-graph/stats-line-graph.component';
import { ContentTaggingComponent } from './components/content-tagging/content-tagging.component';
import { CreateNewTrackComponent } from './components/create-new-track/create-new-track.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { MomentDateModule } from '@angular/material-moment-adapter';
import { VacWorkComponent } from './components/vac-work/vac-work.component';
import { AdminAccessComponent } from './components/admin-access/admin-access.component';
import { CreateProgrammeComponent } from './components/create-programme/create-programme.component';
import { BursarAssessmentComponent } from './components/bursar-assessment/bursar-assessment.component';
import { BursarAssessmentCreationComponent } from './components/bursar-assessment-creation/bursar-assessment-creation.component';
import { BursarAssessmentViewComponent } from './components/bursar-assessment-view/bursar-assessment-view.component';
import {TableProgrammeComponent} from './components/table-programme/table-programme.component';
import {ManageProgrammeComponent} from './components/manage-programme/manage-programme.component'
import { EventOrganiserListComponent } from './components/event-organisers/event-organiser-list.component';
import { EventsComponent } from './components/events/events.component';
import { CoursesAndTracksComponent } from './components/courses-and-tracks/courses-and-tracks.component';
import { AddEventOrganiserComponent } from './components/add-event-organiser/add-event-organiser.component'
import { ProgrammesComponent } from './components/programmes/programmes.component';
import { SideQuestComponent } from './components/side-quest/side-quest.component';

import { OrderItemsComponent } from './components/order-items/order-items.component';
import { PrescribedTrainingDialogComponent } from './components/prescribed-training-dialog/prescribed-training-dialog.component';
import { AppFeatureAccessComponent } from './components/app-feature-access/app-feature-access.component';
import { TableUnitComponent } from './components/table-unit/table-unit.component';
import { ManageUnitsComponent } from './components/manage-units/manage-units.component';
import { TextInputDialogComponent } from './text-input-dialog/text-input-dialog.component';
import { RegisteredUsers } from './components/registered-users/registered-users.component';
import {LevelUpWarningDialogComponent} from './components/level-up-warning-dialog/level-up-warning-dialog.component'
import { ReassignGuidesHeroesComponent } from './components/reassign-guides-heroes/reassign-guides-heroes.component';
import { SharedModule } from './shared.modules';
import "./shared/moment.configurations";

@NgModule({ declarations: [
        LevelUpPageComponent,
        LevelUpWarningDialogComponent,
        LevelUpNewInstanceComponent,
        AppComponent,
        TableCourseProgressComponent,
        NavigationComponent,
        HomeComponent,
        DatePickerComponent,
        EditQuestComponent,
        GuideMonitorComponent,
        GuideDetailsComponent,
        HeroDetailsComponent,
        EditSpecialisationsComponent,
        AllHeroesComponent,
        HeroMessagesComponent,
        HeroQuestsComponent,
        TimeFormatNoAdjustPipe,
        LimitLengthPipe,
        RemoveMarkDownPipe,
        RemoveIconPathPipe,
        UnauthorisedComponent,
        PrescribedTrainingComponent,
        LevelUpComponent,
        LevelUpDetailsComponent,
        LevelUpQrComponent,
        ActivityAttendanceRegister,
        CreateSideQuestComponent,
        CreateContentComponent,
        CreateSideQuestTypeComponent,
        CreateActivityLinkComponent,
        CreateLevelUpComponent,
        CreateGroupComponent,
        CreateLevelUpActivityTypeComponent,
        PrescribedTrainingReportComponent,
        ManageContentComponent,
        ManageTracksComponent,
        ManageRestrictionsComponent,
        CreateCourseComponent,
        CreateTrackComponent,
        ManageCourseComponent,
        CourseEditorComponent,
        SectionEditorComponent,
        QuestionEditorComponent,
        QuestionComponent,
        AnswerComponent,
        DateTimePickerComponent,
        ManageSideQuestComponent,
        ManageLevelUpComponent,
        TableLevelUpComponent,
        TableSideQuestComponent,
        ManageTypeComponent,
        TableTypeComponent,
        TableCourseComponent,
        TableGroupsComponent,
        ManageGroupsComponent,
        TableTrackComponent,
        AwardBucksComponent,
        StackedBarGraphComponent,
        StatsLineGraphComponent,
        RepeatDirective,
        ContentTaggingComponent,
        CreateNewTrackComponent,
        VacWorkComponent,
        AdminAccessComponent,
        CreateProgrammeComponent,
        BursarAssessmentComponent,
        BursarAssessmentCreationComponent,
        BursarAssessmentViewComponent,
        TableProgrammeComponent,
        ManageProgrammeComponent,
        BursarAssessmentViewComponent,
        OrderItemsComponent,
        PrescribedTrainingDialogComponent,
        AppFeatureAccessComponent,
        TableUnitComponent,
        ManageUnitsComponent,
        TextInputDialogComponent,
        RegisteredUsers,
        EventOrganiserListComponent,
        EventsComponent,
        AddEventOrganiserComponent,
        CoursesAndTracksComponent,
        ProgrammesComponent,
        SideQuestComponent,
    ],
    bootstrap: [AppComponent],
    imports: [BrowserModule,
        BrowserAnimationsModule,
        NgApexchartsModule,
        FormsModule,
        ReactiveFormsModule,
        LayoutModule,
        DragDropModule,
        RoutingModule,
        AngularSvgIconModule,
        QRCodeComponent,
        AngularEditorModule,
        MomentDateModule,
        MatTableModule,
        MatPaginatorModule,
        MatTableModule,
        ProfileComponent,
        ReassignGuidesHeroesComponent,
        DateFormatPipe,
        TimeFormatPipe,
        SharedModule], providers: [
        AuthService,
        AuthGuard,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: InterceptorService,
            multi: true,
        },
        {
            provide: ErrorHandler,
            useClass: GlobalErrorHandler,
        },
        { provide: MAT_DATE_FORMATS, useValue: DayMonthYearDateFormat },
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule {
}
