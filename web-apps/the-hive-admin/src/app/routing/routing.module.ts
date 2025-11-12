import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivityAttendanceRegister } from '../components/activity-attendance-register/activity-attendance-register.component';
import { AdminAccessComponent } from '../components/admin-access/admin-access.component';
import { AppFeatureAccessComponent } from '../components/app-feature-access/app-feature-access.component';
import { AwardBucksComponent } from '../components/award-bucks/award-bucks.component';
import { BursarAssessmentComponent } from '../components/bursar-assessment/bursar-assessment.component';
import { CoursesAndTracksComponent } from '../components/courses-and-tracks/courses-and-tracks.component';
import { CreateActivityLinkComponent } from '../components/create-activity-link/create-activity-link.component';
import { CreateContentComponent } from '../components/create-content/create-content.component';
import { EditQuestComponent } from '../components/edit-quest/edit-quest.component';
import { EditSpecialisationsComponent } from '../components/edit-specialisations/edit-specialisations.component';
import { EventsComponent } from '../components/events/events.component';
import { GuideDetailsComponent } from '../components/guide-details/guide-details.component';
import { GuideMonitorComponent } from '../components/guide-monitor/guide-monitor.component';
import { HeroDetailsComponent } from '../components/hero-details/hero-details.component';
import { HomeComponent } from '../components/home/home.component';
import { LevelUpDetailsComponent } from '../components/level-up-details/level-up-details.component';
import { LevelUpNewInstanceComponent } from '../components/level-up-new-instance/level-up-new-instance.component';
import { LevelUpPageComponent } from '../components/level-up-page/level-up-page.component';
import { LevelUpQrComponent } from '../components/level-up-qr/level-up-qr.component';
import { ManageContentComponent } from '../components/manage-content/manage-content.component';
import { OrderItemsComponent } from '../components/order-items/order-items.component';
import { PrescribedTrainingReportComponent } from '../components/prescribed-training-report/prescribed-training-report.component';
import { PrescribedTrainingComponent } from '../components/prescribed-training/prescribed-training.component';
import { ProgrammesComponent } from '../components/programmes/programmes.component';
import { RegisteredUsers } from '../components/registered-users/registered-users.component';
import { SideQuestComponent } from '../components/side-quest/side-quest.component';
import { TableUnitComponent } from '../components/table-unit/table-unit.component';
import { UnauthorisedComponent } from '../components/unauthorised/unauthorised.component';
import { VacWorkComponent } from '../components/vac-work/vac-work.component';
import { AuthGuard } from '../services/auth-guard.service';
import { UnitCorrectionsPageComponent } from '../components/unit-corrections-page/unit-corrections-page';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'editQuest/:id', component: EditQuestComponent },
      { path: 'guideMonitor', component: GuideMonitorComponent },
      { path: 'guide/:guide', component: GuideDetailsComponent },
      { path: 'hero/:hero', component: HeroDetailsComponent },
      { path: 'editSpecialisations/:guide', component: EditSpecialisationsComponent },
      { path: 'prescribe', component: PrescribedTrainingComponent },
      { path: 'levelUp', component: LevelUpPageComponent },
      { path: 'levelUpDetails/:id/detail', component: LevelUpNewInstanceComponent },
      { path: 'levelUpDetails/:id', component: LevelUpDetailsComponent },
      { path: 'levelUpQr/:activityId', component: LevelUpQrComponent },
      { path: 'activityAttendanceRegister/:activityId', component: ActivityAttendanceRegister },
      { path: 'levelUpActivityLink/:id', component: CreateActivityLinkComponent },
      { path: 'report', component: PrescribedTrainingReportComponent },
      { path: 'createContent', component: CreateContentComponent },
      { path: 'manageContent', component: ManageContentComponent },
      { path: 'people', loadChildren: () => import('../people/people.module').then(path => path.PeopleModule) },
      { path: 'rewards', component: AwardBucksComponent },
      { path: 'feedback', loadChildren: () => import('../review/review.module').then(m => m.ReviewModule) },
      { path: 'skills', loadChildren: () => import('../skills/skills.module').then(path => path.SkillsModule) },
      { path: 'skills-atc', loadChildren: () => import('../skills/skills-atc.module').then(path => path.SkillsATCModule) },
      { path: 'skills-hr', loadChildren: () => import('../skills/skills-hr.module').then(path => path.SkillsHRModule) },
      { path: 'people-planning', loadChildren: () => import('../people-planning/people-planning.module').then(path => path.PeoplePlanningModule) },
      { path: 'vac', component: VacWorkComponent },
      { path: 'access', component: AdminAccessComponent },
      { path: 'bursarAssessment', component: BursarAssessmentComponent },
      { path: 'storeManagement', component: OrderItemsComponent },
      { path: 'manageUnit', component: TableUnitComponent},
      { path: 'appFeatureAccess', component: AppFeatureAccessComponent },
      { path: 'registeredUsers/:levelUpId', component: RegisteredUsers },
      { path: 'events', component: EventsComponent},
      { path: 'coursesAndTracks', component: CoursesAndTracksComponent },
      { path: 'programmes', component: ProgrammesComponent },
      { path: 'sideQuest', component: SideQuestComponent },
      { path: 'contracts', loadChildren: () => import('../contracts/contracts.module').then(path => path.ContractsModule) },
      { path: 'unit-corrections', component: UnitCorrectionsPageComponent }
    ],
  },
  { path: '401', component: UnauthorisedComponent },
];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes /*, {enableTracing:true}*/, {})],
  exports: [RouterModule],
  declarations: []
})
export class RoutingModule {}
