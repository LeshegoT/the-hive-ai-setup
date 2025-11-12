import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LoadingIndicatorComponent } from '../components/loading-indicator/loading-indicator.component';
import { SharedModule } from '../shared.modules';
import { ManageAliasComponent } from './components/manage-alias/manage-alias.component';
import { SkillsDashboardComponent } from './components/skills-dashboard/skills-dashboard.component';
import { ManageCanonicalNames } from './components/manage-canonical-names/manage-canonical-names.component';
import { SkillsHRComponent } from './pages/skills-hr/skills-hr.page';
import { SkillsHRRoutingModule } from './skills-hr-routing.module';
import { PendingProofComponent } from './components/pending-proof/pending-proof.component';

@NgModule({
  declarations: [
    SkillsHRComponent,

  ],
  imports: [
    CommonModule,
    SkillsHRRoutingModule,
    SkillsDashboardComponent,
    SharedModule,
    ManageAliasComponent,
    ManageCanonicalNames,
    LoadingIndicatorComponent,
    PendingProofComponent
  ]
})
export class SkillsHRModule { }
